/**
 * History management for undo/redo functionality
 */

import type { Board, Note } from "bytepad-types";

export interface HistoryEntry {
  type: "board" | "note";
  action: "create" | "update" | "delete";
  boardId: string;
  noteId?: string;
  data: Board | Note | null; // null for delete, data for create/update
  timestamp: number;
}

export class HistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  push(entry: HistoryEntry) {
    // Remove any entries after current index (when undoing and then making new changes)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new entry
    this.history.push(entry);
    this.currentIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  undo(): HistoryEntry | null {
    if (!this.canUndo()) return null;
    
    const entry = this.history[this.currentIndex];
    this.currentIndex--;
    return entry;
  }

  redo(): HistoryEntry | null {
    if (!this.canRedo()) return null;
    
    this.currentIndex++;
    return this.history[this.currentIndex];
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  getHistory(): readonly HistoryEntry[] {
    return this.history;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }
}

