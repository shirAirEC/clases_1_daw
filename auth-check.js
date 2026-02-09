// Script de verificación de autenticación
// Incluir este script al inicio de cualquier página protegida

(function() {
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : 'https://clases1daw-production.up.railway.app';

  async function checkAuth() {
    try {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      
      // Si no hay token ni usuario en localStorage, redirigir
      if (!token && !user) {
        console.log('No hay sesión, redirigiendo al index...');
        window.location.href = '/index.html';
        return;
      }

      // Verificar token con el servidor
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/session`, {
        headers: headers,
        credentials: 'include'
      });

      const data = await response.json();

      // Si el servidor dice que no está autenticado, redirigir
      if (!data.authenticated || !data.user) {
        console.log('Sesión inválida, redirigiendo al index...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/index.html';
      } else {
        console.log('Usuario autenticado:', data.user.username);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      // En caso de error, verificar localStorage como fallback
      const user = localStorage.getItem('user');
      if (!user) {
        window.location.href = '/index.html';
      }
    }
  }

  // Ejecutar verificación inmediatamente
  checkAuth();
})();
