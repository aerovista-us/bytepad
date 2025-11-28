import { describe, it, expect, beforeEach } from "vitest";
import { BytePadCore } from "../index";
import type { Board, StorageDriver } from "bytepad-types";

/**
 * Mock storage driver for testing
 */
function createMockDriver(): StorageDriver {
  const boards: Board[] = [];

  return {
    async load(): Promise<Board[]> {
      return [...boards];
    },

    async save(board: Board): Promise<void> {
      const index = boards.findIndex(b => b.id === board.id);
      if (index >= 0) {
        boards[index] = board;
      } else {
        boards.push(board);
      }
    },

    async delete(boardId: string): Promise<void> {
      const index = boards.findIndex(b => b.id === boardId);
      if (index >= 0) {
        boards.splice(index, 1);
      }
    },
  };
}

describe("BytePadCore", () => {
  let core: BytePadCore;
  let mockStorage: StorageDriver;

  beforeEach(() => {
    mockStorage = createMockDriver();
    core = new BytePadCore({ storage: mockStorage });
  });

  describe("Initialization", () => {
    it("should initialize with empty boards", async () => {
      await core.init();
      expect(core.getAllBoards()).toEqual([]);
    });

    it("should load boards from storage", async () => {
      const testBoard: Board = {
        id: "test-1",
        name: "Test Board",
        theme: "default",
        notes: [],
        assets: [],
        playlists: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await mockStorage.save(testBoard);
      await core.init();

      const boards = core.getAllBoards();
      expect(boards).toHaveLength(1);
      expect(boards[0].id).toBe("test-1");
    });
  });

  describe("Board CRUD", () => {
    beforeEach(async () => {
      await core.init();
    });

    it("should create a board", async () => {
      const board = await core.createBoard({ name: "New Board" });
      
      expect(board.id).toBeDefined();
      expect(board.name).toBe("New Board");
      expect(core.getAllBoards()).toHaveLength(1);
    });

    it("should get a board by id", async () => {
      const board = await core.createBoard({ name: "Test Board" });
      const retrieved = core.getBoard(board.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Test Board");
    });

    it("should update a board", async () => {
      const board = await core.createBoard({ name: "Original" });
      const updated = await core.updateBoard(board.id, { name: "Updated" });
      
      expect(updated?.name).toBe("Updated");
      expect(core.getBoard(board.id)?.name).toBe("Updated");
    });

    it("should delete a board", async () => {
      const board = await core.createBoard({ name: "To Delete" });
      await core.deleteBoard(board.id);
      
      expect(core.getBoard(board.id)).toBeUndefined();
      expect(core.getAllBoards()).toHaveLength(0);
    });
  });

  describe("Note CRUD", () => {
    let board: Board;

    beforeEach(async () => {
      await core.init();
      board = await core.createBoard({ name: "Test Board" });
    });

    it("should create a note", async () => {
      const note = await core.createNote(board.id, {
        contentHTML: "<p>Test note</p>",
      });

      expect(note.id).toBeDefined();
      expect(note.contentHTML).toBe("<p>Test note</p>");
      
      const updatedBoard = core.getBoard(board.id);
      expect(updatedBoard?.notes).toHaveLength(1);
    });

    it("should update a note", async () => {
      const note = await core.createNote(board.id, {
        contentHTML: "<p>Original</p>",
      });

      const updated = await core.updateNote(board.id, note.id, {
        contentHTML: "<p>Updated</p>",
      });

      expect(updated?.contentHTML).toBe("<p>Updated</p>");
    });

    it("should delete a note", async () => {
      const note = await core.createNote(board.id, {
        contentHTML: "<p>To delete</p>",
      });

      await core.deleteNote(board.id, note.id);

      const updatedBoard = core.getBoard(board.id);
      expect(updatedBoard?.notes).toHaveLength(0);
    });
  });

  describe("History / Undo-Redo", () => {
    beforeEach(async () => {
      await core.init();
    });

    it("should track history", async () => {
      const board = await core.createBoard({ name: "Test" });
      expect(await core.canUndo()).toBe(true);
      expect(await core.canRedo()).toBe(false);
    });

    it("should undo operations", async () => {
      const board = await core.createBoard({ name: "Original" });
      await core.updateBoard(board.id, { name: "Updated" });
      
      await core.undo();
      
      expect(core.getBoard(board.id)?.name).toBe("Original");
    });

    it("should redo operations", async () => {
      const board = await core.createBoard({ name: "Original" });
      await core.updateBoard(board.id, { name: "Updated" });
      await core.undo();
      
      await core.redo();
      
      expect(core.getBoard(board.id)?.name).toBe("Updated");
    });
  });
});

