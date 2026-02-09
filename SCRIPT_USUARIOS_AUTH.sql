-- ================================================
-- SCRIPT DE BASE DE DATOS PARA AUTENTICACIÓN
-- Sistema de usuarios y roles para 1º DAW
-- ================================================

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('profesor', 'alumno')),
    email VARCHAR(150),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP
);

-- Insertar profesor (contraseña hasheada con bcrypt)
INSERT INTO usuarios (username, password, nombre_completo, rol, email) VALUES
('isabelsainz', '$2b$12$jNfBCp0TV346qA4BfI7PAeXL9vYNMOZCJZaGPxRZO6KwVqDEkBmpa', 'Isabel Sainz', 'profesor', 'isabel@clases1daw.com');

-- Insertar 30 alumnos (contraseñas hasheadas con bcrypt)
INSERT INTO usuarios (username, password, nombre_completo, rol) VALUES
('alumno1', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 1', 'alumno'),
('alumno2', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 2', 'alumno'),
('alumno3', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 3', 'alumno'),
('alumno4', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 4', 'alumno'),
('alumno5', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 5', 'alumno'),
('alumno6', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 6', 'alumno'),
('alumno7', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 7', 'alumno'),
('alumno8', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 8', 'alumno'),
('alumno9', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 9', 'alumno'),
('alumno10', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 10', 'alumno'),
('alumno11', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 11', 'alumno'),
('alumno12', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 12', 'alumno'),
('alumno13', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 13', 'alumno'),
('alumno14', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 14', 'alumno'),
('alumno15', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 15', 'alumno'),
('alumno16', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 16', 'alumno'),
('alumno17', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 17', 'alumno'),
('alumno18', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 18', 'alumno'),
('alumno19', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 19', 'alumno'),
('alumno20', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 20', 'alumno'),
('alumno21', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 21', 'alumno'),
('alumno22', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 22', 'alumno'),
('alumno23', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 23', 'alumno'),
('alumno24', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 24', 'alumno'),
('alumno25', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 25', 'alumno'),
('alumno26', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 26', 'alumno'),
('alumno27', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 27', 'alumno'),
('alumno28', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 28', 'alumno'),
('alumno29', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 29', 'alumno'),
('alumno30', '$2b$12$bFnGIF1yfwQN26aJxz5yYu/qsnSxVHcv.BeBCt78c/jxbiSkHq/CG', 'Alumno 30', 'alumno');

-- Crear índices para búsquedas rápidas
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- ================================================
-- SEGURIDAD: Revocar acceso al usuario 'estudiante'
-- (usuario de solo lectura del SQL Playground)
-- ================================================
REVOKE ALL PRIVILEGES ON TABLE usuarios FROM estudiante;
REVOKE ALL PRIVILEGES ON SEQUENCE usuarios_usuario_id_seq FROM estudiante;

-- Verificar que se crearon correctamente
SELECT 
    rol,
    COUNT(*) as total
FROM usuarios
GROUP BY rol
ORDER BY rol DESC;

-- ================================================
-- NOTA: Las contraseñas están hasheadas con bcrypt
-- Las credenciales se proporcionan por separado
-- ================================================
