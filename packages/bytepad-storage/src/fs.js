"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fsDriver = fsDriver;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Create a filesystem storage driver
 *
 * Stores boards as JSON files in a directory structure.
 * Each board is stored in its own directory with a board.json file.
 *
 * @param boardsPath - Path to the boards directory
 * @returns StorageDriver implementation for filesystem
 *
 * @example
 * ```typescript
 * const driver = fsDriver("/path/to/boards");
 * const core = new BytePadCore({ storage: driver });
 * ```
 */
function fsDriver(boardsPath) {
    const boardsDir = boardsPath;
    // Ensure boards directory exists
    async function ensureBoardsDir() {
        try {
            await fs_1.promises.mkdir(boardsDir, { recursive: true });
        }
        catch (err) {
            // Directory might already exist, that's fine
            if (err.code !== "EEXIST") {
                throw err;
            }
        }
    }
    return {
        async load() {
            try {
                await ensureBoardsDir();
                const entries = await fs_1.promises.readdir(boardsDir, { withFileTypes: true });
                const boards = [];
                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const boardId = entry.name;
                        const boardJsonPath = (0, path_1.join)(boardsDir, boardId, "board.json");
                        try {
                            const boardData = await fs_1.promises.readFile(boardJsonPath, "utf-8");
                            const board = JSON.parse(boardData);
                            boards.push(board);
                        }
                        catch (err) {
                            console.warn(`Failed to load board ${boardId}:`, err);
                            // Continue loading other boards
                        }
                    }
                }
                return boards;
            }
            catch (err) {
                console.error("Failed to load boards from filesystem", err);
                throw err;
            }
        },
        async save(board) {
            try {
                await ensureBoardsDir();
                const boardDir = (0, path_1.join)(boardsDir, board.id);
                const boardJsonPath = (0, path_1.join)(boardDir, "board.json");
                const assetsDir = (0, path_1.join)(boardDir, "assets");
                // Ensure board directory exists
                await fs_1.promises.mkdir(boardDir, { recursive: true });
                // Ensure assets directory exists
                await fs_1.promises.mkdir(assetsDir, { recursive: true });
                // Save board.json
                await fs_1.promises.writeFile(boardJsonPath, JSON.stringify(board, null, 2), "utf-8");
                // Note: Asset files are managed separately by the application
                // This driver only handles the board.json file
            }
            catch (err) {
                console.error("Failed to save board to filesystem", err);
                throw err;
            }
        },
        async delete(boardId) {
            try {
                const boardDir = (0, path_1.join)(boardsDir, boardId);
                // Remove entire board directory (including assets)
                await fs_1.promises.rm(boardDir, { recursive: true, force: true });
            }
            catch (err) {
                console.error("Failed to delete board from filesystem", err);
                throw err;
            }
        },
        supportsTransactions() {
            return false; // Filesystem doesn't support atomic transactions across multiple files
        },
        supportsBackup() {
            return true; // Can backup entire directory
        },
        async healthCheck() {
            try {
                await ensureBoardsDir();
                // Try to read the directory
                await fs_1.promises.readdir(boardsDir);
                return { healthy: true };
            }
            catch (err) {
                return {
                    healthy: false,
                    message: err.message || "Filesystem health check failed",
                    lastError: err,
                };
            }
        },
    };
}
