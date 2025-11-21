import type { Board, Note } from "bytepad-types";

/**
 * IPC message types for communication between renderer and main process
 */

export interface IpcRequest<T = any> {
  type: string;
  payload?: T;
}

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Core operations
export interface CreateBoardRequest {
  data?: Partial<Board>;
}

export interface UpdateBoardRequest {
  id: string;
  data: Partial<Board>;
}

export interface DeleteBoardRequest {
  id: string;
}

export interface CreateNoteRequest {
  boardId: string;
  data?: Partial<Note>;
}

export interface UpdateNoteRequest {
  boardId: string;
  noteId: string;
  data: Partial<Note>;
}

export interface DeleteNoteRequest {
  boardId: string;
  noteId: string;
}

// IPC channel names
export const IPC_CHANNELS = {
  // Board operations
  CREATE_BOARD: "core:createBoard",
  UPDATE_BOARD: "core:updateBoard",
  DELETE_BOARD: "core:deleteBoard",
  GET_BOARD: "core:getBoard",
  GET_ALL_BOARDS: "core:getAllBoards",
  
  // Note operations
  CREATE_NOTE: "core:createNote",
  UPDATE_NOTE: "core:updateNote",
  DELETE_NOTE: "core:deleteNote",
  GET_NOTE: "core:getNote",
  GET_ALL_NOTES: "core:getAllNotes",
  
  // History operations
  UNDO: "core:undo",
  REDO: "core:redo",
  CAN_UNDO: "core:canUndo",
  CAN_REDO: "core:canRedo",
  
  // Backup operations
  CREATE_BACKUP: "core:createBackup",
  LIST_BACKUPS: "core:listBackups",
  RESTORE_BACKUP: "core:restoreBackup",
  EXPORT_BACKUP: "core:exportBackup",
  IMPORT_BACKUP: "core:importBackup",
  
  // Legacy migration
  IMPORT_LEGACY_DATA: "core:importLegacyData",
} as const;

