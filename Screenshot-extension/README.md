# 📸 Screenshot Pro

Screenshot Pro es una potente extensión para Chrome diseñada específicamente para tomar capturas de pantalla de alta calidad (WebP) y con la principal característica de **evadir de forma activa los bloqueos anti-capturas de pantalla** presentes en algunas páginas web (por ejemplo, sitios que oscurecen la pantalla o superponen elementos cuando intentas tomar una captura, o que bloquean el clic derecho).

## ✨ Características Principales

*   **Bypass de Seguridad Avanzado:** Utiliza técnicas para desarmar superposiciones invisibles, reseteos forzados de visibilidad, y manipula el `MutationObserver` y el `visibilityState` para evitar bloqueos agresivos.
*   **Capturas en Alta Calidad:** Utiliza conversión interna a formato WebP (`OffscreenCanvas`), reduciendo peso pero preservando calidad 100%.
*   **Botón Flotante en Shadow DOM:** Inyecta un botón flotante y funcional resistente a los estilos de la web en la que te encuentras (puedes moverlo libremente por la pantalla).
*   **Atajo de Teclado Rápido:** Toma capturas directamente usando `Ctrl+Shift+S` (o `Cmd+Shift+S` en Mac) incluso si el botón está desactivado.
*   **Descarga Automática Instantánea:** Automáticamente guarda la captura en la carpeta Descargas generándole un título único basado en la fecha y la hora exacta.

## ⚙️ Cómo Instalar (Modo Desarrollador)

1. Descarga o clona este directorio (`Screenshot-extension`) en tu ordenador.
2. Abre Google Chrome y ve a `chrome://extensions/`.
3. Activa el **Modo de desarrollador** (esquina superior derecha).
4. Haz clic en **"Cargar descomprimida"** y selecciona la carpeta de esta extensión.
5. ¡Listo! Ya debería aparecer el icono de Screenshot Pro en tu barra.

## 🛠️ Arquitectura y Tecnologías Útiles

*   **Manifest V3**.
*   **Service Worker (`background.js`):** Donde ocurre la captura en background, la API de neutralización y la conversión en Canvas.
*   **Content Script (`content.js`):** Maneja la UI y comportamiento en Shadow DOM del botón flotante.

## 📜 Licencia

Todo el código contenido en esta carpeta se distribuye bajo la [Licencia MIT](./LICENSE). Revisa el archivo LICENSE para conocer más detalles sobre el uso permitido.
