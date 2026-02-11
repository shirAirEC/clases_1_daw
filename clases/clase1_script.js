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

  // Si llegamos aquí, el XML es válido
  showValidationResult(resultDiv, true, 
    `✅ ¡XML bien formado!\n` +
    `${hasProlog ? '✓ Tiene prólogo' : '⚠️ No tiene prólogo (opcional pero recomendado)'}\n` +
    `✓ Tiene raíz única: <${xmlDoc.documentElement.tagName}>\n` +
    `✓ Anidamiento correcto`
  );
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

console.log('✅ Presentación XML Clase 1 cargada correctamente');
console.log('⌨️ Presiona Ctrl+Shift+N para abrir notas del presentador');
