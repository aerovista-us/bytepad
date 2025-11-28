/**
 * Electron bridge for web app
 * Provides unified API for both web (IndexedDB) and Electron (IPC) environments
 */

import { ipcInvoke, isElectron, setBridgeError, type BridgeError } from "./bridge";

/**
 * Electron-compatible core operations
 * Falls back to direct core access in web environment
 */
/**
 * Helper to execute IPC with error handling
 */
async function executeIpc<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  if (!isElectron() || !window.electronAPI) {
    throw new Error("Not in Electron environment - use CoreContext");
  }

  try {
    return await ipcInvoke(operation, {
      timeout: 5000,
      retries: 2,
      retryDelay: 1000,
    });
  } catch (error) {
    const bridgeError = error as BridgeError;
    setBridgeError(bridgeError);
    
    // Log IPC failures for diagnostics
    console.error(`IPC operation failed: ${operationName}`, {
      error: bridgeError.message,
      classification: bridgeError.classification,
      timeout: bridgeError.timeout,
      retryable: bridgeError.retryable,
    });

    throw bridgeError;
  }
}

export const electronBridge = {
  isElectron: () => isElectron(),

  // Board operations
  async createBoard(data?: any) {
    return executeIpc(async () => {
      const response = await window.electronAPI!.createBoard(data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    }, "createBoard");
  },

  async updateBoard(id: string, data: any) {
    return executeIpc(async () => {
      const response = await window.electronAPI!.updateBoard(id, data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    }, "updateBoard");
  },

  async deleteBoard(id: string) {
    return executeIpc(async () => {
      const response = await window.electronAPI!.deleteBoard(id);
      if (!response.success) throw new Error(response.error);
      return response.data;
    }, "deleteBoard");
  },

  async getAllBoards() {
    return executeIpc(async () => {
      const response = await window.electronAPI!.getAllBoards();
      if (!response.success) throw new Error(response.error);
      return response.data;
    }, "getAllBoards");
  },

  // Note operations
  async createNote(boardId: string, data?: any) {
    return executeIpc(async () => {
      const response = await window.electronAPI!.createNote(boardId, data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    }, "createNote");
  },

  async updateNote(boardId: string, noteId: string, data: any) {
    return executeIpc(async () => {
      const response = await window.electronAPI!.updateNote(boardId, noteId, data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    }, "updateNote");
  },

  async deleteNote(boardId: string, noteId: string) {
    return executeIpc(async () => {
      const response = await window.electronAPI!.deleteNote(boardId, noteId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    }, "deleteNote");
  },

  // History operations
  async undo() {
    return executeIpc(async () => {
      const response = await window.electronAPI!.undo();
      if (!response.success) throw new Error(response.error);
      return response.data;
    }, "undo");
  },

  async redo() {
    return executeIpc(async () => {
      const response = await window.electronAPI!.redo();
      if (!response.success) throw new Error(response.error);
      return response.data;
    }, "redo");
  },

  async canUndo() {
    if (!isElectron() || !window.electronAPI) {
      return false;
    }
    try {
      return await ipcInvoke(() => window.electronAPI!.canUndo(), { timeout: 1000 });
    } catch {
      return false;
    }
  },

  async canRedo() {
    if (!isElectron() || !window.electronAPI) {
      return false;
    }
    try {
      return await ipcInvoke(() => window.electronAPI!.canRedo(), { timeout: 1000 });
    } catch {
      return false;
    }
  },
};

// Type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI?: {
      createBoard: (data?: any) => Promise<any>;
      updateBoard: (id: string, data: any) => Promise<any>;
      deleteBoard: (id: string) => Promise<any>;
      getBoard: (id: string) => Promise<any>;
      getAllBoards: () => Promise<any>;
      createNote: (boardId: string, data?: any) => Promise<any>;
      updateNote: (boardId: string, noteId: string, data: any) => Promise<any>;
      deleteNote: (boardId: string, noteId: string) => Promise<any>;
      getNote: (id: string) => Promise<any>;
      getAllNotes: () => Promise<any>;
      undo: () => Promise<any>;
      redo: () => Promise<any>;
      canUndo: () => Promise<boolean>;
      canRedo: () => Promise<boolean>;
      createBackup: () => Promise<any>;
      listBackups: () => Promise<any>;
      restoreBackup: (backupId: string) => Promise<any>;
      exportBackup: (backupId: string) => Promise<string>;
      importBackup: (jsonData: string) => Promise<any>;
      importLegacyData: (jsonString: string) => Promise<any>;
      platform: string;
      versions: NodeJS.ProcessVersions;
    };
  }
}

