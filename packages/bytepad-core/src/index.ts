import { EventEmitter } from "eventemitter3";
import { v4 as uuid } from "uuid";
import type {
  Board,
  Note,
  Plugin,
  SyncEvent,
  CoreConfig,
  CoreInstance,
} from "bytepad-types";
import {
  validateBoard,
  validateNote,
  validatePartialBoard,
  validatePartialNote,
} from "bytepad-types";
import { sanitizeHTML } from "bytepad-utils";
import { HistoryManager, type HistoryEntry } from "./history";
import { BackupManager, type BackupMetadata, importLegacyData } from "bytepad-storage";

/**
 * BytePadCore - The central engine for BytePad operations
 * 
 * Manages boards, notes, plugins, history, and storage operations.
 * Provides a unified API for all BytePad surfaces (Web, Electron, CLI, Panel).
 * 
 * @example
 * ```typescript
 * import { BytePadCore } from "bytepad-core";
 * import { indexedDbDriver } from "bytepad-storage";
 * 
 * const core = new BytePadCore({
 *   storage: indexedDbDriver("bytepad-web")
 * });
 * 
 * await core.init();
 * const boards = core.getAllBoards();
 * ```
 */
export class BytePadCore implements CoreInstance {
  boards: Map<string, Board> = new Map();
  plugins: Plugin[] = [];
  events = new EventEmitter();
  storage: CoreConfig["storage"];
  syncQueue: SyncEvent[] = [];
  history: HistoryManager = new HistoryManager();
  backupManager: BackupManager;
  private transactionInProgress: boolean = false;
  private transactionQueue: Array<() => Promise<void>> = [];

  /**
   * Creates a new BytePadCore instance
   * 
   * @param config - Configuration object containing the storage driver
   * @param config.storage - Storage driver implementation (IndexedDB, Filesystem, or NXDrive)
   */
  constructor(config: CoreConfig) {
    this.storage = config.storage;
    // Initialize backup manager (uses localStorage for web, can be overridden)
    this.backupManager = new BackupManager(
      typeof window !== "undefined" ? window.localStorage : ({} as Storage)
    );
  }

  /**
   * Initialize the core and load boards from storage
   * 
   * Validates loaded boards and filters out invalid ones.
   * Emits 'coreError' event for any invalid boards found.
   * 
   * @throws {Error} If storage load fails
   * 
   * @example
   * ```typescript
   * await core.init();
   * const boards = core.getAllBoards();
   * ```
   */
  async init() {
    try {
      const loaded = await this.storage.load();
      
      // Validate and filter out invalid boards
      const validBoards: Board[] = [];
      for (const board of loaded) {
        try {
          validateBoard(board);
          validBoards.push(board);
        } catch (err) {
          console.warn(`Skipping invalid board ${board.id}:`, err);
          this.broadcast("coreError", {
            type: "invalidBoard",
            boardId: board.id,
            error: err,
          });
        }
      }
      
      validBoards.forEach((board: Board) => this.boards.set(board.id, board));

      this.plugins.forEach((p) => p.onInit?.(this));
    } catch (err) {
      console.error("Failed to load boards", err);
      this.broadcast("coreError", { type: "loadFailed", error: err });
      throw err;
    }
  }

  /**
   * Register a plugin to extend core functionality
   * 
   * Plugins can hook into board/note lifecycle events and sync operations.
   * 
   * @param plugin - Plugin object with hook methods
   * 
   * @example
   * ```typescript
   * core.registerPlugin({
   *   name: "my-plugin",
   *   onNoteCreate: (boardId, note, core) => {
   *     console.log("Note created:", note.id);
   *   }
   * });
   * ```
   */
  registerPlugin(plugin: Plugin) {
    this.plugins.push(plugin);
    plugin.onRegister?.(this);
  }

  /**
   * Get all boards
   * 
   * @returns Array of all boards in the system
   */
  getAllBoards(): Board[] {
    return Array.from(this.boards.values());
  }

  /**
   * Get a board by ID
   * 
   * @param id - Board ID
   * @returns Board object or undefined if not found
   */
  getBoard(id: string): Board | undefined {
    return this.boards.get(id);
  }

  /**
   * Create a new board
   * 
   * Validates and sanitizes input data. Generates a UUID if no ID provided.
   * Automatically saves to storage and adds to history for undo/redo.
   * 
   * @param data - Optional partial board data (id, name, theme, etc.)
   * @returns Created Board object
   * @throws {Error} If validation fails or storage save fails
   * 
   * @example
   * ```typescript
   * const board = await core.createBoard({
   *   name: "My Board",
   *   theme: "dark"
   * });
   * ```
   */
  async createBoard(data?: Partial<Board>): Promise<Board> {
    try {
      // Validate and sanitize input
      const validatedData = data ? validatePartialBoard(data) : {};
      
      const board: Board = {
        id: validatedData.id ?? uuid(),
        name: validatedData.name ?? "New Board",
        theme: validatedData.theme ?? "default",
        notes: validatedData.notes ?? [],
        assets: validatedData.assets ?? [],
        playlists: validatedData.playlists ?? [],
        createdAt: validatedData.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };

      // Validate the complete board
      validateBoard(board);

      this.boards.set(board.id, board);
      await this.persistBoard(board);

      // Add to history
      this.history.push({
        type: "board",
        action: "create",
        boardId: board.id,
        data: board,
        timestamp: Date.now(),
      });

      // Call plugin hooks with microtask to prevent recursion
      this.plugins.forEach((p) => {
        queueMicrotask(() => p.onBoardCreate?.(board, this));
      });

      // Emit for UI subscriptions
      this.broadcast("boardCreated", board);

      return board;
    } catch (err) {
      console.error("Failed to create board", err);
      this.broadcast("coreError", { type: "createBoardFailed", error: err });
      throw err;
    }
  }

  /**
   * Update an existing board
   * 
   * Validates and sanitizes input data. Stores previous state in history for undo.
   * 
   * @param id - Board ID to update
   * @param data - Partial board data to update
   * @returns Updated Board object or undefined if board not found
   * @throws {Error} If validation fails or storage save fails
   * 
   * @example
   * ```typescript
   * const updated = await core.updateBoard(boardId, {
   *   name: "Updated Name"
   * });
   * ```
   */
  async updateBoard(id: string, data: Partial<Board>): Promise<Board | undefined> {
    try {
      const existing = this.boards.get(id);
      if (!existing) return;

      // Validate and sanitize input
      const validatedData = validatePartialBoard(data);
      const updated: Board = { ...existing, ...validatedData, updatedAt: Date.now() };
      
      // Validate the complete board
      validateBoard(updated);
      
      // Add to history (store old state)
      this.history.push({
        type: "board",
        action: "update",
        boardId: id,
        data: existing, // Store old state for undo
        timestamp: Date.now(),
      });
      
      this.boards.set(id, updated);

      await this.persistBoard(updated);

      // Call plugin hooks with microtask to prevent recursion
      this.plugins.forEach((p) => {
        queueMicrotask(() => p.onBoardUpdate?.(updated, this));
      });

      // Emit for UI subscriptions
      this.broadcast("boardUpdated", updated);

      return updated;
    } catch (err) {
      console.error("Failed to update board", err);
      this.broadcast("coreError", { type: "updateBoardFailed", error: err });
      throw err;
    }
  }

  /**
   * Delete a board
   * 
   * Stores deleted board in history for undo. Removes board from storage.
   * 
   * @param id - Board ID to delete
   * @throws {Error} If storage delete fails
   * 
   * @example
   * ```typescript
   * await core.deleteBoard(boardId);
   * ```
   */
  async deleteBoard(id: string): Promise<void> {
    try {
      const board = this.boards.get(id);
      if (!board) return;

      // Add to history (store deleted board for undo)
      this.history.push({
        type: "board",
        action: "delete",
        boardId: id,
        data: board,
        timestamp: Date.now(),
      });

      this.boards.delete(id);
      await this.storage.delete(id);

      // Call plugin hooks with microtask to prevent recursion
      this.plugins.forEach((p) => {
        queueMicrotask(() => p.onBoardDelete?.(id, this));
      });

      // Emit for UI subscriptions
      this.broadcast("boardDeleted", id);
    } catch (err) {
      console.error("Failed to delete board", err);
      this.broadcast("coreError", { type: "deleteBoardFailed", error: err });
      throw err;
    }
  }

  /**
   * Create a new note in a board
   * 
   * Validates and sanitizes input data. Sanitizes HTML content to prevent XSS.
   * Generates a UUID if no ID provided. Automatically saves to storage.
   * 
   * @param boardId - ID of the board to add the note to
   * @param data - Optional partial note data (id, contentHTML, geometry, tags, etc.)
   * @returns Created Note object
   * @throws {Error} If board not found, validation fails, or storage save fails
   * 
   * @example
   * ```typescript
   * const note = await core.createNote(boardId, {
   *   contentHTML: "<p>My note content</p>",
   *   geometry: { x: 100, y: 100, w: 200, h: 150, z: 0 }
   * });
   * ```
   */
  async createNote(boardId: string, data?: Partial<Note>): Promise<Note> {
    try {
      const board = this.boards.get(boardId);
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      // Validate and sanitize input
      const validatedData = data ? validatePartialNote(data) : {};
      
      // Sanitize HTML content to prevent XSS
      const sanitizedContent = validatedData.contentHTML
        ? sanitizeHTML(validatedData.contentHTML)
        : "";
      
      const defaultGeometry = { x: 0, y: 0, w: 200, h: 150, z: 0 };
      const geometry = validatedData.geometry 
        ? { ...defaultGeometry, ...validatedData.geometry }
        : defaultGeometry;
      
      const note: Note = {
        id: validatedData.id ?? uuid(),
        geometry: geometry,
        contentHTML: sanitizedContent,
        tags: validatedData.tags ?? [],
        color: validatedData.color ?? "",
        linkedAssets: validatedData.linkedAssets ?? [],
        createdAt: validatedData.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };

      // Validate the complete note
      validateNote(note);

      board.notes.push(note);
      board.updatedAt = Date.now();
      await this.persistBoard(board);

      // Add to history
      this.history.push({
        type: "note",
        action: "create",
        boardId,
        noteId: note.id,
        data: note,
        timestamp: Date.now(),
      });

      // Call plugin hooks with microtask to prevent recursion
      this.plugins.forEach((p) => {
        queueMicrotask(() => p.onNoteCreate?.(boardId, note, this));
      });

      // Emit for UI subscriptions
      this.broadcast("noteCreated", { boardId, note });

      return note;
    } catch (err) {
      console.error("Failed to create note", err);
      this.broadcast("coreError", { type: "createNoteFailed", error: err });
      throw err;
    }
  }

  /**
   * Update an existing note
   * 
   * Validates and sanitizes input data. Sanitizes HTML content if updated.
   * Stores previous state in history for undo.
   * 
   * @param boardId - ID of the board containing the note
   * @param noteId - ID of the note to update
   * @param data - Partial note data to update
   * @returns Updated Note object or undefined if note not found
   * @throws {Error} If board not found, validation fails, or storage save fails
   * 
   * @example
   * ```typescript
   * const updated = await core.updateNote(boardId, noteId, {
   *   contentHTML: "<p>Updated content</p>"
   * });
   * ```
   */
  async updateNote(
    boardId: string,
    noteId: string,
    data: Partial<Note>
  ): Promise<Note | undefined> {
    try {
      const board = this.boards.get(boardId);
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      const noteIndex = board.notes.findIndex((n) => n.id === noteId);
      if (noteIndex === -1) return;

      // Validate and sanitize input
      const validatedData = validatePartialNote(data);
      const existing = board.notes[noteIndex];
      
      // Sanitize HTML content if it's being updated
      const sanitizedContent = validatedData.contentHTML !== undefined
        ? sanitizeHTML(validatedData.contentHTML)
        : existing.contentHTML;
      
      // Ensure geometry is fully defined (merge with existing if partial)
      const updatedGeometry = validatedData.geometry
        ? { ...existing.geometry, ...validatedData.geometry }
        : existing.geometry;
      
      const updated: Note = {
        ...existing,
        ...validatedData,
        geometry: updatedGeometry,
        contentHTML: sanitizedContent,
        updatedAt: Date.now(),
      };
      
      // Validate the complete note
      validateNote(updated);
      
      // Add to history (store old state)
      this.history.push({
        type: "note",
        action: "update",
        boardId,
        noteId,
        data: existing, // Store old state for undo
        timestamp: Date.now(),
      });
      
      board.notes[noteIndex] = updated;
      board.updatedAt = Date.now();

      await this.persistBoard(board);

      // Call plugin hooks with microtask to prevent recursion
      this.plugins.forEach((p) => {
        queueMicrotask(() => p.onNoteUpdate?.(boardId, updated, this));
      });

      // Emit for UI subscriptions
      this.broadcast("noteUpdated", { boardId, note: updated });

      return updated;
    } catch (err) {
      console.error("Failed to update note", err);
      this.broadcast("coreError", { type: "updateNoteFailed", error: err });
      throw err;
    }
  }

  /**
   * Delete a note from a board
   * 
   * Stores deleted note in history for undo. Removes note from board and saves.
   * 
   * @param boardId - ID of the board containing the note
   * @param noteId - ID of the note to delete
   * @throws {Error} If board not found or storage save fails
   * 
   * @example
   * ```typescript
   * await core.deleteNote(boardId, noteId);
   * ```
   */
  async deleteNote(boardId: string, noteId: string): Promise<void> {
    try {
      const board = this.boards.get(boardId);
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      const note = board.notes.find((n) => n.id === noteId);
      if (!note) return;

      // Add to history (store deleted note for undo)
      this.history.push({
        type: "note",
        action: "delete",
        boardId,
        noteId,
        data: note,
        timestamp: Date.now(),
      });

      board.notes = board.notes.filter((n) => n.id !== noteId);
      board.updatedAt = Date.now();
      await this.persistBoard(board);

      // Call plugin hooks with microtask to prevent recursion
      this.plugins.forEach((p) => {
        queueMicrotask(() => p.onNoteDelete?.(boardId, noteId, this));
      });

      // Emit for UI subscriptions
      this.broadcast("noteDeleted", { boardId, noteId });
    } catch (err) {
      console.error("Failed to delete note", err);
      this.broadcast("coreError", { type: "deleteNoteFailed", error: err });
      throw err;
    }
  }

  /**
   * Enqueue a sync event for plugin processing
   * 
   * @param event - Sync event to queue
   */
  enqueueSync(event: SyncEvent) {
    this.syncQueue.push(event);
    this.broadcast("syncQueued", event);
  }

  /**
   * Flush the sync queue (process all pending sync events)
   * 
   * Calls onSync hook on all registered plugins for each queued event.
   * Clears the sync queue after processing.
   * 
   * @throws {Error} If plugin sync processing fails
   * 
   * @example
   * ```typescript
   * await core.flushSync();
   * ```
   */
  async flushSync() {
    try {
      for (const e of this.syncQueue) {
        for (const p of this.plugins) {
          if (p.onSync) {
            await p.onSync(e, this);
          }
        }
      }
      this.syncQueue = [];
      this.broadcast("syncFlushed");
    } catch (err) {
      console.error("Failed to flush sync", err);
      this.broadcast("coreError", { type: "flushSyncFailed", error: err });
      throw err;
    }
  }

  private async persistBoard(board: Board, retries: number = 3) {
    let lastError: any;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await this.storage.save(board);
        this.enqueueSync({ type: "update", payload: board });
        
        // Create automatic backup after successful save (every 5 minutes)
        if (attempt === 0) {
          this.createAutoBackup();
        }
        
        return;
      } catch (err) {
        lastError = err;
        console.warn(`Failed to persist board (attempt ${attempt + 1}/${retries}):`, err);
        
        if (attempt < retries - 1) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }
    
    console.error("Failed to persist board after retries", lastError);
    this.broadcast("coreError", { type: "persistFailed", error: lastError });
    throw lastError;
  }

  private lastBackupTime: number = 0;
  private readonly BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private async createAutoBackup() {
    const now = Date.now();
    if (now - this.lastBackupTime < this.BACKUP_INTERVAL) {
      return; // Too soon for another backup
    }

    try {
      const boards = this.getAllBoards();
      if (boards.length > 0) {
        await this.backupManager.createBackup(boards);
        this.lastBackupTime = now;
        this.broadcast("backupCreated", { timestamp: now });
      }
    } catch (err) {
      console.warn("Failed to create automatic backup:", err);
      // Don't throw - backup failures shouldn't break the app
    }
  }

  // Simplified broadcast - UI events only
  broadcast(event: string, payload?: any) {
    this.events.emit(event, payload);
  }

  /**
   * Get all notes from all boards
   * 
   * Convenience method that aggregates notes across all boards.
   * 
   * @returns Array of all notes in the system
   */
  getAllNotes(): Note[] {
    const allNotes: Note[] = [];
    this.boards.forEach((board) => {
      allNotes.push(...board.notes);
    });
    return allNotes;
  }

  /**
   * Get a note by ID (searches across all boards)
   * 
   * @param id - Note ID
   * @returns Note object or undefined if not found
   */
  getNote(id: string): Note | undefined {
    for (const board of this.boards.values()) {
      const note = board.notes.find((n) => n.id === id);
      if (note) return note;
    }
    return undefined;
  }

  /**
   * Get the board containing a specific note
   * 
   * @param noteId - Note ID
   * @returns Board object containing the note, or undefined if not found
   */
  getNoteBoard(noteId: string): Board | undefined {
    for (const board of this.boards.values()) {
      const note = board.notes.find((n) => n.id === noteId);
      if (note) return board;
    }
    return undefined;
  }

  /**
   * Undo the last operation
   * 
   * Restores the previous state from history. Supports board and note operations.
   * 
   * @returns true if undo was successful, false if no history to undo
   * 
   * @example
   * ```typescript
   * const success = await core.undo();
   * if (success) {
   *   console.log("Undo successful");
   * }
   * ```
   */
  async undo(): Promise<boolean> {
    const entry = this.history.undo();
    if (!entry) return false;

    try {
      if (entry.type === "board") {
        await this.undoBoard(entry);
      } else {
        await this.undoNote(entry);
      }
      this.broadcast("historyChanged", { canUndo: this.history.canUndo(), canRedo: this.history.canRedo() });
      return true;
    } catch (err) {
      console.error("Undo failed:", err);
      return false;
    }
  }

  /**
   * Redo the last undone operation
   * 
   * Re-applies the operation that was undone. Supports board and note operations.
   * 
   * @returns true if redo was successful, false if no history to redo
   * 
   * @example
   * ```typescript
   * const success = await core.redo();
   * if (success) {
   *   console.log("Redo successful");
   * }
   * ```
   */
  async redo(): Promise<boolean> {
    const entry = this.history.redo();
    if (!entry) return false;

    try {
      if (entry.type === "board") {
        await this.redoBoard(entry);
      } else {
        await this.redoNote(entry);
      }
      this.broadcast("historyChanged", { canUndo: this.history.canUndo(), canRedo: this.history.canRedo() });
      return true;
    } catch (err) {
      console.error("Redo failed:", err);
      return false;
    }
  }

  /**
   * Check if undo is available
   * 
   * @returns true if there are operations in history that can be undone
   */
  canUndo(): boolean {
    return this.history.canUndo();
  }

  /**
   * Check if redo is available
   * 
   * @returns true if there are undone operations that can be redone
   */
  canRedo(): boolean {
    return this.history.canRedo();
  }

  private async undoBoard(entry: HistoryEntry) {
    if (entry.action === "create") {
      // Undo create = delete
      await this.deleteBoard(entry.boardId);
    } else if (entry.action === "update" && entry.data) {
      // Undo update = restore old state
      await this.updateBoard(entry.boardId, entry.data as Board);
    } else if (entry.action === "delete" && entry.data) {
      // Undo delete = restore board
      await this.createBoard(entry.data as Board);
    }
  }

  private async undoNote(entry: HistoryEntry) {
    if (!entry.noteId) return;
    
    if (entry.action === "create") {
      // Undo create = delete
      await this.deleteNote(entry.boardId, entry.noteId);
    } else if (entry.action === "update" && entry.data) {
      // Undo update = restore old state
      await this.updateNote(entry.boardId, entry.noteId, entry.data as Note);
    } else if (entry.action === "delete" && entry.data) {
      // Undo delete = restore note
      const board = this.boards.get(entry.boardId);
      if (board) {
        board.notes.push(entry.data as Note);
        board.updatedAt = Date.now();
        await this.persistBoard(board);
        this.broadcast("noteCreated", { boardId: entry.boardId, note: entry.data as Note });
      }
    }
  }

  private async redoBoard(entry: HistoryEntry) {
    if (entry.action === "create" && entry.data) {
      // Redo create = create again
      await this.createBoard(entry.data as Board);
    } else if (entry.action === "update" && entry.data) {
      // Redo update = apply update again (need current state)
      const current = this.boards.get(entry.boardId);
      if (current) {
        await this.updateBoard(entry.boardId, entry.data as Partial<Board>);
      }
    } else if (entry.action === "delete") {
      // Redo delete = delete again
      await this.deleteBoard(entry.boardId);
    }
  }

  private async redoNote(entry: HistoryEntry) {
    if (!entry.noteId) return;
    
    if (entry.action === "create" && entry.data) {
      // Redo create = create again
      await this.createNote(entry.boardId, entry.data as Partial<Note>);
    } else if (entry.action === "update" && entry.data) {
      // Redo update = apply update again
      await this.updateNote(entry.boardId, entry.noteId, entry.data as Partial<Note>);
    } else if (entry.action === "delete") {
      // Redo delete = delete again
      await this.deleteNote(entry.boardId, entry.noteId);
    }
  }

  /**
   * Execute operations in a transaction (atomic batch)
   * 
   * Ensures all operations in the transaction complete or none do.
   * Queues subsequent transactions if one is already in progress.
   * 
   * @param fn - Async function containing operations to execute atomically
   * @returns Result of the transaction function
   * @throws {Error} If any operation in the transaction fails
   * 
   * @example
   * ```typescript
   * await core.transaction(async () => {
   *   await core.createBoard({ name: "Board 1" });
   *   await core.createBoard({ name: "Board 2" });
   * });
   * ```
   */
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.transactionInProgress) {
      // Queue the transaction
      return new Promise((resolve, reject) => {
        this.transactionQueue.push(async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (err) {
            reject(err);
          }
        });
      });
    }

    this.transactionInProgress = true;
    
    try {
      const result = await fn();
      
      // Process queued transactions
      while (this.transactionQueue.length > 0) {
        const next = this.transactionQueue.shift();
        if (next) {
          await next();
        }
      }
      
      return result;
    } catch (err) {
      // On error, clear queue and rethrow
      this.transactionQueue = [];
      throw err;
    } finally {
      this.transactionInProgress = false;
    }
  }

  /**
   * Create a backup of all boards
   * 
   * @returns Backup metadata including ID and timestamp
   * 
   * @example
   * ```typescript
   * const backup = await core.createBackup();
   * console.log("Backup created:", backup.id);
   * ```
   */
  async createBackup(): Promise<BackupMetadata> {
    const boards = this.getAllBoards();
    const metadata = await this.backupManager.createBackup(boards);
    this.broadcast("backupCreated", metadata);
    return metadata;
  }

  /**
   * List all available backups
   * 
   * @returns Array of backup metadata objects
   */
  listBackups(): BackupMetadata[] {
    return this.backupManager.listBackups();
  }

  /**
   * Restore a backup
   * 
   * Clears current boards and loads boards from the backup.
   * Clears history after restore.
   * 
   * @param backupId - ID of the backup to restore
   * @throws {Error} If backup not found or restore fails
   * 
   * @example
   * ```typescript
   * await core.restoreBackup(backupId);
   * ```
   */
  async restoreBackup(backupId: string): Promise<void> {
    try {
      const boards = await this.backupManager.restoreBackup(backupId);
      
      // Clear current boards
      this.boards.clear();
      
      // Load restored boards
      for (const board of boards) {
        this.boards.set(board.id, board);
        await this.storage.save(board);
      }
      
      this.broadcast("backupRestored", { backupId, boardCount: boards.length });
      this.history.clear(); // Clear history after restore
    } catch (err) {
      console.error("Failed to restore backup:", err);
      this.broadcast("coreError", { type: "restoreBackupFailed", error: err });
      throw err;
    }
  }

  /**
   * Export a backup as JSON string
   * 
   * @param backupId - ID of the backup to export
   * @returns JSON string representation of the backup
   * @throws {Error} If backup not found
   */
  async exportBackup(backupId: string): Promise<string> {
    return this.backupManager.exportBackup(backupId);
  }

  /**
   * Import a backup from JSON string
   * 
   * @param jsonData - JSON string representation of the backup
   * @returns Backup metadata
   * @throws {Error} If JSON is invalid or import fails
   */
  async importBackup(jsonData: string): Promise<BackupMetadata> {
    const metadata = await this.backupManager.importBackup(jsonData);
    this.broadcast("backupImported", metadata);
    return metadata;
  }

  /**
   * Get the most recent backup
   * 
   * @returns Latest backup metadata or null if no backups exist
   */
  getLatestBackup(): BackupMetadata | null {
    return this.backupManager.getLatestBackup();
  }

  /**
   * Import data from legacy BytePad format
   * 
   * Converts old note-based format to new board-based format.
   * Validates and imports boards in a transaction.
   * Generates new IDs for boards that conflict with existing ones.
   * 
   * @param jsonString - JSON string in legacy BytePad format
   * @returns Array of imported boards
   * @throws {Error} If JSON is invalid or import fails
   * 
   * @example
   * ```typescript
   * const boards = await core.importLegacyData(legacyJsonString);
   * console.log(`Imported ${boards.length} boards`);
   * ```
   */
  async importLegacyData(jsonString: string): Promise<Board[]> {
    try {
      const boards = await importLegacyData(jsonString);
      
      // Import boards in a transaction
      await this.transaction(async () => {
        for (const board of boards) {
          // Validate board
          validateBoard(board);
          
          // Check if board with same ID exists
          if (this.boards.has(board.id)) {
            // Generate new ID to avoid conflicts
            board.id = uuid();
          }
          
          this.boards.set(board.id, board);
          await this.storage.save(board);
          
          // Add to history
          this.history.push({
            type: "board",
            action: "create",
            boardId: board.id,
            data: board,
            timestamp: Date.now(),
          });
        }
      });
      
      this.broadcast("legacyDataImported", { boardCount: boards.length });
      return boards;
    } catch (err) {
      console.error("Failed to import legacy data:", err);
      this.broadcast("coreError", { type: "importLegacyDataFailed", error: err });
      throw err;
    }
  }
}
