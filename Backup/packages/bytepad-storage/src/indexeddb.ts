import { openDB, IDBPDatabase } from "idb";
import type { Board, StorageDriver, StorageDriverHealth } from "bytepad-types";

export function indexedDbDriver(dbName = "bytepad"): StorageDriver {
  let db: IDBPDatabase<any> | null = null;

  async function getDb(): Promise<IDBPDatabase<any>> {
    if (!db) {
      db = await openDB(dbName, 2, {
        upgrade(database, oldVersion, newVersion, transaction) {
          // Migration from v1 (notes) to v2 (boards)
          if (oldVersion < 2) {
            // Create boards store first
            if (!database.objectStoreNames.contains("boards")) {
              database.createObjectStore("boards", { keyPath: "id" });
            }
            
            // Migrate old notes to a default board if they exist
            // This must be done synchronously within the transaction
            if (database.objectStoreNames.contains("notes")) {
              const notesStore = transaction.objectStore("notes");
              const boardsStore = transaction.objectStore("boards");
              
              // Use getAll() which returns a promise-like request
              const request = notesStore.getAll();
              
              request.onsuccess = () => {
                const oldNotes = request.result;
                if (oldNotes && oldNotes.length > 0) {
                  // Create a default board with migrated notes
                  const defaultBoard: Board = {
                    id: "default-board",
                    name: "Migrated Board",
                    theme: "default",
                    notes: oldNotes.map((note: any) => ({
                      id: note.id || `note-${Date.now()}-${Math.random()}`,
                      geometry: { x: 0, y: 0, w: 200, h: 150, z: 0 },
                      contentHTML: note.content || note.contentHTML || "",
                      tags: note.tags || [],
                      color: note.color || "",
                      linkedAssets: [],
                      createdAt: note.createdAt || Date.now(),
                      updatedAt: note.updatedAt || Date.now(),
                    })),
                    assets: [],
                    playlists: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  };
                  
                  boardsStore.put(defaultBoard);
                }
              };
              
              request.onerror = () => {
                console.warn("Failed to migrate old notes:", request.error);
              };
            }
          } else {
            // Ensure boards store exists for new databases
            if (!database.objectStoreNames.contains("boards")) {
              database.createObjectStore("boards", { keyPath: "id" });
            }
          }
        },
      });
      
      // After database is opened, check if migration is needed
      // This handles the case where migration didn't complete in upgrade
      if (db.version === 2) {
        try {
          const notesStoreExists = db.objectStoreNames.contains("notes");
          const boardsStoreExists = db.objectStoreNames.contains("boards");
          
          if (notesStoreExists && boardsStoreExists) {
            // Check if we need to migrate
            const boards = await db.getAll("boards");
            const hasMigratedBoard = boards.some((b: any) => b.id === "default-board");
            
            if (!hasMigratedBoard) {
              // Perform migration in a new transaction
              const tx = db.transaction(["notes", "boards"], "readwrite");
              const notesStore = tx.objectStore("notes");
              const boardsStore = tx.objectStore("boards");
              
              const oldNotes = await notesStore.getAll();
              if (oldNotes && oldNotes.length > 0) {
                const defaultBoard: Board = {
                  id: "default-board",
                  name: "Migrated Board",
                  theme: "default",
                  notes: oldNotes.map((note: any) => ({
                    id: note.id || `note-${Date.now()}-${Math.random()}`,
                    geometry: { x: 0, y: 0, w: 200, h: 150, z: 0 },
                    contentHTML: note.content || note.contentHTML || "",
                    tags: note.tags || [],
                    color: note.color || "",
                    linkedAssets: [],
                    createdAt: note.createdAt || Date.now(),
                    updatedAt: note.updatedAt || Date.now(),
                  })),
                  assets: [],
                  playlists: [],
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                
                await boardsStore.put(defaultBoard);
              }
            }
          }
        } catch (err) {
          console.warn("Migration check failed:", err);
        }
      }
    }
    return db;
  }

  return {
    async load(): Promise<Board[]> {
      try {
        const d = await getDb();
        const boards = await d.getAll("boards");
        return boards || [];
      } catch (err) {
        console.error("Failed to load boards from IndexedDB", err);
        return [];
      }
    },

    async save(board: Board): Promise<void> {
      try {
        const d = await getDb();
        await d.put("boards", board);
      } catch (err) {
        console.error("Failed to save board to IndexedDB", err);
        throw err;
      }
    },

    async delete(boardId: string): Promise<void> {
      try {
        const d = await getDb();
        await d.delete("boards", boardId);
      } catch (err) {
        console.error("Failed to delete board from IndexedDB", err);
        throw err;
      }
    },

    supportsTransactions(): boolean {
      return true; // IndexedDB supports transactions
    },

    supportsBackup(): boolean {
      return true; // Can export/import all data
    },

    async healthCheck(): Promise<StorageDriverHealth> {
      try {
        const d = await getDb();
        // Try a simple read operation
        await d.getAll("boards");
        return { healthy: true };
      } catch (err: any) {
        return {
          healthy: false,
          message: err.message || "IndexedDB health check failed",
          lastError: err,
        };
      }
    },
  };
}
