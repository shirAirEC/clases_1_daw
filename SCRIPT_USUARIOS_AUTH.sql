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

-- Insertar profesor
INSERT INTO usuarios (username, password, nombre_completo, rol, email) VALUES
('profesor', 'profesor123', 'Profesor Principal', 'profesor', 'profesor@clases1daw.com');

-- Insertar 30 alumnos
INSERT INTO usuarios (username, password, nombre_completo, rol) VALUES
('alumno1', 'alumno123', 'Alumno 1', 'alumno'),
('alumno2', 'alumno123', 'Alumno 2', 'alumno'),
('alumno3', 'alumno123', 'Alumno 3', 'alumno'),
('alumno4', 'alumno123', 'Alumno 4', 'alumno'),
('alumno5', 'alumno123', 'Alumno 5', 'alumno'),
('alumno6', 'alumno123', 'Alumno 6', 'alumno'),
('alumno7', 'alumno123', 'Alumno 7', 'alumno'),
('alumno8', 'alumno123', 'Alumno 8', 'alumno'),
('alumno9', 'alumno123', 'Alumno 9', 'alumno'),
('alumno10', 'alumno123', 'Alumno 10', 'alumno'),
('alumno11', 'alumno123', 'Alumno 11', 'alumno'),
('alumno12', 'alumno123', 'Alumno 12', 'alumno'),
('alumno13', 'alumno123', 'Alumno 13', 'alumno'),
('alumno14', 'alumno123', 'Alumno 14', 'alumno'),
('alumno15', 'alumno123', 'Alumno 15', 'alumno'),
('alumno16', 'alumno123', 'Alumno 16', 'alumno'),
('alumno17', 'alumno123', 'Alumno 17', 'alumno'),
('alumno18', 'alumno123', 'Alumno 18', 'alumno'),
('alumno19', 'alumno123', 'Alumno 19', 'alumno'),
('alumno20', 'alumno123', 'Alumno 20', 'alumno'),
('alumno21', 'alumno123', 'Alumno 21', 'alumno'),
('alumno22', 'alumno123', 'Alumno 22', 'alumno'),
('alumno23', 'alumno123', 'Alumno 23', 'alumno'),
('alumno24', 'alumno123', 'Alumno 24', 'alumno'),
('alumno25', 'alumno123', 'Alumno 25', 'alumno'),
('alumno26', 'alumno123', 'Alumno 26', 'alumno'),
('alumno27', 'alumno123', 'Alumno 27', 'alumno'),
('alumno28', 'alumno123', 'Alumno 28', 'alumno'),
('alumno29', 'alumno123', 'Alumno 29', 'alumno'),
('alumno30', 'alumno123', 'Alumno 30', 'alumno');

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
-- CREDENCIALES:
-- Profesor: usuario='profesor', password='profesor123'
-- Alumnos: usuario='alumno1' a 'alumno30', password='alumno123'
-- ================================================
