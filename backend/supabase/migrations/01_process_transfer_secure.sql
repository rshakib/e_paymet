-- Migration: Create process_transfer_secure stored procedure

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
BEGIN
    -- 1. Fetch profiles (from users table) with locking
    SELECT * INTO v_sender_profile FROM users WHERE username = p_sender_username FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'Sender profile not found');
    END IF;

    SELECT * INTO v_receiver_profile FROM users WHERE username = p_receiver_username FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'Receiver profile not found');
    END IF;

    -- 2. Fetch accounts with locking
    SELECT * INTO v_sender_account FROM accounts WHERE profile_id = v_sender_profile.id AND is_active = TRUE FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'Sender account not found');
    END IF;

    SELECT * INTO v_receiver_account FROM accounts WHERE profile_id = v_receiver_profile.id AND is_active = TRUE FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'msg', 'Receiver account not found');
    END IF;

    -- 3. Balance verification
    IF v_sender_account.balance < p_amount THEN
        INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, failure_reason, reference)
        VALUES (v_sender_account.id, v_receiver_account.id, p_amount, 'aborted', 'Insufficient balance', p_reference);
        RETURN json_build_object('status', 'futile', 'msg', 'Insufficient balance');
    END IF;

    -- 4. Daily Limit validation (Bypassed since daily limit columns are not in approved schema)

    -- 5. Replay protection (DB level check)
    IF p_timestamp <= v_sender_profile.last_t THEN
        INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, failure_reason, reference)
        VALUES (v_sender_account.id, v_receiver_account.id, p_amount, 'aborted', 'Replay attack detected (T <= Last_T)', p_reference);
        RETURN json_build_object('status', 'error', 'msg', 'Replay attack detected');
    END IF;

    -- 6. Apply balances
    UPDATE accounts SET balance = balance - p_amount WHERE id = v_sender_account.id;
    UPDATE accounts SET balance = balance + p_amount WHERE id = v_receiver_account.id;

    -- 7. Update user last_t
    UPDATE users SET 
        last_t = p_timestamp
    WHERE id = v_sender_profile.id;

    -- 8. Insert success log
    INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status, reference)
    VALUES (v_sender_account.id, v_receiver_account.id, p_amount, 'success', p_reference);

    RETURN json_build_object(
        'status', 'success',
        'msg', 'Transfer successful',
        'new_balance', v_sender_account.balance - p_amount,
        'new_t', p_timestamp
    );
END;
$$ LANGUAGE plpgsql;
