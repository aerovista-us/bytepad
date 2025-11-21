import { BytePadCore } from "bytepad-core";
import { fsDriver } from "bytepad-storage";
import { TagGeneratorPlugin } from "bytepad-plugins";
import { app } from "electron";
import * as path from "path";

/**
 * Initialize BytePadCore with filesystem storage driver
 * Uses Electron's userData directory for board storage
 */
export function initializeCore(): BytePadCore {
  // Get Electron's user data directory (platform-specific)
  // Windows: %APPDATA%\bytepad-studio
  // macOS: ~/Library/Application Support/bytepad-studio
  // Linux: ~/.config/bytepad-studio
  const userDataPath = app.getPath("userData");
  const boardsPath = path.join(userDataPath, "boards");

  // Initialize core with filesystem driver
  const core = new BytePadCore({
    storage: fsDriver(boardsPath),
  });

  // Register default plugins
  core.registerPlugin(TagGeneratorPlugin);

  return core;
}

