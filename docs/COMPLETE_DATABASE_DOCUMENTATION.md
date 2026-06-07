# COMPLETE_DATABASE_DOCUMENTATION.md

---

## 1. Schema Tables & Definitions

### A. Table: `profiles`
Stores user authentication credentials, registration metadata, hardware keys, biometric templates, and spending limit tracking.
* **Columns**:
  * `id` (`UUID`): Primary Key. Maps to Supabase auth user reference ID.
  * `registration_number` (`TEXT`): Unique Constraint, Not Null. Represents the mobile number/username.
  * `password_key_k2` (`TEXT`): Not Null. Stretched password key derived from PIN using NID as salt (`PBKDF2-SHA256`).
  * `fingerprint_bp` (`TEXT`): Not Null. Fingerprint template representation hash.
  * `hmac_key_k1` (`TEXT`): Not Null. Physical device-bound HMAC key.
  * `last_t` (`BIGINT`): Default `0`. Stores the client's last confirmed transaction timestamp to prevent replay attacks.
  * `daily_limit` (`DOUBLE PRECISION`): Default `5000.0`. Maximum spending limit allowed per day.
  * `today_spent` (`DOUBLE PRECISION`): Default `0.0`. Sum of transactions executed on the current calendar day.
  * `last_spent_reset_date` (`DATE`): Default `CURRENT_DATE`. Used to track calendar days and reset `today_spent` to 0.0.
  * `nid` (`TEXT`): User's National ID card number.
  * `full_name` (`TEXT`): User's legal name.
  * `mobile_number` (`TEXT`): User's contact mobile number.
  * `has_fingerprint` (`BOOLEAN`): Default `FALSE`. Biometric registration flag.
  * `has_face_id` (`BOOLEAN`): Default `FALSE`. Biometric registration flag.
  * `created_at` (`TIMESTAMP WITH TIME ZONE`): Default `CURRENT_TIMESTAMP`.
* **Relationships**:
  * Parent table referenced by `accounts.profile_id`, `bills.profile_id`.
* **APIs using it**:
  * `POST /auth/register` (Inserts user profile details)
  * `POST /auth/login` (Reads/Validates stretched PIN K2)
  * `POST /auth/transfer` (Reads K1, K2, bp; updates last_t and daily spent limits)
  * `GET /user/{username}` (Fetches profile fields)
  * `GET /search-users` (Searches profiles by query pattern)
* **Screens displaying it**:
  * Login Screen, Registration Screen, Dashboard Screen, Profile Screen, Send Money Screen (search).

### B. Table: `accounts`
Stores active balances and account mapping statuses.
* **Columns**:
  * `id` (`UUID`): Primary Key. Default `gen_random_uuid()`.
  * `profile_id` (`UUID`): Foreign Key referencing `profiles(id)`.
  * `balance` (`DOUBLE PRECISION`): Default `0.0`. Active account balance.
  * `is_active` (`BOOLEAN`): Default `TRUE`. Indicates if the account is active.
  * `account_number` (`TEXT`): Unique Constraint, Not Null. Typically formatted as `"ACC-<username>"`.
  * `created_at` (`TIMESTAMP WITH TIME ZONE`): Default `CURRENT_TIMESTAMP`.
* **Relationships**:
  * Referenced by `transactions.sender_account_id` and `transactions.receiver_account_id`.
* **APIs using it**:
  * `POST /auth/register` (Inserts account record, seeds initial balance)
  * `POST /auth/login` (Fetches current balance)
  * `POST /auth/transfer` (Debits sender account, credits receiver account)
  * `POST /bills/pay` (Debits user account balance)
  * `POST /auth/recharge` (Debits user account balance)
  * `POST /auth/merchant-payment` (Debits customer account, credits merchant account)
* **Screens displaying it**:
  * Dashboard Screen, Profile Screen, Enter Amount screens, Success receipt screens.

### C. Table: `transactions`
Audits all financial movements and failure logs.
* **Columns**:
  * `id` (`UUID`): Primary Key. Default `gen_random_uuid()`.
  * `sender_account_id` (`UUID`): Foreign Key referencing `accounts(id)`. Can be NULL for deposits or bill payments.
  * `receiver_account_id` (`UUID`): Foreign Key referencing `accounts(id)`. Can be NULL for recharges or bills.
  * `amount` (`DOUBLE PRECISION`): Not Null. Transaction value.
  * `status` (`TEXT`): Not Null. Represents the status of the transaction (e.g. `'success'`, `'aborted'`).
  * `failure_reason` (`TEXT`): Explains transaction aborts (e.g. `"Insufficient balance"`, `"HMAC mismatch"`, `"Replay attack detected"`).
  * `reference` (`TEXT`): Not Null. Unique transaction reference label (typically `"TXN-<timestamp>"`).
  * `created_at` (`TIMESTAMP WITH TIME ZONE`): Default `CURRENT_TIMESTAMP`.
* **Relationships**: None.
* **APIs using it**:
  * `POST /auth/transfer` (Inserts success/failure audit logs)
  * `GET /transactions/{username}` (Fetches transaction list)
  * `POST /bills/pay` (Logs utility payment details)
  * `POST /auth/recharge` (Logs airtime refill transaction)
  * `POST /auth/merchant-payment` (Logs payment details)
* **Screens displaying it**:
  * Dashboard Screen (Recent Activity feed), Transactions Screen (History list).

### D. Table: `bills`
Contains utility company outstanding balances.
* **Columns**:
  * `id` (`UUID`): Primary Key. Default `gen_random_uuid()`.
  * `profile_id` (`UUID`): Foreign Key referencing `profiles(id)` ON DELETE CASCADE.
  * `biller_name` (`TEXT`): Not Null (e.g. `'DESCO Electricity'`, `'Link3 Internet'`).
  * `bill_number` (`TEXT`): Not Null. Customer reference number.
  * `amount` (`DOUBLE PRECISION`): Not Null. Owed amount.
  * `due_date` (`DATE`): Not Null. Bill deadline.
  * `status` (`TEXT`): Default `'unpaid'`. Value is `'unpaid'` or `'paid'`.
  * `paid_at` (`TIMESTAMP WITH TIME ZONE`): Nullable. Tracks time of payment execution.
  * `created_at` (`TIMESTAMP WITH TIME ZONE`): Default `CURRENT_TIMESTAMP`.
* **Relationships**: Linked to user profiles.
* **APIs using it**:
  * `GET /bills/{username}` (Fetches bills list)
  * `POST /bills/pay` (Updates status to `'paid'` and sets timestamp)
* **Screens displaying it**:
  * Utility Bill Screen (`src/app/bill.tsx`).

---

## 2. Database Stored Procedures (Supabase RPC)

### Function: `process_transfer_secure`
An atomic PL/pgSQL database function that executes the transaction steps in a single SQL operation. This guarantees data consistency and prevents race conditions.

```sql
CREATE OR REPLACE FUNCTION process_transfer_secure(
    p_sender_username TEXT,
    p_receiver_username TEXT,
    p_amount DOUBLE PRECISION,
    p_timestamp BIGINT,
    p_reference TEXT
) RETURNS JSON AS $$
DECLARE
    v_sender_profile RECORD;
    v_receiver_profile RECORD;
    v_sender_account RECORD;
    v_receiver_account RECORD;
    v_today DATE;
    v_current_spent DOUBLE PRECISION;
BEGIN
    -- 1. Fetch profiles with locking
    SELECT * INTO v_sender_profile FROM profiles WHERE registration_number = p_sender_username FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'message', 'Sender profile not found');
    END IF;

    SELECT * INTO v_receiver_profile FROM profiles WHERE registration_number = p_receiver_username FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'message', 'Receiver profile not found');
    END IF;

    -- 2. Fetch accounts with locking
    SELECT * INTO v_sender_account FROM accounts WHERE profile_id = v_sender_profile.id AND is_active = TRUE FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'message', 'Sender account not found');
    END IF;

    SELECT * INTO v_receiver_account FROM accounts WHERE profile_id = v_receiver_profile.id AND is_active = TRUE FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'message', 'Receiver account not found');
    END IF;

    -- 3. Balance verification
    IF v_sender_account.balance < p_amount THEN
        INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, failure_reason, reference)
        VALUES (v_sender_account.id, v_receiver_account.id, p_amount, 'aborted', 'Insufficient balance', p_reference);
        RETURN json_build_object('status', 'futile', 'message', 'Insufficient balance');
    END IF;

    -- 4. Daily Limit validation & Reset check
    v_today := CURRENT_DATE;
    IF v_sender_profile.last_spent_reset_date IS NULL OR v_sender_profile.last_spent_reset_date < v_today THEN
        v_current_spent := 0.0;
        UPDATE profiles SET today_spent = 0.0, last_spent_reset_date = v_today WHERE id = v_sender_profile.id;
    ELSE
        v_current_spent := v_sender_profile.today_spent;
    END IF;

    IF v_current_spent + p_amount > v_sender_profile.daily_limit THEN
        INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, failure_reason, reference)
        VALUES (v_sender_account.id, v_receiver_account.id, p_amount, 'aborted', 'Daily limit exceeded', p_reference);
        RETURN json_build_object('status', 'error', 'message', 'Daily limit exceeded');
    END IF;

    -- 5. Replay protection (DB level check)
    IF p_timestamp <= v_sender_profile.last_t THEN
        INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, failure_reason, reference)
        VALUES (v_sender_account.id, v_receiver_account.id, p_amount, 'aborted', 'Replay attack detected (T <= Last_T)', p_reference);
        RETURN json_build_object('status', 'error', 'message', 'Replay attack detected');
    END IF;

    -- 6. Apply balances
    UPDATE accounts SET balance = balance - p_amount WHERE id = v_sender_account.id;
    UPDATE accounts SET balance = balance + p_amount WHERE id = v_receiver_account.id;

    -- 7. Update profile timestamp & spending limits
    UPDATE profiles SET 
        last_t = p_timestamp, 
        today_spent = v_current_spent + p_amount,
        last_spent_reset_date = v_today
    WHERE id = v_sender_profile.id;

    -- 8. Insert success log
    INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, reference)
    VALUES (v_sender_account.id, v_receiver_account.id, p_amount, 'success', p_reference);

    RETURN json_build_object(
        'status', 'success',
        'message', 'Transfer successful',
        'new_balance', v_sender_account.balance - p_amount,
        'new_t', p_timestamp
    );
END;
$$ LANGUAGE plpgsql;
```
