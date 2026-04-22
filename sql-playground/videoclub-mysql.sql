-- ==========================================================================
-- Script de creación de la base de datos "videoclub" para MySQL Workbench
-- Versión adaptada del script PostgreSQL (init-database.sql)
-- Diseñada para los ejercicios de la clase de Subconsultas SQL
-- ==========================================================================

DROP DATABASE IF EXISTS videoclub;
CREATE DATABASE videoclub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE videoclub;

-- ===========================
-- 1. CREAR TABLAS
-- ===========================

CREATE TABLE categoria (
    categoria_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(50) NOT NULL UNIQUE,
    descripcion  TEXT
) ENGINE=InnoDB;

CREATE TABLE pelicula (
    pelicula_id     INT AUTO_INCREMENT PRIMARY KEY,
    titulo          VARCHAR(255) NOT NULL,
    descripcion     TEXT,
    año_lanzamiento INT,
    duracion        INT,                          -- en minutos
    clasificacion   VARCHAR(10),                  -- G, PG, PG-13, R, NC-17
    precio_alquiler DECIMAL(4,2) DEFAULT 2.99,
    categoria_id    INT,
    fecha_creacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categoria(categoria_id)
) ENGINE=InnoDB;

CREATE TABLE actor (
    actor_id         INT AUTO_INCREMENT PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    apellido         VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    nacionalidad     VARCHAR(50)
) ENGINE=InnoDB;

CREATE TABLE pelicula_actor (
    pelicula_id INT,
    actor_id    INT,
    personaje   VARCHAR(100),
    PRIMARY KEY (pelicula_id, actor_id),
    FOREIGN KEY (pelicula_id) REFERENCES pelicula(pelicula_id),
    FOREIGN KEY (actor_id)    REFERENCES actor(actor_id)
) ENGINE=InnoDB;

CREATE TABLE cliente (
    cliente_id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    apellido       VARCHAR(100) NOT NULL,
    email          VARCHAR(150) UNIQUE NOT NULL,
    telefono       VARCHAR(20),
    direccion      TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo         BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE alquiler (
    alquiler_id      INT AUTO_INCREMENT PRIMARY KEY,
    pelicula_id      INT,
    cliente_id       INT,
    fecha_alquiler   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion TIMESTAMP NULL DEFAULT NULL,
    precio_pagado    DECIMAL(5,2),
    FOREIGN KEY (pelicula_id) REFERENCES pelicula(pelicula_id),
    FOREIGN KEY (cliente_id)  REFERENCES cliente(cliente_id)
) ENGINE=InnoDB;

-- ===========================
-- 2. INSERTAR DATOS DE EJEMPLO
-- ===========================

-- Categorías
INSERT INTO categoria (nombre, descripcion) VALUES
    ('Acción',          'Películas de acción y aventura'),
    ('Comedia',         'Películas cómicas y humorísticas'),
    ('Drama',           'Películas dramáticas'),
    ('Terror',          'Películas de terror y suspense'),
    ('Ciencia Ficción', 'Películas de ciencia ficción'),
    ('Romance',         'Películas románticas'),
    ('Animación',       'Películas animadas'),
    ('Documental',      'Documentales');

-- Películas
INSERT INTO pelicula (titulo, descripcion, año_lanzamiento, duracion, clasificacion, precio_alquiler, categoria_id) VALUES
    ('Matrix',                              'Un hacker descubre la verdad sobre su realidad',      1999, 136, 'R',     3.99, 5),
    ('El Señor de los Anillos',             'La búsqueda para destruir el anillo único',           2001, 178, 'PG-13', 4.99, 1),
    ('Toy Story',                           'Los juguetes cobran vida cuando no hay humanos',      1995,  81, 'G',     2.99, 7),
    ('Titanic',                             'Historia de amor en el barco más famoso',             1997, 194, 'PG-13', 3.99, 6),
    ('El Padrino',                          'La saga de una familia mafiosa',                      1972, 175, 'R',     4.99, 3),
    ('Forrest Gump',                        'La extraordinaria vida de un hombre simple',          1994, 142, 'PG-13', 3.99, 3),
    ('Inception',                           'Ladrones que roban secretos a través de los sueños',  2010, 148, 'PG-13', 4.99, 5),
    ('El Rey León',                         'Un león joven debe reclamar su reino',                1994,  88, 'G',     2.99, 7),
    ('Pulp Fiction',                        'Historias entrelazadas del mundo criminal',           1994, 154, 'R',     3.99, 1),
    ('Avatar',                              'Un marine en un mundo alienígena',                    2009, 162, 'PG-13', 4.99, 5),
    ('La La Land',                          'Historia de amor entre un pianista y una actriz',     2016, 128, 'PG-13', 3.99, 6),
    ('Interstellar',                        'Viaje a través del espacio para salvar la humanidad', 2014, 169, 'PG-13', 4.99, 5),
    ('El Conjuro',                          'Investigadores paranormales enfrentan demonios',      2013, 112, 'R',     3.99, 4),
    ('Coco',                                'Un niño viaja al mundo de los muertos',               2017, 105, 'PG',    2.99, 7),
    ('Parásitos',                           'Una familia pobre se infiltra en una familia rica',   2019, 132, 'R',     4.99, 3),
    ('Avengers: Endgame',                   'Los héroes luchan por deshacer las acciones de Thanos', 2019, 181, 'PG-13', 4.99, 1),
    ('Joker',                               'Origen del villano más icónico de Gotham',            2019, 122, 'R',     4.99, 3),
    ('Spider-Man: No Way Home',             'Peter Parker enfrenta villanos del multiverso',       2021, 148, 'PG-13', 4.99, 1),
    ('Dune',                                'Épica sobre el control de un planeta desértico',      2021, 155, 'PG-13', 4.99, 5),
    ('Todo en todas partes al mismo tiempo','Una mujer navega el multiverso',                      2022, 139, 'R',     4.99, 5);

-- Actores
INSERT INTO actor (nombre, apellido, fecha_nacimiento, nacionalidad) VALUES
    ('Keanu',     'Reeves',       '1964-09-02', 'Canadiense'),
    ('Tom',       'Hanks',        '1956-07-09', 'Estadounidense'),
    ('Leonardo',  'DiCaprio',     '1974-11-11', 'Estadounidense'),
    ('Marlon',    'Brando',       '1924-04-03', 'Estadounidense'),
    ('Robert',    'Downey Jr.',   '1965-04-04', 'Estadounidense'),
    ('Scarlett',  'Johansson',    '1984-11-22', 'Estadounidense'),
    ('Morgan',    'Freeman',      '1937-06-01', 'Estadounidense'),
    ('Brad',      'Pitt',         '1963-12-18', 'Estadounidense'),
    ('Natalie',   'Portman',      '1981-06-09', 'Israelí-Estadounidense'),
    ('Samuel L.', 'Jackson',      '1948-12-21', 'Estadounidense'),
    ('Emma',      'Stone',        '1988-11-06', 'Estadounidense'),
    ('Ryan',      'Gosling',      '1980-11-12', 'Canadiense'),
    ('Matthew',   'McConaughey',  '1969-11-04', 'Estadounidense'),
    ('Anne',      'Hathaway',     '1982-11-12', 'Estadounidense'),
    ('Song Kang', 'Ho',           '1967-01-17', 'Surcoreano'),
    ('Joaquin',   'Phoenix',      '1974-10-28', 'Estadounidense'),
    ('Tom',       'Holland',      '1996-06-01', 'Británico'),
    ('Zendaya',   'Coleman',      '1996-09-01', 'Estadounidense'),
    ('Timothée',  'Chalamet',     '1995-12-27', 'Estadounidense-Francés'),
    ('Michelle',  'Yeoh',         '1962-08-06', 'Malasia');

-- Relación películas-actores
INSERT INTO pelicula_actor (pelicula_id, actor_id, personaje) VALUES
    ( 1,  1, 'Neo'),
    ( 2,  7, 'Gandalf'),
    ( 3,  2, 'Woody (voz)'),
    ( 4,  3, 'Jack Dawson'),
    ( 5,  4, 'Don Vito Corleone'),
    ( 6,  2, 'Forrest Gump'),
    ( 7,  3, 'Dom Cobb'),
    ( 9, 10, 'Jules Winnfield'),
    ( 9,  8, 'Vincent Vega'),
    (11, 11, 'Mia'),
    (11, 12, 'Sebastian'),
    (12, 13, 'Cooper'),
    (12, 14, 'Brand'),
    (15, 15, 'Kim Ki-taek'),
    (16,  5, 'Tony Stark / Iron Man'),
    (16,  6, 'Natasha Romanoff / Black Widow'),
    (17, 16, 'Arthur Fleck / Joker'),
    (18, 17, 'Peter Parker / Spider-Man'),
    (18, 18, 'MJ'),
    (19, 19, 'Paul Atreides'),
    (20, 20, 'Evelyn Wang');

-- Clientes (Juan y Pedro activos; un par INACTIVOS para el ejercicio 3)
INSERT INTO cliente (nombre, apellido, email, telefono, direccion, activo) VALUES
    ('Juan',   'Pérez',     'juan.perez@email.com',       '612345678', 'Calle Mayor 1, Madrid',           TRUE),
    ('María',  'García',    'maria.garcia@email.com',     '623456789', 'Avenida Principal 45, Barcelona', TRUE),
    ('Carlos', 'López',     'carlos.lopez@email.com',     '634567890', 'Plaza España 3, Valencia',        TRUE),
    ('Ana',    'Martínez',  'ana.martinez@email.com',     '645678901', 'Calle Luna 12, Sevilla',          FALSE),
    ('Luis',   'Rodríguez', 'luis.rodriguez@email.com',   '656789012', 'Avenida Sol 8, Bilbao',           TRUE),
    ('Laura',  'Fernández', 'laura.fernandez@email.com',  '667890123', 'Calle Estrella 22, Málaga',       TRUE),
    ('Pedro',  'Sánchez',   'pedro.sanchez@email.com',    '678901234', 'Plaza Mayor 5, Zaragoza',         TRUE),
    ('Carmen', 'González',  'carmen.gonzalez@email.com',  '689012345', 'Calle Real 18, Murcia',           FALSE),
    ('David',  'Ruiz',      'david.ruiz@email.com',       '690123456', 'Avenida Libertad 33, Palma',      TRUE),
    ('Elena',  'Díaz',      'elena.diaz@email.com',       '601234567', 'Calle Nueva 7, Las Palmas',       TRUE);

-- Alquileres (algunos devueltos, otros pendientes)
INSERT INTO alquiler (pelicula_id, cliente_id, fecha_alquiler, fecha_devolucion, precio_pagado) VALUES
    ( 1,  1, '2024-01-15 10:30:00', '2024-01-17 14:20:00', 3.99),
    ( 3,  1, '2024-01-20 15:45:00', '2024-01-22 11:30:00', 2.99),
    ( 2,  2, '2024-01-16 09:15:00', '2024-01-19 16:45:00', 4.99),
    ( 5,  3, '2024-01-18 14:20:00', '2024-01-21 10:15:00', 4.99),
    ( 7,  4, '2024-01-19 11:30:00',  NULL,                 4.99),  -- pendiente
    ( 8,  5, '2024-01-21 16:45:00', '2024-01-23 13:20:00', 2.99),
    (10,  6, '2024-01-22 10:15:00',  NULL,                 4.99),  -- pendiente
    ( 4,  7, '2024-01-23 13:20:00', '2024-01-25 15:30:00', 3.99),
    ( 6,  8, '2024-01-24 15:30:00',  NULL,                 3.99),  -- pendiente
    ( 9,  9, '2024-01-25 12:00:00', '2024-01-27 14:45:00', 3.99),
    (11, 10, '2024-01-26 14:45:00',  NULL,                 3.99),  -- pendiente
    (12,  1, '2024-01-27 09:30:00', '2024-01-29 16:20:00', 4.99),
    (15,  2, '2024-01-28 11:15:00',  NULL,                 4.99),  -- pendiente
    (16,  3, '2024-01-29 16:20:00', '2024-01-31 12:45:00', 4.99),
    (18,  4, '2024-01-30 12:45:00',  NULL,                 4.99),  -- pendiente
    ( 1,  5, '2024-02-01 10:00:00', '2024-02-03 15:30:00', 3.99),
    ( 3,  6, '2024-02-02 15:30:00',  NULL,                 2.99),  -- pendiente
    ( 7,  7, '2024-02-03 13:15:00', '2024-02-05 11:20:00', 4.99),
    (14,  8, '2024-02-04 11:20:00',  NULL,                 2.99),  -- pendiente
    (20,  9, '2024-02-05 09:45:00', '2024-02-07 14:30:00', 4.99);

-- ===========================
-- 3. CREAR ÍNDICES
-- ===========================

CREATE INDEX idx_pelicula_categoria ON pelicula(categoria_id);
CREATE INDEX idx_pelicula_titulo    ON pelicula(titulo);
CREATE INDEX idx_alquiler_cliente   ON alquiler(cliente_id);
CREATE INDEX idx_alquiler_pelicula  ON alquiler(pelicula_id);
CREATE INDEX idx_alquiler_fecha     ON alquiler(fecha_alquiler);

-- ===========================
-- 4. CREAR VISTAS ÚTILES
-- ===========================

CREATE OR REPLACE VIEW v_peliculas_completas AS
SELECT
    p.pelicula_id,
    p.titulo,
    p.descripcion,
    p.año_lanzamiento,
    p.duracion,
    p.clasificacion,
    p.precio_alquiler,
    c.nombre AS categoria
FROM pelicula p
LEFT JOIN categoria c ON p.categoria_id = c.categoria_id;

CREATE OR REPLACE VIEW v_alquileres_activos AS
SELECT
    a.alquiler_id,
    CONCAT(c.nombre, ' ', c.apellido) AS cliente,
    p.titulo                          AS pelicula,
    a.fecha_alquiler,
    TIMESTAMPDIFF(DAY, a.fecha_alquiler, NOW()) AS dias_alquilado
FROM alquiler a
JOIN cliente  c ON a.cliente_id  = c.cliente_id
JOIN pelicula p ON a.pelicula_id = p.pelicula_id
WHERE a.fecha_devolucion IS NULL;

CREATE OR REPLACE VIEW v_estadisticas_peliculas AS
SELECT
    p.pelicula_id,
    p.titulo,
    c.nombre                         AS categoria,
    COUNT(a.alquiler_id)             AS total_alquileres,
    IFNULL(SUM(a.precio_pagado), 0)  AS ingresos_totales,
    ROUND(AVG(a.precio_pagado), 2)   AS precio_promedio
FROM pelicula p
LEFT JOIN alquiler  a ON p.pelicula_id = a.pelicula_id
LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
GROUP BY p.pelicula_id, p.titulo, c.nombre;

-- ===========================
-- 5. COMPROBACIÓN RÁPIDA
-- ===========================

SELECT 'categoria'      AS tabla, COUNT(*) AS filas FROM categoria
UNION ALL SELECT 'pelicula',       COUNT(*) FROM pelicula
UNION ALL SELECT 'actor',          COUNT(*) FROM actor
UNION ALL SELECT 'pelicula_actor', COUNT(*) FROM pelicula_actor
UNION ALL SELECT 'cliente',        COUNT(*) FROM cliente
UNION ALL SELECT 'alquiler',       COUNT(*) FROM alquiler;

-- ==========================================================================
-- RESUMEN
-- - 8 categorías (Animación = id 7, Ciencia Ficción = id 5)
-- - 20 películas (Matrix, El Padrino, Interstellar, ...)
-- - 20 actores
-- - 21 relaciones pelicula_actor
-- - 10 clientes (2 inactivos: Ana Martínez y Carmen González)
-- - 20 alquileres (9 con fecha_devolucion NULL = pendientes)
-- - 3 vistas: v_peliculas_completas, v_alquileres_activos, v_estadisticas_peliculas
-- ==========================================================================
