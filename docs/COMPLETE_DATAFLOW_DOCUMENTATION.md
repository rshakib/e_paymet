# COMPLETE_DATAFLOW_DOCUMENTATION.md

---

## 1. User Registration Flow

```
[Register Screen]
  |
  +-- (Step 1-3 inputs collected)
  +-- (Captures MAC address, derives K1, K2, bp_hash)
  |
  v
[authApiService.register]
  |
  +-- (Wraps keys & profile data in Layer 1 secure envelope)
  |
  v
[API POST: /auth/register]
  |
  +-- (Sends envelope payload, hmac, nonce, timestamp)
  |
  v
[FastAPI Route: /auth/register]
  |
  +-- (Decrypts outer envelope, verifies HMAC integrity)
  +-- (Performs user duplicate checks)
  |
  v
[Supabase DB Queries]
  |
  +-- INSERT INTO profiles (id, registration_number, password_key_k2, hmac_key_k1, fingerprint_bp, nid, ...)
  +-- INSERT INTO accounts (profile_id, balance, account_number, is_active)
  |
  v
[Backend Success Response]
  |
  +-- Encrypts {"success": true, "message": "Account created successfully"} in outer envelope
  |
  v
[Client UI Response Handler]
  |
  +-- (Decrypts response envelope, shows success dialog, redirects to /login)
```

---

## 2. User Login Flow

```
[Login Screen]
  |
  +-- (Captures mobile username, PIN, MAC address)
  |
  v
[authApiService.login]
  |
  +-- (Wraps credentials in Layer 1 secure envelope)
  |
  v
[API POST: /auth/login]
  |
  v
[FastAPI Route: /auth/login]
  |
  +-- (Decrypts envelope, verifies HMAC integrity)
  +-- (Validates K2 stretched PIN or performs fallback legacy migration)
  |
  v
[Supabase DB Queries]
  |
  +-- SELECT * FROM profiles WHERE registration_number = username
  +-- SELECT * FROM accounts WHERE profile_id = id AND is_active = true
  |
  v
[Backend Success Response]
  |
  +-- Generates session token, adds token to active_sessions map
  +-- Returns encrypted access_token & profile credentials (k1, k2, bp, last_t, balance)
  |
  v
[Client UI Response Handler]
  |
  +-- (Decrypts response, updates globalSession, redirects to dashboard /)
```

---

## 3. P2P Send Money Flow

```
[Send Money Screens]
  |
  +-- (Contact selected: 018XXXXXXXX)
  +-- (Amount entered: ৳500.00)
  +-- (Biometric / Face verify checks complete)
  |
  v
[authApiService.transfer]
  |
  +-- (Generates Message M = "Receiver:018XXXXXXXX|Amt:500.0")
  +-- (Generates HMAC Signature F1 = HMAC-SHA256(M, K1))
  +-- (Encrypts M | F1 via AES-256 using key derived from BP + T + K2)
  +-- (Wraps payload, iv, T inside Layer 1 outer secure envelope)
  |
  v
[API POST: /auth/transfer]
  |
  v
[FastAPI Route: /auth/transfer]
  |
  +-- (Decrypts Layer 1 outer envelope, validates session header)
  +-- (Decrypts Layer 2 inner payload using BP, T, K2)
  +-- (Verifies HMAC integrity: F1 matches generated HMAC-SHA256(M, K1))
  +-- (Verifies freshness of T and checks sequence: T > last_t)
  |
  v
[PostgreSQL Atomic Function: process_transfer_secure]
  |
  +-- Locks sender/receiver profiles and accounts (FOR UPDATE)
  +-- Verifies sender balance >= amount
  +-- Verifies daily spending limit (spent + amount <= daily_limit)
  +-- Updates sender balance, receiver balance, last_t, today_spent
  +-- Inserts audit record into transactions
  |
  v
[Backend Success Response]
  |
  +-- Returns encrypted new_balance & new_t inside outer envelope
  |
  v
[Client UI Response Handler]
  |
  +-- (Decrypts response, updates globalSession.balance, redirects to /send/success)
```

---

## 4. Utility Bill Payment Flow

```
[Utility Bill Screen]
  |
  +-- (Selects bill item, click Pay Bill)
  |
  v
[authApiService.payBill]
  |
  +-- (Sends payload containing bill_id)
  |
  v
[API POST: /bills/pay]
  |
  v
[FastAPI Route: /bills/pay]
  |
  +-- (Resolves user session from authorization headers)
  |
  v
[PostgreSQL DB Operations]
  |
  +-- SELECT FOR UPDATE on accounts where profile_id = id
  +-- SELECT FOR UPDATE on bills where id = bill_id
  +-- (Validates balance >= bill amount, verifies bill status != 'paid')
  +-- UPDATE accounts SET balance = balance - bill_amount
  +-- UPDATE bills SET status = 'paid', paid_at = CURRENT_TIMESTAMP
  +-- INSERT INTO transactions (sender_account, receiver_account, amount, status, reference)
  |
  v
[Backend Success Response]
  |
  +-- Returns {"status": "success", "message": "Bill payment successful", "new_balance": balance}
  |
  v
[Client UI Response Handler]
  |
  +-- (Updates list status, shows success message, updates dashboard balance)
```
