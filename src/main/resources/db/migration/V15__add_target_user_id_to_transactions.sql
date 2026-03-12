-- Add target_user_id to transactions for recording recipient in transfers
ALTER TABLE transactions ADD COLUMN target_user_id BIGINT;
