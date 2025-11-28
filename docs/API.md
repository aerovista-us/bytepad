# BytePad API Reference

> **Note:** This API documentation is generated from JSDoc comments. For complete details, see the source code.

## Core API

### BytePadCore

The central engine for BytePad operations. Manages boards, notes, plugins, history, and storage operations. Provides a unified API for all BytePad surfaces (Web, Electron, CLI, Panel).

#### Constructor

```typescript
new BytePadCore(config: CoreConfig): BytePadCore
```

**Parameters:**
- `config.storage`: StorageDriver instance (IndexedDB, Filesystem, or NXDrive)

**Example:**
```typescript
import { BytePadCore } from "bytepad-core";
import { indexedDbDriver } from "bytepad-storage";

const core = new BytePadCore({
  storage: indexedDbDriver("bytepad-web"),
});
await core.init();
```

#### Methods

##### `init(): Promise<void>`

Initialize the core and load boards from storage. Validates loaded boards and filters out invalid ones. Emits 'coreError' event for any invalid boards found.

**Throws:** `Error` if storage load fails

**Example:**
```typescript
await core.init();
const boards = core.getAllBoards();
```

##### `getAllBoards(): Board[]`

Get all boards.

**Returns:** Array of all boards in the system

##### `getBoard(id: string): Board | undefined`

Get a board by ID.

**Parameters:**
- `id`: Board ID

**Returns:** Board object or undefined if not found

##### `createBoard(data?: Partial<Board>): Promise<Board>`

Create a new board. Validates and sanitizes input data. Generates a UUID if no ID provided. Automatically saves to storage and adds to history for undo/redo.

**Parameters:**
- `data`: Optional partial board data (id, name, theme, etc.)

**Returns:** Created Board object

**Throws:** `Error` if validation fails or storage save fails

**Example:**
```typescript
const board = await core.createBoard({
  name: "My Board",
  theme: "dark"
});
```

##### `updateBoard(id: string, data: Partial<Board>): Promise<Board | undefined>`

Update an existing board. Validates and sanitizes input data. Stores previous state in history for undo.

**Parameters:**
- `id`: Board ID to update
- `data`: Partial board data to update

**Returns:** Updated Board object or undefined if board not found

**Throws:** `Error` if validation fails or storage save fails

**Example:**
```typescript
const updated = await core.updateBoard(boardId, {
  name: "Updated Name"
});
```

##### `deleteBoard(id: string): Promise<void>`

Delete a board. Stores deleted board in history for undo. Removes board from storage.

**Parameters:**
- `id`: Board ID to delete

**Throws:** `Error` if storage delete fails

**Example:**
```typescript
await core.deleteBoard(boardId);
```

##### `createNote(boardId: string, data?: Partial<Note>): Promise<Note>`

Create a new note in a board. Validates and sanitizes input data. Sanitizes HTML content to prevent XSS. Generates a UUID if no ID provided. Automatically saves to storage.

**Parameters:**
- `boardId`: ID of the board to add the note to
- `data`: Optional partial note data (id, contentHTML, geometry, tags, etc.)

**Returns:** Created Note object

**Throws:** `Error` if board not found, validation fails, or storage save fails

**Example:**
```typescript
const note = await core.createNote(boardId, {
  contentHTML: "<p>My note content</p>",
  geometry: { x: 100, y: 100, w: 200, h: 150, z: 0 }
});
```

##### `updateNote(boardId: string, noteId: string, data: Partial<Note>): Promise<Note | undefined>`

Update an existing note. Validates and sanitizes input data. Sanitizes HTML content if updated. Stores previous state in history for undo.

**Parameters:**
- `boardId`: ID of the board containing the note
- `noteId`: ID of the note to update
- `data`: Partial note data to update

**Returns:** Updated Note object or undefined if note not found

**Throws:** `Error` if board not found, validation fails, or storage save fails

**Example:**
```typescript
const updated = await core.updateNote(boardId, noteId, {
  contentHTML: "<p>Updated content</p>"
});
```

##### `deleteNote(boardId: string, noteId: string): Promise<void>`

Delete a note from a board. Stores deleted note in history for undo. Removes note from board and saves.

**Parameters:**
- `boardId`: ID of the board containing the note
- `noteId`: ID of the note to delete

**Throws:** `Error` if board not found or storage save fails

**Example:**
```typescript
await core.deleteNote(boardId, noteId);
```

##### `undo(): Promise<boolean>`

Undo the last operation. Restores the previous state from history. Supports board and note operations.

**Returns:** `true` if undo was successful, `false` if no history to undo

**Example:**
```typescript
const success = await core.undo();
if (success) {
  console.log("Undo successful");
}
```

##### `redo(): Promise<boolean>`

Redo the last undone operation. Re-applies the operation that was undone. Supports board and note operations.

**Returns:** `true` if redo was successful, `false` if no history to redo

**Example:**
```typescript
const success = await core.redo();
if (success) {
  console.log("Redo successful");
}
```

##### `canUndo(): boolean`

Check if undo is available.

**Returns:** `true` if there are operations in history that can be undone

##### `canRedo(): boolean`

Check if redo is available.

**Returns:** `true` if there are undone operations that can be redone

##### `registerPlugin(plugin: Plugin): void`

Register a plugin to extend core functionality. Plugins can hook into board/note lifecycle events and sync operations.

**Parameters:**
- `plugin`: Plugin object with hook methods

**Example:**
```typescript
core.registerPlugin({
  name: "my-plugin",
  onNoteCreate: (boardId, note, core) => {
    console.log("Note created:", note.id);
  }
});
```

##### `enqueueSync(event: SyncEvent): void`

Enqueue a sync event for plugin processing.

**Parameters:**
- `event`: Sync event to queue

##### `flushSync(): Promise<void>`

Flush the sync queue (process all pending sync events). Calls onSync hook on all registered plugins for each queued event. Clears the sync queue after processing.

**Throws:** `Error` if plugin sync processing fails

**Example:**
```typescript
await core.flushSync();
```

##### `getAllNotes(): Note[]`

Get all notes from all boards. Convenience method that aggregates notes across all boards.

**Returns:** Array of all notes in the system

##### `getNote(id: string): Note | undefined`

Get a note by ID (searches across all boards).

**Parameters:**
- `id`: Note ID

**Returns:** Note object or undefined if not found

##### `getNoteBoard(noteId: string): Board | undefined`

Get the board containing a specific note.

**Parameters:**
- `noteId`: Note ID

**Returns:** Board object containing the note, or undefined if not found

##### `transaction<T>(fn: () => Promise<T>): Promise<T>`

Execute operations in a transaction (atomic batch). Ensures all operations in the transaction complete or none do. Queues subsequent transactions if one is already in progress.

**Parameters:**
- `fn`: Async function containing operations to execute atomically

**Returns:** Result of the transaction function

**Throws:** `Error` if any operation in the transaction fails

**Example:**
```typescript
await core.transaction(async () => {
  await core.createBoard({ name: "Board 1" });
  await core.createBoard({ name: "Board 2" });
});
```

##### `createBackup(): Promise<BackupMetadata>`

Create a backup of all boards.

**Returns:** Backup metadata including ID and timestamp

**Example:**
```typescript
const backup = await core.createBackup();
console.log("Backup created:", backup.id);
```

##### `listBackups(): BackupMetadata[]`

List all available backups.

**Returns:** Array of backup metadata objects

##### `restoreBackup(backupId: string): Promise<void>`

Restore a backup. Clears current boards and loads boards from the backup. Clears history after restore.

**Parameters:**
- `backupId`: ID of the backup to restore

**Throws:** `Error` if backup not found or restore fails

**Example:**
```typescript
await core.restoreBackup(backupId);
```

##### `exportBackup(backupId: string): Promise<string>`

Export a backup as JSON string.

**Parameters:**
- `backupId`: ID of the backup to export

**Returns:** JSON string representation of the backup

**Throws:** `Error` if backup not found

##### `importBackup(jsonData: string): Promise<BackupMetadata>`

Import a backup from JSON string.

**Parameters:**
- `jsonData`: JSON string representation of the backup

**Returns:** Backup metadata

**Throws:** `Error` if JSON is invalid or import fails

##### `getLatestBackup(): BackupMetadata | null`

Get the most recent backup.

**Returns:** Latest backup metadata or null if no backups exist

##### `importLegacyData(jsonString: string): Promise<Board[]>`

Import data from legacy BytePad format. Converts old note-based format to new board-based format. Validates and imports boards in a transaction. Generates new IDs for boards that conflict with existing ones.

**Parameters:**
- `jsonString`: JSON string in legacy BytePad format

**Returns:** Array of imported boards

**Throws:** `Error` if JSON is invalid or import fails

**Example:**
```typescript
const boards = await core.importLegacyData(legacyJsonString);
console.log(`Imported ${boards.length} boards`);
```

## Storage API

### StorageDriver

Interface for storage drivers. All drivers must implement this interface.

**Location:** `packages/bytepad-types/src/index.ts` (single source of truth)

**Consumption:** All apps and storage implementations import from `bytepad-types`:
```typescript
import type { StorageDriver } from "bytepad-types";
```

#### Methods

##### `load(): Promise<Board[]>`

Load all boards from storage.

**Returns:** Array of Board objects

##### `save(board: Board): Promise<void>`

Save a board to storage.

**Parameters:**
- `board`: Board object to save

##### `delete(boardId: string): Promise<void>`

Delete a board from storage.

**Parameters:**
- `boardId`: Board ID to delete

##### `supportsTransactions?(): boolean`

Check if driver supports transactions.

**Returns:** true if transactions are supported

##### `supportsBackup?(): boolean`

Check if driver supports backup operations.

**Returns:** true if backups are supported

##### `healthCheck?(): Promise<StorageDriverHealth>`

Perform a health check on the storage driver.

**Returns:** StorageDriverHealth object

### Storage Driver Factory Functions

#### `indexedDbDriver(dbName?: string): StorageDriver`

Create an IndexedDB storage driver. Stores boards in browser IndexedDB. Supports automatic migration from legacy note-based format to board-based format.

**Parameters:**
- `dbName`: Database name (default: "bytepad")

**Returns:** StorageDriver implementation for IndexedDB

**Example:**
```typescript
const driver = indexedDbDriver("bytepad-web");
const core = new BytePadCore({ storage: driver });
```

#### `fsDriver(boardsPath: string): StorageDriver`

Create a filesystem storage driver. Stores boards as JSON files in a directory structure. Each board is stored in its own directory with a board.json file.

**Parameters:**
- `boardsPath`: Path to the boards directory

**Returns:** StorageDriver implementation for filesystem

**Example:**
```typescript
const driver = fsDriver("/path/to/boards");
const core = new BytePadCore({ storage: driver });
```

#### `nxdriveDriver(filePath: string): StorageDriver`

Create an NXDrive storage driver. NXDrive JSON driver for NXCore Panel. Reads/writes to NXDrive JSON file via API or direct file access.

**Note:** This is a placeholder implementation. The actual implementation will depend on how NXCore exposes the NXDrive API. See `docs/NXDRIVE_STATUS.md` for current status and requirements.

**Parameters:**
- `filePath`: Path to NXDrive JSON file or API endpoint

**Returns:** StorageDriver implementation for NXDrive (placeholder)

**Example:**
```typescript
// When NXCore API is available:
const driver = nxdriveDriver("/srv/NXDrive/bytepad/boards.json");
const core = new BytePadCore({ storage: driver });
```

### DriverManager

Manages multiple storage drivers with automatic fallback. Selects the best available driver based on health checks and automatically falls back to the next driver if the current one fails.

**Fallback order:** NXDrive → Filesystem → IndexedDB

#### Constructor

```typescript
new DriverManager(options?: DriverManagerOptions): DriverManager
```

**Parameters:**
- `options.nxdrivePath?`: Optional path to NXDrive storage
- `options.fsPath?`: Optional path to filesystem storage
- `options.indexedDbName?`: Optional IndexedDB database name
- `options.enableMigration?`: Enable data migration on fallback (default: false)

**Example:**
```typescript
const manager = new DriverManager({
  nxdrivePath: "/srv/NXDrive/bytepad/boards.json",
  indexedDbName: "bytepad-panel"
});

await manager.initialize();
const core = new BytePadCore({ storage: manager });
```

#### Methods

##### `initialize(): Promise<void>`

Initialize and select the best available driver. Checks all configured drivers and selects the first healthy one. Must be called before using the manager.

**Throws:** `Error` if no drivers are available

**Example:**
```typescript
await manager.initialize();
const driver = manager.getDriver();
```

##### `getDriver(): StorageDriver`

Get the currently active driver.

**Returns:** Active StorageDriver instance

**Throws:** `Error` if manager not initialized

##### `getActiveDriverName(): string`

Get the name of the active driver.

**Returns:** Driver name ("nxdrive", "filesystem", or "indexeddb")

##### `getFallbackReason(): string`

Get the reason for fallback (if any).

**Returns:** Fallback reason string

##### `getDriverStatuses(): DriverStatus[]`

Get status of all drivers.

**Returns:** Array of DriverStatus objects

##### `load(): Promise<Board[]>`

Load boards with automatic fallback. If the active driver fails, automatically falls back to the next available driver.

**Returns:** Array of boards loaded from storage

**Throws:** `Error` if all drivers fail

##### `save(board: Board): Promise<void>`

Save a board with automatic fallback. If the active driver fails, automatically falls back to the next available driver.

**Parameters:**
- `board`: Board object to save

**Throws:** `Error` if all drivers fail

##### `delete(boardId: string): Promise<void>`

Delete a board with automatic fallback. If the active driver fails, automatically falls back to the next available driver.

**Parameters:**
- `boardId`: ID of the board to delete

**Throws:** `Error` if all drivers fail

## Types

### Board

```typescript
interface Board {
  id: string;
  name: string;
  theme: string;
  notes: Note[];
  assets: Asset[];
  playlists: Playlist[];
  createdAt: number;
  updatedAt: number;
}
```

### Note

```typescript
interface Note {
  id: string;
  geometry: { x: number; y: number; w: number; h: number; z: number };
  contentHTML: string;
  tags: string[];
  color: string;
  linkedAssets: string[];
  createdAt: number;
  updatedAt: number;
}
```

### Plugin

```typescript
interface Plugin {
  name: string;
  onRegister?: (core: CoreInstance) => void;
  onInit?: (core: CoreInstance) => void;
  onBoardCreate?: (board: Board, core: CoreInstance) => void;
  onBoardUpdate?: (board: Board, core: CoreInstance) => void;
  onBoardDelete?: (id: string, core: CoreInstance) => void;
  onNoteCreate?: (boardId: string, note: Note, core: CoreInstance) => void;
  onNoteUpdate?: (boardId: string, note: Note, core: CoreInstance) => void;
  onNoteDelete?: (boardId: string, noteId: string, core: CoreInstance) => void;
  onSync?: (event: SyncEvent, core: CoreInstance) => Promise<void>;
}
```

## Events

BytePadCore emits events via `core.events` (EventEmitter3).

### Board Events

- `boardCreated`: Emitted when a board is created
- `boardUpdated`: Emitted when a board is updated
- `boardDeleted`: Emitted when a board is deleted

### Note Events

- `noteCreated`: Emitted when a note is created
- `noteUpdated`: Emitted when a note is updated
- `noteDeleted`: Emitted when a note is deleted

### Error Events

- `coreError`: Emitted when a core error occurs

**Example:**
```typescript
core.events.on("boardCreated", (board: Board) => {
  console.log("Board created:", board.id);
});

core.events.on("coreError", (error: any) => {
  console.error("Core error:", error);
});
```

## Related Documentation

- [Architecture](./ARCHITECTURE.md) - System architecture
- [Plugin Guide](./PLUGIN_GUIDE.md) - Plugin development
- [Deployment](./DEPLOYMENT.md) - Deployment guides

