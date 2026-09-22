# Context Stack ⚡

> Extensión de Google Chrome (**Manifest V3**) para capturar URLs de navegación, convertirlas automáticamente a Markdown limpio mediante **Jina AI** (`https://r.jina.ai/`) y acumular un bloc de notas editable para armar contexto rápido listo para LLMs (ChatGPT, Claude, Gemini, DeepSeek, etc.).

---

## ✨ Características Principales

- ** Proxy Jina AI Automático:** Convierte de forma transparente cualquier URL a su versión limpia en Markdown anteponiendo `https://r.jina.ai/`.
- **⌨️ Atajo de Teclado Ergonómico (`Alt+S`):** Captura la pestaña activa en segundo plano con una sola mano (`Alt+S` en Windows/Linux o `Command+Shift+S` en Mac) sin necesidad de abrir el popup.
- **📑 Captura en Lote:** Botón para recopilar todas las pestañas abiertas en la ventana actual con un solo clic.
- **🎨 Selector de Formatos de Salida:**
  1. **Markdown Links:** `[Título de la página](https://r.jina.ai/https://ejemplo.com)`
  2. **Solo URLs:** `https://r.jina.ai/https://ejemplo.com`
  3. **Prompt LLM Listo:** Bloque con encabezado de instrucción (*"Analiza la siguiente documentación estructurada en Markdown:"*) listo para copiar y pegar.
- **📝 Bloc de Notas Editable Sincronizado:** Permite agregar o modificar notas manualmente en tiempo real. Se sincroniza bidireccionalmente con `chrome.storage.local` para no perder ediciones.
- **🔢 Badge Contador Dinámico:** Muestra el número de páginas capturadas en el ícono de la extensión en la barra de herramientas.
- **🌙 Diseño Oscuro Moderno:** Interfaz compacta (~380px x 500px) inspirada en Dark Mode con paleta Slate/Indigo y animaciones fluidas.

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
├── manifest.json         # Configuración Manifest V3 y permisos
├── background.js        # Service worker en segundo plano y escuchador de atajos
├── popup.html           # Estructura de la interfaz del popup flotante
├── popup.css            # Estilos CSS oscuros y diseño responsivo
├── popup.js             # Lógica del popup y sincronización en tiempo real
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

## 🛠️ Desarrollo y Tecnologías

- **Google Chrome Extensions API (Manifest V3)**
- **JavaScript (ES6+)**
- **HTML5 & CSS3 Pure Flexbox**
- **Jina AI Reader Proxy (`https://r.jina.ai/`)**

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo de código para más detalles.
