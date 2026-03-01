CREATE TABLE pending_registrations (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(64),
    phone VARCHAR(32),
    token VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_pending_registration_token ON pending_registrations(token);
CREATE INDEX idx_pending_registration_email ON pending_registrations(email);
