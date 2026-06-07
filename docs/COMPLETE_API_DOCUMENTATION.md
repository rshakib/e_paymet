# COMPLETE_API_DOCUMENTATION.md

All API endpoints are hosted on the FastAPI server. Standard secure endpoints expect a JSON wrapper payload format, referred to as the **Secure Envelope**:
```json
{
  "payload": "IV_BASE64:CIPHERTEXT_BASE64",
  "hmac": "HMAC_SHA256_HEX",
  "nonce": "random_string",
  "timestamp": 1234567890
}
```

---

## 1. Authentication Endpoints

### A. Secure User Registration
* **Method**: `POST`
* **Endpoint**: `/auth/register`
* **Authentication**: None.
* **Request Body (Decrypted Envelope)**:
  ```json
  {
    "username": "017XXXXXXXX",
    "pin": "1234",
    "full_name": "Piyash",
    "mobile_number": "017XXXXXXXX",
    "nid_number": "1234567890",
    "date_of_birth": "1995-05-15",
    "has_fingerprint": true,
    "has_face_id": false,
    "mac_address": "A4:5E:60:XX:XX:AB",
    "activation_code": "948201",
    "bp_hash": "2f6a7d8e..."
  }
  ```
* **Response Body (Encrypted Envelope)**:
  ```json
  {
    "success": true,
    "message": "Account created successfully"
  }
  ```
* **Backend Function**: `auth_register()` inside `backend/app.py`
* **Database Tables**:
  * Writes to `profiles` (registration metadata, K2 stretched PIN, K1 hardware key, BP fingerprint).
  * Writes to `accounts` (generates ACC-username, sets starting balance to ৳5,000.00).
* **Called by Screens**: Registration Screen (`src/app/register/index.tsx`).

### B. Secure User Login
* **Method**: `POST`
* **Endpoint**: `/auth/login`
* **Authentication**: None.
* **Request Body (Decrypted Envelope)**:
  ```json
  {
    "username": "017XXXXXXXX",
    "pin": "1234",
    "mac_address": "A4:5E:60:XX:XX:AB"
  }
  ```
* **Response Body (Encrypted Envelope)**:
  ```json
  {
    "access_token": "uuid-session-token",
    "user": {
      "id": "supabase-user-uuid",
      "username": "017XXXXXXXX",
      "full_name": "Piyash",
      "balance": 5000.0,
      "has_fingerprint": true,
      "has_face_id": false,
      "k1": "hmac_key_k1_hex",
      "k2": "password_key_k2_hex",
      "bp": "fingerprint_bp_hex",
      "last_t": 0
    }
  }
  ```
* **Backend Function**: `auth_login()` inside `backend/app.py`
* **Database Tables**:
  * Reads `profiles` (validates K2 password key, supports legacy user fallback migrations).
  * Reads `accounts` (resolves balance).
* **Called by Screens**: Login Screen (`src/app/login.tsx`).

### C. Secure User Logout
* **Method**: `POST`
* **Endpoint**: `/auth/logout`
* **Authentication**: None (Wrapper authentication is checked locally on frontend side).
* **Request Body (Decrypted Envelope)**: `{}`
* **Response Body (Encrypted Envelope)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```
* **Backend Function**: `auth_logout()` inside `backend/app.py`
* **Database Tables**: None.
* **Called by Screens**: Profile Screen (`src/app/profile.tsx`).

---

## 2. Wallet & Financial Transaction Endpoints

### A. Secure Money Transfer (P2P Send Money)
* **Method**: `POST`
* **Endpoint**: `/auth/transfer`
* **Authentication**: `Bearer <session_token>` header parameter inside outer envelope request.
* **Request Body (Decrypted Envelope)**:
  ```json
  {
    "username": "017XXXXXXXX",
    "payload": "BASE64_CIPHERTEXT",
    "iv": "BASE64_IV",
    "T": 1715694020
  }
  ```
  *Note: Decrypted payload contains `M = "Receiver:018XXXXXXXX|Amt:500.0"` and `F1 = HMAC-SHA256(M, K1)`.*
* **Response Body (Encrypted Envelope)**:
  ```json
  {
    "status": "success",
    "message": "Transfer of 500.0 to 018XXXXXXXX successful",
    "new_t": 1715694020,
    "new_balance": 4500.0
  }
  ```
* **Backend Function**: `auth_transfer()` inside `backend/app.py`
* **Database Tables**:
  * Invokes DB atomic stored procedure `process_transfer_secure` which locks and modifies `accounts` (debit/credit) and updates `profiles` (last_t, today_spent).
  * Writes success/aborted transaction log to `transactions`.
* **Called by Screens**: Confirm Payment Screen (`src/app/send/send-money-confirm.tsx`).

### B. Mobile Airtime Recharge
* **Method**: `POST`
* **Endpoint**: `/auth/recharge`
* **Authentication**: `Bearer <session_token>` header.
* **Request Body**:
  ```json
  {
    "phone": "017XXXXXXXX",
    "amount": 100.0,
    "operator": "Grameenphone"
  }
  ```
* **Response Body**:
  ```json
  {
    "status": "success",
    "message": "Recharge successful",
    "new_balance": 4400.0
  }
  ```
* **Backend Function**: `mobile_recharge()` inside `backend/app.py`
* **Database Tables**:
  * Updates `accounts` (debits user balance).
  * Writes transaction entry to `transactions` (reference matches `"Recharge to 017XXXXXXXX (Grameenphone)"`).
* **Called by Screens**: Confirm Recharge (`src/app/recharge/confirm.tsx`).

### C. Merchant Payment
* **Method**: `POST`
* **Endpoint**: `/auth/merchant-payment`
* **Authentication**: `Bearer <session_token>` header.
* **Request Body**:
  ```json
  {
    "merchant_username": "merchant_phone",
    "amount": 250.0
  }
  ```
* **Response Body**:
  ```json
  {
    "status": "success",
    "message": "Payment successful",
    "new_balance": 4150.0
  }
  ```
* **Backend Function**: `merchant_payment()` inside `backend/app.py`
* **Database Tables**:
  * Updates `accounts` (debits customer, credits merchant).
  * Writes to `transactions` (reference matches `"Merchant Payment to merchant_phone"`).
* **Called by Screens**: Confirm Payment Screen (`src/app/payment/confirm.tsx` / `scan/confirm.tsx`).

### D. Utility Bill Payment
* **Method**: `POST`
* **Endpoint**: `/bills/pay`
* **Authentication**: `Bearer <session_token>` header.
* **Request Body**:
  ```json
  {
    "bill_id": "bill-uuid-string"
  }
  ```
* **Response Body**:
  ```json
  {
    "status": "success",
    "message": "Bill payment successful",
    "new_balance": 3300.0
  }
  ```
* **Backend Function**: `pay_bill()` inside `backend/app.py`
* **Database Tables**:
  * Reads/Locks `accounts` and `bills` via write lock (`FOR UPDATE`).
  * Updates `accounts` (debits user balance).
  * Updates `bills` (sets status = 'paid', paid_at = CURRENT_TIMESTAMP).
  * Inserts record into `transactions`.
* **Called by Screens**: Utility Bill Screen (`src/app/bill.tsx`).

---

## 3. Data Query & Directory Endpoints

### A. Get User Profile Details
* **Method**: `GET`
* **Endpoint**: `/user/{username}`
* **Authentication**: `Bearer <session_token>` header.
* **Response Body**:
  ```json
  {
    "status": "success",
    "user": {
      "id": "user-uuid",
      "username": "017XXXXXXXX",
      "balance": 3300.0,
      "daily_limit": 5000.0,
      "today_spent": 1700.0,
      "full_name": "Piyash",
      "mobile_number": "017XXXXXXXX",
      "nid": "1234567890",
      "date_of_birth": "1995-05-15",
      "has_fingerprint": true,
      "has_face_id": false
    }
  }
  ```
* **Backend Function**: `get_user()` inside `backend/app.py`
* **Database Tables**: Reads `profiles` and `accounts`.
* **Called by Screens**: Dashboard Screen, Profile Screen, Enter Amount Screens (Send Money, Recharge, Payment).

### B. Get Transaction History
* **Method**: `GET`
* **Endpoint**: `/transactions/{username}`
* **Authentication**: `Bearer <session_token>` header.
* **Response Body**:
  ```json
  {
    "status": "success",
    "transactions": [
      {
        "id": "txn-uuid",
        "amount": 500.0,
        "status": "success",
        "created_at": "2026-06-07T12:00:00Z",
        "reference": "TXN-2026-06-07T12:00:00.000",
        "receiver_username": "018XXXXXXXX",
        "type": "sent"
      }
    ]
  }
  ```
* **Backend Function**: `get_transactions()` inside `backend/app.py`
* **Database Tables**: Reads `transactions`, `accounts`, and `profiles`.
* **Called by Screens**: Dashboard Screen (`DashboardScreen.tsx`), Transactions Screen (`transactions.tsx`).

### C. Search Registered Users
* **Method**: `GET`
* **Endpoint**: `/search-users?q=query_string`
* **Authentication**: `Bearer <session_token>` header.
* **Response Body**:
  ```json
  {
    "status": "success",
    "users": [
      {
        "id": "uuid",
        "username": "018XXXXXXXX",
        "full_name": "Bob",
        "mobile_number": "018XXXXXXXX"
      }
    ]
  }
  ```
* **Backend Function**: `search_users()` inside `backend/app.py`
* **Database Tables**: Reads `profiles` (matching pattern against username, full name, or mobile).
* **Called by Screens**: Contacts Selection Screen (`src/app/send/index.tsx` / `payment/index.tsx`).

### D. Get Utility Bills List
* **Method**: `GET`
* **Endpoint**: `/bills/{username}`
* **Authentication**: `Bearer <session_token>` header.
* **Response Body**:
  ```json
  {
    "status": "success",
    "bills": [
      {
        "id": "bill-uuid",
        "biller_name": "DESCO Electricity",
        "bill_number": "BILL-E-5910",
        "amount": 850.50,
        "due_date": "2026-06-17",
        "status": "unpaid",
        "paid_at": null
      }
    ]
  }
  ```
* **Backend Function**: `get_bills()` inside `backend/app.py`
* **Database Tables**: Reads `bills` matching user `profile_id`.
* **Called by Screens**: Utility Bill Screen (`src/app/bill.tsx`).
