# Baxahaun's Chrome Extensions

Este repositorio sirve como catálogo central para todas las extensiones de Google Chrome desarrolladas por Baxahaun.

La finalidad de este espacio es mantener un índice claro, donde cada extensión viva en su propio directorio de forma independiente. Esto permite que cada proyecto tenga su propia documentación (README), su propio código fuente aislado y, muy importante, su propia licencia.

## 📋 Índice de Extensiones

A continuación se listan las extensiones disponibles en este repositorio. Haz clic en el nombre de la extensión para acceder a su código fuente y a su documentación detallada.

| Nombre de la Extensión | Descripción Breve |
| :--- | :--- |
| **[Screenshot-extension](./Screenshot-extension)** | Extensión avanzada para tomar capturas de pantalla de alta calidad (WebP) capaz de evadir mecanismos y scripts anti-screenshot comunes en ciertas páginas web. |

---

## 🏗️ Estructura del Repositorio

Para mantener el orden, el repositorio sigue unas reglas de estructura muy estrictas:

* Cada extensión DEBE estar dentro de su propia carpeta en la raíz del repositorio.
* Cada carpeta de extensión DEBE contener:
  * El código fuente de la extensión (ej. `manifest.json`, scripts, iconos).
  * Un archivo `README.md` que explique qué hace la extensión, cómo instalarla y cómo usarla.
  * Un archivo `LICENSE` con los términos bajo los cuales se distribuye esa extensión en particular.

```text
/ (Raíz del Repositorio)
├── README.md (Este archivo)
├── Nombre_De_La_Extension_1/
│   ├── manifest.json
│   ├── README.md
│   ├── LICENSE
│   └── ... (código fuente)
└── Nombre_De_La_Extension_2/
    ├── manifest.json
    ├── README.md
    ├── LICENSE
    └── ... (código fuente)
```

## 📜 Licencias

Cada extensión dentro de este repositorio tiene su propia licencia independiente. Siempre debes revisar el archivo `LICENSE` dentro de la carpeta específica de la extensión que quieras utilizar o modificar.
