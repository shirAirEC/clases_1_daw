// Script de verificación de autenticación
// Incluir este script al inicio de cualquier página protegida

(function() {
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : 'https://clases1daw-production.up.railway.app';

  // Configuración
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000; // 1 segundo
  const CACHE_DURATION = 60000; // 60 segundos en caché

  // Función para esperar
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function checkAuth(retryCount = 0) {
    try {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      
      // Si no hay token ni usuario en localStorage, redirigir
      if (!token && !user) {
        console.log('No hay sesión en localStorage, redirigiendo al index...');
        window.location.href = '/index.html';
        return;
      }

      // Verificar si tenemos una verificación reciente en caché
      const lastCheck = localStorage.getItem('lastAuthCheck');
      const now = Date.now();
      if (lastCheck && (now - parseInt(lastCheck)) < CACHE_DURATION) {
        console.log('✅ Verificación en caché válida');
        return;
      }

      // Verificar token con el servidor
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/session`, {
        headers: headers,
        credentials: 'include',
        signal: AbortSignal.timeout(8000) // Timeout de 8 segundos
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Si el servidor dice que no está autenticado, redirigir
      if (!data.authenticated || !data.user) {
        console.log('Sesión inválida según servidor, redirigiendo al index...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('lastAuthCheck');
        window.location.href = '/index.html';
      } else {
        console.log('✅ Usuario autenticado:', data.user.username);
        // Guardar timestamp de verificación exitosa
        localStorage.setItem('lastAuthCheck', now.toString());
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error.message);
      
      // Reintentar si es un error de red y aún tenemos intentos
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Reintentando verificación... (${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY);
        return checkAuth(retryCount + 1);
      }
      
      // Si llegamos aquí después de reintentos, verificar localStorage como fallback
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        console.log('⛔ Sin token local después de reintentos, redirigiendo...');
        window.location.href = '/index.html';
      } else {
        console.warn('⚠️ Servidor no responde pero tienes sesión local. Continuando...');
        // Permitir acceso basado en localStorage si el servidor no responde
        localStorage.setItem('lastAuthCheck', Date.now().toString());
      }
    }
  }

  // Ejecutar verificación inmediatamente
  checkAuth();
})();
