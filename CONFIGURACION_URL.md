# 🎯 Configuración Final

## Obtener la URL de tu SQL Playground en Railway

1. Ve a Railway: https://railway.app
2. Abre tu proyecto (donde está el backend del SQL Playground)
3. Click en el servicio del backend (Node.js)
4. Ve a **Settings** → **Networking** → **Domains**
5. Copia la URL generada (ejemplo: `https://sql-playground-production.up.railway.app`)

## Actualizar el index.html

Edita `index.html` línea ~853:

**Busca:**
```html
<a href="https://tu-app.up.railway.app" target="_blank" class="btn-comenzar">
```

**Reemplaza con tu URL:**
```html
<a href="https://TU-URL-REAL.up.railway.app" target="_blank" class="btn-comenzar">
```

## Subir cambios a GitHub

```bash
git add index.html
git commit -m "Add SQL Playground integration"
git push origin main
```

## ✅ Verificación

1. Abre tu página principal
2. Click en "Bases de Datos"
3. Deberías ver la tarjeta del SQL Playground
4. Click en "Abrir SQL Playground"
5. Se abrirá en una nueva pestaña con los 30 ejercicios

---

¡Listo! Tus alumnos ya pueden acceder al SQL Playground desde la página principal.
