import { ipcMain } from "electron";
import type { CoreInstance } from "bytepad-types";
import { IPC_CHANNELS } from "./types";
import type {
  CreateBoardRequest,
  UpdateBoardRequest,
  DeleteBoardRequest,
  CreateNoteRequest,
  UpdateNoteRequest,
  DeleteNoteRequest,
  IpcResponse,
} from "./types";

/**
 * Set up IPC handlers for core operations
 * All handlers validate input and return typed responses
 */
export function setupIpcHandlers(core: CoreInstance): void {
  // Board operations
  ipcMain.handle(IPC_CHANNELS.CREATE_BOARD, async (_, request: CreateBoardRequest): Promise<IpcResponse> => {
    try {
      const board = await core.createBoard(request.data);
      return { success: true, data: board };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_BOARD, async (_, request: UpdateBoardRequest): Promise<IpcResponse> => {
    try {
      const board = await core.updateBoard(request.id, request.data);
      return { success: true, data: board };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_BOARD, async (_, request: DeleteBoardRequest): Promise<IpcResponse> => {
    try {
      await core.deleteBoard(request.id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GET_BOARD, async (_, id: string): Promise<IpcResponse> => {
    try {
      const board = core.getBoard(id);
      return { success: true, data: board };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GET_ALL_BOARDS, async (): Promise<IpcResponse> => {
    try {
      const boards = core.getAllBoards();
      return { success: true, data: boards };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Note operations
  ipcMain.handle(IPC_CHANNELS.CREATE_NOTE, async (_, request: CreateNoteRequest): Promise<IpcResponse> => {
    try {
      const note = await core.createNote(request.boardId, request.data);
      return { success: true, data: note };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_NOTE, async (_, request: UpdateNoteRequest): Promise<IpcResponse> => {
    try {
      const note = await core.updateNote(request.boardId, request.noteId, request.data);
      return { success: true, data: note };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_NOTE, async (_, request: DeleteNoteRequest): Promise<IpcResponse> => {
    try {
      await core.deleteNote(request.boardId, request.noteId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GET_NOTE, async (_, id: string): Promise<IpcResponse> => {
    try {
      const note = core.getNote(id);
      return { success: true, data: note };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GET_ALL_NOTES, async (): Promise<IpcResponse> => {
    try {
      const notes = core.getAllNotes();
      return { success: true, data: notes };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // History operations
  ipcMain.handle(IPC_CHANNELS.UNDO, async (): Promise<IpcResponse> => {
    try {
      const success = await core.undo();
      return { success, data: { canUndo: core.canUndo(), canRedo: core.canRedo() } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.REDO, async (): Promise<IpcResponse> => {
    try {
      const success = await core.redo();
      return { success, data: { canUndo: core.canUndo(), canRedo: core.canRedo() } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.CAN_UNDO, async (): Promise<IpcResponse> => {
    return { success: true, data: core.canUndo() };
  });

  ipcMain.handle(IPC_CHANNELS.CAN_REDO, async (): Promise<IpcResponse> => {
    return { success: true, data: core.canRedo() };
  });

  // Backup operations
  ipcMain.handle(IPC_CHANNELS.CREATE_BACKUP, async (): Promise<IpcResponse> => {
    try {
      const metadata = await core.createBackup();
      return { success: true, data: metadata };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.LIST_BACKUPS, async (): Promise<IpcResponse> => {
    try {
      const backups = core.listBackups();
      return { success: true, data: backups };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.RESTORE_BACKUP, async (_, backupId: string): Promise<IpcResponse> => {
    try {
      await core.restoreBackup(backupId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.EXPORT_BACKUP, async (_, backupId: string): Promise<IpcResponse> => {
    try {
      const jsonData = await core.exportBackup(backupId);
      return { success: true, data: jsonData };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.IMPORT_BACKUP, async (_, jsonData: string): Promise<IpcResponse> => {
    try {
      const metadata = await core.importBackup(jsonData);
      return { success: true, data: metadata };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Legacy migration
  ipcMain.handle(IPC_CHANNELS.IMPORT_LEGACY_DATA, async (_, jsonString: string): Promise<IpcResponse> => {
    try {
      const boards = await core.importLegacyData(jsonString);
      return { success: true, data: boards };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}

