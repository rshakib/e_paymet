# COMPLETE_BACKEND_FLOW.md

---

## 1. Registration Route (`POST /auth/register`)
* **Route**: `/auth/register`
* **Function**: `auth_register(envelope: SecureEnvelope)`
* **Validation**:
  * Pydantic validation ensures the body conforms to the `SecureEnvelope` schema (must contain `payload`, `hmac`, `nonce`, and `timestamp`).
  * Validates that the decrypted envelope contains: `username`, `pin`, `nid_number`, `activation_code`, `mac_address`, and `bp_hash`.
* **Security Checks**:
  * **Envelope Decryption**: Decrypts the outer envelope using the shared 32-character `SECRET_KEY`.
  * **HMAC Integrity Check**: Verifies `hmac` matches `HMAC-SHA256(payload | timestamp | nonce, SECRET_KEY)`.
  * **Username Conflict Check**: Verifies that the username (mobile phone number) does not already exist in the database.
* **Database Queries & Tables**:
  * **Table `profiles`**: Reads using `get_user_profile` to check duplicates. Inserts user profile details (includes password stretched key K2 = `PBKDF2-SHA256(pin, nid)`, hardware bound key K1, biometric template hash `bp_hash`).
  * **Table `accounts`**: Inserts a new wallet account linked to the profile with a starting balance of 5000.0.
* **Return Values**:
  * On Success: Encrypted outer envelope containing `{"success": true, "message": "Account created successfully"}`.
* **Error Paths**:
  * If envelope decryption or HMAC checks fail: Returns `HTTP 400 Bad Request` with `{"status": "error", "message": "Outer decryption failed or invalid signature"}`.
  * If fields are missing: Returns `HTTP 400 Bad Request`.
  * If username exists: Returns `HTTP 400 Bad Request` with `{"status": "error", "message": "Username already exists"}`.
  * If database insert fails: Rolls back Auth creation, deletes orphaned Auth record, and returns `HTTP 500 Internal Server Error`.

---

## 2. Login Route (`POST /auth/login`)
* **Route**: `/auth/login`
* **Function**: `auth_login(envelope: SecureEnvelope)`
* **Validation**: Checks that the decrypted envelope contains both `username` and `pin` parameters.
* **Security Checks**:
  * **Envelope Decryption & HMAC verification** using `SECRET_KEY`.
  * **PIN Validation**: Matches the input PIN with the storedstretched password K2. Supports legacy migrations by verifying plaintext and automatically migrating the user to a PBKDF2-stretched PIN if NID is present.
* **Database Queries & Tables**:
  * **Table `profiles`**: Reads profile details via username lookup. Updates `password_key_k2` if performing a legacy migration.
  * **Table `accounts`**: Reads balance and active status mapping.
* **Return Values**:
  * On Success: Encrypted outer envelope containing:
    ```json
    {
      "access_token": "generated-session-uuid",
      "user": {
        "id": "uuid",
        "username": "017XXXXXXXX",
        "balance": 5000.0,
        "k1": "hmac_key_k1",
        "k2": "password_key_k2",
        "bp": "fingerprint_bp",
        "last_t": 0
      }
    }
    ```
    *Note: The generated session token is added to the server's in-memory `active_sessions` store.*
* **Error Paths**:
  * Decryption fail: Returns `HTTP 400`.
  * User not found: Returns `HTTP 404` (`"User not found"`).
  * Wrong password: Returns `HTTP 401` (`"Invalid password"`).
  * Account not found: Returns `HTTP 404` (`"Account not found"`).

---

## 3. Secure Transfer Route (`POST /auth/transfer`)
* **Route**: `/auth/transfer`
* **Function**: `auth_transfer(envelope: SecureEnvelope)`
* **Validation**:
  * Checks that the decrypted envelope contains `username`, `payload`, `iv`, and `T`.
* **Security Checks**:
  * **Envelope Decryption & HMAC verification** (Layer 1).
  * **Authentication Check**: Verifies that the username matches the active session username from the `Authorization: Bearer <token>` header.
  * **Layer 2 Decryption**: Derives an AES-256 key from K2, BP, and client timestamp `T`. Decrypts the inner transaction payload (`payload` and `iv`) to retrieve Message `M` (`"Receiver:Bob|Amt:1000"`) and Signature `F1`.
  * **Layer 2 Integrity**: Verifies that `F1` matches `HMAC-SHA256(M, K1)`.
  * **Replay Protection**: Freshness check (client time `T` must be within ±180 seconds of server time). Sequence check (client time `T` must be strictly greater than the user's last recorded timestamp `last_t` in `profiles`).
* **Database Queries & Tables**:
  * **Atomic Transaction Execution**: Invokes Supabase RPC function `process_transfer_secure(sender_username, receiver_username, amount, timestamp, reference)`.
  * **Locking Row Check**: The function executes inside a PostgreSQL transactional block. It queries `profiles` and `accounts` using `FOR UPDATE` locks, checking:
    * Balance availability (`accounts.balance >= amount`).
    * Daily limit availability (`profiles.today_spent + amount <= profiles.daily_limit`).
  * **State Modification**: Debits sender balance, credits receiver balance, updates `profiles.last_t = T`, and updates `profiles.today_spent`.
  * **Auditing**: Inserts success/failure record into `transactions`.
* **Return Values**:
  * On Success: Encrypted outer envelope containing:
    ```json
    {
      "status": "success",
      "message": "Transfer of <amount> to <receiver> successful",
      "new_t": client_t,
      "new_balance": balance_after_debit
    }
    ```
* **Error Paths**:
  * Decryption fail: Returns `HTTP 400` or `HTTP 401`.
  * HMAC Signature mismatch: Inserts transaction record with status `aborted` and failure reason `"HMAC mismatch"`, returns `HTTP 403 Forbidden` (`"Data integrity compromised"`).
  * Replay attack or out of sync: Returns `HTTP 403 Forbidden` (`"Transaction expired"` or `"Replay attack detected"`).
  * Insufficient balance: Inserts aborted log, returns `HTTP 400 Bad Request` with status `"futile"`.
  * Daily limit exceeded: Inserts aborted log, returns `HTTP 403 Forbidden` (`"Daily limit exceeded"`).

---

## 4. Pay Bill Route (`POST /bills/pay`)
* **Route**: `/bills/pay`
* **Function**: `pay_bill(data: BillPayRequest, username_from_token: str = Depends(get_current_user))`
* **Validation**: Validates that `bill_id` parameter exists.
* **Security Checks**:
  * Resolves user details from session token. Verifies that the bill matches the authenticated user's ID.
* **Database Queries & Tables**:
  * **Table `accounts`**: Selects and locks user account via `FOR UPDATE`. Updates balance after debiting the bill amount.
  * **Table `bills`**: Selects and locks the bill item via `FOR UPDATE`. Updates status to `'paid'` and sets `paid_at = CURRENT_TIMESTAMP`.
  * **Table `transactions`**: Inserts success transaction log.
* **Return Values**:
  * On Success: `{"status": "success", "message": "Bill payment successful", "new_balance": balance}`.
* **Error Paths**:
  * Account or Bill not found: Returns `HTTP 404`.
  * Bill already paid: Returns `HTTP 400` (`"Bill is already paid"`).
  * Insufficient balance: Returns `HTTP 400` (`"Insufficient balance to pay this bill"`).

---

## 5. Mobile Recharge Route (`POST /auth/recharge`)
* **Route**: `/auth/recharge`
* **Function**: `mobile_recharge(data: RechargeRequest, username_from_token: str = Depends(get_current_user))`
* **Validation**: Validates that phone, amount (must be positive), and operator parameters are present.
* **Security Checks**:
  * Session token validation.
* **Database Queries & Tables**:
  * **Table `accounts`**: Selects and locks user account via `FOR UPDATE`. Updates balance after debiting the recharge amount.
  * **Table `transactions`**: Inserts transaction history entry with reference `"Recharge to <phone> (<operator>)"`.
* **Return Values**:
  * On Success: `{"status": "success", "message": "Recharge successful", "new_balance": balance}`.
* **Error Paths**:
  * Invalid recharge amount (<= 0): Returns `HTTP 400`.
  * Insufficient balance: Returns `HTTP 400` (`"Insufficient balance"`).
