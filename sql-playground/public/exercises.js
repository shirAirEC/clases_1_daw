// Cargar ejercicios
async function loadExercises() {
  exercisesContent.innerHTML = '<p class="loading">Cargando ejercicios...</p>';
  
  try {
    const response = await fetch(`${API_URL}/api/exercises`);
    const data = await response.json();
    
    if (data.success) {
      renderExercises(data.exercises);
      updateProgress();
    } else {
      exercisesContent.innerHTML = '<p class="error-message">❌ Error al cargar ejercicios</p>';
    }
  } catch (error) {
    console.error('Error cargando ejercicios:', error);
    exercisesContent.innerHTML = '<p class="error-message">❌ Error de conexión</p>';
  }
}

// Renderizar ejercicios
function renderExercises(exercises) {
  if (exercises.length === 0) {
    exercisesContent.innerHTML = '<p class="empty-state">No hay ejercicios disponibles</p>';
    return;
  }
  
  const html = exercises.map((exercise, index) => {
    const isCompleted = completedExercises.includes(exercise.id);
    const statusIcon = isCompleted ? '✅' : '⭕';
    const completedClass = isCompleted ? 'completed' : '';
    
    return `
      <div class="exercise-item ${completedClass}" onclick="loadExercise(${index})">
        <div class="exercise-header">
          <span class="exercise-number">${exercise.id}</span>
          <span class="exercise-status">${statusIcon}</span>
        </div>
        <div class="exercise-title">${exercise.title}</div>
        <div class="exercise-description">${exercise.description}</div>
        <span class="exercise-difficulty difficulty-${exercise.difficulty}">
          ${exercise.difficulty.toUpperCase()}
        </span>
      </div>
    `;
  }).join('');
  
  exercisesContent.innerHTML = html;
  
  // Guardar ejercicios en variable global
  window.exercises = exercises;
  updateProgress();
}

// Cargar ejercicio en el editor
function loadExercise(index) {
  if (window.exercises && window.exercises[index]) {
    const exercise = window.exercises[index];
    currentExercise = exercise;
    
    // Limpiar editor y poner el enunciado como comentario
    sqlEditor.value = `-- ${exercise.title}\n-- ${exercise.description}\n\n-- Escribe tu consulta aquí:\n`;
    
    // Si hay query de plantilla
    if (exercise.template) {
      sqlEditor.value += exercise.template;
    }
    
    updateLineCount();
    sqlEditor.focus();
    
    // Marcar ejercicio como activo
    document.querySelectorAll('.exercise-item').forEach((item, i) => {
      item.classList.remove('active');
      if (i === index) {
        item.classList.add('active');
      }
    });
    
    // Scroll al ejercicio
    const exerciseItem = document.querySelectorAll('.exercise-item')[index];
    if (exerciseItem) {
      exerciseItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// Toggle hint
function toggleHint(index) {
  const hint = document.getElementById(`hint-${index}`);
  if (hint) {
    hint.classList.toggle('show');
  }
}

// Marcar ejercicio como completado
function markExerciseCompleted(exerciseId) {
  if (!completedExercises.includes(exerciseId)) {
    completedExercises.push(exerciseId);
    localStorage.setItem('completedExercises', JSON.stringify(completedExercises));
    updateProgress();
    loadExercises(); // Recargar para actualizar visualización
  }
}

// Actualizar progreso
function updateProgress() {
  const total = window.exercises ? window.exercises.length : 0;
  const completed = completedExercises.length;
  progressText.textContent = `${completed}/${total}`;
}

// Verificar si ejercicio fue completado después de ejecutar query exitosa
function checkExerciseCompletion() {
  // Si hay un ejercicio activo y la query fue exitosa, preguntar si quiere marcarlo como completado
  if (currentExercise && resultsContent.querySelector('.results-table')) {
    setTimeout(() => {
      if (confirm(`¿Has completado el ejercicio "${currentExercise.title}"?\n\nSi es así, se marcará como completado.`)) {
        markExerciseCompleted(currentExercise.id);
      }
    }, 500);
  }
}

// Exportar funciones al objeto global window
window.loadExercise = loadExercise;
window.toggleHint = toggleHint;
window.markExerciseCompleted = markExerciseCompleted;
window.checkExerciseCompletion = checkExerciseCompletion;

