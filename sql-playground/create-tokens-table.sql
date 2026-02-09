-- Tabla para tokens de autenticación (alternativa a cookies de sesión)
CREATE TABLE IF NOT EXISTS auth_tokens (
    token_id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_token FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE
);

-- Índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_auth_token ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_usuario ON auth_tokens(usuario_id);

-- Limpiar tokens expirados (puedes ejecutar esto periódicamente)
DELETE FROM auth_tokens WHERE expires_at < NOW();

COMMENT ON TABLE auth_tokens IS 'Tokens de autenticación para acceso cross-domain (localStorage)';
