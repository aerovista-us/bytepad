/**
 * Electron bridge for web app
 * Provides unified API for both web (IndexedDB) and Electron (IPC) environments
 */

// Check if running in Electron
const isElectron = typeof window !== "undefined" && window.electronAPI !== undefined;

/**
 * Electron-compatible core operations
 * Falls back to direct core access in web environment
 */
export const electronBridge = {
  isElectron: () => isElectron,

  // Board operations
  async createBoard(data?: any) {
    if (isElectron && window.electronAPI) {
      const response = await window.electronAPI.createBoard(data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    }
    // Web: Use direct core access (handled by CoreProvider)
    throw new Error("Not in Electron environment - use CoreContext");
  },

  async updateBoard(id: string, data: any) {
    if (isElectron && window.electronAPI) {
      const response = await window.electronAPI.updateBoard(id, data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    }
    throw new Error("Not in Electron environment - use CoreContext");
  },

  async deleteBoard(id: string) {
    if (isElectron && window.electronAPI) {
      const response = await window.electronAPI.deleteBoard(id);
      if (!response.success) throw new Error(response.error);
      return response.data;
    }
    throw new Error("Not in Electron environment - use CoreContext");
  },

  async getAllBoards() {
    if (isElectron && window.electronAPI) {
      const response = await window.electronAPI.getAllBoards();
      if (!response.success) throw new Error(response.error);
      return response.data;
    }
    throw new Error("Not in Electron environment - use CoreContext");
  },

  // Note operations
  async createNote(boardId: string, data?: any) {
    if (isElectron && window.electronAPI) {
      const response = await window.electronAPI.createNote(boardId, data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    }
    throw new Error("Not in Electron environment - use CoreContext");
  },

  async updateNote(boardId: string, noteId: string, data: any) {
    if (isElectron && window.electronAPI) {
      const response = await window.electronAPI.updateNote(boardId, noteId, data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    }
    throw new Error("Not in Electron environment - use CoreContext");
  },

  async deleteNote(boardId: string, noteId: string) {
    if (isElectron && window.electronAPI) {
      const response = await window.electronAPI.deleteNote(boardId, noteId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    }
    throw new Error("Not in Electron environment - use CoreContext");
  },

  // History operations
  async undo() {
    if (isElectron && window.electronAPI) {
      const response = await window.electronAPI.undo();
      if (!response.success) throw new Error(response.error);
      return response.data;
    }
    throw new Error("Not in Electron environment - use CoreContext");
  },

  async redo() {
    if (isElectron && window.electronAPI) {
      const response = await window.electronAPI.redo();
      if (!response.success) throw new Error(response.error);
      return response.data;
    }
    throw new Error("Not in Electron environment - use CoreContext");
  },

  async canUndo() {
    if (isElectron && window.electronAPI) {
      return await window.electronAPI.canUndo();
    }
    return false;
  },

  async canRedo() {
    if (isElectron && window.electronAPI) {
      return await window.electronAPI.canRedo();
    }
    return false;
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

