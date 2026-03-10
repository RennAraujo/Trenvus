-- Adiciona campo verified na tabela users
ALTER TABLE users ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false;

-- Adiciona índice para consultas por usuários verificados
CREATE INDEX idx_users_verified ON users(verified);
