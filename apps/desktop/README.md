# BytePad Studio - Electron Desktop Application

BytePad Studio is the full-featured desktop application for BytePad 3.0, built with Electron.

## Features

- Full board and note management
- File system storage (boards stored locally)
- Native menus and keyboard shortcuts
- Window state persistence
- Integration with BytePad Core engine

## Development

### Prerequisites

- Node.js 20+
- PNPM
- Local Windows SSD (not network drive)

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start Next.js dev server (Terminal 1):
```bash
pnpm dev
```

3. Start Electron app (Terminal 2):
```bash
pnpm --filter desktop start
```

### Development Workflow

- **Dev Mode**: Electron loads Next.js from `http://localhost:3000`
- **Hot Reload**: Works automatically (Electron watches Next.js dev server)
- **DevTools**: Opens automatically in dev mode

## Building

### Package for Development
```bash
pnpm --filter desktop package
```

### Create Installer
```bash
pnpm --filter desktop make
```

## Architecture

### Main Process (`src/main/`)
- `index.ts` - Application entry point
- `window.ts` - Window management
- `menu.ts` - Native menu creation
- `core/setup.ts` - BytePadCore initialization
- `ipc/handlers.ts` - IPC request handlers

### Preload Script (`src/preload/`)
- Security bridge between renderer and main process
- Exposes safe IPC methods to renderer
- No direct Node.js access from renderer

### Renderer (`src/renderer/`)
- Loads Next.js web app (dev server or static build)
- All UI logic handled by Next.js app

## Security

- Context isolation enabled
- Node integration disabled in renderer
- Sandbox enabled
- All file system operations through IPC
- Content Security Policy configured

## Storage

Boards are stored in Electron's user data directory:
- Windows: `%APPDATA%\bytepad-studio\boards\`
- macOS: `~/Library/Application Support/bytepad-studio/boards/`
- Linux: `~/.config/bytepad-studio/boards/`

