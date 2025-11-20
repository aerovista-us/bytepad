import { EventEmitter } from "events";
import { v4 as uuid } from "uuid";
import type { Note, Plugin, SyncEvent, CoreConfig } from "bytepad-types";

export class BytePadCore {
  notes: Map<string, Note> = new Map();
  plugins: Plugin[] = [];
  events = new EventEmitter();
  storage: CoreConfig["storage"];
  syncQueue: SyncEvent[] = [];

  constructor(config: CoreConfig) {
    this.storage = config.storage;
  }

  async init() {
    const loaded = await this.storage.load();
    loaded.forEach((note: Note) => this.notes.set(note.id, note));

    this.plugins.forEach((p) => p.onInit?.(this));
  }

  registerPlugin(plugin: Plugin) {
    this.plugins.push(plugin);
    plugin.onRegister?.(this);
  }

  getAllNotes(): Note[] {
    return Array.from(this.notes.values());
  }

  getNote(id: string): Note | undefined {
    return this.notes.get(id);
  }

  async createNote(data?: Partial<Note>): Promise<Note> {
    const note: Note = {
      id: uuid(),
      title: data?.title ?? "",
      content: data?.content ?? "",
      tags: data?.tags ?? [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.notes.set(note.id, note);
    await this.persist(note);
    this.broadcast("noteCreated", note);

    return note;
  }

  async updateNote(id: string, data: Partial<Note>): Promise<Note | undefined> {
    const existing = this.notes.get(id);
    if (!existing) return;

    const updated: Note = { ...existing, ...data, updatedAt: Date.now() };
    this.notes.set(id, updated);

    await this.persist(updated);
    this.broadcast("noteUpdated", updated);

    return updated;
  }

  async deleteNote(id: string): Promise<void> {
    this.notes.delete(id);
    await this.storage.delete(id);
    this.broadcast("noteDeleted", id);
  }

  enqueueSync(event: SyncEvent) {
    this.syncQueue.push(event);
    this.broadcast("syncQueued", event);
  }

  async flushSync() {
    for (const e of this.syncQueue) {
      for (const p of this.plugins) {
        if (p.onSync) {
          await p.onSync(e, this);
        }
      }
    }
    this.syncQueue = [];
    this.broadcast("syncFlushed");
  }

  private async persist(note: Note) {
    await this.storage.save(note);
    this.enqueueSync({ type: "update", payload: note });
  }

  broadcast(event: string, payload?: any) {
    this.events.emit(event, payload);
    this.plugins.forEach((p: any) => {
      const handler = (p as any)[event];
      if (typeof handler === "function") {
        handler(payload, this);
      }
    });
  }
}
