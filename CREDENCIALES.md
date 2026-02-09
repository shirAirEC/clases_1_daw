# 🔐 Credenciales de Acceso

Sistema de autenticación para el sitio web de clases 1º DAW

## 📚 Usuarios Disponibles

### 👨‍🏫 Profesor

- **Usuario:** `profesor`
- **Contraseña:** `profesor123`
- **Rol:** Profesor
- **Nombre:** Profesor Principal
- **Email:** profesor@clases1daw.com

---

### 👨‍🎓 Alumnos (30 usuarios)

**Contraseña común para todos los alumnos:** `alumno123`

| Usuario | Nombre Completo | Rol |
|---------|----------------|-----|
| `alumno1` | Alumno 1 | Alumno |
| `alumno2` | Alumno 2 | Alumno |
| `alumno3` | Alumno 3 | Alumno |
| `alumno4` | Alumno 4 | Alumno |
| `alumno5` | Alumno 5 | Alumno |
| `alumno6` | Alumno 6 | Alumno |
| `alumno7` | Alumno 7 | Alumno |
| `alumno8` | Alumno 8 | Alumno |
| `alumno9` | Alumno 9 | Alumno |
| `alumno10` | Alumno 10 | Alumno |
| `alumno11` | Alumno 11 | Alumno |
| `alumno12` | Alumno 12 | Alumno |
| `alumno13` | Alumno 13 | Alumno |
| `alumno14` | Alumno 14 | Alumno |
| `alumno15` | Alumno 15 | Alumno |
| `alumno16` | Alumno 16 | Alumno |
| `alumno17` | Alumno 17 | Alumno |
| `alumno18` | Alumno 18 | Alumno |
| `alumno19` | Alumno 19 | Alumno |
| `alumno20` | Alumno 20 | Alumno |
| `alumno21` | Alumno 21 | Alumno |
| `alumno22` | Alumno 22 | Alumno |
| `alumno23` | Alumno 23 | Alumno |
| `alumno24` | Alumno 24 | Alumno |
| `alumno25` | Alumno 25 | Alumno |
| `alumno26` | Alumno 26 | Alumno |
| `alumno27` | Alumno 27 | Alumno |
| `alumno28` | Alumno 28 | Alumno |
| `alumno29` | Alumno 29 | Alumno |
| `alumno30` | Alumno 30 | Alumno |

---

## 🚀 Cómo usar

1. Visita el sitio web: https://clasesprimerodaw.anaisabelsainz.com
2. Haz clic en el botón **"👤 Iniciar Sesión"** en la esquina superior izquierda
3. Ingresa tu usuario y contraseña
4. Una vez autenticado, verás tu nombre y rol en la esquina superior izquierda

---

## 🔄 Características del sistema

- **Sesiones persistentes:** Tu sesión se mantiene activa durante 24 horas
- **Roles diferenciados:** El sistema distingue entre profesor y alumnos
- **Seguridad:** Las contraseñas están almacenadas de forma segura en PostgreSQL
- **Cierre de sesión:** Puedes cerrar sesión en cualquier momento haciendo clic en "Cerrar Sesión"

---

## 📊 Base de Datos

Los usuarios están almacenados en PostgreSQL (Railway) en la tabla `usuarios` con los siguientes campos:

- `usuario_id` (Primary Key, auto-incremental)
- `username` (único)
- `password`
- `nombre_completo`
- `rol` (profesor o alumno)
- `email`
- `activo` (boolean)
- `fecha_creacion`
- `ultima_conexion`

---

## 🛠️ Gestión de usuarios

Para crear más usuarios o modificar existentes, edita el archivo:
- `sql-playground/create-users.sql`

Y ejecuta:
```bash
python sql-playground/create_users_db.py
```

---

## 📝 Notas

- Las contraseñas son simples por propósitos educativos
- Todos los alumnos comparten la misma contraseña (`alumno123`)
- El profesor tiene una contraseña específica (`profesor123`)
- Por ahora, ambos roles tienen los mismos permisos de acceso
- Las funcionalidades diferenciadas por rol se pueden implementar en el futuro

---

**Última actualización:** Febrero 2026
