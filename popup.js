// Context Stack - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM Principales
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

  // Vistas y Navegación
  const notepadView = document.getElementById('notepadView');
  const itemsView = document.getElementById('itemsView');
  const settingsView = document.getElementById('settingsView');

  const toggleItemsBtn = document.getElementById('toggleItemsBtn');
  const closeItemsViewBtn = document.getElementById('closeItemsViewBtn');
  const itemsList = document.getElementById('itemsList');

  const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
  const closeSettingsViewBtn = document.getElementById('closeSettingsViewBtn');
  const deduplicateCheck = document.getElementById('deduplicateCheck');
  const jinaNoImagesCheck = document.getElementById('jinaNoImagesCheck');
  const jinaLinksSummaryCheck = document.getElementById('jinaLinksSummaryCheck');

  // Herramientas & LLM
  const downloadMdBtn = document.getElementById('downloadMdBtn');
  const openLlmBtn = document.getElementById('openLlmBtn');
  const llmMenu = document.getElementById('llmMenu');

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

  function updateStats() {
    const text = notepad.value;
    const charCount = text.length;
    const lineCount = text ? text.split('\n').length : 0;
    statsText.textContent = `${charCount} caracteres | ${lineCount} líneas`;
  }

  function updateBadge(count) {
    itemCountBadge.textContent = `${count} URL${count === 1 ? '' : 's'}`;
  }

  /**
   * Renderiza la lista de ítems individuales para su inspección y eliminación
   */
  function renderItemsList() {
    itemsList.innerHTML = '';
    if (itemsState.length === 0) {
      itemsList.innerHTML = '<div style="color: var(--text-muted); font-size: 11px; text-align: center; padding: 20px;">No hay URLs guardadas aún.</div>';
      return;
    }

    itemsState.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';

      const info = document.createElement('div');
      info.className = 'item-info';

      const title = document.createElement('div');
      title.className = 'item-title';
      title.textContent = item.title || 'Sin Título';

      const url = document.createElement('div');
      url.className = 'item-url';
      url.textContent = item.originalUrl;

      info.appendChild(title);
      info.appendChild(url);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'item-delete-btn';
      deleteBtn.title = 'Eliminar ítem';
      deleteBtn.innerHTML = '❌';
      deleteBtn.addEventListener('click', () => {
        removeItem(item.id);
      });

      card.appendChild(info);
      card.appendChild(deleteBtn);
      itemsList.appendChild(card);
    });
  }

  /**
   * Elimina un ítem específico por ID
   */
  function removeItem(id) {
    chrome.runtime.sendMessage({ action: 'removeItem', id }, (response) => {
      if (response && response.success) {
        loadState();
      }
    });
  }

  /**
   * Carga inicial del estado desde chrome.storage.local
   */
  async function loadState() {
    const data = await chrome.storage.local.get(['items', 'selectedFormat', 'notepadContent', 'deduplicate', 'jinaOptions']);
    itemsState = data.items || [];
    selectedFormat = data.selectedFormat || 'markdown';
    formatSelect.value = selectedFormat;

    if (data.notepadContent !== undefined && data.notepadContent !== null) {
      notepad.value = data.notepadContent;
    } else {
      notepad.value = formatItems(itemsState, selectedFormat);
    }

    // Opciones
    deduplicateCheck.checked = data.deduplicate !== false;
    const jinaOpts = data.jinaOptions || {};
    jinaNoImagesCheck.checked = !!jinaOpts.noImages;
    jinaLinksSummaryCheck.checked = !!jinaOpts.withLinksSummary;

    updateStats();
    updateBadge(itemsState.length);
    renderItemsList();
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

  // --- EVENTOS PRINCIPALES ---

  formatSelect.addEventListener('change', async () => {
    selectedFormat = formatSelect.value;
    await chrome.storage.local.set({ selectedFormat });

    if (itemsState.length > 0) {
      const newContent = formatItems(itemsState, selectedFormat);
      notepad.value = newContent;
      await chrome.storage.local.set({ notepadContent: newContent });
      updateStats();
    }
  });

  notepad.addEventListener('input', () => {
    updateStats();
    saveNotepadContent(notepad.value);
  });

  addCurrentBtn.addEventListener('click', () => {
    addCurrentBtn.disabled = true;
    chrome.runtime.sendMessage({ action: 'addCurrentTab' }, (response) => {
      addCurrentBtn.disabled = false;
      if (response && response.success) {
        loadState();
      }
    });
  });

  addAllBtn.addEventListener('click', () => {
    addAllBtn.disabled = true;
    chrome.runtime.sendMessage({ action: 'addAllTabs' }, (response) => {
      addAllBtn.disabled = false;
      if (response && response.success) {
        loadState();
      }
    });
  });

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

  clearBtn.addEventListener('click', () => {
    if (notepad.value.trim() === '') return;

    chrome.runtime.sendMessage({ action: 'clearAll' }, () => {
      itemsState = [];
      notepad.value = '';
      updateStats();
      updateBadge(0);
      renderItemsList();
      syncIndicator.textContent = 'Limpio ✓';
      setTimeout(() => {
        syncIndicator.textContent = 'Sincronizado ✓';
      }, 1500);
    });
  });

  // --- PASO 2: EXPORTACIÓN A .MD Y HERRAMIENTAS LLM ---

  downloadMdBtn.addEventListener('click', () => {
    const content = notepad.value;
    if (!content) return;

    const today = new Date().toISOString().slice(0, 10);
    const filename = `context-stack-${today}.md`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  openLlmBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    llmMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    llmMenu.classList.add('hidden');
  });

  document.querySelectorAll('.llm-menu-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      const targetUrl = e.currentTarget.getAttribute('data-url');
      if (!targetUrl) return;

      if (notepad.value) {
        await navigator.clipboard.writeText(notepad.value);
      }

      chrome.tabs.create({ url: targetUrl });
    });
  });

  // --- PASO 3 & 4: NAVEGACIÓN Y AJUSTES DE JINA AI ---

  toggleItemsBtn.addEventListener('click', () => {
    renderItemsList();
    notepadView.classList.add('hidden');
    settingsView.classList.add('hidden');
    itemsView.classList.remove('hidden');
  });

  closeItemsViewBtn.addEventListener('click', () => {
    itemsView.classList.add('hidden');
    notepadView.classList.remove('hidden');
  });

  toggleSettingsBtn.addEventListener('click', () => {
    notepadView.classList.add('hidden');
    itemsView.classList.add('hidden');
    settingsView.classList.remove('hidden');
  });

  closeSettingsViewBtn.addEventListener('click', async () => {
    const deduplicate = deduplicateCheck.checked;
    const jinaOptions = {
      noImages: jinaNoImagesCheck.checked,
      withLinksSummary: jinaLinksSummaryCheck.checked
    };

    await chrome.storage.local.set({ deduplicate, jinaOptions });

    settingsView.classList.add('hidden');
    notepadView.classList.remove('hidden');
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.items || changes.notepadContent) {
        loadState();
      }
    }
  });

  // Carga Inicial
  loadState();
});
