const toggle = document.getElementById('toggleBtn');
// Al abrir el popup, verificar si el botón ya está activo en esta pestaña
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  chrome.tabs.sendMessage(tab.id, { action: 'getState' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      toggle.checked = false;
    } else {
      toggle.checked = response.active;
    }
  });
});
toggle.addEventListener('change', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (toggle.checked) {
      // Inyectar content script y activar botón
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, () => {
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: 'activate' });
        }, 100);
      });
    } else {
      chrome.tabs.sendMessage(tab.id, { action: 'deactivate' });
    }
  });
});