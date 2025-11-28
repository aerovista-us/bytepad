"use strict";
/**
 * Backup system for BytePad storage
 * Provides automatic backups and recovery functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupManager = void 0;
class BackupManager {
    constructor(storage = localStorage) {
        this.maxBackups = 10;
        this.backupPrefix = "bytepad-backup-";
        this.storage = storage;
    }
    /**
     * Create a backup of all boards
     */
    async createBackup(boards) {
        const backupId = `backup-${Date.now()}`;
        const metadata = {
            id: backupId,
            timestamp: Date.now(),
            boardCount: boards.length,
            version: 1,
        };
        const backup = {
            metadata,
            boards: JSON.parse(JSON.stringify(boards)), // Deep clone
        };
        const key = `${this.backupPrefix}${backupId}`;
        this.storage.setItem(key, JSON.stringify(backup));
        // Clean up old backups
        this.cleanupOldBackups();
        return metadata;
    }
    /**
     * List all available backups
     */
    listBackups() {
        const backups = [];
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(this.backupPrefix)) {
                try {
                    const data = this.storage.getItem(key);
                    if (data) {
                        const backup = JSON.parse(data);
                        backups.push(backup.metadata);
                    }
                }
                catch (err) {
                    console.warn(`Failed to parse backup ${key}:`, err);
                }
            }
        }
        return backups.sort((a, b) => b.timestamp - a.timestamp);
    }
    /**
     * Restore a backup by ID
     */
    async restoreBackup(backupId) {
        const key = `${this.backupPrefix}${backupId}`;
        const data = this.storage.getItem(key);
        if (!data) {
            throw new Error(`Backup ${backupId} not found`);
        }
        const backup = JSON.parse(data);
        return backup.boards;
    }
    /**
     * Delete a backup
     */
    deleteBackup(backupId) {
        const key = `${this.backupPrefix}${backupId}`;
        this.storage.removeItem(key);
    }
    /**
     * Clean up old backups, keeping only the most recent ones
     */
    cleanupOldBackups() {
        const backups = this.listBackups();
        if (backups.length > this.maxBackups) {
            const toDelete = backups.slice(this.maxBackups);
            toDelete.forEach((backup) => {
                this.deleteBackup(backup.id);
            });
        }
    }
    /**
     * Get the most recent backup
     */
    getLatestBackup() {
        const backups = this.listBackups();
        return backups.length > 0 ? backups[0] : null;
    }
    /**
     * Export backup to JSON string
     */
    async exportBackup(backupId) {
        const key = `${this.backupPrefix}${backupId}`;
        const data = this.storage.getItem(key);
        if (!data) {
            throw new Error(`Backup ${backupId} not found`);
        }
        return data;
    }
    /**
     * Import backup from JSON string
     */
    async importBackup(jsonData) {
        const backup = JSON.parse(jsonData);
        // Validate backup structure
        if (!backup.metadata || !backup.boards) {
            throw new Error("Invalid backup format");
        }
        const key = `${this.backupPrefix}${backup.metadata.id}`;
        this.storage.setItem(key, jsonData);
        return backup.metadata;
    }
}
exports.BackupManager = BackupManager;
