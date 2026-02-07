// API Base URL (cambiar según el entorno)
const API_URL = window.location.pathname.startsWith('/sql-playground') 
  ? '/sql-playground' 
  : '';

// Elementos del DOM
const sqlEditor = document.getElementById('sqlEditor');
const executeBtn = document.getElementById('executeBtn');
const clearBtn = document.getElementById('clearBtn');
const formatBtn = document.getElementById('formatBtn');
const refreshSchemaBtn = document.getElementById('refreshSchema');
const schemaContent = document.getElementById('schemaContent');
const examplesContent = document.getElementById('examplesContent');
const exercisesContent = document.getElementById('exercisesContent');
const resultsContent = document.getElementById('resultsContent');
const executionInfo = document.getElementById('executionInfo');
const lineCount = document.getElementById('lineCount');
const progressText = document.getElementById('progressText');

// Estado actual
let currentQuery = '';
let completedExercises = JSON.parse(localStorage.getItem('completedExercises') || '[]');
let currentExercise = null;

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => {
  loadSchema();
  loadExamples();
  loadExercises();
  setupEventListeners();
  setupTabs();
});

// Event Listeners
function setupEventListeners() {
  executeBtn.addEventListener('click', executeQuery);
  clearBtn.addEventListener('click', clearEditor);
  formatBtn.addEventListener('click', formatQuery);
  refreshSchemaBtn.addEventListener('click', loadSchema);
  
  // Actualizar contador de líneas
  sqlEditor.addEventListener('input', updateLineCount);
  sqlEditor.addEventListener('keyup', updateLineCount);
  
  // Atajo de teclado Ctrl+Enter para ejecutar
  sqlEditor.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  });
}

// Setup de pestañas
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      // Desactivar todas las pestañas
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      // Activar pestaña seleccionada
      btn.classList.add('active');
      document.getElementById(`${tabName}Tab`).classList.add('active');
    });
  });
}

// Actualizar contador de líneas
function updateLineCount() {
  const lines = sqlEditor.value.split('\n').length;
  lineCount.textContent = `Línea${lines > 1 ? 's' : ''} ${lines}`;
}

// Cargar esquema de base de datos
async function loadSchema() {
  schemaContent.innerHTML = '<p class="loading">Cargando esquema...</p>';
  
  try {
    const response = await fetch(`${API_URL}/api/schema`);
    const data = await response.json();
    
    if (data.success) {
      renderSchema(data.schema);
    } else {
      schemaContent.innerHTML = '<p class="error-message">❌ Error al cargar esquema</p>';
    }
  } catch (error) {
    console.error('Error cargando esquema:', error);
    schemaContent.innerHTML = '<p class="error-message">❌ Error de conexión</p>';
  }
}

// Renderizar esquema
function renderSchema(schema) {
  const tables = Object.keys(schema).sort();
  
  if (tables.length === 0) {
    schemaContent.innerHTML = '<p class="empty-state">No hay tablas disponibles</p>';
    return;
  }
  
  let html = '';
  
  tables.forEach(tableName => {
    const columns = schema[tableName];
    const columnsHtml = columns.map(col => {
      const nullable = col.nullable ? '' : ' NOT NULL';
      return `<div class="column-item">
        <span class="column-name">${col.column}</span>
        <span class="column-type">${col.type}${nullable}</span>
      </div>`;
    }).join('');
    
    html += `
      <div class="table-item">
        <div class="table-name" onclick="insertTableName('${tableName}')">
          ${tableName}
          <span>📋</span>
        </div>
        <div class="table-columns">
          ${columnsHtml}
        </div>
      </div>
    `;
  });
  
  schemaContent.innerHTML = html;
}

// Insertar nombre de tabla en el editor
function insertTableName(tableName) {
  const cursorPos = sqlEditor.selectionStart;
  const textBefore = sqlEditor.value.substring(0, cursorPos);
  const textAfter = sqlEditor.value.substring(cursorPos);
  
  sqlEditor.value = textBefore + tableName + textAfter;
  sqlEditor.focus();
  sqlEditor.selectionStart = sqlEditor.selectionEnd = cursorPos + tableName.length;
  updateLineCount();
}

// Cargar ejemplos
async function loadExamples() {
  examplesContent.innerHTML = '<p class="loading">Cargando ejemplos...</p>';
  
  try {
    const response = await fetch(`${API_URL}/api/examples`);
    const data = await response.json();
    
    if (data.success) {
      renderExamples(data.examples);
    } else {
      examplesContent.innerHTML = '<p class="error-message">❌ Error al cargar ejemplos</p>';
    }
  } catch (error) {
    console.error('Error cargando ejemplos:', error);
    examplesContent.innerHTML = '<p class="error-message">❌ Error de conexión</p>';
  }
}

// Renderizar ejemplos
function renderExamples(examples) {
  if (examples.length === 0) {
    examplesContent.innerHTML = '<p class="empty-state">No hay ejemplos disponibles</p>';
    return;
  }
  
  const html = examples.map((example, index) => `
    <div class="example-item" onclick="loadExample(${index})">
      <div class="example-title">${example.title}</div>
      <span class="example-category">${example.category}</span>
    </div>
  `).join('');
  
  examplesContent.innerHTML = html;
  
  // Guardar ejemplos en variable global para acceso rápido
  window.examples = examples;
}

// Cargar ejemplo en el editor
function loadExample(index) {
  if (window.examples && window.examples[index]) {
    sqlEditor.value = window.examples[index].query;
    updateLineCount();
    sqlEditor.focus();
  }
}

// Ejecutar consulta
async function executeQuery() {
  const query = sqlEditor.value.trim();
  
  if (!query) {
    showError('Por favor, escribe una consulta SQL');
    return;
  }
  
  // Deshabilitar botón y mostrar estado de carga
  executeBtn.disabled = true;
  executeBtn.textContent = '⏳ Ejecutando...';
  resultsContent.innerHTML = '<p class="loading">Ejecutando consulta...</p>';
  executionInfo.textContent = '';
  
  try {
    const response = await fetch(`${API_URL}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    
    if (data.success) {
      renderResults(data);
      // Verificar si el ejercicio fue completado (si la función existe)
      if (typeof window.checkExerciseCompletion === 'function') {
        window.checkExerciseCompletion();
      }
    } else {
      showError(data.error);
    }
  } catch (error) {
    console.error('Error ejecutando query:', error);
    showError('Error de conexión con el servidor');
  } finally {
    executeBtn.disabled = false;
    executeBtn.textContent = '▶️ Ejecutar';
  }
}

// Renderizar resultados
function renderResults(data) {
  const { rows, rowCount, executionTime } = data;
  
  // Mostrar información de ejecución
  executionInfo.textContent = `${rowCount} fila${rowCount !== 1 ? 's' : ''} · ${executionTime}`;
  
  if (rows.length === 0) {
    resultsContent.innerHTML = `
      <div class="success-message">
        ✅ Consulta ejecutada correctamente (0 resultados)
      </div>
    `;
    return;
  }
  
  // Crear tabla de resultados
  const columns = Object.keys(rows[0]);
  
  let html = '<table class="results-table"><thead><tr>';
  columns.forEach(col => {
    html += `<th>${col}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  rows.forEach(row => {
    html += '<tr>';
    columns.forEach(col => {
      const value = row[col];
      const displayValue = value === null ? 'NULL' : String(value);
      const className = value === null ? 'null-value' : '';
      html += `<td class="${className}">${escapeHtml(displayValue)}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  
  resultsContent.innerHTML = html;
}

// Mostrar error
function showError(message) {
  resultsContent.innerHTML = `
    <div class="error-message">
      ❌ Error: ${escapeHtml(message)}
    </div>
  `;
  executionInfo.textContent = '';
}

// Limpiar editor
function clearEditor() {
  if (confirm('¿Estás seguro de que quieres limpiar el editor?')) {
    sqlEditor.value = '';
    updateLineCount();
    sqlEditor.focus();
  }
}

// Formatear consulta (básico)
function formatQuery() {
  let query = sqlEditor.value.trim();
  
  if (!query) return;
  
  // Formato básico de SQL
  const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 
                   'ON', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET', 
                   'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL'];
  
  // Poner keywords en mayúsculas
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    query = query.replace(regex, keyword);
  });
  
  // Agregar saltos de línea después de ciertas palabras clave
  query = query
    .replace(/\s+FROM\s+/gi, '\nFROM ')
    .replace(/\s+WHERE\s+/gi, '\nWHERE ')
    .replace(/\s+JOIN\s+/gi, '\nJOIN ')
    .replace(/\s+INNER\s+JOIN\s+/gi, '\nINNER JOIN ')
    .replace(/\s+LEFT\s+JOIN\s+/gi, '\nLEFT JOIN ')
    .replace(/\s+RIGHT\s+JOIN\s+/gi, '\nRIGHT JOIN ')
    .replace(/\s+GROUP\s+BY\s+/gi, '\nGROUP BY ')
    .replace(/\s+HAVING\s+/gi, '\nHAVING ')
    .replace(/\s+ORDER\s+BY\s+/gi, '\nORDER BY ')
    .replace(/\s+LIMIT\s+/gi, '\nLIMIT ');
  
  sqlEditor.value = query.trim();
  updateLineCount();
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Hacer funciones globales para onclick
window.insertTableName = insertTableName;
window.loadExample = loadExample;
// Las funciones de ejercicios se definirán en exercises.js
window.loadExercise = null;
window.toggleHint = null;
window.markExerciseCompleted = null;
