# SQL Playground - 1º DAW

Aplicación web para que los estudiantes practiquen consultas SQL en tiempo real contra una base de datos PostgreSQL alojada en Railway.

## 🎯 Características

- ✅ Editor SQL con resaltado de sintaxis
- ✅ Ejecución de consultas en tiempo real
- ✅ Visualización de esquema de base de datos
- ✅ Ejemplos de consultas predefinidas
- ✅ Restricciones de seguridad (solo SELECT)
- ✅ Interfaz moderna y responsive
- ✅ Base de datos de ejemplo (Videoclub)

## 🚀 Despliegue en Railway

### 1. Crear Base de Datos PostgreSQL

```bash
# En Railway:
1. New Project → Provision PostgreSQL
2. Espera a que se cree la base de datos
3. Copia la CONNECTION STRING
```

### 2. Inicializar Base de Datos

Ejecuta el script `init-database.sql` en tu base de datos PostgreSQL:

```bash
# Opción 1: Desde Railway Dashboard
# - Ve a PostgreSQL → Data → Query
# - Copia y pega el contenido de init-database.sql
# - Ejecuta

# Opción 2: Desde terminal local
psql "postgresql://postgres:password@host:5432/railway" < init-database.sql
```

### 3. Desplegar Aplicación

```bash
# 1. Push a GitHub
git init
git add .
git commit -m "Initial commit: SQL Playground"
git push origin main

# 2. En Railway:
# - New Project → Deploy from GitHub
# - Selecciona el repositorio
# - Railway detectará automáticamente Node.js
```

### 4. Configurar Variables de Entorno

En Railway, agrega estas variables:

```env
DATABASE_URL=postgresql://estudiante:estudiante2024@tu-db.railway.app:5432/railway
NODE_ENV=production
```

**⚠️ IMPORTANTE:** Usa las credenciales del usuario `estudiante` (solo lectura), NO las del admin.

## 💻 Desarrollo Local

### Requisitos

- Node.js >= 18
- PostgreSQL (o conexión a Railway)

### Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# 3. Inicializar base de datos
psql "tu_connection_string" < init-database.sql

# 4. Iniciar servidor
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🗄️ Estructura de la Base de Datos

### Tablas

- `categoria` - Categorías de películas
- `pelicula` - Catálogo de películas
- `actor` - Actores
- `pelicula_actor` - Relación muchos a muchos
- `cliente` - Clientes del videoclub
- `alquiler` - Histórico de alquileres

### Vistas

- `v_peliculas_completas` - Películas con su categoría
- `v_alquileres_activos` - Alquileres pendientes
- `v_estadisticas_peliculas` - Estadísticas de popularidad

## 🔒 Seguridad

- ✅ Usuario de base de datos con permisos de solo lectura
- ✅ Validación de queries (solo SELECT permitido)
- ✅ Protección contra SQL injection
- ✅ Timeout de 10 segundos por query
- ✅ Límite de conexiones concurrentes (20)
- ✅ Rate limiting implícito por Pool

## 📚 Uso en Clase

### Consultas de Ejemplo

La aplicación incluye 10 consultas de ejemplo organizadas por nivel:

1. **Básico** - SELECT, WHERE, ORDER BY
2. **JOINs** - INNER JOIN, LEFT JOIN
3. **Agregaciones** - COUNT, SUM, AVG, GROUP BY
4. **Vistas** - Consultas a vistas predefinidas
5. **Subconsultas** - Queries avanzadas

### Ejercicios Sugeridos

1. Encuentra todas las películas de una categoría específica
2. Lista los actores que aparecen en más de 2 películas
3. Calcula el ingreso total por categoría
4. Identifica los clientes que nunca han devuelto una película a tiempo
5. Encuentra las películas que nunca han sido alquiladas

## 🛠️ Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js, Express
- **Base de Datos:** PostgreSQL 16+
- **Hosting:** Railway
- **Seguridad:** Helmet, CORS

## 📊 Capacidad

- **Estudiantes simultáneos:** 20-30 (con pool de 20 conexiones)
- **Queries por segundo:** ~50-100
- **Timeout por query:** 10 segundos

Para más de 30 estudiantes simultáneos, considera implementar pgBouncer.

## 📝 Licencia

MIT

## 👨‍🏫 Autor

Material educativo para 1º DAW - Bases de Datos
