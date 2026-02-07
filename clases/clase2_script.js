// ===== CONFIGURACIÓN REVEAL.JS =====
Reveal.initialize({
  hash: true,
  slideNumber: 'c/t',
  showSlideNumber: 'all',
  transition: 'slide',
  backgroundTransition: 'fade',
  plugins: [RevealNotes, RevealHighlight],
  keyboard: {
    // Ctrl+Shift+N para notas del presentador (evita apertura accidental)
    78: function() {
      if (event.ctrlKey && event.shiftKey) {
        Reveal.getPlugin('notes').open();
      }
    }
  }
});

// ===== SISTEMA DE LOGIN Y PROGRESO SIMPLE =====
let currentStudent = null;

// Cargar estudiante actual al iniciar
window.addEventListener('DOMContentLoaded', function() {
  const stored = localStorage.getItem('currentStudent');
  if (stored) {
    currentStudent = JSON.parse(stored);
    showStudentIndicator();
  } else {
    showLoginModal();
  }
});

function showLoginModal() {
  const modal = document.createElement('div');
  modal.id = 'login-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  modal.innerHTML = `
    <div style="background: white; padding: 40px; border-radius: 20px; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
      <h2 style="color: #667eea; margin-bottom: 20px; font-size: 1.8em;">🎓 Clase 2: DTD y XSD</h2>
      <p style="color: #666; margin-bottom: 25px; font-size: 1.1em;">Ingresa tu nombre para comenzar:</p>
      <input type="text" id="student-name-input" placeholder="Tu nombre completo" style="width: 100%; padding: 15px; font-size: 1.1em; border: 2px solid #ddd; border-radius: 10px; margin-bottom: 20px;" autofocus>
      <button onclick="startSession()" style="width: 100%; padding: 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 10px; font-size: 1.2em; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
        Comenzar →
      </button>
      <p style="color: #999; font-size: 0.85em; margin-top: 15px; text-align: center;">
        Tu progreso se guardará automáticamente
      </p>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Enter para enviar
  document.getElementById('student-name-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      startSession();
    }
  });
}

function startSession() {
  const nameInput = document.getElementById('student-name-input');
  const name = nameInput.value.trim();
  
  if (!name) {
    alert('Por favor ingresa tu nombre');
    return;
  }
  
  currentStudent = {
    name: name,
    startTime: new Date().toISOString(),
    correctAnswers: 0,
    totalAnswers: 0
  };
  
  localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
  
  // Cerrar modal
  document.getElementById('login-modal').remove();
  
  // Mostrar indicador
  showStudentIndicator();
}

function showStudentIndicator() {
  const indicator = document.getElementById('student-indicator');
  const indicatorText = document.getElementById('student-indicator-text');
  
  if (currentStudent.totalAnswers === 0) {
    indicatorText.textContent = `✅ ${currentStudent.name}`;
  } else {
    const percentage = Math.round((currentStudent.correctAnswers / currentStudent.totalAnswers) * 100);
    indicatorText.textContent = `✅ ${currentStudent.name} - ${currentStudent.correctAnswers}/${currentStudent.totalAnswers} (${percentage}%)`;
  }
  
  indicator.style.display = 'block';
}

function saveStudentAnswer(question, answer, isCorrect) {
  if (!currentStudent) return;
  
  currentStudent.totalAnswers++;
  if (isCorrect) {
    currentStudent.correctAnswers++;
  }
  
  localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
  showStudentIndicator();
}

// ===== RESPUESTAS DEL CUESTIONARIO =====
const respuestasVF = {
  q1: 'v',  // DTD = Document Type Definition
  q2: 'f',  // Bien formado no es lo mismo que válido
  q3: 'v',  // DTD interno va dentro del XML
  q4: 'v',  // #PCDATA = Parsed Character Data
  q5: 'v',  // + = una o más veces
  q6: 'f',  // ? = opcional (0 o 1 vez)
  q7: 'v',  // ATTLIST declara atributos
  q8: 'f',  // #REQUIRED = obligatorio
  q9: 'v',  // #IMPLIED = opcional
  q10: 'v', // Entidades son atajos reutilizables
  q11: 'v', // EMPTY = sin contenido
  q12: 'v', // ID debe ser único
  q13: 'v', // XSD usa XML, DTD no
  q14: 'v', // XSD soporta tipos específicos
  q15: 'f', // DTD NO soporta tipos específicos
  q16: 'v', // XSD es recomendado por W3C
  q17: 'v', // | = alternativa
  q18: 'v'  // Puede tener ambos (interno+externo)
};

const explicacionesVF = {
  q1: {
    correcta: '✅ Correcto. DTD significa "Document Type Definition" (Definición de Tipo de Documento).',
    incorrecta: '❌ Incorrecto. DTD SÍ significa "Document Type Definition".'
  },
  q2: {
    correcta: '✅ Correcto. Un XML bien formado tiene sintaxis correcta, pero válido significa que cumple un esquema (DTD/XSD).',
    incorrecta: '❌ Incorrecto. Bien formado y válido son conceptos diferentes. Un XML puede estar bien formado pero no ser válido según un DTD.'
  },
  q3: {
    correcta: '✅ Correcto. Los DTD internos se escriben dentro del mismo archivo XML, entre corchetes después de <!DOCTYPE>.',
    incorrecta: '❌ Incorrecto. Los DTD internos SÍ van dentro del archivo XML.'
  },
  q4: {
    correcta: '✅ Correcto. #PCDATA significa "Parsed Character Data" - datos de texto que pueden contener entidades.',
    incorrecta: '❌ Incorrecto. #PCDATA SÍ significa "Parsed Character Data".'
  },
  q5: {
    correcta: '✅ Correcto. El operador + indica que el elemento debe aparecer una o más veces.',
    incorrecta: '❌ Incorrecto. El operador + SÍ significa "una o más veces".'
  },
  q6: {
    correcta: '✅ Correcto. El operador ? significa opcional (0 o 1 vez), no obligatorio.',
    incorrecta: '❌ Incorrecto. El operador ? significa "opcional" (0 o 1 vez), no obligatorio.'
  },
  q7: {
    correcta: '✅ Correcto. ATTLIST se usa para declarar atributos de un elemento en DTD.',
    incorrecta: '❌ Incorrecto. ATTLIST SÍ se usa para declarar atributos.'
  },
  q8: {
    correcta: '✅ Correcto. #REQUIRED significa que el atributo es obligatorio, no opcional.',
    incorrecta: '❌ Incorrecto. #REQUIRED significa "obligatorio", no opcional.'
  },
  q9: {
    correcta: '✅ Correcto. #IMPLIED significa que el atributo es opcional (puede o no estar presente).',
    incorrecta: '❌ Incorrecto. #IMPLIED SÍ significa opcional.'
  },
  q10: {
    correcta: '✅ Correcto. Las entidades permiten definir atajos para contenido reutilizable (como variables).',
    incorrecta: '❌ Incorrecto. Las entidades SÍ son atajos reutilizables.'
  },
  q11: {
    correcta: '✅ Correcto. EMPTY indica que un elemento no puede tener contenido (como <br/> o <img/>).',
    incorrecta: '❌ Incorrecto. EMPTY SÍ indica que no puede tener contenido.'
  },
  q12: {
    correcta: '✅ Correcto. Los atributos de tipo ID deben tener valores únicos en todo el documento.',
    incorrecta: '❌ Incorrecto. Los ID SÍ deben ser únicos.'
  },
  q13: {
    correcta: '✅ Correcto. XSD usa sintaxis XML (más fácil de procesar), mientras que DTD usa sintaxis heredada de SGML.',
    incorrecta: '❌ Incorrecto. XSD SÍ usa sintaxis XML, DTD no.'
  },
  q14: {
    correcta: '✅ Correcto. XSD soporta muchos tipos: xs:integer, xs:date, xs:boolean, xs:decimal, etc.',
    incorrecta: '❌ Incorrecto. XSD SÍ soporta tipos de datos específicos.'
  },
  q15: {
    correcta: '✅ Correcto. DTD NO soporta tipos de datos específicos, todo es tratado como texto (#PCDATA).',
    incorrecta: '❌ Incorrecto. DTD NO soporta tipos específicos, esta es una limitación clave.'
  },
  q16: {
    correcta: '✅ Correcto. XSD es el estándar moderno recomendado por el W3C para validar XML.',
    incorrecta: '❌ Incorrecto. XSD SÍ es el método recomendado actualmente.'
  },
  q17: {
    correcta: '✅ Correcto. El operador | indica alternativa: (a|b) significa "a o b, pero no ambos".',
    incorrecta: '❌ Incorrecto. El operador | SÍ indica alternativa.'
  },
  q18: {
    correcta: '✅ Correcto. Un documento puede tener DTD interno y externo al mismo tiempo (se combinan las reglas).',
    incorrecta: '❌ Incorrecto. SÍ puede tener ambos simultáneamente.'
  }
};

// Manejar clics en botones Verdadero/Falso
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('vf-btn')) {
    const pregunta = e.target.dataset.question;
    const respuesta = e.target.dataset.answer;
    const feedbackElement = document.getElementById(`feedback-${pregunta}`);
    
    if (!feedbackElement) return;
    
    // Obtener todos los botones de esta pregunta
    const botones = document.querySelectorAll(`[data-question="${pregunta}"]`);
    
    // Resetear todos los botones
    botones.forEach(btn => {
      btn.classList.remove('correct', 'incorrect');
    });
    
    // Verificar si la respuesta es correcta
    const esCorrecta = respuesta === respuestasVF[pregunta];
    
    // Aplicar clase al botón clickeado
    e.target.classList.add(esCorrecta ? 'correct' : 'incorrect');
    
    // Mostrar feedback
    feedbackElement.className = esCorrecta ? 'feedback ok show' : 'feedback ko show';
    feedbackElement.innerHTML = esCorrecta 
      ? explicacionesVF[pregunta].correcta 
      : explicacionesVF[pregunta].incorrecta;
    
    // Guardar respuesta del estudiante
    saveStudentAnswer(pregunta, respuesta, esCorrecta);
  }
});

console.log('✅ Presentación Clase 2 (DTD y XSD) cargada correctamente');
console.log('🎓 Sistema simple de registro activo');
console.log('⌨️ Presiona Ctrl+Shift+N para abrir notas del presentador');
