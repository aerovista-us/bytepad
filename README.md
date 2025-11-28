# BytePad 3.0

Multi-Surface Creative Board OS with Fully Decoupled Core and Plugin-Based Extensibility.

**Status:** Phase 4 (85% Complete) - Production-ready Web/PWA, Electron Desktop, and CLI

## 🚀 Quick Start

### Prerequisites

- **Node.js 20.x** (see `.nvmrc`)
- **Yarn 1.22.22+** (see `package.json`)
- **Local disk drive** (not network/mapped drive)

### Installation

1. **Verify environment:**
   ```bash
   yarn cli:doctor
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Start the development server:**
   ```bash
   yarn dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Electron Desktop

1. **Start Next.js dev server** (Terminal 1):
   ```bash
   yarn dev
   ```

2. **Start Electron app** (Terminal 2):
   ```bash
   yarn desktop:dev
   ```

See [ELECTRON_LAUNCH_INSTRUCTIONS.md](./ELECTRON_LAUNCH_INSTRUCTIONS.md) for details.

## 📖 Features

### Core Features

- ✅ **Boards & Notes**: Board-centric organization with rich notes
- ✅ **Multi-Surface**: Web/PWA, Electron Desktop, CLI, NXCore Panel
- ✅ **Storage Drivers**: IndexedDB, Filesystem, NXDrive (with automatic fallback)
- ✅ **Undo/Redo**: Full history management
- ✅ **Backup/Restore**: Automatic backups and manual restore
- ✅ **Plugin System**: Extensible architecture
- ✅ **Search & Filter**: Find notes quickly
- ✅ **PWA Support**: Install as app, offline support
- ✅ **Security**: XSS protection, validation, sanitization

### Surfaces

- **Web/PWA**: Browser-based with IndexedDB storage
- **Electron Desktop**: Native desktop app with filesystem storage
- **CLI Tool**: Export, import, sync operations
- **NXCore Panel**: Embedded panel (NXDrive storage when available)

### Debug Tools

- **Debug Overlay**: Press `Ctrl+Alt+D` to toggle (dev mode)
- **Bridge Diagnostics**: `/debug/bridge` - IPC health monitoring
- **Storage Diagnostics**: `/debug/storage` - Driver status and health

## 🏗️ Project Structure

```
bytepad/
├── packages/
│   ├── bytepad-core/        # Core engine
│   ├── bytepad-types/       # Type definitions
│   ├── bytepad-storage/     # Storage drivers + manager
│   ├── bytepad-plugins/     # Plugin bundle
│   └── bytepad-utils/       # Utility functions
└── apps/
    ├── web/                 # Next.js web application
    ├── desktop/             # Electron desktop app
    └── cli/                 # CLI tool
```

## 📚 Documentation

- [**Architecture**](./docs/ARCHITECTURE.md) - System architecture and design
- [**API Reference**](./docs/API.md) - Core API documentation
- [**Plugin Guide**](./docs/PLUGIN_GUIDE.md) - Creating plugins
- [**Deployment**](./docs/DEPLOYMENT.md) - Deployment guides
- [**Environment Safety**](./docs/ENVIRONMENT_SAFETY.md) - Environment requirements
- [**Clean Install**](./docs/CLEAN_INSTALL.md) - Clean installation process
- [**NXDrive Status**](./docs/NXDRIVE_STATUS.md) - NXDrive driver status

## 🛠️ Development

### Building

```bash
# Web app
cd apps/web && yarn build

# Electron app
cd apps/desktop && yarn package

# CLI tool
yarn cli:build
```

### Testing

**Framework:** Vitest (unit + integration tests), Playwright (E2E tests)

```bash
# Run all tests
yarn test

# Run with UI
yarn test:ui

# Coverage report
yarn test:coverage
```

**Test Structure:**
- **Unit Tests:** Core engine, storage drivers (`packages/*/src/__tests__/`)
- **Integration Tests:** Storage driver fallback, driver manager behavior
- **E2E Tests:** Playwright for web app (`apps/web/tests/`)
- **Coverage Target:** >80% for core and storage packages

### Environment Checks

```bash
# Run doctor to check environment
yarn cli:doctor

# Specific checks
yarn cli:doctor env
yarn cli:doctor storage
yarn cli:doctor electron
```

## 📦 Packages

- **bytepad-core**: Standalone engine (Node, React, Electron compatible)
- **bytepad-types**: Shared TypeScript type definitions
- **bytepad-storage**: Storage abstraction with multiple drivers + manager
- **bytepad-plugins**: Official plugin bundle
- **bytepad-utils**: Helper utilities

## 🔧 CLI Commands

```bash
# Export boards
yarn cli:export output.json

# Import boards
yarn cli:import input.json

# Flush sync queue
yarn cli:flush-sync

# Environment health check
yarn cli:doctor
```

## ⚠️ Important Notes

- **Repository must be on local disk** (not network/mapped drive)
- **Node.js 20.x required** (see `.nvmrc`)
- **Yarn 1.22.22+ required** (see `package.json`)
- Run `yarn cli:doctor` after cloning to verify environment

## 📝 License

See repository for license information.

