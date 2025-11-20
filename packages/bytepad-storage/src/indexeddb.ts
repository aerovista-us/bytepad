import { openDB, IDBPDatabase } from "idb";
import type { Note } from "bytepad-types";

export function indexedDbDriver(dbName = "bytepad") {
  let db: IDBPDatabase<any> | null = null;

  async function getDb(): Promise<IDBPDatabase<any>> {
    if (!db) {
      db = await openDB(dbName, 1, {
        upgrade(database) {
          if (!database.objectStoreNames.contains("notes")) {
            database.createObjectStore("notes", { keyPath: "id" });
          }
        },
      });
    }
    return db;
  }

  return {
    async load(): Promise<Note[]> {
      const d = await getDb();
      return await d.getAll("notes");
    },

    async save(note: Note): Promise<void> {
      const d = await getDb();
      await d.put("notes", note);
    },

    async delete(id: string): Promise<void> {
      const d = await getDb();
      await d.delete("notes", id);
    },
  };
}
