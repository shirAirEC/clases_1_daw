// ===== INICIALIZACIÓN DE REVEAL.JS =====
Reveal.initialize({
  hash: true,
  controls: true,
  progress: true,
  center: false,
  transition: 'slide',
  slideNumber: 'c/t',
  plugins: [RevealNotes, RevealHighlight],
  width: 1280,
  height: 720,
  margin: 0.1,
  minScale: 0.2,
  maxScale: 2.0,
  keyboard: {
    // Cambiar atajo para notas del presentador a Ctrl+Shift+N
    78: function() {
      if (event.ctrlKey && event.shiftKey) {
        RevealNotes.open();
      }
    }
  }
});

// ===== SISTEMA SIMPLE DE IDENTIFICACIÓN =====
let currentStudent = null;

// Verificar si el estudiante ya se identificó
function checkStudentIdentification() {
  const studentData = localStorage.getItem('current-student');
  if (studentData) {
    currentStudent = JSON.parse(studentData);
    return true;
  }
  return false;
}

// Modal de identificación
function showStudentModal() {
  if (checkStudentIdentification()) {
    return; // Ya está identificado
  }

  const modal = document.createElement('div');
  modal.id = 'student-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  modal.innerHTML = `
    <div style="background: white; padding: 40px; border-radius: 20px; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
      <h2 style="color: #667eea; margin-bottom: 20px; text-align: center;">🎓 Identificación de Estudiante</h2>
      <p style="color: #666; margin-bottom: 25px; text-align: center;">Para comenzar, identifícate:</p>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; color: #333; font-weight: 600; margin-bottom: 8px;">Nombre completo:</label>
        <input type="text" id="student-name" placeholder="Ej: María García López" 
          style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em;">
      </div>
      
      <button onclick="registerStudent()" 
        style="width: 100%; padding: 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-size: 1.1em; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(102,126,234,0.3);">
        Comenzar
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  // Focus en el input
  setTimeout(() => {
    document.getElementById('student-name').focus();
  }, 100);

  // Permitir Enter para enviar
  document.getElementById('student-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') registerStudent();
  });
}

// Registrar estudiante
window.registerStudent = function() {
  const name = document.getElementById('student-name').value.trim();

  if (!name) {
    alert('Por favor, ingresa tu nombre');
    return;
  }

  currentStudent = {
    name: name,
    startTime: Date.now(),
    correctAnswers: 0,
    totalAnswers: 0
  };

  localStorage.setItem('current-student', JSON.stringify(currentStudent));
  
  // Cerrar modal
  const modal = document.getElementById('student-modal');
  if (modal) modal.remove();

  // Mostrar indicador
  updateStudentIndicator();
  
  const indicator = document.getElementById('student-indicator');
  if (indicator) {
    indicator.style.display = 'block';
  }
};

// Actualizar indicador de estudiante
function updateStudentIndicator() {
  const indicator = document.getElementById('student-indicator');
  if (!indicator) return;

  if (currentStudent) {
    indicator.style.display = 'block';
    const percentage = currentStudent.totalAnswers > 0 
      ? Math.round((currentStudent.correctAnswers / currentStudent.totalAnswers) * 100)
      : 0;
    
    document.getElementById('student-indicator-text').textContent = 
      `${currentStudent.name} - ${currentStudent.correctAnswers}/${currentStudent.totalAnswers} (${percentage}%)`;
  } else {
    indicator.style.display = 'none';
  }
}

// Guardar respuesta de estudiante
function saveStudentAnswer(questionId, answer, isCorrect) {
  if (!currentStudent) {
    console.warn('Estudiante no identificado');
    return;
  }

  currentStudent.totalAnswers++;
  if (isCorrect) {
    currentStudent.correctAnswers++;
  }

  localStorage.setItem('current-student', JSON.stringify(currentStudent));
  updateStudentIndicator();
}

// Mostrar identificación al cargar
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(showStudentModal, 1000);
});

// Verificar identificación al iniciar
setTimeout(() => {
  if (checkStudentIdentification()) {
    const indicator = document.getElementById('student-indicator');
    if (indicator) {
      indicator.style.display = 'block';
      updateStudentIndicator();
    }
  }
}, 2000);

// ===== VALIDADOR XML INTEGRADO =====
function validateXML(textareaId, resultId) {
  const textarea = document.getElementById(textareaId);
  const resultDiv = document.getElementById(resultId);
  const xmlString = textarea.value.trim();

  if (!xmlString) {
    showValidationResult(resultDiv, false, '⚠️ El campo está vacío. Escribe tu XML aquí.');
    return;
  }

  // Intentar parsear el XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  // Verificar errores de parseo
  const parseError = xmlDoc.querySelector('parsererror');
  
  if (parseError) {
    const errorMessage = parseError.textContent;
    showValidationResult(resultDiv, false, `❌ XML NO válido:\n${errorMessage}`);
    return;
  }

  // Verificar que tenga prólogo
  const hasProlog = xmlString.trim().startsWith('<?xml');
  
  // Verificar que tenga una única raíz
  const rootElements = xmlDoc.documentElement ? 1 : 0;
  
  if (rootElements === 0) {
    showValidationResult(resultDiv, false, '❌ No se encontró elemento raíz.');
    return;
  }

  // Verificar indentación básica
  const hasProperIndentation = xmlString.includes('  ') || xmlString.includes('\t');

  // Validación exitosa
  let successMessage = '✅ ¡XML bien formado!';
  if (!hasProlog) {
    successMessage += '\n⚠️ Recomendación: Añade el prólogo XML.';
  }
  if (!hasProperIndentation) {
    successMessage += '\n⚠️ Recomendación: Mejora la indentación para mayor legibilidad.';
  }
  
  showValidationResult(resultDiv, true, successMessage);
}

// ===== VALIDADOR XML AVANZADO (con requisitos específicos) =====
function validateXMLAdvanced(textareaId, resultId, requirements) {
  const textarea = document.getElementById(textareaId);
  const resultDiv = document.getElementById(resultId);
  const xmlString = textarea.value.trim();

  if (!xmlString) {
    showValidationResult(resultDiv, false, '⚠️ El campo está vacío. Escribe tu XML aquí.');
    return;
  }

  // Parsear XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const parseError = xmlDoc.querySelector('parsererror');
  
  if (parseError) {
    showValidationResult(resultDiv, false, `❌ XML NO válido:\n${parseError.textContent}`);
    return;
  }

  // Verificaciones
  const errors = [];
  const warnings = [];

  // 1. Verificar prólogo
  if (!xmlString.trim().startsWith('<?xml')) {
    errors.push('❌ Falta el prólogo XML');
  }

  // 2. Contar niveles de profundidad
  const maxDepth = getMaxDepth(xmlDoc.documentElement);
  if (requirements.minLevels && maxDepth < requirements.minLevels) {
    errors.push(`❌ Requiere al menos ${requirements.minLevels} niveles. Detectados: ${maxDepth}`);
  }

  // 3. Contar elementos únicos
  const uniqueElements = countUniqueElements(xmlDoc.documentElement);
  if (requirements.minElements && uniqueElements < requirements.minElements) {
    errors.push(`❌ Requiere al menos ${requirements.minElements} elementos diferentes. Detectados: ${uniqueElements}`);
  }

  // 4. Verificar elementos con atributos
  const elementsWithAttrs = countElementsWithAttributes(xmlDoc.documentElement);
  if (requirements.minAttributes && elementsWithAttrs < requirements.minAttributes) {
    errors.push(`❌ Requiere al menos ${requirements.minAttributes} elementos con atributos. Detectados: ${elementsWithAttrs}`);
  }

  // 5. Verificar comentarios
  const commentCount = (xmlString.match(/<!--/g) || []).length;
  if (requirements.requireComments && commentCount < requirements.requireComments) {
    errors.push(`❌ Requiere al menos ${requirements.requireComments} comentarios. Detectados: ${commentCount}`);
  }

  // 6. Verificar referencias a entidades
  if (requirements.requireEntities) {
    const hasEntities = /&(lt|gt|amp|quot|apos|#\d+|#x[0-9A-Fa-f]+);/.test(xmlString);
    if (!hasEntities) {
      errors.push('❌ Debe incluir al menos una referencia a entidad (&lt;, &gt;, &amp;, etc.)');
    }
  }

  // 7. Verificar indentación
  const hasIndentation = xmlString.includes('  ') || xmlString.includes('\t');
  if (!hasIndentation) {
    warnings.push('⚠️ Recomendación: Mejora la indentación');
  }

  // Mostrar resultados
  if (errors.length > 0) {
    showValidationResult(resultDiv, false, errors.join('\n'));
  } else {
    let message = '✅ ¡Excelente! XML bien formado y cumple todos los requisitos.';
    message += `\n📊 ${uniqueElements} elementos únicos detectados`;
    message += `\n📊 ${maxDepth} niveles de profundidad`;
    message += `\n📊 ${elementsWithAttrs} elementos con atributos`;
    message += `\n📊 ${commentCount} comentarios encontrados`;
    if (warnings.length > 0) {
      message += '\n\n' + warnings.join('\n');
    }
    showValidationResult(resultDiv, true, message);
  }
}

// Funciones auxiliares para validación avanzada
function getMaxDepth(element, currentDepth = 1) {
  if (!element || !element.children || element.children.length === 0) {
    return currentDepth;
  }
  
  let maxChildDepth = currentDepth;
  for (let child of element.children) {
    const childDepth = getMaxDepth(child, currentDepth + 1);
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }
  
  return maxChildDepth;
}

function countUniqueElements(element, elementSet = new Set()) {
  if (!element) return elementSet.size;
  
  elementSet.add(element.tagName.toLowerCase());
  
  if (element.children) {
    for (let child of element.children) {
      countUniqueElements(child, elementSet);
    }
  }
  
  return elementSet.size;
}

function countElementsWithAttributes(element, count = 0) {
  if (!element) return count;
  
  if (element.attributes && element.attributes.length > 0) {
    count++;
  }
  
  if (element.children) {
    for (let child of element.children) {
      count = countElementsWithAttributes(child, count);
    }
  }
  
  return count;
}

function showValidationResult(element, isSuccess, message) {
  element.style.display = 'block';
  element.style.background = isSuccess ? '#e8f5e9' : '#ffebee';
  element.style.border = `3px solid ${isSuccess ? '#4caf50' : '#f44336'}`;
  element.style.color = isSuccess ? '#2e7d32' : '#c62828';
  element.style.fontSize = '0.9em';
  element.style.padding = '15px';
  element.style.whiteSpace = 'pre-wrap';
  element.innerHTML = `<strong>${message.split('\n').join('<br>')}</strong>`;
}

// Hacer las funciones globales
window.validateXML = validateXML;
window.validateXMLAdvanced = validateXMLAdvanced;

// ===== RESPUESTAS DEL CUESTIONARIO =====
const respuestasVF = {
  q1: 'v',  // XML es case sensitive
  q2: 'f',  // XML deriva de SGML, no de XHTML
  q3: 'f',  // Solo puede haber una raíz
  q4: 'f',  // El prólogo es opcional
  q5: 'f',  // Los nombres no pueden tener espacios
  q6: 'v',  // Anidamiento correcto es obligatorio
  q7: 'v',  // standalone="no" indica dependencia
  q8: 'f',  // No pueden empezar con números
  q9: 'v',  // Ambas formas son válidas para vacíos
  q10: 'v', // Pueden haber hermanos con mismo nombre
  q11: 'f', // Atributos van en apertura, no en cierre
  q12: 'v', // Valores deben ir entre comillas
  q13: 'f', // No puede haber atributos duplicados
  q14: 'v', // Misma sintaxis que HTML
  q15: 'f', // Los comentarios no pueden anidarse
  q16: 'v', // Esa es la función de CDATA
  q17: 'f', // La sintaxis correcta es <![CDATA[...]]>
  q18: 'v', // Los atributos son opcionales
  q19: 'f', // Bien formado != válido
  q20: 'v'  // XML es extensible
};

const explicacionesVF = {
  q1: {
    correcta: '✅ Correcto. XML distingue entre mayúsculas y minúsculas. <nombre> y <Nombre> son elementos diferentes.',
    incorrecta: '❌ Incorrecto. XML SÍ es case sensitive. <nombre> y <Nombre> son elementos distintos.'
  },
  q2: {
    correcta: '✅ Correcto. XML deriva de SGML (Standard Generalized Markup Language), no de XHTML.',
    incorrecta: '❌ Incorrecto. XML SÍ deriva de SGML, que es un metalenguaje más antiguo y complejo.'
  },
  q3: {
    correcta: '✅ Correcto. Solo puede haber un elemento raíz. Tener múltiples raíces haría el XML no válido.',
    incorrecta: '❌ Incorrecto. Un documento XML debe tener una ÚNICA raíz que contenga todos los demás elementos.'
  },
  q4: {
    correcta: '✅ Correcto. El prólogo (<?xml version="1.0"?>) es opcional, aunque muy recomendado.',
    incorrecta: '❌ Incorrecto. El prólogo SÍ es opcional, pero es una buena práctica incluirlo.'
  },
  q5: {
    correcta: '✅ Correcto. Los espacios no están permitidos en nombres de etiquetas. <mi etiqueta> es inválido.',
    incorrecta: '❌ Incorrecto. Los nombres de etiquetas NO pueden contener espacios.'
  },
  q6: {
    correcta: '✅ Correcto. Los elementos deben cerrarse en orden inverso: <a><b></b></a> es correcto.',
    incorrecta: '❌ Incorrecto. El anidamiento correcto SÍ es obligatorio en XML bien formado.'
  },
  q7: {
    correcta: '✅ Correcto. standalone="no" indica que el documento depende de definiciones externas (DTD/XSD).',
    incorrecta: '❌ Incorrecto. standalone="no" SÍ indica dependencia de esquemas externos.'
  },
  q8: {
    correcta: '✅ Correcto. Los nombres deben empezar con letra, _ o :, pero nunca con números. <1elemento> es inválido.',
    incorrecta: '❌ Incorrecto. Los nombres de elementos NO pueden empezar con números.'
  },
  q9: {
    correcta: '✅ Correcto. <elemento></elemento> y <elemento/> son equivalentes para elementos vacíos.',
    incorrecta: '❌ Incorrecto. Ambas formas SÍ son válidas y equivalentes.'
  },
  q10: {
    correcta: '✅ Correcto. Puede haber múltiples <producto> al mismo nivel dentro de un <catalogo>.',
    incorrecta: '❌ Incorrecto. SÍ pueden existir elementos hermanos con el mismo nombre.'
  },
  q11: {
    correcta: '✅ Correcto. Los atributos van exclusivamente en la etiqueta de apertura: <elemento attr="valor">',
    incorrecta: '❌ Incorrecto. Los atributos SOLO se añaden en la etiqueta de apertura, no en la de cierre.'
  },
  q12: {
    correcta: '✅ Correcto. Los valores de atributos deben ir entre comillas: attr="valor" o attr=\'valor\'',
    incorrecta: '❌ Incorrecto. Las comillas (simples o dobles) SÍ son obligatorias para los valores de atributos.'
  },
  q13: {
    correcta: '✅ Correcto. Los nombres de atributos deben ser únicos dentro de un elemento.',
    incorrecta: '❌ Incorrecto. Un elemento NO puede tener dos atributos con el mismo nombre.'
  },
  q14: {
    correcta: '✅ Correcto. Los comentarios en XML se escriben igual que en HTML: <!-- comentario -->',
    incorrecta: '❌ Incorrecto. La sintaxis SÍ es la misma: <!-- comentario -->'
  },
  q15: {
    correcta: '✅ Correcto. No se pueden anidar comentarios en XML porque no se permite -- dentro de un comentario.',
    incorrecta: '❌ Incorrecto. Los comentarios NO pueden anidarse en XML.'
  },
  q16: {
    correcta: '✅ Correcto. CDATA permite incluir texto con < y > sin que sean procesados como etiquetas.',
    incorrecta: '❌ Incorrecto. Esa ES la función principal de CDATA.'
  },
  q17: {
    correcta: '✅ Correcto. Falta el signo de exclamación al inicio: debe ser <![CDATA[...]]> y no <[CDATA[...]]>',
    incorrecta: '❌ Incorrecto. La sintaxis correcta es <![CDATA[...]]>, no <[CDATA[...]]>'
  },
  q18: {
    correcta: '✅ Correcto. Los atributos son opcionales. Un elemento puede no tener ningún atributo.',
    incorrecta: '❌ Incorrecto. Los atributos SÍ son opcionales en XML.'
  },
  q19: {
    correcta: '✅ Correcto. Son conceptos diferentes: bien formado = sintaxis OK, válido = cumple esquema (DTD/XSD).',
    incorrecta: '❌ Incorrecto. "Bien formado" y "válido" NO son lo mismo. Bien formado es sintaxis, válido es cumplir esquema.'
  },
  q20: {
    correcta: '✅ Correcto. XML es extensible porque puedes crear tus propias etiquetas según tus necesidades.',
    incorrecta: '❌ Incorrecto. La extensibilidad (definir tus propias etiquetas) ES una característica clave de XML.'
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

console.log('✅ Presentación XML cargada correctamente');
console.log('🎓 Sistema simple de registro activo');
console.log('⌨️ Presiona Ctrl+Shift+N para abrir notas del presentador');
