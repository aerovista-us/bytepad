import type { EventEmitter } from "eventemitter3";

// Board-centric schema
export interface Note {
  id: string;
  geometry: { x: number; y: number; w: number; h: number; z: number };
  contentHTML: string;
  tags: string[];
  color: string;
  linkedAssets: string[]; // Asset IDs
  createdAt: number;
  updatedAt: number;
}

export interface Asset {
  id: string;
  type: "image" | "video" | "audio" | "file" | "code";
  path?: string; // Filesystem path (Studio)
  blob?: Blob; // In-memory blob (PWA)
  mime: string;
  metadata: Record<string, any>;
}

export interface Playlist {
  id: string;
  tracks: string[]; // Asset IDs
  metadata: Record<string, any>;
}

export interface Board {
  id: string;
  name: string;
  theme: string;
  notes: Note[];
  assets: Asset[];
  playlists: Playlist[];
  createdAt: number;
  updatedAt: number;
}

export interface SyncEvent {
  type: "update" | "delete";
  payload: any;
}

export interface StorageDriverHealth {
  healthy: boolean;
  message?: string;
  lastError?: Error;
}

export interface StorageDriver {
  load(): Promise<Board[]>;
  save(board: Board): Promise<void>;
  delete(boardId: string): Promise<void>;
  
  /**
   * Check if the driver supports transactions (atomic operations)
   */
  supportsTransactions?(): boolean;
  
  /**
   * Check if the driver supports backup operations
   */
  supportsBackup?(): boolean;
  
  /**
   * Perform a health check on the storage driver
   */
  healthCheck?(): Promise<StorageDriverHealth>;
}

export interface CoreConfig {
  storage: StorageDriver;
}

// CoreInstance interface to avoid circular dependencies
export interface CoreInstance {
  boards: Map<string, Board>;
  plugins: Plugin[];
  events: EventEmitter;
  getAllBoards(): Board[];
  getBoard(id: string): Board | undefined;
  createBoard(data?: Partial<Board>): Promise<Board>;
  updateBoard(id: string, data: Partial<Board>): Promise<Board | undefined>;
  deleteBoard(id: string): Promise<void>;
  // Note methods (within a board)
  createNote(boardId: string, data?: Partial<Note>): Promise<Note>;
  updateNote(boardId: string, noteId: string, data: Partial<Note>): Promise<Note | undefined>;
  deleteNote(boardId: string, noteId: string): Promise<void>;
  // Plugin management
  registerPlugin(plugin: Plugin): void;
  // Sync
  flushSync(): Promise<void>;
}

export interface Plugin {
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

// Export validation schemas and functions
export * from "./validation";
export * from "./version";
