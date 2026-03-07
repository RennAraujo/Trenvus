-- Adiciona constraint de unicidade para nickname na tabela users
ALTER TABLE users ADD CONSTRAINT uk_users_nickname UNIQUE (nickname);

-- Adiciona constraint de unicidade para nickname na tabela pending_registrations
ALTER TABLE pending_registrations ADD CONSTRAINT uk_pending_nickname UNIQUE (nickname);
