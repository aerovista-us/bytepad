"use strict";
/**
 * Migration utilities for importing data from old BytePad versions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLegacyNote = migrateLegacyNote;
exports.migrateLegacyWorkspace = migrateLegacyWorkspace;
exports.migrateFromLegacyFormat = migrateFromLegacyFormat;
exports.importLegacyData = importLegacyData;
const uuid_1 = require("uuid");
/**
 * Migrate legacy note format to new format
 */
function migrateLegacyNote(legacy) {
    return {
        id: legacy.id || (0, uuid_1.v4)(),
        geometry: {
            x: legacy.x ?? 0,
            y: legacy.y ?? 0,
            w: legacy.width ?? 200,
            h: legacy.height ?? 150,
            z: 0,
        },
        contentHTML: legacy.contentHTML || legacy.content || "",
        tags: legacy.tags || [],
        color: legacy.color || "",
        linkedAssets: [],
        createdAt: legacy.createdAt || Date.now(),
        updatedAt: legacy.updatedAt || Date.now(),
    };
}
/**
 * Migrate legacy workspace/board format to new Board format
 */
function migrateLegacyWorkspace(legacy) {
    const notes = (legacy.notes || []).map(migrateLegacyNote);
    return {
        id: legacy.id || (0, uuid_1.v4)(),
        name: legacy.name || "Migrated Board",
        theme: "default",
        notes,
        assets: [],
        playlists: [],
        createdAt: legacy.createdAt || Date.now(),
        updatedAt: legacy.updatedAt || Date.now(),
    };
}
/**
 * Migrate from old BytePad JSON export format
 * Supports multiple formats:
 * - Array of notes
 * - Object with notes array
 * - Array of workspaces/boards
 */
function migrateFromLegacyFormat(data) {
    const boards = [];
    // Case 1: Array of notes
    if (Array.isArray(data) && data.length > 0 && !data[0].notes) {
        const notes = data.map(migrateLegacyNote);
        boards.push({
            id: (0, uuid_1.v4)(),
            name: "Migrated Board",
            theme: "default",
            notes,
            assets: [],
            playlists: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }
    // Case 2: Single workspace/board object
    else if (data && typeof data === "object" && !Array.isArray(data)) {
        if (data.notes && Array.isArray(data.notes)) {
            boards.push(migrateLegacyWorkspace(data));
        }
        else if (data.workspaces && Array.isArray(data.workspaces)) {
            // Multiple workspaces
            boards.push(...data.workspaces.map(migrateLegacyWorkspace));
        }
        else if (data.boards && Array.isArray(data.boards)) {
            // Already in board format, but might need migration
            boards.push(...data.boards.map((b) => {
                if (b.notes && Array.isArray(b.notes) && b.notes.length > 0) {
                    // Check if notes need migration
                    const firstNote = b.notes[0];
                    if (!firstNote.geometry && (firstNote.x !== undefined || firstNote.y !== undefined)) {
                        // Legacy format
                        return migrateLegacyWorkspace(b);
                    }
                }
                return b;
            }));
        }
    }
    // Case 3: Array of workspaces/boards
    else if (Array.isArray(data) && data.length > 0 && data[0].notes) {
        boards.push(...data.map(migrateLegacyWorkspace));
    }
    return boards;
}
/**
 * Import from old BytePad JSON file
 */
async function importLegacyData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        return migrateFromLegacyFormat(data);
    }
    catch (err) {
        throw new Error(`Failed to parse legacy data: ${err}`);
    }
}
