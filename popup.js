// Context Stack - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const addCurrentBtn = document.getElementById('addCurrentBtn');
  const addAllBtn = document.getElementById('addAllBtn');
  const formatSelect = document.getElementById('formatSelect');
  const notepad = document.getElementById('notepad');
  const statsText = document.getElementById('statsText');
  const syncIndicator = document.getElementById('syncIndicator');
  const copyBtn = document.getElementById('copyBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const clearBtn = document.getElementById('clearBtn');
  const itemCountBadge = document.getElementById('itemCountBadge');

  let itemsState = [];
  let selectedFormat = 'markdown';
  let saveDebounceTimeout = null;

  /**
   * Helper para formatear la lista de ítems según el formato elegido
   */
  function formatItems(items, format) {
    if (!items || items.length === 0) return '';

    const formatItem = (item) => {
      const title = (item.title || item.originalUrl || 'Sin Título').replace(/[\[\]]/g, '');
      switch (format) {
        case 'urls':
          return item.jinaUrl;
        case 'markdown':
        case 'llm_prompt':
        default:
          return `[${title}](${item.jinaUrl})`;
      }
    };

    const lines = items.map(formatItem).join('\n');

    if (format === 'llm_prompt') {
      return `Analiza la siguiente documentación estructurada en Markdown:\n\n${lines}`;
    }

    return lines;
  }

  /**
   * Actualiza el indicador de estadísticas (caracteres y líneas)
   */
  function updateStats() {
    const text = notepad.value;
    const charCount = text.length;
    const lineCount = text ? text.split('\n').length : 0;
    statsText.textContent = `${charCount} caracteres | ${lineCount} líneas`;
  }

  /**
   * Actualiza el badge con el número de URLs
   */
  function updateBadge(count) {
    itemCountBadge.textContent = `${count} URL${count === 1 ? '' : 's'}`;
  }

  /**
   * Carga inicial del estado desde chrome.storage.local
   */
  async function loadState() {
    const data = await chrome.storage.local.get(['items', 'selectedFormat', 'notepadContent']);
    itemsState = data.items || [];
    selectedFormat = data.selectedFormat || 'markdown';
    formatSelect.value = selectedFormat;

    if (data.notepadContent !== undefined && data.notepadContent !== null) {
      notepad.value = data.notepadContent;
    } else {
      notepad.value = formatItems(itemsState, selectedFormat);
    }

    updateStats();
    updateBadge(itemsState.length);
  }

  /**
   * Guarda el contenido del bloc de notas con debounce
   */
  function saveNotepadContent(content) {
    syncIndicator.textContent = 'Guardando...';
    syncIndicator.classList.add('saving');

    if (saveDebounceTimeout) clearTimeout(saveDebounceTimeout);

    saveDebounceTimeout = setTimeout(async () => {
      await chrome.storage.local.set({ notepadContent: content });
      syncIndicator.textContent = 'Sincronizado ✓';
      syncIndicator.classList.remove('saving');
    }, 250);
  }

  // Evento: Cambiar formato
  formatSelect.addEventListener('change', async () => {
    selectedFormat = formatSelect.value;
    await chrome.storage.local.set({ selectedFormat });

    // Si existen ítems estructurados, re-formatear el contenido
    if (itemsState.length > 0) {
      const newContent = formatItems(itemsState, selectedFormat);
      notepad.value = newContent;
      await chrome.storage.local.set({ notepadContent: newContent });
      updateStats();
    }
  });

  // Evento: Edición manual del textarea
  notepad.addEventListener('input', () => {
    updateStats();
    saveNotepadContent(notepad.value);
  });

  // Evento: Botón "➕ Pestaña Actual"
  addCurrentBtn.addEventListener('click', () => {
    addCurrentBtn.disabled = true;
    chrome.runtime.sendMessage({ action: 'addCurrentTab' }, (response) => {
      addCurrentBtn.disabled = false;
      if (response && response.success) {
        loadState();
      }
    });
  });

  // Evento: Botón "📑 Todas las Pestañas"
  addAllBtn.addEventListener('click', () => {
    addAllBtn.disabled = true;
    chrome.runtime.sendMessage({ action: 'addAllTabs' }, (response) => {
      addAllBtn.disabled = false;
      if (response && response.success) {
        loadState();
      }
    });
  });

  // Evento: Botón "📋 Copiar Todo"
  copyBtn.addEventListener('click', async () => {
    const textToCopy = notepad.value;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      const originalText = copyBtnText.textContent;
      copyBtnText.textContent = '¡Copiado! ✓';
      copyBtn.style.backgroundColor = '#059669';

      setTimeout(() => {
        copyBtnText.textContent = originalText;
        copyBtn.style.backgroundColor = '';
      }, 1800);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  });

  // Evento: Botón "🗑️ Limpiar"
  clearBtn.addEventListener('click', () => {
    if (notepad.value.trim() === '') return;

    chrome.runtime.sendMessage({ action: 'clearAll' }, () => {
      itemsState = [];
      notepad.value = '';
      updateStats();
      updateBadge(0);
      syncIndicator.textContent = 'Limpio ✓';
      setTimeout(() => {
        syncIndicator.textContent = 'Sincronizado ✓';
      }, 1500);
    });
  });

  // Escuchar cambios en chrome.storage en tiempo real (p. ej. si se usa el atajo Alt+S)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.items || changes.notepadContent) {
        loadState();
      }
    }
  });

  // Carga inicial
  loadState();
});
