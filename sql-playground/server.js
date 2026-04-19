const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Pool de conexiones a PostgreSQL (definir ANTES de usar en sesión)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Configuración de CORS más robusta
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman) y todos los orígenes
    callback(null, origin || '*');
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['set-cookie', 'Authorization'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight por 24 horas
};

// CORS debe ir primero - antes de todo
app.use(cors(corsOptions));

// Manejar todas las preflight OPTIONS explícitamente ANTES de cualquier middleware
app.use((req, res, next) => {
  // Asegurar headers CORS en TODAS las respuestas
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
  res.header('Access-Control-Expose-Headers', 'set-cookie,Authorization');
  
  // Si es preflight, responder inmediatamente
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400');
    return res.sendStatus(200);
  }
  
  next();
});

// JSON parser (límite ampliado a 3 MB para permitir guardar clases editadas completas)
app.use(express.json({ limit: '3mb' }));

// Configuración de seguridad DESPUÉS de CORS
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));

// Configurar sesiones con PostgreSQL store (más robusto para producción)
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'clases1daw-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  proxy: true, // Confiar en el proxy de Railway
  cookie: {
    secure: true, // Siempre true para HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: 'none' // Permitir cookies cross-site
  }
}));

app.use(express.static('public'));

// Palabras clave peligrosas (prohibir modificaciones)
const FORBIDDEN_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 
  'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE'
];

// Tablas del sistema que NO deben ser accesibles desde el playground
const FORBIDDEN_TABLES = [
  'usuarios',
  'session',
  'auth_tokens',
  'respuestas_cuestionario'
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
  
  // Verificar que no se acceda a tablas del sistema
  for (const table of FORBIDDEN_TABLES) {
    const tableUpper = table.toUpperCase();
    // Buscar la tabla en diferentes contextos: FROM, JOIN, etc.
    const patterns = [
      `FROM ${tableUpper}`,
      `FROM\n${tableUpper}`,
      `FROM\t${tableUpper}`,
      `JOIN ${tableUpper}`,
      `JOIN\n${tableUpper}`,
      `JOIN\t${tableUpper}`,
      // También detectar con alias: "FROM usuarios u" o "usuarios AS u"
      new RegExp(`FROM\\s+${tableUpper}(\\s+|$|\\s+AS\\s+)`, 'i'),
      new RegExp(`JOIN\\s+${tableUpper}(\\s+|$|\\s+AS\\s+)`, 'i')
    ];
    
    for (const pattern of patterns) {
      if (typeof pattern === 'string') {
        if (upperQuery.includes(pattern)) {
          return { 
            valid: false, 
            error: `⛔ Acceso denegado: La tabla "${table}" es una tabla del sistema y no está disponible en el playground. Usa solo las tablas del videoclub (pelicula, cliente, actor, alquiler, categoria, pelicula_actor).` 
          };
        }
      } else {
        // Es una RegExp
        if (pattern.test(query)) {
          return { 
            valid: false, 
            error: `⛔ Acceso denegado: La tabla "${table}" es una tabla del sistema y no está disponible en el playground. Usa solo las tablas del videoclub (pelicula, cliente, actor, alquiler, categoria, pelicula_actor).` 
          };
        }
      }
    }
  }
  
  // Límite de queries (evitar queries múltiples maliciosas)
  const semicolonCount = (query.match(/;/g) || []).length;
  if (semicolonCount > 1) {
    return { valid: false, error: 'Solo se permite una consulta a la vez' };
  }
  
  return { valid: true };
}

// Logging de todas las peticiones
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Middleware para verificar autenticación (sesión O token)
async function requireAuth(req, res, next) {
  const endpoint = req.originalUrl || req.url;
  
  // Intentar 1: Verificar sesión
  if (req.session && req.session.user) {
    console.log(`✅ requireAuth: OK (sesión) - ${req.session.user.username} → ${endpoint}`);
    return next();
  }

  // Intentar 2: Verificar token en header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log(`❌ requireAuth: Sin header Authorization → ${endpoint}`);
    return res.status(401).json({ 
      success: false, 
      error: 'Debes iniciar sesión para acceder' 
    });
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.log(`❌ requireAuth: Authorization header sin Bearer → ${endpoint}`);
    return res.status(401).json({ 
      success: false, 
      error: 'Formato de token inválido' 
    });
  }
  
  const token = authHeader.substring(7);
  console.log(`🔍 requireAuth: Verificando token (primeros 8 chars: ${token.substring(0, 8)}...) → ${endpoint}`);
  
  try {
    const result = await pool.query(
      `SELECT u.*, t.expires_at FROM usuarios u 
       JOIN auth_tokens t ON u.usuario_id = t.usuario_id 
       WHERE t.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      console.log(`❌ requireAuth: Token no encontrado en BD → ${endpoint}`);
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }
    
    const user = result.rows[0];
    const tokenExpired = new Date(user.expires_at) < new Date();
    
    if (tokenExpired) {
      console.log(`⏰ requireAuth: Token expirado (${user.expires_at}) para ${user.username} → ${endpoint}`);
      return res.status(401).json({ 
        success: false, 
        error: 'Token expirado, por favor inicia sesión nuevamente' 
      });
    }
    
    // Actualizar last_used
    await pool.query('UPDATE auth_tokens SET last_used = NOW() WHERE token = $1', [token]);
    
    // Adjuntar usuario a la request
    req.user = {
      usuario_id: user.usuario_id,
      username: user.username,
      nombre: user.nombre_completo,
      rol: user.rol,
      email: user.email
    };
    
    console.log(`✅ requireAuth: OK (token) - ${user.username} (${user.rol}) → ${endpoint}`);
    return next();
    
  } catch (error) {
    console.error(`❌ requireAuth: Error de BD al validar token → ${endpoint}:`, error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
}

// Helper para obtener usuario actual (desde sesión o token)
function getCurrentUser(req) {
  // Priorizar req.user (desde token)
  if (req.user) {
    return req.user;
  }
  
  // Fallback a req.session.user (desde cookie de sesión)
  if (req.session && req.session.user) {
    // Normalizar el formato para asegurar que tenga usuario_id
    const sessionUser = req.session.user;
    return {
      usuario_id: sessionUser.usuario_id || sessionUser.id,
      username: sessionUser.username,
      nombre: sessionUser.nombre,
      rol: sessionUser.rol,
      email: sessionUser.email
    };
  }
  
  return null;
}

// Health check endpoint para Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint de test para CORS (sin autenticación)
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando correctamente',
    cors: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Test POST para verificar CORS en método POST (sin autenticación)
app.post('/api/test-post', (req, res) => {
  console.log('POST /api/test-post recibido', req.body);
  res.json({ 
    success: true, 
    message: 'POST funcionando correctamente',
    received: req.body,
    cors: 'OK',
    timestamp: new Date().toISOString()
  });
});

// ===== ENDPOINTS DE AUTENTICACIÓN =====

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Usuario y contraseña son requeridos' 
    });
  }
  
  try {
    // Buscar usuario en la base de datos
    const query = 'SELECT * FROM usuarios WHERE username = $1 AND activo = true';
    const result = await pool.query(query, [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario o contraseña incorrectos' 
      });
    }
    
    const user = result.rows[0];
    
    // Verificar contraseña hasheada con bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario o contraseña incorrectos' 
      });
    }
    
    // Actualizar última conexión
    await pool.query(
      'UPDATE usuarios SET ultima_conexion = NOW() WHERE usuario_id = $1',
      [user.usuario_id]
    );
    
    // Generar token de autenticación
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
    
    // Limpiar solo tokens EXPIRADOS del usuario (no todos)
    await pool.query('DELETE FROM auth_tokens WHERE usuario_id = $1 AND expires_at < NOW()', [user.usuario_id]);
    
    // Guardar nuevo token (permite múltiples sesiones simultáneas)
    await pool.query(
      'INSERT INTO auth_tokens (usuario_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.usuario_id, token, expiresAt]
    );
    
    // Crear sesión (para compatibilidad)
    req.session.user = {
      usuario_id: user.usuario_id,
      username: user.username,
      nombre: user.nombre_completo,
      rol: user.rol,
      email: user.email
    };
    
    res.json({
      success: true,
      token: token, // Token para localStorage
      user: {
        usuario_id: user.usuario_id,
        username: user.username,
        nombre: user.nombre_completo,
        rol: user.rol,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al iniciar sesión' 
    });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Error al cerrar sesión' 
      });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Verificar sesión
app.get('/api/session', (req, res) => {
  const user = getCurrentUser(req);
  const authHeader = req.headers.authorization;
  const hasSession = !!req.session?.user;
  
  console.log(`🔍 Verificación de sesión - Usuario: ${user ? user.username : 'ninguno'}, Token: ${authHeader ? 'presente' : 'ausente'}, Session: ${hasSession ? 'sí' : 'no'}`);
  
  if (user) {
    res.json({
      success: true,
      authenticated: true,
      user: user
    });
  } else {
    console.log('⚠️ Verificación fallida - Sin usuario autenticado');
    res.json({
      success: true,
      authenticated: false
    });
  }
});

// Endpoint para ejecutar queries (PROTEGIDO - requiere autenticación)
app.post('/api/execute', requireAuth, async (req, res) => {
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

// Endpoint para obtener información del esquema (PROTEGIDO)
app.get('/api/schema', requireAuth, async (req, res) => {
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
    
    // Agrupar por tabla, excluyendo tablas del sistema
    const schema = {};
    result.rows.forEach(row => {
      // Saltar tablas prohibidas (del sistema)
      if (FORBIDDEN_TABLES.includes(row.table_name.toLowerCase())) {
        return;
      }
      
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

// Endpoint para obtener queries de ejemplo (PROTEGIDO)
app.get('/api/examples', requireAuth, (req, res) => {
  const examples = [
    {
      title: '1. SELECT básico - Ver todas las películas',
      query: 'SELECT * FROM pelicula LIMIT 10;',
      category: 'SELECT Básico'
    },
    {
      title: '2. SELECT específico - Títulos de películas',
      query: 'SELECT titulo FROM pelicula;',
      category: 'SELECT Básico'
    },
    {
      title: '3. WHERE simple - Películas baratas',
      query: 'SELECT titulo, precio_alquiler\nFROM pelicula\nWHERE precio_alquiler < 3.00;',
      category: 'WHERE'
    },
    {
      title: '4. WHERE con comparación - Películas modernas',
      query: 'SELECT titulo, año_lanzamiento\nFROM pelicula\nWHERE año_lanzamiento >= 2010\nORDER BY año_lanzamiento;',
      category: 'WHERE'
    },
    {
      title: '5. ORDER BY - Películas ordenadas por año',
      query: 'SELECT titulo, año_lanzamiento\nFROM pelicula\nORDER BY año_lanzamiento DESC;',
      category: 'ORDER BY'
    },
    {
      title: '6. LIMIT - Primeras 5 películas',
      query: 'SELECT titulo, año_lanzamiento\nFROM pelicula\nORDER BY año_lanzamiento DESC\nLIMIT 5;',
      category: 'LIMIT'
    },
    {
      title: '7. AND - Películas baratas y recientes',
      query: 'SELECT titulo, año_lanzamiento, precio_alquiler\nFROM pelicula\nWHERE precio_alquiler < 3.50 AND año_lanzamiento > 2005\nORDER BY año_lanzamiento;',
      category: 'Operadores Lógicos'
    },
    {
      title: '8. OR - Películas extremas en precio',
      query: 'SELECT titulo, precio_alquiler\nFROM pelicula\nWHERE precio_alquiler < 2.00 OR precio_alquiler > 4.50\nORDER BY precio_alquiler;',
      category: 'Operadores Lógicos'
    },
    {
      title: '9. LIKE - Buscar películas por título',
      query: 'SELECT titulo\nFROM pelicula\nWHERE titulo LIKE \'%Matrix%\';',
      category: 'LIKE - Búsqueda'
    },
    {
      title: '10. LIKE con patrones - Nombres que empiezan con M',
      query: 'SELECT nombre, apellido\nFROM cliente\nWHERE nombre LIKE \'M%\'\nORDER BY nombre;',
      category: 'LIKE - Búsqueda'
    },
    {
      title: '11. COUNT - Contar películas',
      query: 'SELECT COUNT(*) AS total_peliculas\nFROM pelicula;',
      category: 'Funciones de Agregación'
    },
    {
      title: '12. AVG - Precio promedio de alquiler',
      query: 'SELECT AVG(precio_alquiler) AS precio_promedio\nFROM pelicula;',
      category: 'Funciones de Agregación'
    },
    {
      title: '13. MAX y MIN - Precios extremos',
      query: 'SELECT \n  MAX(precio_alquiler) AS mas_caro,\n  MIN(precio_alquiler) AS mas_barato\nFROM pelicula;',
      category: 'Funciones de Agregación'
    },
    {
      title: '14. SUM - Total de ingresos',
      query: 'SELECT SUM(precio_pagado) AS ingresos_totales\nFROM alquiler;',
      category: 'Funciones de Agregación'
    },
    {
      title: '15. GROUP BY simple - Contar por categoría',
      query: 'SELECT categoria_id, COUNT(*) AS total\nFROM pelicula\nGROUP BY categoria_id\nORDER BY total DESC;',
      category: 'GROUP BY'
    },
    {
      title: '16. GROUP BY con AVG - Precio promedio por categoría',
      query: 'SELECT categoria_id, AVG(precio_alquiler) AS precio_promedio\nFROM pelicula\nGROUP BY categoria_id\nORDER BY precio_promedio DESC;',
      category: 'GROUP BY'
    },
    {
      title: '17. Películas por categoría filtradas',
      query: 'SELECT titulo, año_lanzamiento, precio_alquiler\nFROM pelicula\nWHERE categoria_id = 1\nORDER BY titulo;',
      category: 'WHERE + ORDER BY'
    },
    {
      title: '18. Películas con su categoría (JOIN)',
      query: 'SELECT p.titulo, c.nombre AS categoria, p.duracion\nFROM pelicula p\nJOIN categoria c ON p.categoria_id = c.categoria_id\nORDER BY c.nombre, p.titulo;',
      category: 'JOINs'
    },
    {
      title: '19. Actores y sus películas',
      query: 'SELECT a.nombre, a.apellido, p.titulo, pa.personaje\nFROM actor a\nJOIN pelicula_actor pa ON a.actor_id = pa.actor_id\nJOIN pelicula p ON pa.pelicula_id = p.pelicula_id\nORDER BY a.apellido, p.titulo;',
      category: 'JOINs'
    },
    {
      title: '20. Total de alquileres por cliente',
      query: 'SELECT \n  c.nombre || \' \' || c.apellido AS cliente,\n  COUNT(a.alquiler_id) AS total_alquileres,\n  SUM(a.precio_pagado) AS total_gastado\nFROM cliente c\nLEFT JOIN alquiler a ON c.cliente_id = a.cliente_id\nGROUP BY c.cliente_id, c.nombre, c.apellido\nORDER BY total_alquileres DESC;',
      category: 'GROUP BY + JOINs'
    },
    {
      title: '21. Películas más rentadas',
      query: 'SELECT \n  p.titulo,\n  COUNT(a.alquiler_id) AS veces_rentada,\n  SUM(a.precio_pagado) AS ingresos\nFROM pelicula p\nLEFT JOIN alquiler a ON p.pelicula_id = a.pelicula_id\nGROUP BY p.pelicula_id, p.titulo\nHAVING COUNT(a.alquiler_id) > 0\nORDER BY veces_rentada DESC;',
      category: 'GROUP BY + JOINs'
    },
    {
      title: '22. Alquileres pendientes de devolución',
      query: 'SELECT * FROM v_alquileres_activos\nORDER BY fecha_alquiler DESC;',
      category: 'Vistas'
    },
    {
      title: '23. Estadísticas por película',
      query: 'SELECT * FROM v_estadisticas_peliculas\nWHERE total_alquileres > 0\nORDER BY ingresos_totales DESC;',
      category: 'Vistas'
    },
    {
      title: '24. Películas sin alquilar nunca',
      query: 'SELECT p.titulo, c.nombre AS categoria\nFROM pelicula p\nLEFT JOIN alquiler a ON p.pelicula_id = a.pelicula_id\nLEFT JOIN categoria c ON p.categoria_id = c.categoria_id\nWHERE a.alquiler_id IS NULL\nORDER BY p.titulo;',
      category: 'Subconsultas'
    },
    {
      title: '25. Clientes que nunca han alquilado',
      query: 'SELECT nombre, apellido, email, fecha_registro\nFROM cliente\nWHERE cliente_id NOT IN (\n  SELECT DISTINCT cliente_id FROM alquiler\n)\nORDER BY fecha_registro;',
      category: 'Subconsultas'
    }
  ];
  
  res.json({ success: true, examples });
});

// Endpoint para obtener ejercicios guiados (PROTEGIDO)
app.get('/api/exercises', requireAuth, (req, res) => {
  const exercises = [
    // ===== NIVEL 1: BÁSICO - SELECT simple =====
    {
      id: 'EJ-01',
      title: 'Listar todos los clientes',
      description: 'Muestra el email de todos los clientes.',
      difficulty: 'clase1',
      hint: 'Usa SELECT email FROM cliente;',
      template: 'SELECT email FROM cliente;'
    },
    {
      id: 'EJ-02',
      title: 'Nombres de clientes',
      description: 'Muestra el nombre de todos los clientes.',
      difficulty: 'clase1',
      hint: 'Usa SELECT nombre FROM cliente;'
    },
    {
      id: 'EJ-03',
      title: 'Nombre completo',
      description: 'Muestra el nombre y apellido de todos los clientes.',
      difficulty: 'clase1',
      hint: 'Selecciona dos columnas: nombre y apellido'
    },
    {
      id: 'EJ-04',
      title: 'Datos de contacto',
      description: 'Muestra la dirección, teléfono y email de todos los clientes.',
      difficulty: 'clase1',
      hint: 'Selecciona tres columnas de la tabla cliente'
    },
    {
      id: 'EJ-05',
      title: 'Todas las columnas',
      description: 'Muestra TODA la información de los clientes.',
      difficulty: 'clase1',
      hint: 'Usa SELECT * FROM cliente;'
    },
    
    // ===== NIVEL 2: ORDER BY y LIMIT =====
    {
      id: 'EJ-06',
      title: 'Categorías alfabéticas',
      description: 'Ordena las categorías por orden alfabético.',
      difficulty: 'clase1',
      hint: 'Usa ORDER BY nombre para ordenar alfabéticamente'
    },
    {
      id: 'EJ-07',
      title: 'Primeras 6 categorías',
      description: 'Muestra solo las primeras 6 categorías ordenadas alfabéticamente.',
      difficulty: 'clase1',
      hint: 'Combina ORDER BY con LIMIT 6'
    },
    {
      id: 'EJ-08',
      title: 'Últimas películas',
      description: 'Muestra las últimas 5 películas de la tabla.',
      difficulty: 'clase1',
      hint: 'Usa ORDER BY pelicula_id DESC LIMIT 5'
    },
    
    // ===== NIVEL 3: WHERE y filtros =====
    {
      id: 'EJ-09',
      title: 'Clientes activos',
      description: 'Muestra los clientes que están activos.',
      difficulty: 'clase1',
      hint: 'Usa WHERE activo = true'
    },
    {
      id: 'EJ-10',
      title: 'Películas baratas',
      description: 'Muestra las películas que cuestan menos de 3.00 €.',
      difficulty: 'clase1',
      hint: 'Usa WHERE precio_alquiler < 3.00'
    },
    {
      id: 'EJ-11',
      title: 'Buscar por email',
      description: 'Muestra los clientes que tienen email de gmail.',
      difficulty: 'clase1',
      hint: 'Usa LIKE con el patrón %gmail%'
    },
    {
      id: 'EJ-12',
      title: 'Películas de terror',
      description: 'Muestra todas las películas de la categoría Terror.',
      difficulty: 'clase2',
      hint: 'Necesitas hacer un JOIN con la tabla categoria'
    },
    {
      id: 'EJ-13',
      title: 'Películas entre 2010 y 2020',
      description: 'Muestra las películas lanzadas entre 2010 y 2020.',
      difficulty: 'clase1',
      hint: 'Usa WHERE año_lanzamiento BETWEEN 2010 AND 2020'
    },
    {
      id: 'EJ-14',
      title: 'Actores españoles',
      description: 'Muestra los actores que sean de nacionalidad española.',
      difficulty: 'clase1',
      hint: 'Busca en la columna nacionalidad valores que contengan "España"'
    },
    
    // ===== NIVEL 4: Agregaciones COUNT, SUM, AVG =====
    {
      id: 'EJ-15',
      title: 'Contar películas',
      description: 'Cuenta cuántas películas hay en total.',
      difficulty: 'clase1',
      hint: 'Usa COUNT(*) FROM pelicula'
    },
    {
      id: 'EJ-16',
      title: 'Películas por categoría',
      description: 'Cuenta cuántas películas hay en cada categoría.',
      difficulty: 'clase1',
      hint: 'Usa GROUP BY categoria_id y COUNT(*)'
    },
    {
      id: 'EJ-17',
      title: 'Duración promedio',
      description: 'Calcula la duración promedio de todas las películas.',
      difficulty: 'clase1',
      hint: 'Usa AVG(duracion) FROM pelicula'
    },
    {
      id: 'EJ-18',
      title: 'Ingresos totales',
      description: 'Calcula los ingresos totales de todos los alquileres.',
      difficulty: 'clase1',
      hint: 'Usa SUM(precio_pagado) FROM alquiler'
    },
    {
      id: 'EJ-19',
      title: 'Cliente más gastador',
      description: 'Encuentra el cliente que más dinero ha gastado en alquileres.',
      difficulty: 'clase1',
      hint: 'Agrupa por cliente_id, suma precio_pagado y ordena descendente'
    },
    
    // ===== NIVEL 5: JOINs =====
    {
      id: 'EJ-20',
      title: 'Películas con categoría',
      description: 'Muestra el título de cada película junto con su categoría.',
      difficulty: 'clase2',
      hint: 'JOIN entre pelicula y categoria usando categoria_id'
    },
    {
      id: 'EJ-21',
      title: 'Alquileres con clientes',
      description: 'Muestra todos los alquileres con el nombre del cliente.',
      difficulty: 'clase2',
      hint: 'JOIN entre alquiler y cliente usando cliente_id'
    },
    {
      id: 'EJ-22',
      title: 'Actores y sus películas',
      description: 'Lista todos los actores con las películas en las que han participado.',
      difficulty: 'clase2',
      hint: 'Necesitas JOIN entre actor, pelicula_actor y pelicula'
    },
    {
      id: 'EJ-23',
      title: 'Películas nunca alquiladas',
      description: 'Encuentra las películas que nunca han sido alquiladas.',
      difficulty: 'clase2',
      hint: 'Usa LEFT JOIN y WHERE alquiler_id IS NULL'
    },
    
    // ===== NIVEL 6: Consultas avanzadas =====
    {
      id: 'EJ-24',
      title: 'Top 5 películas más populares',
      description: 'Muestra las 5 películas más alquiladas con su número de alquileres.',
      difficulty: 'clase2',
      hint: 'Agrupa por película, cuenta alquileres, ordena DESC y limita a 5'
    },
    {
      id: 'EJ-25',
      title: 'Ingresos por categoría',
      description: 'Calcula los ingresos totales generados por cada categoría de películas.',
      difficulty: 'clase2',
      hint: 'Necesitas JOIN de 3 tablas: pelicula, categoria y alquiler'
    },
    {
      id: 'EJ-26',
      title: 'Actores más prolíficos',
      description: 'Muestra los 5 actores que han participado en más películas.',
      difficulty: 'clase2',
      hint: 'Cuenta las filas en pelicula_actor agrupadas por actor'
    },
    {
      id: 'EJ-27',
      title: 'Películas por encima del promedio',
      description: 'Muestra las películas cuya duración es mayor que el promedio.',
      difficulty: 'clase2',
      hint: 'Usa una subconsulta: WHERE duracion > (SELECT AVG(duracion)...)'
    },
    {
      id: 'EJ-28',
      title: 'Clientes sin alquileres recientes',
      description: 'Encuentra clientes que no han alquilado nada en 2024.',
      difficulty: 'clase2',
      hint: 'Usa NOT IN o NOT EXISTS con una subconsulta filtrada por fecha'
    },
    {
      id: 'EJ-29',
      title: 'Ranking de categorías',
      description: 'Crea un ranking de categorías por número de alquileres totales.',
      difficulty: 'clase2',
      hint: 'JOIN múltiple con GROUP BY categoria y COUNT de alquileres'
    },
    {
      id: 'EJ-30',
      title: 'Análisis completo del videoclub',
      description: 'Crea un resumen con: total películas, actores, clientes activos, alquileres pendientes e ingresos totales.',
      difficulty: 'clase2',
      hint: 'Usa múltiples subconsultas con UNION ALL o varios SELECT con CROSS JOIN'
    }
  ];
  
  res.json({ success: true, exercises });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint para enviar respuestas de cuestionario (PROTEGIDO)
app.post('/api/cuestionario/submit', requireAuth, async (req, res) => {
  const user = getCurrentUser(req);
  console.log('POST /api/cuestionario/submit - Usuario completo:', JSON.stringify(user));
  console.log('Body recibido:', req.body);
  
  if (!user || !user.usuario_id) {
    console.error('ERROR: Usuario no encontrado o sin usuario_id');
    return res.status(401).json({ 
      success: false, 
      message: 'No se pudo identificar al usuario' 
    });
  }
  
  const { cuestionario_id, respuestas } = req.body;
  const usuario_id = user.usuario_id;

  if (!cuestionario_id || !respuestas) {
    console.log('Faltan datos del cuestionario');
    return res.status(400).json({ 
      success: false, 
      message: 'Faltan datos del cuestionario' 
    });
  }

  const client = await pool.connect();
  try {
    // Verificar si el usuario ya envió este cuestionario
    const checkQuery = `
      SELECT respuesta_id FROM respuestas_cuestionario 
      WHERE usuario_id = $1 AND cuestionario_id = $2
    `;
    const checkResult = await client.query(checkQuery, [usuario_id, cuestionario_id]);

    if (checkResult.rows.length > 0) {
      // Actualizar respuestas existentes
      const updateQuery = `
        UPDATE respuestas_cuestionario 
        SET respuestas = $1, fecha_envio = CURRENT_TIMESTAMP, revisado = false
        WHERE usuario_id = $2 AND cuestionario_id = $3
        RETURNING respuesta_id
      `;
      await client.query(updateQuery, [JSON.stringify(respuestas), usuario_id, cuestionario_id]);
      
      res.json({ 
        success: true, 
        message: 'Cuestionario actualizado correctamente' 
      });
    } else {
      // Insertar nuevas respuestas
      const insertQuery = `
        INSERT INTO respuestas_cuestionario (usuario_id, cuestionario_id, respuestas)
        VALUES ($1, $2, $3)
        RETURNING respuesta_id
      `;
      await client.query(insertQuery, [usuario_id, cuestionario_id, JSON.stringify(respuestas)]);
      
      res.json({ 
        success: true, 
        message: 'Cuestionario enviado correctamente' 
      });
    }
  } catch (error) {
    console.error('Error guardando cuestionario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al guardar el cuestionario' 
    });
  } finally {
    client.release();
  }
});

// Endpoint para que el profesor vea las respuestas (SOLO PROFESOR)
app.get('/api/cuestionario/respuestas/:cuestionario_id?', requireAuth, async (req, res) => {
  const user = getCurrentUser(req);
  // Verificar que sea profesor
  if (user.rol !== 'profesor') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Solo profesores.' 
    });
  }

  const { cuestionario_id } = req.params;
  const client = await pool.connect();
  
  try {
    let query = `
      SELECT 
        r.respuesta_id,
        r.cuestionario_id,
        r.respuestas,
        r.fecha_envio,
        r.revisado,
        r.nota,
        r.comentarios,
        u.username,
        u.nombre_completo as nombre,
        u.rol
      FROM respuestas_cuestionario r
      JOIN usuarios u ON r.usuario_id = u.usuario_id
    `;
    
    const params = [];
    if (cuestionario_id) {
      query += ' WHERE r.cuestionario_id = $1';
      params.push(cuestionario_id);
    }
    
    query += ' ORDER BY r.fecha_envio DESC';
    
    const result = await client.query(query, params);
    
    res.json({ 
      success: true, 
      respuestas: result.rows 
    });
  } catch (error) {
    console.error('Error obteniendo respuestas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener las respuestas' 
    });
  } finally {
    client.release();
  }
});

// Endpoint para calificar respuestas (SOLO PROFESOR)
app.post('/api/cuestionario/calificar', requireAuth, async (req, res) => {
  const user = getCurrentUser(req);
  // Verificar que sea profesor
  if (user.rol !== 'profesor') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Solo profesores.' 
    });
  }

  const { respuesta_id, nota, comentarios } = req.body;

  if (!respuesta_id || nota === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: 'Faltan datos requeridos' 
    });
  }

  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE respuestas_cuestionario
      SET 
        revisado = true,
        nota = $1,
        comentarios = $2
      WHERE respuesta_id = $3
      RETURNING respuesta_id
    `;
    
    const result = await client.query(query, [nota, comentarios, respuesta_id]);
    
    if (result.rows.length > 0) {
      res.json({ 
        success: true, 
        message: 'Calificación guardada correctamente' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Respuesta no encontrada' 
      });
    }
  } catch (error) {
    console.error('Error guardando calificación:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al guardar la calificación' 
    });
  } finally {
    client.release();
  }
});

// Endpoint para que el alumno vea sus propias calificaciones
app.get('/api/cuestionario/mis-respuestas', requireAuth, async (req, res) => {
  const user = getCurrentUser(req);
  
  if (!user || !user.usuario_id) {
    return res.status(401).json({ 
      success: false, 
      message: 'Usuario no autenticado' 
    });
  }

  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        respuesta_id,
        cuestionario_id,
        fecha_envio,
        revisado,
        nota,
        comentarios
      FROM respuestas_cuestionario
      WHERE usuario_id = $1
      ORDER BY fecha_envio DESC
    `;
    
    const result = await client.query(query, [user.usuario_id]);
    
    res.json({ 
      success: true, 
      respuestas: result.rows 
    });
    
  } catch (error) {
    console.error('Error obteniendo mis respuestas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cargar tus calificaciones' 
    });
  } finally {
    client.release();
  }
});

// ===== ENDPOINTS DE EDICIÓN DE CLASES (SOLO PROFESOR) =====

// Lista blanca de archivos de clase editables (seguridad: evita escribir archivos arbitrarios)
const CLASES_EDITABLES = [
  'basesdatos1.html',
  'basesdatos2.html',
  'clase1.html',
  'clase2.html',
  'dml-sql.html',
  'subconsultas-sql.html'
];

// Crear tabla clases_editadas si no existe
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clases_editadas (
        filename TEXT PRIMARY KEY,
        contenido TEXT NOT NULL,
        ultima_edicion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        editado_por TEXT
      );
    `);
    console.log('✅ Tabla clases_editadas verificada');
  } catch (err) {
    console.error('❌ Error creando tabla clases_editadas:', err.message);
  }
})();

// Middleware: solo profesor
function requireProfesor(req, res, next) {
  const user = getCurrentUser(req);
  if (!user || user.rol !== 'profesor') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Solo profesores.'
    });
  }
  next();
}

// GET /api/clases/:filename - obtener contenido editado (o null si no existe)
// Autenticado: cualquier usuario logueado puede leer la versión editada
// (alumno o profesor); el guardado y borrado sí requieren rol profesor.
app.get('/api/clases/:filename', requireAuth, async (req, res) => {
  const { filename } = req.params;

  if (!CLASES_EDITABLES.includes(filename)) {
    return res.status(404).json({
      success: false,
      error: 'Clase no encontrada'
    });
  }

  try {
    const result = await pool.query(
      'SELECT contenido, ultima_edicion, editado_por FROM clases_editadas WHERE filename = $1',
      [filename]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, edited: false });
    }

    res.json({
      success: true,
      edited: true,
      contenido: result.rows[0].contenido,
      ultima_edicion: result.rows[0].ultima_edicion,
      editado_por: result.rows[0].editado_por
    });
  } catch (error) {
    console.error('Error obteniendo clase editada:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la clase'
    });
  }
});

// PUT /api/clases/:filename - guardar contenido editado (solo profesor)
app.put('/api/clases/:filename', requireAuth, requireProfesor, async (req, res) => {
  const { filename } = req.params;
  const { contenido } = req.body;
  const user = getCurrentUser(req);

  if (!CLASES_EDITABLES.includes(filename)) {
    return res.status(404).json({
      success: false,
      error: 'Clase no encontrada'
    });
  }

  if (typeof contenido !== 'string' || contenido.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'El contenido no puede estar vacío'
    });
  }

  // Límite de tamaño para prevenir abusos (2 MB)
  if (contenido.length > 2 * 1024 * 1024) {
    return res.status(413).json({
      success: false,
      error: 'El contenido excede el tamaño máximo (2 MB)'
    });
  }

  try {
    await pool.query(
      `INSERT INTO clases_editadas (filename, contenido, ultima_edicion, editado_por)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (filename)
       DO UPDATE SET contenido = $2, ultima_edicion = NOW(), editado_por = $3`,
      [filename, contenido, user.username]
    );

    console.log(`📝 Clase editada: ${filename} por ${user.username}`);
    res.json({
      success: true,
      message: 'Clase guardada correctamente'
    });
  } catch (error) {
    console.error('Error guardando clase:', error);
    res.status(500).json({
      success: false,
      error: 'Error al guardar la clase'
    });
  }
});

// DELETE /api/clases/:filename - restaurar clase original (solo profesor)
app.delete('/api/clases/:filename', requireAuth, requireProfesor, async (req, res) => {
  const { filename } = req.params;

  if (!CLASES_EDITABLES.includes(filename)) {
    return res.status(404).json({
      success: false,
      error: 'Clase no encontrada'
    });
  }

  try {
    const result = await pool.query(
      'DELETE FROM clases_editadas WHERE filename = $1',
      [filename]
    );

    console.log(`🔄 Clase restaurada: ${filename} (${result.rowCount} filas eliminadas)`);
    res.json({
      success: true,
      message: result.rowCount > 0
        ? 'Clase restaurada a su versión original'
        : 'La clase ya estaba en su versión original'
    });
  } catch (error) {
    console.error('Error restaurando clase:', error);
    res.status(500).json({
      success: false,
      error: 'Error al restaurar la clase'
    });
  }
});

// GET /api/clases - listar todas las clases y saber cuáles han sido editadas (solo profesor)
app.get('/api/clases', requireAuth, requireProfesor, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT filename, ultima_edicion, editado_por FROM clases_editadas'
    );

    const editadas = {};
    result.rows.forEach(row => {
      editadas[row.filename] = {
        ultima_edicion: row.ultima_edicion,
        editado_por: row.editado_por
      };
    });

    const clases = CLASES_EDITABLES.map(f => ({
      filename: f,
      edited: !!editadas[f],
      ...(editadas[f] || {})
    }));

    res.json({ success: true, clases });
  } catch (error) {
    console.error('Error listando clases:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar las clases'
    });
  }
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Error interno del servidor' 
  });
});

// Verificar conexión a la base de datos al iniciar
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('✅ Conexión a PostgreSQL verificada:', res.rows[0].now);
  }
});

// Limpieza automática de tokens expirados cada 24 horas
setInterval(async () => {
  try {
    const result = await pool.query('DELETE FROM auth_tokens WHERE expires_at < NOW()');
    console.log(`🧹 Limpieza automática: ${result.rowCount} tokens expirados eliminados`);
  } catch (error) {
    console.error('❌ Error en limpieza de tokens:', error);
  }
}, 24 * 60 * 60 * 1000); // 24 horas

// Iniciar servidor - escuchar en 0.0.0.0 para Railway
const HOST = '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor ejecutándose en ${HOST}:${PORT}`);
  console.log(`🌍 CORS habilitado para todos los orígenes`);
  console.log(`🔐 Sesiones configuradas`);
  console.log(`📡 Listo para recibir peticiones`);
});

// Manejo de errores del servidor
server.on('error', (error) => {
  console.error('❌ Error del servidor:', error);
  process.exit(1);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando conexiones...');
  pool.end(() => {
    console.log('Pool de conexiones cerrado');
    process.exit(0);
  });
});
