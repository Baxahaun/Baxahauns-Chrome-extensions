(() => {
  // Evitar múltiples inyecciones
  if (window.__screenshotProInjected) {
    return;
  }
  window.__screenshotProInjected = true;
  let isActive = false;
  let hostEl = null;
  // ═══════════════════════════════════════════
  // CREAR BOTÓN FLOTANTE DENTRO DE SHADOW DOM
  // (aislado de los estilos de la página)
  // ═══════════════════════════════════════════
  function createFloatingButton() {
    if (hostEl) return;
    hostEl = document.createElement('div');
    hostEl.id = '__screenshot-pro-host__';
    // Posicionamiento del host: siempre encima de todo
    hostEl.style.cssText = `
      position: fixed !important;
      z-index: 2147483647 !important;
      top: 20px !important;
      right: 20px !important;
      width: auto !important;
      height: auto !important;
      pointer-events: auto !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      filter: none !important;
    `;
    const shadow = hostEl.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
      <style>
        :host {
          all: initial !important;
        }
        .sp-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #2563eb, #1e40af);
          color: white;
          font-size: 22px;
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.1);
          transition: transform 0.15s, box-shadow 0.15s, background 0.2s;
          user-select: none;
          -webkit-user-select: none;
          line-height: 1;
        }
        .sp-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 28px rgba(37,99,235,0.5), 0 0 0 2px rgba(255,255,255,0.2);
        }
        .sp-btn:active {
          cursor: grabbing;
        }
        .sp-btn.capturing {
          background: linear-gradient(135deg, #16a34a, #15803d);
          transform: scale(0.92);
        }
        .sp-btn.error {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
        }
        .sp-tooltip {
          position: absolute;
          bottom: -32px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.85);
          color: #fff;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        .sp-wrap:hover .sp-tooltip {
          opacity: 1;
        }
        .sp-wrap {
          position: relative;
          display: inline-block;
        }
      </style>
      <div class="sp-wrap">
        <button class="sp-btn" id="spBtn" title="Screenshot">📸</button>
        <div class="sp-tooltip">Capturar (Ctrl+Shift+S)</div>
      </div>
    `;
    const btn = shadow.getElementById('spBtn');
    // --- DRAG (arrastrar el botón por la pantalla) ---
    let isDragging = false;
    let wasDragged = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    btn.addEventListener('mousedown', (e) => {
      isDragging = true;
      wasDragged = false;
      const rect = hostEl.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      btn.style.cursor = 'grabbing';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      wasDragged = true;
      const x = e.clientX - dragOffsetX;
      const y = e.clientY - dragOffsetY;
      hostEl.style.left = x + 'px';
      hostEl.style.top = y + 'px';
      hostEl.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        btn.style.cursor = 'grab';
      }
    });
    // --- CLICK → capturar ---
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (wasDragged) {
        wasDragged = false;
        return; // si fue drag, no disparar screenshot
      }
      triggerCapture(btn);
    });
    document.body.appendChild(hostEl);
    // Asegurar que el botón se re-inserta si algo lo elimina
    const observer = new MutationObserver(() => {
      if (!document.body.contains(hostEl)) {
        document.body.appendChild(hostEl);
      }
    });
    observer.observe(document.body, { childList: true });
  }
  function removeFloatingButton() {
    if (hostEl && hostEl.parentNode) {
      hostEl.parentNode.removeChild(hostEl);
    }
    hostEl = null;
  }
  // ═══════════════════════════════════════════
  // TRIGGER: pedir al background que capture
  // ═══════════════════════════════════════════
  function triggerCapture(btnElement) {
    // Ocultar el botón temporalmente para que no aparezca en la captura
    if (hostEl) hostEl.style.display = 'none';
    // Feedback visual
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'takeScreenshot' }, (response) => {
        // Restaurar botón
        if (hostEl) hostEl.style.display = 'block';
        if (btnElement) {
          if (response && response.success) {
            btnElement.classList.add('capturing');
            setTimeout(() => btnElement.classList.remove('capturing'), 600);
          } else {
            btnElement.classList.add('error');
            setTimeout(() => btnElement.classList.remove('error'), 600);
          }
        }
      });
    }, 80); // pequeña pausa para que el display:none se aplique antes de la captura
  }
  // ═══════════════════════════════════════════
  // ESCUCHAR MENSAJES del popup y background
  // ═══════════════════════════════════════════
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'activate') {
      isActive = true;
      createFloatingButton();
      sendResponse({ active: true });
    } else if (message.action === 'deactivate') {
      isActive = false;
      removeFloatingButton();
      sendResponse({ active: false });
    } else if (message.action === 'getState') {
      sendResponse({ active: isActive });
    } else if (message.action === 'shortcutCapture') {
      // Captura por atajo de teclado (funciona aunque el botón no esté visible)
      triggerCapture(null);
      sendResponse({ ok: true });
    }
    return true;
  });
})();