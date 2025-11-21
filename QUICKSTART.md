# 🚀 BytePad 3.0 - Quick Start Guide

## Installation & Launch

### Step 1: Install Dependencies

```bash
npm install
```

This will install all dependencies for the monorepo including:
- Next.js and React for the web app
- All BytePad packages (core, types, storage, plugins, utils)
- Required dependencies (uuid, idb, eventemitter3, etc.)

### Step 2: Start Development Server

```bash
npm run dev
```

Or navigate to the web app directory:

```bash
cd apps/web
npm run dev
```

### Step 3: Open in Browser

The app will be available at: **http://localhost:3000**

## 📝 How to Use

### Creating Notes

1. **Click the "+ Note" button** - Creates a new note with title "New Note"
2. Notes are **automatically saved** to IndexedDB in your browser
3. Data **persists** across browser sessions

### Automatic Tagging

The TagGeneratorPlugin automatically adds tags when you update note content:

- Type **"todo"** or **"task"** → Gets `todo` tag
- Type **"idea"** or **"concept"** → Gets `idea` tag  
- Type **"bug"** or **"issue"** → Gets `issue` tag

### Viewing Notes

- All notes display in a **3-column grid**
- Each note card shows:
  - **Title** (bold)
  - **Content** (body text)
  - **Tags** (comma-separated at bottom)

### Example Usage

1. Click **"+ Note"** to create a note
2. The note appears in the grid
3. Update the note content with "This is a todo item"
4. The plugin automatically adds the `todo` tag
5. All changes are saved automatically

## 🛠️ Troubleshooting

### Port Already in Use

If port 3000 is busy, Next.js will automatically use the next available port (3001, 3002, etc.)

### Clear Browser Data

To reset all notes, clear your browser's IndexedDB:
- Chrome/Edge: DevTools → Application → IndexedDB → Delete `bytepad-web`
- Firefox: DevTools → Storage → IndexedDB → Delete `bytepad-web`

### Build for Production

```bash
npm run build
cd apps/web
npm start
```

## 📦 Project Structure

```
bytepad/
├── packages/          # Core packages
│   ├── bytepad-core/     # Main engine
│   ├── bytepad-types/    # TypeScript types
│   ├── bytepad-storage/  # IndexedDB driver
│   ├── bytepad-plugins/  # Tag generator plugin
│   └── bytepad-utils/    # Utility functions
└── apps/
    └── web/              # Next.js web application
```

## 🔌 Using the Core API

You can access the BytePadCore instance via React Context:

```typescript
import { useContext } from 'react';
import { CoreContext } from './providers';

const core = useContext(CoreContext);

// Create note
await core.createNote({ 
  title: "My Note", 
  content: "Note content here" 
});

// Get all notes
const notes = core.getAllNotes();

// Update note
await core.updateNote(noteId, { 
  title: "Updated Title" 
});

// Delete note
await core.deleteNote(noteId);
```

## 🎯 Next Steps

- Customize the UI in `apps/web/app/page.tsx`
- Add more plugins in `packages/bytepad-plugins/`
- Create desktop version with Electron
- Build NXCore panel widget

