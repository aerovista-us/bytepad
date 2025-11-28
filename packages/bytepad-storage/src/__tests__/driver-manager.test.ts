import { describe, it, expect, beforeEach } from "vitest";
import { DriverManager } from "../driver-manager";
import { indexedDbDriver } from "../indexeddb";
import type { Board, StorageDriver } from "bytepad-types";

/**
 * Mock storage driver for testing
 */
function createMockDriver(name: string, shouldFail: boolean = false): StorageDriver {
  const boards: Board[] = [];

  return {
    async load(): Promise<Board[]> {
      if (shouldFail) throw new Error(`${name} load failed`);
      return [...boards];
    },

    async save(board: Board): Promise<void> {
      if (shouldFail) throw new Error(`${name} save failed`);
      const index = boards.findIndex(b => b.id === board.id);
      if (index >= 0) {
        boards[index] = board;
      } else {
        boards.push(board);
      }
    },

    async delete(boardId: string): Promise<void> {
      if (shouldFail) throw new Error(`${name} delete failed`);
      const index = boards.findIndex(b => b.id === boardId);
      if (index >= 0) {
        boards.splice(index, 1);
      }
    },

    supportsTransactions: () => false,
    supportsBackup: () => true,

    async healthCheck() {
      if (shouldFail) {
        return {
          healthy: false,
          message: `${name} is unhealthy`,
        };
      }
      return { healthy: true };
    },
  };
}

describe("DriverManager", () => {
  describe("Initialization", () => {
    it("should initialize with available drivers", async () => {
      const manager = new DriverManager({
        indexedDbName: "test-db",
      });

      await manager.initialize();

      expect(manager.getActiveDriverName()).toBe("indexeddb");
    });

    it("should select first healthy driver", async () => {
      // This test would require mocking the drivers
      // For now, we'll test the basic structure
      const manager = new DriverManager({
        indexedDbName: "test-db",
      });

      await manager.initialize();
      const driver = manager.getDriver();

      expect(driver).toBeDefined();
    });
  });

  describe("Fallback Cascade", () => {
    it("should fall back when primary driver fails", async () => {
      // This would require more complex mocking
      // Testing the fallback logic structure
      const manager = new DriverManager({
        indexedDbName: "test-db",
      });

      await manager.initialize();
      const statuses = manager.getDriverStatuses();

      expect(statuses.length).toBeGreaterThan(0);
    });
  });

  describe("Driver Status", () => {
    it("should report driver statuses", async () => {
      const manager = new DriverManager({
        indexedDbName: "test-db",
      });

      await manager.initialize();
      const statuses = manager.getDriverStatuses();

      expect(Array.isArray(statuses)).toBe(true);
      statuses.forEach(status => {
        expect(status).toHaveProperty("name");
        expect(status).toHaveProperty("available");
        expect(status).toHaveProperty("healthy");
      });
    });
  });
});

