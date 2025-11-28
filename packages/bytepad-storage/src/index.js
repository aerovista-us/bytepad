"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importLegacyData = exports.migrateLegacyWorkspace = exports.migrateLegacyNote = exports.migrateFromLegacyFormat = exports.BackupManager = exports.DriverManager = exports.nxdriveDriver = exports.fsDriver = exports.indexedDbDriver = void 0;
var indexeddb_1 = require("./indexeddb");
Object.defineProperty(exports, "indexedDbDriver", { enumerable: true, get: function () { return indexeddb_1.indexedDbDriver; } });
// fsDriver is Node.js only - conditionally export to avoid bundling in browser
var fs_1 = require("./fs");
Object.defineProperty(exports, "fsDriver", { enumerable: true, get: function () { return fs_1.fsDriver; } });
var nxdrive_1 = require("./nxdrive");
Object.defineProperty(exports, "nxdriveDriver", { enumerable: true, get: function () { return nxdrive_1.nxdriveDriver; } });
var driver_manager_1 = require("./driver-manager");
Object.defineProperty(exports, "DriverManager", { enumerable: true, get: function () { return driver_manager_1.DriverManager; } });
var backup_1 = require("./backup");
Object.defineProperty(exports, "BackupManager", { enumerable: true, get: function () { return backup_1.BackupManager; } });
var migration_1 = require("./migration");
Object.defineProperty(exports, "migrateFromLegacyFormat", { enumerable: true, get: function () { return migration_1.migrateFromLegacyFormat; } });
Object.defineProperty(exports, "migrateLegacyNote", { enumerable: true, get: function () { return migration_1.migrateLegacyNote; } });
Object.defineProperty(exports, "migrateLegacyWorkspace", { enumerable: true, get: function () { return migration_1.migrateLegacyWorkspace; } });
Object.defineProperty(exports, "importLegacyData", { enumerable: true, get: function () { return migration_1.importLegacyData; } });
