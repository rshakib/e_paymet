-- Migration: Create remaining atomic transaction procedures (Bill Payment, Recharge, Merchant Payment)

-- 1. Bill Payment Stored Procedure
CREATE OR REPLACE FUNCTION process_bill_pay_secure(
    p_username TEXT,
    p_bill_id UUID,
    p_timestamp BIGINT,
    p_reference TEXT
) RETURNS JSON AS $$
DECLARE
    v_user RECORD;
    v_account RECORD;
    v_bill RECORD;
BEGIN
    -- 1. Fetch user profile with locking
    SELECT * INTO v_user FROM users WHERE username = p_username FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'User not found');
    END IF;

    -- 2. Fetch account with locking
    SELECT * INTO v_account FROM accounts WHERE profile_id = v_user.id AND is_active = TRUE FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'Account not found');
    END IF;

    -- 3. Fetch bill with locking
    SELECT * INTO v_bill FROM bills WHERE id = p_bill_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'Bill not found');
    END IF;

    -- 4. Check if bill is already paid
    IF v_bill.status = 'paid' THEN
        RETURN json_build_object('status', 'error', 'msg', 'Bill is already paid');
    END IF;

    -- 5. Balance verification
    IF v_account.balance < v_bill.amount THEN
        INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, failure_reason, reference)
        VALUES (v_account.id, NULL, v_bill.amount, 'aborted', 'Insufficient balance', p_reference);
        RETURN json_build_object('status', 'error', 'msg', 'Insufficient balance');
    END IF;

    -- 6. Replay protection (DB level check)
    IF p_timestamp <= v_user.last_t THEN
        INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, failure_reason, reference)
        VALUES (v_account.id, NULL, v_bill.amount, 'aborted', 'Replay attack detected (T <= Last_T)', p_reference);
        RETURN json_build_object('status', 'error', 'msg', 'Replay attack detected');
    END IF;

    -- 7. Apply balances (Debit user account)
    UPDATE accounts SET balance = balance - v_bill.amount WHERE id = v_account.id;

    -- 8. Update bill status
    UPDATE bills SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = p_bill_id;

    -- 9. Update user last_t
    UPDATE users SET last_t = p_timestamp WHERE id = v_user.id;

    -- 10. Insert success log
    INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, reference)
    VALUES (v_account.id, NULL, v_bill.amount, 'success', p_reference);

    RETURN json_build_object(
        'status', 'success',
        'msg', 'Bill payment successful',
        'new_balance', v_account.balance - v_bill.amount,
        'new_t', p_timestamp
    );
END;
$$ LANGUAGE plpgsql;


-- 2. Mobile Recharge Stored Procedure
CREATE OR REPLACE FUNCTION process_recharge_secure(
    p_username TEXT,
    p_amount DOUBLE PRECISION,
    p_timestamp BIGINT,
    p_reference TEXT
) RETURNS JSON AS $$
DECLARE
    v_user RECORD;
    v_account RECORD;
BEGIN
    -- 1. Fetch user profile with locking
    SELECT * INTO v_user FROM users WHERE username = p_username FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'User not found');
    END IF;

    -- 2. Fetch account with locking
    SELECT * INTO v_account FROM accounts WHERE profile_id = v_user.id AND is_active = TRUE FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'Account not found');
    END IF;

    -- 3. Balance verification
    IF v_account.balance < p_amount THEN
        INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, failure_reason, reference)
        VALUES (v_account.id, NULL, p_amount, 'aborted', 'Insufficient balance', p_reference);
        RETURN json_build_object('status', 'error', 'msg', 'Insufficient balance');
    END IF;

    -- 4. Replay protection (DB level check)
    IF p_timestamp <= v_user.last_t THEN
        INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, failure_reason, reference)
        VALUES (v_account.id, NULL, p_amount, 'aborted', 'Replay attack detected (T <= Last_T)', p_reference);
        RETURN json_build_object('status', 'error', 'msg', 'Replay attack detected');
    END IF;

    -- 5. Apply balances (Debit user account)
    UPDATE accounts SET balance = balance - p_amount WHERE id = v_account.id;

    -- 6. Update user last_t
    UPDATE users SET last_t = p_timestamp WHERE id = v_user.id;

    -- 7. Insert success log
    INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, reference)
    VALUES (v_account.id, NULL, p_amount, 'success', p_reference);

    RETURN json_build_object(
        'status', 'success',
        'msg', 'Recharge successful',
        'new_balance', v_account.balance - p_amount,
        'new_t', p_timestamp
    );
END;
$$ LANGUAGE plpgsql;


-- 3. Merchant Payment Stored Procedure
CREATE OR REPLACE FUNCTION process_merchant_payment_secure(
    p_sender_username TEXT,
    p_merchant_username TEXT,
    p_amount DOUBLE PRECISION,
    p_timestamp BIGINT,
    p_reference TEXT
) RETURNS JSON AS $$
DECLARE
    v_sender_user RECORD;
    v_merchant_user RECORD;
    v_sender_account RECORD;
    v_merchant_account RECORD;
BEGIN
    -- 1. Fetch profiles with locking
    SELECT * INTO v_sender_user FROM users WHERE username = p_sender_username FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'Sender profile not found');
    END IF;

    SELECT * INTO v_merchant_user FROM users WHERE username = p_merchant_username FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'Merchant profile not found');
    END IF;

    -- 2. Fetch accounts with locking
    SELECT * INTO v_sender_account FROM accounts WHERE profile_id = v_sender_user.id AND is_active = TRUE FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'Sender account not found');
    END IF;

    SELECT * INTO v_merchant_account FROM accounts WHERE profile_id = v_merchant_user.id AND is_active = TRUE FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'Merchant account not found');
    END IF;

    -- 3. Balance verification
    IF v_sender_account.balance < p_amount THEN
        INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, failure_reason, reference)
        VALUES (v_sender_account.id, v_merchant_account.id, p_amount, 'aborted', 'Insufficient balance', p_reference);
        RETURN json_build_object('status', 'error', 'msg', 'Insufficient balance');
    END IF;

    -- 4. Replay protection (DB level check)
    IF p_timestamp <= v_sender_user.last_t THEN
        INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, failure_reason, reference)
        VALUES (v_sender_account.id, v_merchant_account.id, p_amount, 'aborted', 'Replay attack detected (T <= Last_T)', p_reference);
        RETURN json_build_object('status', 'error', 'msg', 'Replay attack detected');
    END IF;

    -- 5. Apply balances
    UPDATE accounts SET balance = balance - p_amount WHERE id = v_sender_account.id;
    UPDATE accounts SET balance = balance + p_amount WHERE id = v_merchant_account.id;

    -- 6. Update user last_t
    UPDATE users SET last_t = p_timestamp WHERE id = v_sender_user.id;

    -- 7. Insert success log
    INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, reference)
    VALUES (v_sender_account.id, v_merchant_account.id, p_amount, 'success', p_reference);

    RETURN json_build_object(
        'status', 'success',
        'msg', 'Merchant payment successful',
        'new_balance', v_sender_account.balance - p_amount,
        'new_t', p_timestamp
    );
END;
$$ LANGUAGE plpgsql;
