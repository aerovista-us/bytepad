export { indexedDbDriver } from "./indexeddb";
// fsDriver is Node.js only - conditionally export to avoid bundling in browser
export { fsDriver } from "./fs";
export { nxdriveDriver } from "./nxdrive";
export { DriverManager, type DriverManagerOptions, type DriverStatus } from "./driver-manager";
export { BackupManager, type BackupMetadata, type BackupData } from "./backup";
export {
  migrateFromLegacyFormat,
  migrateLegacyNote,
  migrateLegacyWorkspace,
  importLegacyData,
  type LegacyNote,
  type LegacyWorkspace,
} from "./migration";

