CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    currency VARCHAR(16) NOT NULL,
    balance_cents BIGINT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_wallet_user_curr ON wallets(user_id, currency);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    type VARCHAR(32) NOT NULL,
    usd_amount_cents BIGINT,
    vps_amount_cents BIGINT,
    fee_usd_cents BIGINT,
    idempotency_key VARCHAR(128),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tx_user_idempotency_key ON transactions(user_id, idempotency_key);
