"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverManager = void 0;
const indexeddb_1 = require("./indexeddb");
const fs_1 = require("./fs");
const nxdrive_1 = require("./nxdrive");
/**
 * DriverManager - Manages multiple storage drivers with automatic fallback
 *
 * Selects the best available driver based on health checks and automatically
 * falls back to the next driver if the current one fails.
 *
 * Fallback order: NXDrive → Filesystem → IndexedDB
 *
 * @example
 * ```typescript
 * const manager = new DriverManager({
 *   nxdrivePath: "/srv/NXDrive/bytepad/boards.json",
 *   indexedDbName: "bytepad-panel"
 * });
 *
 * await manager.initialize();
 * const core = new BytePadCore({ storage: manager });
 * ```
 */
class DriverManager {
    /**
     * Create a new DriverManager instance
     *
     * @param options - Configuration options
     * @param options.nxdrivePath - Optional path to NXDrive storage
     * @param options.fsPath - Optional path to filesystem storage
     * @param options.indexedDbName - Optional IndexedDB database name
     * @param options.enableMigration - Enable data migration on fallback (default: false)
     */
    constructor(options = {}) {
        this.drivers = [];
        this.activeDriver = null;
        this.activeDriverName = "none";
        this.fallbackReason = "";
        this.driverStatuses = new Map();
        // Initialize drivers in priority order: NXDrive → FS → IndexedDB
        if (options.nxdrivePath) {
            this.drivers.push({
                name: "nxdrive",
                driver: (0, nxdrive_1.nxdriveDriver)(options.nxdrivePath),
                priority: 1,
            });
        }
        if (options.fsPath) {
            this.drivers.push({
                name: "filesystem",
                driver: (0, fs_1.fsDriver)(options.fsPath),
                priority: 2,
            });
        }
        // IndexedDB is always available in browser, optional in Node
        if (typeof window !== "undefined" || options.indexedDbName) {
            this.drivers.push({
                name: "indexeddb",
                driver: (0, indexeddb_1.indexedDbDriver)(options.indexedDbName || "bytepad"),
                priority: 3,
            });
        }
        // Sort by priority
        this.drivers.sort((a, b) => a.priority - b.priority);
    }
    /**
     * Check driver availability and health
     */
    async checkDriverAvailability(driver, name) {
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
            }
            catch (err) {
                return {
                    available: true,
                    healthy: false,
                    health: {
                        healthy: false,
                        message: err.message,
                        lastError: err,
                    },
                };
            }
        }
        catch (err) {
            return {
                available: false,
                healthy: false,
                health: {
                    healthy: false,
                    message: err.message,
                    lastError: err,
                },
            };
        }
    }
    /**
     * Initialize and select the best available driver
     *
     * Checks all configured drivers and selects the first healthy one.
     * Must be called before using the manager.
     *
     * @throws {Error} If no drivers are available
     *
     * @example
     * ```typescript
     * await manager.initialize();
     * const driver = manager.getDriver();
     * ```
     */
    async initialize() {
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
    getDriver() {
        if (!this.activeDriver) {
            throw new Error("Driver manager not initialized. Call initialize() first.");
        }
        return this.activeDriver;
    }
    /**
     * Get active driver name
     */
    getActiveDriverName() {
        return this.activeDriverName;
    }
    /**
     * Get fallback reason
     */
    getFallbackReason() {
        return this.fallbackReason;
    }
    /**
     * Get status of all drivers
     */
    getDriverStatuses() {
        return Array.from(this.driverStatuses.values());
    }
    /**
     * Handle partial failure (e.g., read works but write fails)
     */
    async handlePartialFailure(operation, error) {
        // Log the failure
        console.error(`Partial failure in ${this.activeDriverName} driver (${operation}):`, error);
        // Try to fall back to next driver
        const currentIndex = this.drivers.findIndex(d => d.name === this.activeDriverName);
        if (currentIndex >= 0 && currentIndex < this.drivers.length - 1) {
            const nextDriver = this.drivers[currentIndex + 1];
            const status = await this.checkDriverAvailability(nextDriver.driver, nextDriver.name);
            if (status.available && status.healthy) {
                console.warn(`Falling back from ${this.activeDriverName} to ${nextDriver.name} due to ${operation} failure`);
                this.activeDriver = nextDriver.driver;
                this.activeDriverName = nextDriver.name;
                this.fallbackReason = `${operation} failed on previous driver: ${error.message}`;
                // Retry the operation with the new driver
                try {
                    if (operation === "load") {
                        return await this.activeDriver.load();
                    }
                    // For save/delete, we can't retry without the original parameters
                    // So we just throw the error
                }
                catch (retryError) {
                    throw retryError;
                }
            }
        }
        // No fallback available, throw original error
        throw error;
    }
    /**
     * Load boards with automatic fallback
     *
     * If the active driver fails, automatically falls back to the next available driver.
     *
     * @returns Array of boards loaded from storage
     * @throws {Error} If all drivers fail
     */
    async load() {
        const driver = this.getDriver();
        try {
            return await driver.load();
        }
        catch (error) {
            return this.handlePartialFailure("load", error);
        }
    }
    /**
     * Save board with automatic fallback
     *
     * If the active driver fails, automatically falls back to the next available driver.
     *
     * @param board - Board object to save
     * @throws {Error} If all drivers fail
     */
    async save(board) {
        const driver = this.getDriver();
        try {
            await driver.save(board);
        }
        catch (error) {
            return this.handlePartialFailure("save", error);
        }
    }
    /**
     * Delete board with automatic fallback
     *
     * If the active driver fails, automatically falls back to the next available driver.
     *
     * @param boardId - ID of the board to delete
     * @throws {Error} If all drivers fail
     */
    async delete(boardId) {
        const driver = this.getDriver();
        try {
            await driver.delete(boardId);
        }
        catch (error) {
            return this.handlePartialFailure("delete", error);
        }
    }
}
exports.DriverManager = DriverManager;
