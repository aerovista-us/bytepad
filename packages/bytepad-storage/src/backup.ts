/**
 * Backup system for BytePad storage
 * Provides automatic backups and recovery functionality
 */

import type { Board } from "bytepad-types";

export interface BackupMetadata {
  id: string;
  timestamp: number;
  boardCount: number;
  version: number;
}

export interface BackupData {
  metadata: BackupMetadata;
  boards: Board[];
}

export class BackupManager {
  private storage: Storage;
  private maxBackups: number = 10;
  private backupPrefix: string = "bytepad-backup-";

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  /**
   * Create a backup of all boards
   */
  async createBackup(boards: Board[]): Promise<BackupMetadata> {
    const backupId = `backup-${Date.now()}`;
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: Date.now(),
      boardCount: boards.length,
      version: 1,
    };

    const backup: BackupData = {
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
  listBackups(): BackupMetadata[] {
    const backups: BackupMetadata[] = [];
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.backupPrefix)) {
        try {
          const data = this.storage.getItem(key);
          if (data) {
            const backup: BackupData = JSON.parse(data);
            backups.push(backup.metadata);
          }
        } catch (err) {
          console.warn(`Failed to parse backup ${key}:`, err);
        }
      }
    }

    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Restore a backup by ID
   */
  async restoreBackup(backupId: string): Promise<Board[]> {
    const key = `${this.backupPrefix}${backupId}`;
    const data = this.storage.getItem(key);
    
    if (!data) {
      throw new Error(`Backup ${backupId} not found`);
    }

    const backup: BackupData = JSON.parse(data);
    return backup.boards;
  }

  /**
   * Delete a backup
   */
  deleteBackup(backupId: string): void {
    const key = `${this.backupPrefix}${backupId}`;
    this.storage.removeItem(key);
  }

  /**
   * Clean up old backups, keeping only the most recent ones
   */
  private cleanupOldBackups(): void {
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
  getLatestBackup(): BackupMetadata | null {
    const backups = this.listBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  /**
   * Export backup to JSON string
   */
  async exportBackup(backupId: string): Promise<string> {
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
  async importBackup(jsonData: string): Promise<BackupMetadata> {
    const backup: BackupData = JSON.parse(jsonData);
    
    // Validate backup structure
    if (!backup.metadata || !backup.boards) {
      throw new Error("Invalid backup format");
    }

    const key = `${this.backupPrefix}${backup.metadata.id}`;
    this.storage.setItem(key, jsonData);

    return backup.metadata;
  }
}

