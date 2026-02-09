-- Tabla para guardar respuestas de cuestionarios
CREATE TABLE IF NOT EXISTS respuestas_cuestionario (
    respuesta_id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    cuestionario_id VARCHAR(50) NOT NULL,
    respuestas JSONB NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revisado BOOLEAN DEFAULT false,
    nota DECIMAL(5,2),
    comentarios TEXT,
    CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_respuestas_usuario ON respuestas_cuestionario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_respuestas_cuestionario ON respuestas_cuestionario(cuestionario_id);

COMMENT ON TABLE respuestas_cuestionario IS 'Respuestas de los cuestionarios enviadas por los alumnos';
