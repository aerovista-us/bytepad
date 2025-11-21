import { contextBridge, ipcRenderer } from "electron";

/**
 * Preload script - Security bridge between renderer and main process
 * Exposes safe IPC methods to the renderer process
 * 
 * Security: No Node.js access from renderer, all operations go through IPC
 */

// Type-safe IPC API for renderer
export interface ElectronAPI {
  // Board operations
  createBoard: (data?: any) => Promise<any>;
  updateBoard: (id: string, data: any) => Promise<any>;
  deleteBoard: (id: string) => Promise<any>;
  getBoard: (id: string) => Promise<any>;
  getAllBoards: () => Promise<any>;
  
  // Note operations
  createNote: (boardId: string, data?: any) => Promise<any>;
  updateNote: (boardId: string, noteId: string, data: any) => Promise<any>;
  deleteNote: (boardId: string, noteId: string) => Promise<any>;
  getNote: (id: string) => Promise<any>;
  getAllNotes: () => Promise<any>;
  
  // History operations
  undo: () => Promise<any>;
  redo: () => Promise<any>;
  canUndo: () => Promise<boolean>;
  canRedo: () => Promise<boolean>;
  
  // Backup operations
  createBackup: () => Promise<any>;
  listBackups: () => Promise<any>;
  restoreBackup: (backupId: string) => Promise<any>;
  exportBackup: (backupId: string) => Promise<string>;
  importBackup: (jsonData: string) => Promise<any>;
  
  // Legacy migration
  importLegacyData: (jsonString: string) => Promise<any>;
  
  // Platform info
  platform: string;
  versions: NodeJS.ProcessVersions;
}

// Expose protected methods to renderer
contextBridge.exposeInMainWorld("electronAPI", {
  // Board operations
  createBoard: (data?: any) => ipcRenderer.invoke("core:createBoard", { data }),
  updateBoard: (id: string, data: any) => ipcRenderer.invoke("core:updateBoard", { id, data }),
  deleteBoard: (id: string) => ipcRenderer.invoke("core:deleteBoard", { id }),
  getBoard: (id: string) => ipcRenderer.invoke("core:getBoard", id),
  getAllBoards: () => ipcRenderer.invoke("core:getAllBoards"),
  
  // Note operations
  createNote: (boardId: string, data?: any) => ipcRenderer.invoke("core:createNote", { boardId, data }),
  updateNote: (boardId: string, noteId: string, data: any) => ipcRenderer.invoke("core:updateNote", { boardId, noteId, data }),
  deleteNote: (boardId: string, noteId: string) => ipcRenderer.invoke("core:deleteNote", { boardId, noteId }),
  getNote: (id: string) => ipcRenderer.invoke("core:getNote", id),
  getAllNotes: () => ipcRenderer.invoke("core:getAllNotes"),
  
  // History operations
  undo: () => ipcRenderer.invoke("core:undo"),
  redo: () => ipcRenderer.invoke("core:redo"),
  canUndo: () => ipcRenderer.invoke("core:canUndo"),
  canRedo: () => ipcRenderer.invoke("core:canRedo"),
  
  // Backup operations
  createBackup: () => ipcRenderer.invoke("core:createBackup"),
  listBackups: () => ipcRenderer.invoke("core:listBackups"),
  restoreBackup: (backupId: string) => ipcRenderer.invoke("core:restoreBackup", backupId),
  exportBackup: (backupId: string) => ipcRenderer.invoke("core:exportBackup", backupId),
  importBackup: (jsonData: string) => ipcRenderer.invoke("core:importBackup", jsonData),
  
  // Legacy migration
  importLegacyData: (jsonString: string) => ipcRenderer.invoke("core:importLegacyData", jsonString),
  
  // Platform info
  platform: process.platform,
  versions: process.versions,
} as ElectronAPI);

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

