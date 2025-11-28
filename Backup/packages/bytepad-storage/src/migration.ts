/**
 * Migration utilities for importing data from old BytePad versions
 */

import type { Board, Note } from "bytepad-types";
import { v4 as uuid } from "uuid";

/**
 * Legacy note format from old BytePad
 */
export interface LegacyNote {
  id?: string;
  content?: string;
  contentHTML?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  tags?: string[];
  color?: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Legacy board/workspace format
 */
export interface LegacyWorkspace {
  id?: string;
  name?: string;
  notes?: LegacyNote[];
  [key: string]: any;
}

/**
 * Migrate legacy note format to new format
 */
export function migrateLegacyNote(legacy: LegacyNote): Note {
  return {
    id: legacy.id || uuid(),
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
export function migrateLegacyWorkspace(legacy: LegacyWorkspace): Board {
  const notes = (legacy.notes || []).map(migrateLegacyNote);

  return {
    id: legacy.id || uuid(),
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
export function migrateFromLegacyFormat(data: any): Board[] {
  const boards: Board[] = [];

  // Case 1: Array of notes
  if (Array.isArray(data) && data.length > 0 && !data[0].notes) {
    const notes = data.map(migrateLegacyNote);
    boards.push({
      id: uuid(),
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
    } else if (data.workspaces && Array.isArray(data.workspaces)) {
      // Multiple workspaces
      boards.push(...data.workspaces.map(migrateLegacyWorkspace));
    } else if (data.boards && Array.isArray(data.boards)) {
      // Already in board format, but might need migration
      boards.push(...data.boards.map((b: any) => {
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
export async function importLegacyData(jsonString: string): Promise<Board[]> {
  try {
    const data = JSON.parse(jsonString);
    return migrateFromLegacyFormat(data);
  } catch (err) {
    throw new Error(`Failed to parse legacy data: ${err}`);
  }
}

