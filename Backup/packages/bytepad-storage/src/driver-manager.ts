import type { Board, StorageDriver, StorageDriverHealth } from "bytepad-types";
import { indexedDbDriver } from "./indexeddb";
import { fsDriver } from "./fs";
import { nxdriveDriver } from "./nxdrive";

/**
 * Driver manager with fallback cascade: NXDrive → Filesystem → IndexedDB
 */

export interface DriverManagerOptions {
  nxdrivePath?: string;
  fsPath?: string;
  indexedDbName?: string;
  enableMigration?: boolean; // Migrate data when falling back
}

export interface DriverStatus {
  name: string;
  available: boolean;
  healthy: boolean;
  health?: StorageDriverHealth;
  lastError?: Error;
}

export class DriverManager {
  private drivers: Array<{ name: string; driver: StorageDriver; priority: number }> = [];
  private activeDriver: StorageDriver | null = null;
  private activeDriverName: string = "none";
  private fallbackReason: string = "";
  private driverStatuses: Map<string, DriverStatus> = new Map();

  constructor(options: DriverManagerOptions = {}) {
    // Initialize drivers in priority order: NXDrive → FS → IndexedDB
    if (options.nxdrivePath) {
      this.drivers.push({
        name: "nxdrive",
        driver: nxdriveDriver(options.nxdrivePath),
        priority: 1,
      });
    }

    if (options.fsPath) {
      this.drivers.push({
        name: "filesystem",
        driver: fsDriver(options.fsPath),
        priority: 2,
      });
    }

    // IndexedDB is always available in browser, optional in Node
    if (typeof window !== "undefined" || options.indexedDbName) {
      this.drivers.push({
        name: "indexeddb",
        driver: indexedDbDriver(options.indexedDbName || "bytepad"),
        priority: 3,
      });
    }

    // Sort by priority
    this.drivers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check driver availability and health
   */
  private async checkDriverAvailability(
    driver: StorageDriver,
    name: string
  ): Promise<{ available: boolean; healthy: boolean; health?: StorageDriverHealth }> {
    try {
      // Try health check if available
      if (driver.healthCheck) {
        const health = await driver.healthCheck();
        return {
          available: true,
          healthy: health.healthy,
          health,
        };
      }

      // Fallback: try a lightweight operation
      try {
        await driver.load();
        return { available: true, healthy: true };
      } catch (err) {
        return {
          available: true,
          healthy: false,
          health: {
            healthy: false,
            message: (err as Error).message,
            lastError: err as Error,
          },
        };
      }
    } catch (err) {
      return {
        available: false,
        healthy: false,
        health: {
          healthy: false,
          message: (err as Error).message,
          lastError: err as Error,
        },
      };
    }
  }

  /**
   * Initialize and select the best available driver
   */
  async initialize(): Promise<void> {
    // Check all drivers
    for (const { name, driver } of this.drivers) {
      const status = await this.checkDriverAvailability(driver, name);
      this.driverStatuses.set(name, {
        name,
        ...status,
      });

      // Use the first healthy driver
      if (status.available && status.healthy && !this.activeDriver) {
        this.activeDriver = driver;
        this.activeDriverName = name;
        this.fallbackReason = "";
      }
    }

    // If no driver is healthy, use the first available one (with warning)
    if (!this.activeDriver && this.drivers.length > 0) {
      const firstDriver = this.drivers[0];
      this.activeDriver = firstDriver.driver;
      this.activeDriverName = firstDriver.name;
      this.fallbackReason = "No healthy driver found, using first available";
    }

    if (!this.activeDriver) {
      throw new Error("No storage drivers available");
    }
  }

  /**
   * Get the active driver
   */
  getDriver(): StorageDriver {
    if (!this.activeDriver) {
      throw new Error("Driver manager not initialized. Call initialize() first.");
    }
    return this.activeDriver;
  }

  /**
   * Get active driver name
   */
  getActiveDriverName(): string {
    return this.activeDriverName;
  }

  /**
   * Get fallback reason
   */
  getFallbackReason(): string {
    return this.fallbackReason;
  }

  /**
   * Get status of all drivers
   */
  getDriverStatuses(): DriverStatus[] {
    return Array.from(this.driverStatuses.values());
  }

  /**
   * Handle partial failure (e.g., read works but write fails)
   */
  async handlePartialFailure(
    operation: "load" | "save" | "delete",
    error: Error
  ): Promise<never> {
    // Log the failure
    console.error(`Partial failure in ${this.activeDriverName} driver (${operation}):`, error);

    // Try to fall back to next driver
    const currentIndex = this.drivers.findIndex(d => d.name === this.activeDriverName);
    if (currentIndex >= 0 && currentIndex < this.drivers.length - 1) {
      const nextDriver = this.drivers[currentIndex + 1];
      const status = await this.checkDriverAvailability(nextDriver.driver, nextDriver.name);

      if (status.available && status.healthy) {
        console.warn(
          `Falling back from ${this.activeDriverName} to ${nextDriver.name} due to ${operation} failure`
        );
        this.activeDriver = nextDriver.driver;
        this.activeDriverName = nextDriver.name;
        this.fallbackReason = `${operation} failed on previous driver: ${error.message}`;

        // Retry the operation with the new driver
        try {
          if (operation === "load") {
            return await this.activeDriver.load() as never;
          }
          // For save/delete, we can't retry without the original parameters
          // So we just throw the error
        } catch (retryError) {
          throw retryError;
        }
      }
    }

    // No fallback available, throw original error
    throw error;
  }

  /**
   * Load boards with automatic fallback
   */
  async load(): Promise<Board[]> {
    const driver = this.getDriver();
    try {
      return await driver.load();
    } catch (error) {
      return this.handlePartialFailure("load", error as Error);
    }
  }

  /**
   * Save board with automatic fallback
   */
  async save(board: Board): Promise<void> {
    const driver = this.getDriver();
    try {
      await driver.save(board);
    } catch (error) {
      return this.handlePartialFailure("save", error as Error);
    }
  }

  /**
   * Delete board with automatic fallback
   */
  async delete(boardId: string): Promise<void> {
    const driver = this.getDriver();
    try {
      await driver.delete(boardId);
    } catch (error) {
      return this.handlePartialFailure("delete", error as Error);
    }
  }
}

