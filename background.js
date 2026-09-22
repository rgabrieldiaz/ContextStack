// Context Stack - Background Service Worker (Manifest V3)

/**
 * Convierte una URL estándar a la versión procesada por Jina AI.
 * Filtra esquemas no soportados (chrome://, about:, file://, etc.)
 */
function toJinaUrl(url, jinaOptions = {}) {
  if (!url || typeof url !== 'string') return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return null;
  if (url.startsWith('https://r.jina.ai/')) return url;
  
  let prefix = 'https://r.jina.ai/';
  const params = [];
  if (jinaOptions.noImages) params.push('no-image=true');
  if (jinaOptions.withLinksSummary) params.push('with-links-summary=true');

  if (params.length > 0) {
    prefix = `https://r.jina.ai/?${params.join('&')}/`;
  }

  return `${prefix}${url}`;
}

/**
 * Genera el texto formateado según la opción seleccionada.
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
 * Actualiza el badge de la extensión en la barra de herramientas de Chrome.
 */
async function updateBadge(count) {
  try {
    const text = count > 0 ? count.toString() : '';
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color: '#6366F1' });
    await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  } catch (e) {
    console.error('Error actualizando badge:', e);
  }
}

/**
 * Agrega una o varias pestañas al almacenamiento local.
 */
async function addTabs(tabs) {
  const data = await chrome.storage.local.get(['items', 'selectedFormat', 'notepadContent', 'jinaOptions', 'deduplicate']);
  let items = data.items || [];
  const selectedFormat = data.selectedFormat || 'markdown';
  const jinaOptions = data.jinaOptions || {};
  const deduplicate = data.deduplicate !== false; // Por defecto true
  
  const newItems = [];
  const tabsToAdd = Array.isArray(tabs) ? tabs : [tabs];

  for (const tab of tabsToAdd) {
    if (!tab || !tab.url) continue;
    const jinaUrl = toJinaUrl(tab.url, jinaOptions);
    if (!jinaUrl) continue;

    // Deduplicación por URL original si está activada
    if (deduplicate && items.some(item => item.originalUrl === tab.url)) {
      continue;
    }

    newItems.push({
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title: tab.title || 'Página Web',
      originalUrl: tab.url,
      jinaUrl: jinaUrl,
      addedAt: Date.now()
    });
  }

  if (newItems.length === 0) return items;

  items = [...items, ...newItems];
  const newFormattedContent = formatItems(items, selectedFormat);

  await chrome.storage.local.set({
    items: items,
    notepadContent: newFormattedContent
  });

  await updateBadge(items.length);
  return items;
}

/**
 * Agrega texto seleccionado como nota al bloc de notas.
 */
async function addSelectionAsNote(text, tab) {
  if (!text || !text.trim()) return;
  const data = await chrome.storage.local.get(['notepadContent']);
  let currentContent = data.notepadContent || '';

  const header = tab ? `\n> 📝 **Nota de [${tab.title || 'Página'}](${tab.url}):**\n` : '\n> 📝 **Nota:**\n';
  const snippet = text.split('\n').map(line => `> ${line}`).join('\n');
  const noteBlock = `${header}${snippet}\n`;

  currentContent = currentContent ? `${currentContent}\n${noteBlock}` : noteBlock;
  await chrome.storage.local.set({ notepadContent: currentContent });
}

// 1. Configuración de Menú Contextual (Click Derecho)
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'add-page-to-stack',
      title: '➕ Agregar esta página a Context Stack',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'add-link-to-stack',
      title: '➕ Agregar este enlace a Context Stack',
      contexts: ['link']
    });
    chrome.contextMenus.create({
      id: 'add-selection-to-stack',
      title: '➕ Agregar texto seleccionado a Context Stack',
      contexts: ['selection']
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === 'add-page-to-stack' && tab) {
      await addTabs(tab);
    } else if (info.menuItemId === 'add-link-to-stack' && info.linkUrl) {
      const linkTab = {
        url: info.linkUrl,
        title: info.linkText || info.linkUrl
      };
      await addTabs(linkTab);
    } else if (info.menuItemId === 'add-selection-to-stack' && info.selectionText) {
      await addSelectionAsNote(info.selectionText, tab);
    }
  } catch (err) {
    console.error('Error en menú contextual:', err);
  }
});

// 2. Atajo de Teclado (Command listener)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'add-current-tab') {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        await addTabs(activeTab);
      }
    } catch (err) {
      console.error('Error al capturar pestaña con atajo:', err);
    }
  }
});

// 3. Escuchar mensajes del Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (request.action === 'addCurrentTab') {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        const updatedItems = await addTabs(activeTab);
        sendResponse({ success: true, count: updatedItems.length });
      } else {
        sendResponse({ success: false, error: 'No se encontró pestaña activa' });
      }
    } else if (request.action === 'addAllTabs') {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const updatedItems = await addTabs(tabs);
      sendResponse({ success: true, count: updatedItems.length });
    } else if (request.action === 'clearAll') {
      await chrome.storage.local.set({ items: [], notepadContent: '' });
      await updateBadge(0);
      sendResponse({ success: true });
    } else if (request.action === 'removeItem') {
      const data = await chrome.storage.local.get(['items', 'selectedFormat']);
      let items = data.items || [];
      items = items.filter(item => item.id !== request.id);
      const selectedFormat = data.selectedFormat || 'markdown';
      const newContent = formatItems(items, selectedFormat);
      await chrome.storage.local.set({ items, notepadContent: newContent });
      await updateBadge(items.length);
      sendResponse({ success: true, count: items.length });
    } else if (request.action === 'updateBadge') {
      const data = await chrome.storage.local.get(['items']);
      const count = (data.items || []).length;
      await updateBadge(count);
      sendResponse({ success: true, count });
    }
  })();
  return true; // Asíncrono
});

// 4. Inicialización y sincronización de estado al cargar el worker
chrome.runtime.onInstalled.addListener(async () => {
  setupContextMenus();
  const data = await chrome.storage.local.get(['items', 'selectedFormat', 'deduplicate', 'jinaOptions']);
  if (!data.selectedFormat) {
    await chrome.storage.local.set({ selectedFormat: 'markdown' });
  }
  if (data.deduplicate === undefined) {
    await chrome.storage.local.set({ deduplicate: true });
  }
  if (!data.jinaOptions) {
    await chrome.storage.local.set({ jinaOptions: { noImages: false, withLinksSummary: false } });
  }
  const count = (data.items || []).length;
  await updateBadge(count);
});

chrome.runtime.onStartup.addListener(async () => {
  setupContextMenus();
  const data = await chrome.storage.local.get(['items']);
  const count = (data.items || []).length;
  await updateBadge(count);
});
