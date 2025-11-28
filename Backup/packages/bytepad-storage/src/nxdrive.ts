import type { Board, StorageDriver, StorageDriverHealth } from "bytepad-types";

/**
 * NXDrive JSON driver for NXCore Panel
 * Reads/writes to NXDrive JSON file via API or direct file access
 * 
 * Note: This is a placeholder implementation. The actual implementation
 * will depend on how NXCore exposes the NXDrive API.
 */
export function nxdriveDriver(filePath: string): StorageDriver {
  // In a real implementation, this would use NXCore APIs or direct file access
  // For now, this is a browser-compatible version that uses fetch API
  
  return {
    async load(): Promise<Board[]> {
      try {
        // In NXCore, this would read from /srv/NXDrive/.../bytepad-boards.json
        // For now, try to fetch from the file path
        if (typeof window !== "undefined" && window.fetch) {
          const response = await fetch(filePath);
          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
          }
        }
        
        // Fallback: return empty array if file doesn't exist or can't be accessed
        return [];
      } catch (err) {
        console.error("Failed to load boards from NXDrive", err);
        return [];
      }
    },

    async save(board: Board): Promise<void> {
      try {
        // In NXCore, this would write to /srv/NXDrive/.../bytepad-boards.json
        // For now, try to use fetch PUT or POST
        if (typeof window !== "undefined" && window.fetch) {
          // Load existing boards
          const existing = await this.load();
          
          // Update or add the board
          const index = existing.findIndex(b => b.id === board.id);
          if (index >= 0) {
            existing[index] = board;
          } else {
            existing.push(board);
          }
          
          // Save back (this would need a proper API endpoint in NXCore)
          // For now, we'll just log - actual implementation needs NXCore API
          console.warn("NXDrive save not fully implemented - needs NXCore API endpoint");
        }
      } catch (err) {
        console.error("Failed to save board to NXDrive", err);
        throw err;
      }
    },

    async delete(boardId: string): Promise<void> {
      try {
        // Load existing boards
        const existing = await this.load();
        
        // Filter out the deleted board
        const filtered = existing.filter(b => b.id !== boardId);
        
        // Save back (this would need a proper API endpoint in NXCore)
        // For now, we'll just log - actual implementation needs NXCore API
        console.warn("NXDrive delete not fully implemented - needs NXCore API endpoint");
      } catch (err) {
        console.error("Failed to delete board from NXDrive", err);
        throw err;
      }
    },

    supportsTransactions(): boolean {
      return false; // NXDrive JSON file doesn't support transactions
    },

    supportsBackup(): boolean {
      return true; // Can backup JSON file
    },

    async healthCheck(): Promise<StorageDriverHealth> {
      try {
        // Try to access the file path
        if (typeof window !== "undefined" && window.fetch) {
          const response = await fetch(filePath, { method: "HEAD" });
          if (response.ok || response.status === 404) {
            // 404 is OK - file doesn't exist yet but path is accessible
            return { healthy: true };
          }
          return {
            healthy: false,
            message: `NXDrive endpoint returned status ${response.status}`,
          };
        }
        return {
          healthy: false,
          message: "NXDrive not available (not in browser environment)",
        };
      } catch (err: any) {
        return {
          healthy: false,
          message: err.message || "NXDrive health check failed",
          lastError: err,
        };
      }
    },
  };
}

