const diagrams = document.querySelectorAll('.mermaid');
if (diagrams.length && window.mermaid) {
  window.mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    look: 'classic',
    fontFamily: 'Arial, sans-serif',
    htmlLabels: false,
    flowchart: { htmlLabels: false, useMaxWidth: false }
  });
  window.mermaid.run({ nodes: [...diagrams] }).catch(() => {
    for (const diagram of diagrams) {
      diagram.textContent = 'Не удалось загрузить схему. Попробуйте обновить страницу.';
    }
  });
}
