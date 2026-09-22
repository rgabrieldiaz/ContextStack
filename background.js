// Context Stack - Background Service Worker (Manifest V3)

/**
 * Convierte una URL estándar a la versión procesada por Jina AI.
 * Filtra esquemas no soportados (chrome://, about:, file://, etc.)
 */
function toJinaUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return null;
  if (url.startsWith('https://r.jina.ai/')) return url;
  return `https://r.jina.ai/${url}`;
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
  const data = await chrome.storage.local.get(['items', 'selectedFormat', 'notepadContent']);
  let items = data.items || [];
  const selectedFormat = data.selectedFormat || 'markdown';
  
  const newItems = [];
  const tabsToAdd = Array.isArray(tabs) ? tabs : [tabs];

  for (const tab of tabsToAdd) {
    if (!tab || !tab.url) continue;
    const jinaUrl = toJinaUrl(tab.url);
    if (!jinaUrl) continue;

    // Evitar duplicados exactos seguidos si fuera necesario, o agregar único
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

// 1. Atajo de Teclado (Command listener)
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

// 2. Escuchar mensajes del Popup
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
    } else if (request.action === 'updateBadge') {
      const data = await chrome.storage.local.get(['items']);
      const count = (data.items || []).length;
      await updateBadge(count);
      sendResponse({ success: true, count });
    }
  })();
  return true; // Asíncrono
});

// 3. Inicialización y sincronización de estado al cargar el worker
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['items', 'selectedFormat']);
  if (!data.selectedFormat) {
    await chrome.storage.local.set({ selectedFormat: 'markdown' });
  }
  const count = (data.items || []).length;
  await updateBadge(count);
});

chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get(['items']);
  const count = (data.items || []).length;
  await updateBadge(count);
});
