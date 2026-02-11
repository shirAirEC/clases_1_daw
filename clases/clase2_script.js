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

console.log('✅ Presentación Clase 2 (DTD y XSD) cargada correctamente');
console.log('⌨️ Presiona Ctrl+Shift+N para abrir notas del presentador');
