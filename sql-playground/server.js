const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Permitir estilos inline
}));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Pool de conexiones a PostgreSQL (usuario de solo lectura)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Máximo 20 conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Palabras clave peligrosas (prohibir modificaciones)
const FORBIDDEN_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 
  'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE'
];

// Middleware para validar queries
function validateQuery(query) {
  const upperQuery = query.toUpperCase();
  
  // Verificar palabras prohibidas
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (upperQuery.includes(keyword)) {
      return { valid: false, error: `Operación no permitida: ${keyword}` };
    }
  }
  
  // Límite de queries (evitar queries múltiples maliciosas)
  const semicolonCount = (query.match(/;/g) || []).length;
  if (semicolonCount > 1) {
    return { valid: false, error: 'Solo se permite una consulta a la vez' };
  }
  
  return { valid: true };
}

// Endpoint para ejecutar queries
app.post('/api/execute', async (req, res) => {
  const { query } = req.body;
  
  if (!query || query.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      error: 'La consulta no puede estar vacía' 
    });
  }
  
  // Validar query
  const validation = validateQuery(query);
  if (!validation.valid) {
    return res.status(403).json({ 
      success: false, 
      error: validation.error 
    });
  }
  
  // Ejecutar query con timeout
  const client = await pool.connect();
  
  try {
    // Establecer timeout de 10 segundos
    await client.query('SET statement_timeout = 10000');
    
    const startTime = Date.now();
    const result = await client.query(query);
    const executionTime = Date.now() - startTime;
    
    res.json({
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields?.map(f => ({ name: f.name, type: f.dataTypeID })),
      executionTime: `${executionTime}ms`
    });
    
  } catch (error) {
    console.error('Error ejecutando query:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al ejecutar la consulta'
    });
  } finally {
    client.release();
  }
});

// Endpoint para obtener información del esquema
app.get('/api/schema', async (req, res) => {
  try {
    const query = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;
    
    const result = await pool.query(query);
    
    // Agrupar por tabla
    const schema = {};
    result.rows.forEach(row => {
      if (!schema[row.table_name]) {
        schema[row.table_name] = [];
      }
      schema[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default
      });
    });
    
    res.json({ success: true, schema });
  } catch (error) {
    console.error('Error obteniendo esquema:', error);
    res.status(500).json({ success: false, error: 'Error al obtener el esquema' });
  }
});

// Endpoint para obtener queries de ejemplo
app.get('/api/examples', (req, res) => {
  const examples = [
    {
      title: '1. Ver todas las películas',
      query: 'SELECT * FROM pelicula LIMIT 10;',
      category: 'Básico'
    },
    {
      title: '2. Películas por categoría',
      query: 'SELECT titulo, año_lanzamiento, precio_alquiler\nFROM pelicula\nWHERE categoria_id = 1\nORDER BY titulo;',
      category: 'Básico'
    },
    {
      title: '3. Películas con su categoría (JOIN)',
      query: 'SELECT p.titulo, c.nombre AS categoria, p.duracion\nFROM pelicula p\nJOIN categoria c ON p.categoria_id = c.categoria_id\nORDER BY c.nombre, p.titulo;',
      category: 'JOINs'
    },
    {
      title: '4. Actores y sus películas',
      query: 'SELECT a.nombre, a.apellido, p.titulo, pa.personaje\nFROM actor a\nJOIN pelicula_actor pa ON a.actor_id = pa.actor_id\nJOIN pelicula p ON pa.pelicula_id = p.pelicula_id\nORDER BY a.apellido, p.titulo;',
      category: 'JOINs'
    },
    {
      title: '5. Total de alquileres por cliente',
      query: 'SELECT \n  c.nombre || \' \' || c.apellido AS cliente,\n  COUNT(a.alquiler_id) AS total_alquileres,\n  SUM(a.precio_pagado) AS total_gastado\nFROM cliente c\nLEFT JOIN alquiler a ON c.cliente_id = a.cliente_id\nGROUP BY c.cliente_id, c.nombre, c.apellido\nORDER BY total_alquileres DESC;',
      category: 'Agregaciones'
    },
    {
      title: '6. Películas más rentadas',
      query: 'SELECT \n  p.titulo,\n  COUNT(a.alquiler_id) AS veces_rentada,\n  SUM(a.precio_pagado) AS ingresos\nFROM pelicula p\nLEFT JOIN alquiler a ON p.pelicula_id = a.pelicula_id\nGROUP BY p.pelicula_id, p.titulo\nHAVING COUNT(a.alquiler_id) > 0\nORDER BY veces_rentada DESC;',
      category: 'Agregaciones'
    },
    {
      title: '7. Alquileres pendientes de devolución',
      query: 'SELECT * FROM v_alquileres_activos\nORDER BY fecha_alquiler DESC;',
      category: 'Vistas'
    },
    {
      title: '8. Estadísticas por película',
      query: 'SELECT * FROM v_estadisticas_peliculas\nWHERE total_alquileres > 0\nORDER BY ingresos_totales DESC;',
      category: 'Vistas'
    },
    {
      title: '9. Películas sin alquilar nunca',
      query: 'SELECT p.titulo, c.nombre AS categoria\nFROM pelicula p\nLEFT JOIN alquiler a ON p.pelicula_id = a.pelicula_id\nLEFT JOIN categoria c ON p.categoria_id = c.categoria_id\nWHERE a.alquiler_id IS NULL\nORDER BY p.titulo;',
      category: 'Subconsultas'
    },
    {
      title: '10. Clientes que nunca han alquilado',
      query: 'SELECT nombre, apellido, email, fecha_registro\nFROM cliente\nWHERE cliente_id NOT IN (\n  SELECT DISTINCT cliente_id FROM alquiler\n)\nORDER BY fecha_registro;',
      category: 'Subconsultas'
    }
  ];
  
  res.json({ success: true, examples });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Error interno del servidor' 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📊 Conectado a base de datos PostgreSQL`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando conexiones...');
  pool.end(() => {
    console.log('Pool de conexiones cerrado');
    process.exit(0);
  });
});
