/**
 * teacher-edit.js
 *
 * Script de edición de presentaciones Reveal.js para el rol "profesor".
 *
 * Cómo funciona:
 * - En cualquier presentación incluye este script. En su carga:
 *   1. Si hay una versión editada de esta clase en BD, la aplica al DOM
 *      ANTES de que Reveal.js se inicialice.
 *   2. Si el usuario logueado tiene rol "profesor", muestra un botón
 *      flotante "✏️ Editar" que permite entrar en modo edición.
 *
 * Modo edición:
 *   - Edición visual: los slides pasan a contentEditable, el profesor edita
 *     texto directamente sobre la diapositiva.
 *   - Editor HTML: se abre un modal con un textarea con el HTML de las
 *     diapositivas para edición avanzada (añadir slides, cambiar clases...).
 *
 * Acciones:
 *   - Guardar: envía el HTML de .slides al backend para persistirlo.
 *   - Cancelar: recarga sin guardar.
 *   - Restaurar: elimina la versión editada de BD, volviendo al original.
 *
 * Requisitos en la página:
 *   - Contenedor Reveal con la estructura: <div class="reveal"><div class="slides">...</div></div>
 *   - Este script debe cargarse ANTES del script que inicializa Reveal (para
 *     que la versión editada se aplique a tiempo).
 */
(function () {
  'use strict';

  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://clases1daw-production.up.railway.app';

  // Nombre del archivo actual (sin ruta)
  const FILENAME = (window.location.pathname.split('/').pop() || '').toLowerCase();

  // Lista blanca (debe coincidir con la del backend)
  const CLASES_EDITABLES = [
    'basesdatos1.html',
    'basesdatos2.html',
    'clase1.html',
    'clase2.html',
    'dml-sql.html',
    'subconsultas-sql.html'
  ];

  if (!CLASES_EDITABLES.includes(FILENAME)) {
    return; // No es una clase editable, no hacemos nada
  }

  const token = localStorage.getItem('authToken');
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch (_) { user = null; }

  const isProfesor = user && user.rol === 'profesor';

  // ==========================================================================
  // 1. CARGA DE VERSIÓN EDITADA (para TODOS los usuarios autenticados)
  // ==========================================================================
  async function cargarVersionEditada() {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/clases/${FILENAME}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.edited && typeof data.contenido === 'string') {
        const slides = document.querySelector('.reveal .slides');
        if (slides) {
          slides.innerHTML = data.contenido;
          console.log(`📘 Aplicada versión editada de ${FILENAME} (última edición: ${data.ultima_edicion})`);
          // Re-sincronizar Reveal.js si ya está inicializado (o cuando lo esté).
          syncReveal();
        }
      }
    } catch (err) {
      console.warn('No se pudo cargar la versión editada:', err.message);
    }
  }

  /**
   * Indica a Reveal.js que refresque su estado tras cambios en el DOM.
   * Se llama tras aplicar una versión editada o tras usar el editor HTML.
   */
  function syncReveal(attempt = 0) {
    if (typeof Reveal === 'undefined' || typeof Reveal.sync !== 'function') {
      // Reveal aún no cargado; reintentar hasta 20 veces (2 segundos).
      if (attempt < 20) setTimeout(() => syncReveal(attempt + 1), 100);
      return;
    }
    try {
      Reveal.sync();
      if (typeof Reveal.layout === 'function') Reveal.layout();
      // Asegurar que la diapositiva actual sigue siendo válida
      if (typeof Reveal.slide === 'function') {
        const idx = (typeof Reveal.getIndices === 'function') ? Reveal.getIndices() : null;
        if (idx) Reveal.slide(idx.h, idx.v);
      }
    } catch (err) {
      console.warn('Error al sincronizar Reveal:', err.message);
    }
  }

  // Se ejecuta lo antes posible: si .slides existe, aplica la versión editada.
  // Esto se ejecuta antes de Reveal.initialize en las presentaciones.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoad);
  } else {
    initLoad();
  }

  function initLoad() {
    // Carga versión editada, luego inicializa UI de profesor si corresponde.
    cargarVersionEditada().finally(() => {
      if (isProfesor) initEditorUI();
    });
  }

  // ==========================================================================
  // 2. UI DEL EDITOR (solo profesor)
  // ==========================================================================
  function initEditorUI() {
    injectStyles();
    injectFloatingButton();
  }

  function injectStyles() {
    const css = `
      #te-fab {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 99999;
        background: linear-gradient(135deg, #00897b, #004d40);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 50px;
        font-weight: 700;
        font-size: 0.95em;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        font-family: -apple-system, system-ui, sans-serif;
        transition: transform 0.15s, box-shadow 0.15s;
      }
      #te-fab:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.35);
      }

      #te-toolbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99998;
        background: linear-gradient(135deg, #263238, #37474f);
        color: white;
        padding: 12px 20px;
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        font-family: -apple-system, system-ui, sans-serif;
        font-size: 0.9em;
      }
      #te-toolbar .te-title {
        font-weight: 700;
        margin-right: 10px;
        color: #80cbc4;
      }
      #te-toolbar .te-spacer { flex: 1; }
      #te-toolbar button {
        background: rgba(255,255,255,0.1);
        color: white;
        border: 1px solid rgba(255,255,255,0.2);
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 0.85em;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }
      #te-toolbar button:hover { background: rgba(255,255,255,0.2); }
      #te-toolbar button.primary { background: #00897b; border-color: #00897b; }
      #te-toolbar button.primary:hover { background: #00acc1; }
      #te-toolbar button.danger { background: #c62828; border-color: #c62828; }
      #te-toolbar button.danger:hover { background: #e53935; }
      #te-toolbar button.warning { background: #ef6c00; border-color: #ef6c00; }
      #te-toolbar button.warning:hover { background: #f57c00; }
      #te-toolbar .te-status {
        font-size: 0.8em;
        color: #80cbc4;
        padding: 4px 10px;
        border-radius: 4px;
        background: rgba(0,0,0,0.3);
      }

      body.te-editing {
        padding-top: 60px;
      }
      body.te-editing .reveal .slides section[contenteditable="true"] {
        outline: 2px dashed #00897b;
        outline-offset: -4px;
        cursor: text;
      }
      body.te-editing .reveal .slides section[contenteditable="true"]:focus-within {
        outline: 3px solid #26a69a;
      }

      /* Modal del editor HTML */
      #te-modal {
        position: fixed;
        inset: 0;
        z-index: 100000;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 30px;
        font-family: -apple-system, system-ui, sans-serif;
      }
      #te-modal .te-modal-box {
        background: white;
        border-radius: 12px;
        max-width: 1200px;
        width: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      }
      #te-modal header {
        background: linear-gradient(135deg, #263238, #37474f);
        color: white;
        padding: 14px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      #te-modal header h3 {
        margin: 0;
        font-size: 1.1em;
        color: #80cbc4 !important;
        background: none !important;
        padding: 0 !important;
        text-shadow: none !important;
      }
      #te-modal .te-modal-close {
        background: transparent;
        color: white;
        border: none;
        font-size: 1.5em;
        cursor: pointer;
        padding: 0 8px;
      }
      #te-modal textarea {
        flex: 1;
        width: 100%;
        border: none;
        padding: 16px;
        font-family: 'SF Mono', Menlo, Consolas, monospace;
        font-size: 0.85em;
        line-height: 1.5;
        resize: none;
        background: #fafafa;
        color: #263238;
        outline: none;
      }
      #te-modal footer {
        background: #eceff1;
        padding: 12px 20px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        border-top: 1px solid #cfd8dc;
      }
      #te-modal footer button {
        padding: 8px 18px;
        border-radius: 6px;
        border: none;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.9em;
      }
      #te-modal footer button.primary {
        background: #00897b;
        color: white;
      }
      #te-modal footer button.secondary {
        background: #cfd8dc;
        color: #263238;
      }

      /* Toast */
      #te-toast {
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 100001;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        font-family: -apple-system, system-ui, sans-serif;
        font-size: 0.9em;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        animation: te-slidein 0.3s ease;
      }
      #te-toast.success { background: #2e7d32; }
      #te-toast.error   { background: #c62828; }
      #te-toast.info    { background: #1565c0; }
      @keyframes te-slidein {
        from { transform: translateY(20px); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }
    `;
    const style = document.createElement('style');
    style.id = 'te-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function injectFloatingButton() {
    const btn = document.createElement('button');
    btn.id = 'te-fab';
    btn.textContent = '✏️ Editar';
    btn.title = 'Modo edición de profesor';
    btn.addEventListener('click', enterEditMode);
    document.body.appendChild(btn);
  }

  // ==========================================================================
  // 3. MODO EDICIÓN
  // ==========================================================================
  let originalSlidesHTML = null;

  function enterEditMode() {
    const slides = document.querySelector('.reveal .slides');
    if (!slides) {
      showToast('No se encontró el contenedor de diapositivas', 'error');
      return;
    }

    // Guardar versión actual para poder "cancelar"
    originalSlidesHTML = slides.innerHTML;

    // Hacer todos los <section> editables
    slides.querySelectorAll('section').forEach(section => {
      section.setAttribute('contenteditable', 'true');
      section.setAttribute('spellcheck', 'false');
    });

    // Ocultar FAB y añadir toolbar
    const fab = document.getElementById('te-fab');
    if (fab) fab.style.display = 'none';
    injectToolbar();

    document.body.classList.add('te-editing');
    showToast('Modo edición activado. Haz clic en cualquier slide para editar su texto.', 'info');
  }

  function injectToolbar() {
    if (document.getElementById('te-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'te-toolbar';
    toolbar.innerHTML = `
      <span class="te-title">📘 Editando: ${FILENAME}</span>
      <span class="te-status">Modo edición activo</span>
      <span class="te-spacer"></span>
      <button id="te-html-editor" title="Abrir editor de código HTML">&lt;/&gt; Editor HTML</button>
      <button id="te-save" class="primary" title="Guardar los cambios en la base de datos">💾 Guardar</button>
      <button id="te-cancel" class="warning" title="Descartar cambios y recargar">↩ Cancelar</button>
      <button id="te-restore" class="danger" title="Borrar la versión editada y volver al original">🔄 Restaurar original</button>
    `;
    document.body.appendChild(toolbar);

    document.getElementById('te-html-editor').addEventListener('click', openHtmlEditor);
    document.getElementById('te-save').addEventListener('click', saveChanges);
    document.getElementById('te-cancel').addEventListener('click', cancelChanges);
    document.getElementById('te-restore').addEventListener('click', restoreOriginal);
  }

  function exitEditMode({ reload = false } = {}) {
    if (reload) {
      window.location.reload();
      return;
    }
    document.body.classList.remove('te-editing');
    document.querySelectorAll('.reveal .slides section').forEach(section => {
      section.removeAttribute('contenteditable');
      section.removeAttribute('spellcheck');
    });
    const toolbar = document.getElementById('te-toolbar');
    if (toolbar) toolbar.remove();
    const fab = document.getElementById('te-fab');
    if (fab) fab.style.display = '';
  }

  // ==========================================================================
  // 4. EDITOR HTML (modal)
  // ==========================================================================
  function openHtmlEditor() {
    const slides = document.querySelector('.reveal .slides');
    if (!slides) return;

    // Modal
    const modal = document.createElement('div');
    modal.id = 'te-modal';
    modal.innerHTML = `
      <div class="te-modal-box">
        <header>
          <h3>&lt;/&gt; Editor HTML — ${FILENAME}</h3>
          <button class="te-modal-close" title="Cerrar sin aplicar">×</button>
        </header>
        <textarea spellcheck="false"></textarea>
        <footer>
          <button class="secondary" id="te-modal-cancel">Cerrar sin aplicar</button>
          <button class="primary"   id="te-modal-apply">Aplicar cambios</button>
        </footer>
      </div>
    `;
    document.body.appendChild(modal);

    const textarea = modal.querySelector('textarea');
    textarea.value = formatHTML(slides.innerHTML);

    modal.querySelector('.te-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#te-modal-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#te-modal-apply').addEventListener('click', () => {
      try {
        slides.innerHTML = textarea.value;
        // Re-aplicar contenteditable
        slides.querySelectorAll('section').forEach(section => {
          section.setAttribute('contenteditable', 'true');
          section.setAttribute('spellcheck', 'false');
        });
        syncReveal();
        modal.remove();
        showToast('Cambios aplicados a la presentación (aún NO guardados)', 'info');
      } catch (err) {
        showToast('HTML inválido: ' + err.message, 'error');
      }
    });
  }

  /** Indentación básica del HTML para que sea más legible en el textarea. */
  function formatHTML(html) {
    try {
      let depth = 0;
      return html
        .replace(/>\s*</g, '>\n<')
        .split('\n')
        .map(line => {
          line = line.trim();
          if (!line) return '';
          if (/^<\//.test(line)) depth = Math.max(depth - 1, 0);
          const indented = '  '.repeat(depth) + line;
          if (/^<[^/!][^>]*[^/]>$/.test(line) && !/^<(br|hr|img|input|meta|link)/i.test(line)) {
            depth++;
          }
          return indented;
        })
        .filter(Boolean)
        .join('\n');
    } catch (_) {
      return html;
    }
  }

  // ==========================================================================
  // 5. GUARDAR / CANCELAR / RESTAURAR
  // ==========================================================================
  async function saveChanges() {
    const slides = document.querySelector('.reveal .slides');
    if (!slides) return;

    // Capturar el HTML sin los atributos del modo edición
    const clone = slides.cloneNode(true);
    clone.querySelectorAll('section').forEach(section => {
      section.removeAttribute('contenteditable');
      section.removeAttribute('spellcheck');
    });
    const contenido = clone.innerHTML;

    const saveBtn = document.getElementById('te-save');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Guardando...'; }

    try {
      const res = await fetch(`${API_URL}/api/clases/${FILENAME}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ contenido })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Error ${res.status}`);
      }
      showToast('✅ Clase guardada correctamente', 'success');
    } catch (err) {
      showToast('❌ Error al guardar: ' + err.message, 'error');
    } finally {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Guardar'; }
    }
  }

  function cancelChanges() {
    if (!confirm('¿Descartar los cambios no guardados y recargar la página?')) return;
    exitEditMode({ reload: true });
  }

  async function restoreOriginal() {
    if (!confirm('Esto eliminará la versión editada de la base de datos y volverá al archivo original. ¿Continuar?')) return;

    try {
      const res = await fetch(`${API_URL}/api/clases/${FILENAME}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Error ${res.status}`);
      }
      showToast('🔄 Versión original restaurada. Recargando...', 'success');
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      showToast('❌ Error al restaurar: ' + err.message, 'error');
    }
  }

  // ==========================================================================
  // 6. TOAST HELPER
  // ==========================================================================
  let toastTimer = null;
  function showToast(message, type = 'info') {
    const old = document.getElementById('te-toast');
    if (old) old.remove();
    if (toastTimer) clearTimeout(toastTimer);

    const toast = document.createElement('div');
    toast.id = 'te-toast';
    toast.className = type;
    toast.textContent = message;
    document.body.appendChild(toast);

    toastTimer = setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 4000);
  }
})();
