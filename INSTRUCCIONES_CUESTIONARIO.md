# 📝 Instrucciones: Cuestionario de Bases de Datos

## Configuración Inicial

Para que el cuestionario funcione correctamente, necesitas crear la tabla en la base de datos de PostgreSQL.

### 1. Ejecutar el script SQL

Conéctate a tu base de datos en Railway y ejecuta el siguiente script:

**Archivo:** `sql-playground/create-cuestionario-table.sql`

```sql
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

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_respuestas_usuario ON respuestas_cuestionario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_respuestas_cuestionario ON respuestas_cuestionario(cuestionario_id);
```

### 2. Verificar la tabla

Puedes verificar que la tabla se creó correctamente con:

```sql
SELECT * FROM respuestas_cuestionario;
```

## Uso del Cuestionario

### Para los alumnos:

1. Inician sesión en la plataforma
2. Van a la sección "Bases de Datos"
3. Hacen clic en "📝 Cuestionario: Fundamentos de BD"
4. Responden las 20 preguntas
5. Envían el cuestionario
6. El sistema guarda automáticamente sus respuestas

### Para el profesor (revisar respuestas):

Puedes ver todas las respuestas enviadas con esta consulta SQL:

```sql
SELECT 
    r.respuesta_id,
    u.username,
    u.nombre,
    r.fecha_envio,
    r.respuestas,
    r.revisado,
    r.nota
FROM respuestas_cuestionario r
JOIN usuarios u ON r.usuario_id = u.usuario_id
WHERE r.cuestionario_id = 'BD-CLASE1'
ORDER BY r.fecha_envio DESC;
```

### Ver respuestas de un alumno específico:

```sql
SELECT 
    u.username,
    u.nombre,
    r.respuestas,
    r.fecha_envio
FROM respuestas_cuestionario r
JOIN usuarios u ON r.usuario_id = u.usuario_id
WHERE u.username = 'alumno1'  -- Cambia por el username del alumno
AND r.cuestionario_id = 'BD-CLASE1';
```

### Marcar como revisado y añadir nota:

```sql
UPDATE respuestas_cuestionario
SET 
    revisado = true,
    nota = 18.5,  -- Calificación sobre 20
    comentarios = 'Muy bien, solo algunos errores menores en GROUP BY'
WHERE usuario_id = (SELECT usuario_id FROM usuarios WHERE username = 'alumno1')
AND cuestionario_id = 'BD-CLASE1';
```

## Estructura del Cuestionario

El cuestionario incluye:

- **20 preguntas** en total
- **Preguntas de opción múltiple** (1-11, 13-14, 16-18)
- **Preguntas de texto corto** (6, 12, 19) - Consultas SQL
- **Preguntas de texto largo** (15, 20) - Explicaciones

### Temas evaluados:

1. Conceptos de bases de datos relacionales
2. Claves primarias y foráneas
3. Sintaxis SELECT, WHERE, ORDER BY, LIMIT
4. Funciones de agregación (COUNT, SUM, AVG, MAX, MIN)
5. GROUP BY
6. Operadores lógicos (AND, OR)
7. Búsquedas con LIKE
8. Análisis de consultas SQL
9. Detección de errores de sintaxis

## API Endpoints Disponibles

### Ver respuestas (Solo profesor):

```
GET /api/cuestionario/respuestas/BD-CLASE1
```

Requiere estar autenticado como profesor.

## Notas Adicionales

- Las respuestas se guardan en formato JSONB para facilitar consultas complejas
- Los alumnos pueden reenviar el cuestionario (se sobrescribe el anterior)
- No hay límite de tiempo en el cuestionario
- Las respuestas no se califican automáticamente
