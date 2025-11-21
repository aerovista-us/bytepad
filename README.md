# BytePad 3.0

Multi-Shell Architecture Note-Taking Application with Fully Decoupled Core and Plugin-Based Extensibility.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- For npm workspaces: npm 7+

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   # or
   cd apps/web && npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### Creating Notes

1. Click the **"+ Note"** button to create a new note
2. The note will be automatically saved to IndexedDB in your browser

### Automatic Tagging

The TagGeneratorPlugin automatically detects and adds tags based on note content:
- **"todo"** tag: when content contains "todo" or "task"
- **"idea"** tag: when content contains "idea" or "concept"
- **"issue"** tag: when content contains "bug" or "issue"

### Viewing Notes

- All notes are displayed in a grid layout
- Each note card shows:
  - Title
  - Content
  - Tags (if any)

### Data Storage

- Notes are stored locally in your browser using IndexedDB
- Database name: `bytepad-web`
- Data persists across browser sessions

## 🏗️ Project Structure

```
bytepad/
├── packages/
│   ├── bytepad-core/        # Core engine
│   ├── bytepad-types/       # Type definitions
│   ├── bytepad-storage/     # Storage drivers (IndexedDB)
│   ├── bytepad-plugins/     # Plugin bundle
│   └── bytepad-utils/       # Utility functions
└── apps/
    └── web/                 # Next.js web application
```

## 🔌 Available APIs

### BytePadCore

```typescript
// Create a note
await core.createNote({ title: "My Note", content: "Note content" });

// Get all notes
const notes = core.getAllNotes();

// Get a specific note
const note = core.getNote(noteId);

// Update a note
await core.updateNote(noteId, { title: "Updated Title" });

// Delete a note
await core.deleteNote(noteId);

// Flush sync queue
await core.flushSync();
```

## 🛠️ Development

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

## 📦 Packages

- **bytepad-core**: Standalone engine that works in Node, React, Electron, etc.
- **bytepad-types**: Shared TypeScript type definitions
- **bytepad-storage**: Storage abstraction with IndexedDB driver
- **bytepad-plugins**: Official plugin bundle
- **bytepad-utils**: Helper utilities

## 🔮 Future Shells

- **Desktop**: Electron shell (coming soon)
- **NXCore Panel**: AeroCoreOS dock widget (coming soon)

## 📝 License

See repository for license information.

