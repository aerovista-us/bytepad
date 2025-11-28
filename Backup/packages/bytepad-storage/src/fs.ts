import { promises as fs } from "fs";
import { join, dirname } from "path";
import type { Board, StorageDriver, StorageDriverHealth } from "bytepad-types";

export function fsDriver(boardsPath: string): StorageDriver {
  const boardsDir = boardsPath;

  // Ensure boards directory exists
  async function ensureBoardsDir() {
    try {
      await fs.mkdir(boardsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, that's fine
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
        throw err;
      }
    }
  }

  return {
    async load(): Promise<Board[]> {
      try {
        await ensureBoardsDir();
        
        const entries = await fs.readdir(boardsDir, { withFileTypes: true });
        const boards: Board[] = [];

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const boardId = entry.name;
            const boardJsonPath = join(boardsDir, boardId, "board.json");
            
            try {
              const boardData = await fs.readFile(boardJsonPath, "utf-8");
              const board: Board = JSON.parse(boardData);
              boards.push(board);
            } catch (err) {
              console.warn(`Failed to load board ${boardId}:`, err);
              // Continue loading other boards
            }
          }
        }

        return boards;
      } catch (err) {
        console.error("Failed to load boards from filesystem", err);
        throw err;
      }
    },

    async save(board: Board): Promise<void> {
      try {
        await ensureBoardsDir();
        
        const boardDir = join(boardsDir, board.id);
        const boardJsonPath = join(boardDir, "board.json");
        const assetsDir = join(boardDir, "assets");

        // Ensure board directory exists
        await fs.mkdir(boardDir, { recursive: true });
        
        // Ensure assets directory exists
        await fs.mkdir(assetsDir, { recursive: true });

        // Save board.json
        await fs.writeFile(boardJsonPath, JSON.stringify(board, null, 2), "utf-8");

        // Note: Asset files are managed separately by the application
        // This driver only handles the board.json file
      } catch (err) {
        console.error("Failed to save board to filesystem", err);
        throw err;
      }
    },

    async delete(boardId: string): Promise<void> {
      try {
        const boardDir = join(boardsDir, boardId);
        
        // Remove entire board directory (including assets)
        await fs.rm(boardDir, { recursive: true, force: true });
      } catch (err) {
        console.error("Failed to delete board from filesystem", err);
        throw err;
      }
    },

    supportsTransactions(): boolean {
      return false; // Filesystem doesn't support atomic transactions across multiple files
    },

    supportsBackup(): boolean {
      return true; // Can backup entire directory
    },

    async healthCheck(): Promise<StorageDriverHealth> {
      try {
        await ensureBoardsDir();
        // Try to read the directory
        await fs.readdir(boardsDir);
        return { healthy: true };
      } catch (err: any) {
        return {
          healthy: false,
          message: err.message || "Filesystem health check failed",
          lastError: err,
        };
      }
    },
  };
}

