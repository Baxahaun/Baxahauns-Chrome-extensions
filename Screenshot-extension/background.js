// ═══════════════════════════════════════════
// ATAJO DE TECLADO (Ctrl+Shift+S)
// ═══════════════════════════════════════════
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'take-screenshot') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    // Intentar inyectar content script por si no lo está
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (e) { /* ya inyectado, no pasa nada */ }
    // Pedir al content que haga la captura (oculta botón, etc.)
    try {
      chrome.tabs.sendMessage(tab.id, { action: 'shortcutCapture' });
    } catch (e) {
      // Si no responde el content, capturar directamente
      await captureAndSave(tab);
    }
  }
});
// ═══════════════════════════════════════════
// MENSAJES DESDE CONTENT SCRIPT
// ═══════════════════════════════════════════
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'takeScreenshot') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await captureAndSave(tab);
        sendResponse({ success: true });
      } catch (err) {
        console.error('Screenshot error:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // mantener canal abierto
  }
});
// ═══════════════════════════════════════════
// CAPTURA + NEUTRALIZACIÓN + CONVERSIÓN + DESCARGA
// ═══════════════════════════════════════════
async function captureAndSave(tab) {
  // 1. Neutralizar bloqueos anti-screenshot
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: neutralizeAntiScreenshot,
      world: 'MAIN'
    });
  } catch (e) {
    console.warn('No se pudo neutralizar (puede ser chrome:// page):', e);
  }
  // 2. Pausa para que el DOM se actualice
  await sleep(120);
  // 3. Captura a nivel de navegador
  const pngDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: 'png',
    quality: 100
  });
  // 4. Convertir a WebP máxima calidad
  const webpDataUrl = await convertToWebP(pngDataUrl);
  // 5. Nombre con timestamp
  const now = new Date();
  const ts = now.getFullYear().toString() +
    pad(now.getMonth() + 1) + pad(now.getDate()) + '_' +
    pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
  const filename = `screenshot_${ts}.webp`;
  // 6. Descargar
  await chrome.downloads.download({
    url: webpDataUrl,
    filename: filename,
    saveAs: false
  });
}
function pad(n) { return n.toString().padStart(2, '0'); }
// ═══════════════════════════════════════════
// NEUTRALIZACIÓN AGRESIVA ANTI-SCREENSHOT
// ═══════════════════════════════════════════
function neutralizeAntiScreenshot() {
  try {
    // --- A) Eliminar overlays de bloqueo ---
    const all = document.querySelectorAll('*');
    all.forEach(el => {
      if (el.id === '__screenshot-pro-host__') return; // no tocar nuestro botón
      const cs = getComputedStyle(el);
      const pos = cs.position;
      const z = parseInt(cs.zIndex) || 0;
      if ((pos === 'fixed' || pos === 'absolute') && z > 9000) {
        const bg = cs.backgroundColor;
        const op = parseFloat(cs.opacity);
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const coversScreen = w > window.innerWidth * 0.8 && h > window.innerHeight * 0.8;
        if (coversScreen && (
          bg === 'rgb(0, 0, 0)' ||
          bg.startsWith('rgba(0, 0, 0') ||
          bg === 'rgb(255, 255, 255)' ||
          op < 0.1
        )) {
          el.style.setProperty('display', 'none', 'important');
        }
      }
    });
    // --- B) Restaurar visibilidad global ---
    ['visibility', 'opacity', 'filter', 'backdrop-filter', '-webkit-filter',
     'clip-path', '-webkit-clip-path', 'mask', '-webkit-mask'].forEach(prop => {
      const reset = (prop === 'opacity') ? '1' : (prop === 'visibility') ? 'visible' : 'none';
      document.documentElement.style.setProperty(prop, reset, 'important');
      document.body.style.setProperty(prop, reset, 'important');
    });
    // --- C) Desactivar pointer-events y user-select bloqueados ---
    document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
    document.body.style.setProperty('pointer-events', 'auto', 'important');
    document.documentElement.style.setProperty('user-select', 'auto', 'important');
    document.body.style.setProperty('user-select', 'auto', 'important');
    // --- D) Interceptar visibilitychange, blur, focus usados para activar bloqueos ---
    ['visibilitychange', 'blur', 'focus', 'webkitvisibilitychange'].forEach(evt => {
      document.addEventListener(evt, e => e.stopImmediatePropagation(), true);
      window.addEventListener(evt, e => e.stopImmediatePropagation(), true);
    });
    // --- E) Neutralizar document.hidden y document.visibilityState ---
    try {
      Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
      Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
    } catch (e) {}
    // --- F) Neutralizar MutationObservers maliciosos que re-aplican bloqueos ---
    const _observe = MutationObserver.prototype.observe;
    MutationObserver.prototype.observe = function (target, config) {
      // Si observan body/html con atributos (típico de anti-screenshot), ignorar
      if (target === document.body || target === document.documentElement) {
        if (config && config.attributes) {
          return; // no observar
        }
      }
      return _observe.call(this, target, config);
    };
    // --- G) Inyectar estilos de neutralización ---
    const fixId = '__sp_neutralize__';
    if (!document.getElementById(fixId)) {
      const style = document.createElement('style');
      style.id = fixId;
      style.textContent = `
        html, body {
          visibility: visible !important;
          opacity: 1 !important;
          filter: none !important;
          backdrop-filter: none !important;
          -webkit-filter: none !important;
          clip-path: none !important;
          -webkit-clip-path: none !important;
          overflow: visible !important;
        }
        *::before, *::after {
          background-color: transparent !important;
          backdrop-filter: none !important;
          filter: none !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }
    // --- H) Desactivar bloqueo de clic derecho ---
    document.addEventListener('contextmenu', e => e.stopImmediatePropagation(), true);
    // --- I) Desactivar onbeforeprint/onafterprint usados para oscurecer al "imprimir" ---
    window.onbeforeprint = null;
    window.onafterprint = null;
  } catch (e) {
    console.warn('Screenshot Pro: neutralización parcial', e);
  }
}
// ═══════════════════════════════════════════
// CONVERSIÓN A WEBP MÁXIMA CALIDAD
// ═══════════════════════════════════════════
async function convertToWebP(pngDataUrl) {
  const response = await fetch(pngDataUrl);
  const blob = await response.blob();
  const bmp = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bmp.width, bmp.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0);
  const webpBlob = await canvas.convertToBlob({
    type: 'image/webp',
    quality: 1.0
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(webpBlob);
  });
}
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}