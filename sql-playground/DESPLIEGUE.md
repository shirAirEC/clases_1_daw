# 🚀 Guía Rápida de Despliegue - SQL Playground

## Paso 1: Crear Base de Datos en Railway (5 minutos)

1. Ve a https://railway.app
2. Click en **"New Project"**
3. Selecciona **"Provision PostgreSQL"**
4. Espera 1-2 minutos a que se cree
5. Click en la base de datos → **"Connect"**
6. Copia el **"Postgres Connection URL"**

**Ejemplo:**
```
postgresql://postgres:ABC123xyz@monorail.proxy.rlwy.net:12345/railway
```

---

## Paso 2: Inicializar la Base de Datos (10 minutos)

### Opción A: Desde Railway Dashboard (Recomendado)

1. En Railway, click en tu base de datos PostgreSQL
2. Ve a la pestaña **"Data"**
3. Click en **"Query"**
4. Abre el archivo `init-database.sql`
5. **Copia TODO el contenido** y pégalo en el editor de Railway
6. Click en **"Run"**
7. Verifica que se crearon las tablas (deberías ver confirmaciones)

### Opción B: Desde tu Terminal

```bash
# Reemplaza con tu CONNECTION STRING de Railway
psql "postgresql://postgres:password@host:port/railway" < init-database.sql
```

---

## Paso 3: Desplegar la Aplicación (10 minutos)

### 3.1. Subir código a GitHub

```bash
cd sql-playground

# Inicializar git (si no lo has hecho)
git init
git add .
git commit -m "Initial commit: SQL Playground"

# Crear repositorio en GitHub y push
git remote add origin https://github.com/tu-usuario/sql-playground.git
git branch -M main
git push -u origin main
```

### 3.2. Desplegar en Railway

1. En Railway, click en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Conecta tu cuenta de GitHub (si es la primera vez)
4. Selecciona el repositorio `sql-playground`
5. Railway detectará automáticamente que es Node.js
6. Espera 2-3 minutos mientras se despliega

---

## Paso 4: Configurar Variables de Entorno (5 minutos)

1. En Railway, click en tu aplicación (no la base de datos)
2. Ve a la pestaña **"Variables"**
3. Agrega estas variables:

```env
DATABASE_URL = postgresql://estudiante:estudiante2024@TU-HOST.railway.app:5432/railway
NODE_ENV = production
```

**⚠️ MUY IMPORTANTE:**

- **NO uses** las credenciales del admin (`postgres`)
- **USA** las credenciales del usuario `estudiante` que creamos en el script
- Reemplaza `TU-HOST` con el host de tu base de datos de Railway
- El usuario `estudiante` solo tiene permisos de lectura (SELECT)

**Cómo obtener el host correcto:**
1. Ve a tu base de datos PostgreSQL en Railway
2. Pestaña "Connect"
3. Copia el "Postgres Connection URL"
4. Reemplaza `postgres:PASSWORD` por `estudiante:estudiante2024`

**Ejemplo:**
```
Original:  postgresql://postgres:ABC123@monorail.proxy.rlwy.net:12345/railway
Correcto:  postgresql://estudiante:estudiante2024@monorail.proxy.rlwy.net:12345/railway
```

---

## Paso 5: Obtener la URL y Probar (2 minutos)

1. En Railway, ve a tu aplicación
2. Pestaña **"Settings"**
3. Sección **"Domains"**
4. Click en **"Generate Domain"**
5. Railway te dará una URL como: `https://tu-app.up.railway.app`
6. Abre esa URL en tu navegador

**Si todo está bien, verás:**
- ✅ El SQL Playground cargado
- ✅ Esquema de base de datos en el sidebar
- ✅ Ejemplos de consultas
- ✅ Puedes ejecutar `SELECT * FROM pelicula LIMIT 5;`

---

## 🔥 Solución de Problemas

### Error: "Cannot connect to database"

**Causa:** Variable `DATABASE_URL` incorrecta

**Solución:**
1. Verifica que usas las credenciales de `estudiante`, no `postgres`
2. Verifica que el host y puerto son correctos
3. En Railway Variables, asegúrate de que no hay espacios extra

### Error: "Operation not permitted: INSERT/UPDATE/DELETE"

**Causa:** El usuario `estudiante` solo tiene permisos de lectura

**Solución:**
- ✅ Esto es CORRECTO y esperado
- Solo se permiten consultas `SELECT`
- Es una medida de seguridad para los estudiantes

### Error: "No tables found"

**Causa:** No ejecutaste el script `init-database.sql`

**Solución:**
- Ve al Paso 2 y ejecuta el script completo
- Verifica que estás conectado a la base de datos correcta

### La aplicación se despliega pero muestra error 502

**Causa:** Railway no puede conectar con la base de datos

**Solución:**
1. Verifica que la base de datos está en el mismo proyecto de Railway
2. Revisa las variables de entorno
3. Mira los logs: Railway → Tu App → "Deployments" → Click en el último deploy

---

## 📊 Verificación Final

Ejecuta esta consulta en tu aplicación para verificar que todo funciona:

```sql
SELECT 
    (SELECT COUNT(*) FROM pelicula) AS total_peliculas,
    (SELECT COUNT(*) FROM actor) AS total_actores,
    (SELECT COUNT(*) FROM cliente) AS total_clientes,
    (SELECT COUNT(*) FROM alquiler) AS total_alquileres;
```

**Resultado esperado:**
```
total_peliculas: 20
total_actores: 20
total_clientes: 10
total_alquileres: 20
```

---

## 🎓 Próximos Pasos

1. **Comparte la URL** con tus estudiantes
2. **Prepara ejercicios** usando las consultas de ejemplo
3. **Monitorea el uso** en Railway Dashboard (pestañas "Metrics" y "Logs")
4. **Si tienes >30 estudiantes**, considera implementar pgBouncer

---

## 📞 ¿Necesitas Ayuda?

- Railway Docs: https://docs.railway.app
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Express Docs: https://expressjs.com/

---

**Tiempo total estimado: 30-35 minutos**

¡Listo! Tu SQL Playground está funcionando 🎉
