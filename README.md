# Context Stack ⚡

> Extensión de Google Chrome (**Manifest V3**) para capturar URLs de navegación, convertirlas automáticamente a Markdown limpio mediante **Jina AI** (`https://r.jina.ai/`) y acumular un bloc de notas editable para armar contexto rápido listo para LLMs (ChatGPT, Claude, Gemini, DeepSeek, etc.).

---

## ✨ Características Principales

- ** Proxy Jina AI Automático:** Convierte de forma transparente cualquier URL a su versión limpia en Markdown anteponiendo `https://r.jina.ai/`.
- **⌨️ Atajo de Teclado Ergonómico (`Alt+S`):** Captura la pestaña activa en segundo plano con una sola mano (`Alt+S` en Windows/Linux o `Command+Shift+S` en Mac) sin necesidad de abrir el popup.
- **🖱️ Menú Contextual (Click Derecho):**
  - Haz click derecho en **cualquier enlace** para agregarlo a la pila sin abrirlo.
  - Haz click derecho en **cualquier texto seleccionado** para añadirlo como cita/nota.
  - Haz click derecho en el fondo de **cualquier página** para capturarla.
- **🔔 Notificación Toast Sutil:** Feedback flotante en pantalla (*"⚡ Context Stack: Guardado"*) al usar el atajo de teclado o el menú contextual.
- **📥 Exportación & Accesos Rápidos a LLMs:**
  - **Descargar `.md`:** Exporta tu colección directamente como un archivo `.md` (ej. `context-stack-2026-09-22.md`).
  - **Abrir en LLM:** Copia automáticamente tu contexto y abre **ChatGPT**, **Claude**, **Gemini** o **DeepSeek** en una nueva pestaña.
- **📋 Inspector & Eliminación Individual:** Vista detallada de URLs capturadas con opción para borrar ítems individualmente (❌).
- **⚙️ Opciones de Jina AI & Deduplicación:**
  - Omitir URLs duplicadas automáticamente.
  - Omitir imágenes (`no-image=true`) para reducir drásticamente el consumo de tokens en tu LLM.
  - Generar resumen de enlaces al final de la conversión.
- **🌙 Diseño Oscuro Moderno:** Interfaz compacta (~380px x 520px) inspirada en Dark Mode con paleta Slate/Indigo y animaciones fluidas.

---

## 🚀 Instalación en Modo Desarrollador (Google Chrome)

1. **Clona este repositorio** o descarga el código fuente:
   ```bash
   git clone https://github.com/rgabrieldiaz/ContextStack.git
   ```
2. Abre Google Chrome y navega a:
   ```text
   chrome://extensions
   ```
3. Activa la casilla **"Modo de desarrollador"** en la esquina superior derecha.
4. Haz clic en el botón **"Cargar descomprimida"** (*Load unpacked*).
5. Selecciona la carpeta del repositorio local `ContextStack`.
6. ¡Listo! Te recomendamos **fijar la extensión** en la barra de herramientas de Chrome usando el ícono de rompecabezas 🧩.

---

## ⌨️ Atajos de Teclado

| Plataforma | Atajo por Defecto | Acción |
| :--- | :--- | :--- |
| **Windows / Linux** | `Alt + S` | Capturar pestaña activa en segundo plano |
| **macOS** | `Command + Shift + S` | Capturar pestaña activa en segundo plano |

> 💡 *Nota:* Puedes cambiar o personalizar este atajo en cualquier momento desde `chrome://extensions/shortcuts`.

---

## 📁 Estructura del Proyecto

```text
ContextStack/
├── manifest.json         # Configuración Manifest V3, permisos y contextMenus
├── background.js        # Service worker, listeners, menú contextual y toast
├── popup.html           # Interfaz HTML del popup con inspector y herramientas LLM
├── popup.css            # Estilos CSS oscuros y menú desplegable
├── popup.js             # Lógica interactiva, exportación .md y ajustes
├── icons/               # Logotipos e íconos en PNG (16px, 48px, 128px) y SVG
│   ├── icon.svg
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── scripts/
│   └── generate_icons.js # Script autónomo en Node.js para regenerar íconos PNG
├── .gitignore
└── README.md
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
