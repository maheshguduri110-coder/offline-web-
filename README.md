# OfflineWeb AI — Fully Offline Website & Local Workspace

OfflineWeb AI is an offline-first, client-side web application and local productivity workspace. It allows developers, students, and users with unreliable internet access to create notes, organize and search local documents, use essential dev utilities, and interact with local open-weight AI models via Ollama — all without needing external servers, remote CDNs, or cloud dependencies.

---

## ⚡ Core Highlights & Offline Architecture

1. **Zero External Runtime Dependencies**:
   - No external CDNs, Google Fonts, remote CSS, or cloud databases.
   - All styling, fonts, and icons are bundled directly into the client package or use system fonts.
2. **Service Worker Pre-caching**:
   - Implements a cache-first strategy for versioned static assets (`.js`, `.css`, SVG icons).
   - Network-first with cache fallback for page navigation.
   - Dedicated `offline-fallback.html` page for any uncached external routes.
3. **IndexedDB Local Storage**:
   - Sandboxed local persistence for notes, imported documents, cheatsheets, and settings.
   - Data persists when the browser is closed, restarted, or the computer is rebooted.
4. **Local AI Integration (Ollama)**:
   - Connects strictly to `http://127.0.0.1:11434`.
   - Never silently routes queries to cloud AI (OpenAI, Google, Anthropic).
   - If Ollama is offline or not installed, the application continues to function normally with clear diagnostic status.

---

## 📂 Project Structure

```
offlineweb-ai/
├── public/
│   ├── icons/
│   │   ├── icon-192.svg           # Local 192px PWA icon
│   │   └── icon-512.svg           # Local 512px PWA icon
│   ├── manifest.webmanifest       # Web App Manifest for PWA installation
│   ├── offline-fallback.html      # Self-contained offline navigation fallback
│   └── service-worker.js          # Core Service Worker caching engine
├── src/
│   ├── components/
│   │   └── OfflineFallbackView.jsx# React fallback view for uncached components
│   ├── database/
│   │   └── db.js                  # Standard IndexedDB wrapper (notes, docs, settings)
│   ├── pages/
│   │   ├── DocumentLibraryPage.jsx# Drag-and-drop file import & full-text search
│   │   ├── HomeDashboard.jsx      # Readiness indicators, storage meters, recent feeds
│   │   ├── LocalAiPage.jsx        # Local Ollama streaming chat interface
│   │   ├── NotesPage.jsx          # Auto-saving markdown notes & tags
│   │   ├── OfflineToolsPage.jsx   # 5 client dev tools (Diff, JSON, Word Count, etc.)
│   │   ├── SavedKnowledgePage.jsx # Bookmarks & Cheatsheets with category filters
│   │   └── SettingsPage.jsx       # Export/Import backups, cache reset, theme switch
│   ├── services/
│   │   ├── ollama.js              # Localhost Ollama HTTP client (localhost:11434)
│   │   └── useOnlineStatus.js     # React hook for navigator.onLine & SW health
│   ├── styles/
│   │   └── theme.css              # Dark navy & cyan glassmorphism design system
│   ├── utils/
│   │   └── helpers.js             # Safe markdown parser, diffing, excerpt highlight
│   ├── App.jsx                    # Top-level shell and responsive navigation
│   └── main.jsx                   # Entry point and Service Worker registration
├── tests/
│   └── verify-offline.js          # Automated 26-point verification test suite
├── index.html                     # Clean entry HTML (zero CDNs/remote fonts)
├── package.json                   # Dependencies and scripts
├── server.js                      # Standalone zero-dependency production server
├── vite.config.js                 # Vite build config with automatic asset injection
└── README.md
```

---

## 🚀 Quick Setup & Installation (Windows Instructions)

### Prerequisites
- Node.js (v18 or newer recommended, tested on Node v24).
- Any modern web browser (Edge, Chrome, Firefox, Brave).

### 1. Install Dependencies
Open PowerShell or Command Prompt in the `offlineweb-ai` directory:
```powershell
cmd.exe /c "npm install"
```
*(Or simply `npm install`)*

### 2. Build the Production Version
Compile the production bundle and inject hashed assets into the service worker:
```powershell
cmd.exe /c "npm run build"
```

### 3. Run the Automated Verification Test Suite
Run the 26-point automated offline validation test:
```powershell
cmd.exe /c "npm run test:offline"
```
You will see all 26 checks pass.

### 4. Serve the Production Build Locally
Run the standalone local production server:
```powershell
cmd.exe /c "npm run serve"
```
Output:
```
======================================================
  ⚡ OfflineWeb AI — Production Server Running!
  🔗 Local URL: http://127.0.0.1:4173
  📦 Serving from: ...\offlineweb-ai\dist
  🛡️ Offline Mode: Service Worker & IndexedDB Enabled
======================================================
```

Open `http://127.0.0.1:4173` in your browser.

---

## 🔌 Offline Reproduction & Acceptance Test

To test offline functionality:

1. **First-time install**:
   - Open `http://127.0.0.1:4173` in your browser.
   - On the top right, verify the pill says `ONLINE (READY)`.
   - On the dashboard, verify the card displays `OFFLINE READY` and `Assets & Fallback routes cached`.
2. **Sever Internet Connection**:
   - Disconnect Wi-Fi or unplug your Ethernet cable (or in DevTools > Network tab, toggle **Throttling** to **Offline**).
   - Notice the status badge dynamically switches to `OFFLINE (SELF-RELIANT)`.
3. **Hard Reload while Offline**:
   - Press `Ctrl + F5` or `Ctrl + Shift + R` to reload the page with Wi-Fi disabled.
   - The application instantly reloads from the Service Worker cache!
4. **Test Notes Vault**:
   - Click **Notes Vault** in the sidebar.
   - Click **+ New Note**. Type title `"Emergency Offline Field Note"` and content `"Created with zero internet connection."`.
   - The note saves instantly to local **IndexedDB**.
5. **Close and Reopen Browser**:
   - Close the browser tab or entire browser window.
   - Reopen the browser and navigate back to `http://127.0.0.1:4173`.
   - Your note `"Emergency Offline Field Note"` is still there.
6. **Test Offline Developer Tools**:
   - Open **Offline Tools**.
   - Use the **Word Counter**, test the **Text Comparison Diff**, or format and validate JSON in the **JSON Formatter**. All tools execute 100% locally.
7. **Test Document Library**:
   - Open **Doc Library**. Drag and drop any `.txt` or `.md` file. It parses and indexes into IndexedDB and is searchable offline.

---

## 🤖 Optional Local AI (Ollama) Setup

OfflineWeb AI includes an optional Local AI assistant that talks **only** to Ollama running on your machine (`localhost:11434`).

1. Install Ollama from [ollama.com](https://ollama.com).
2. Download any lightweight model on your computer:
   ```bash
   ollama run llama3.2
   ```
   *(Or `ollama run qwen2.5:0.5b`, `ollama run deepseek-r1:1.5b`, `ollama run phi3`)*
3. In **OfflineWeb AI**, navigate to **Local AI Assistant**.
4. The local model will be automatically detected in the dropdown. You can prompt it with questions completely offline.
5. If Ollama is stopped, OfflineWeb AI displays a clear diagnostic warning and **never** tries to route your data to a remote cloud server. The rest of the app continues working.

---

## 🛠️ Offline Features Checklist

- [x] **Home Dashboard**: Live connection indicator, offline readiness badge, IndexedDB storage meter, and recent items feed.
- [x] **Notes Vault**: Auto-saving notes, tags, search filter, Markdown preview, and JSON/TXT import and export.
- [x] **Document Library**: Drag-and-drop file import (`.md`, `.txt`, `.json`, `.csv`, code files), IndexedDB storage, full-text search with excerpts, and error handling for unsupported formats.
- [x] **Saved Knowledge**: Categorized snippets, tags, search, and one-click clipboard copy.
- [x] **Offline Tools**: Word/character counter with reading speed, text diff engine, JSON formatter & validator, Unix timestamp converter, and expression calculator.
- [x] **Local AI Assistant**: Safe localhost Ollama streaming client with zero cloud fallback.
- [x] **Settings & Diagnostics**: Full JSON database backup and restore, clear cache utility, service worker health checks, and theme switcher (Dark/Light).
- [x] **Offline Fallback Route**: Graceful fallback view for uncached navigation requests.

---

## 🔍 Troubleshooting Service Worker & IndexedDB

- **PWA Installation**: Click the install icon in the browser address bar to install OfflineWeb AI as a standalone desktop app.
- **Service Worker Debugging**: In Chrome/Edge, press `F12` -> **Application** tab -> **Service Workers**. You can verify that `service-worker.js` is active and running.
- **Cache Storage Inspection**: Under **Application** -> **Cache Storage** -> `offlineweb-core-v1.0.0`, you can inspect all pre-cached HTML, CSS, JS, and SVG assets.
- **IndexedDB Inspection**: Under **Application** -> **IndexedDB** -> `OfflineWebAI_DB`, view all locally stored notes, documents, and settings.
- **Resetting State**: If you wish to reset all caches and start fresh, go to **Settings & Cache** in the application and click **Reset Service Worker & Caches**.
