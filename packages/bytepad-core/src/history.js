"use strict";
/**
 * History management for undo/redo functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryManager = void 0;
class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 50;
    }
    push(entry) {
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
    canUndo() {
        return this.currentIndex >= 0;
    }
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }
    undo() {
        if (!this.canUndo())
            return null;
        const entry = this.history[this.currentIndex];
        this.currentIndex--;
        return entry;
    }
    redo() {
        if (!this.canRedo())
            return null;
        this.currentIndex++;
        return this.history[this.currentIndex];
    }
    clear() {
        this.history = [];
        this.currentIndex = -1;
    }
    getHistory() {
        return this.history;
    }
    getCurrentIndex() {
        return this.currentIndex;
    }
}
exports.HistoryManager = HistoryManager;
