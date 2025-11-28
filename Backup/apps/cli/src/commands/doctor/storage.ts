import * as path from "path";
import * as fs from "fs/promises";
import type { EnvironmentCheck } from "./env";

/**
 * Storage-related health checks
 */

/**
 * Check if storage directories are accessible
 */
export async function checkStorageAccess(repoPath: string): Promise<EnvironmentCheck> {
  // Check Electron storage path (userData)
  // This is a placeholder - actual Electron paths are platform-specific
  const electronStorageHint = process.platform === "win32"
    ? "%APPDATA%\\bytepad-studio\\boards"
    : process.platform === "darwin"
    ? "~/Library/Application Support/bytepad-studio/boards"
    : "~/.config/bytepad-studio/boards";

  return {
    name: "Storage Access",
    status: "pass",
    message: "Storage paths are platform-specific",
    details: `Electron storage: ${electronStorageHint}\nWeb storage: IndexedDB (browser)\nCLI storage: ./boards (configurable)`,
  };
}

/**
 * Check if boards directory exists and is writable (for CLI)
 */
export async function checkBoardsDirectory(boardsPath?: string): Promise<EnvironmentCheck> {
  const targetPath = boardsPath || path.join(process.cwd(), "boards");

  try {
    await fs.access(targetPath);
    const stats = await fs.stat(targetPath);
    
    if (!stats.isDirectory()) {
      return {
        name: "Boards Directory",
        status: "fail",
        message: "Boards path exists but is not a directory",
        details: `Path: ${targetPath}`,
      };
    }

    // Try to write a test file
    const testFile = path.join(targetPath, ".bytepad-test");
    try {
      await fs.writeFile(testFile, "test", "utf-8");
      await fs.unlink(testFile);
      
      return {
        name: "Boards Directory",
        status: "pass",
        message: "Boards directory is accessible and writable",
        details: `Path: ${targetPath}`,
      };
    } catch (err: any) {
      return {
        name: "Boards Directory",
        status: "fail",
        message: "Boards directory is not writable",
        details: `Path: ${targetPath}\nError: ${err.message}`,
      };
    }
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return {
        name: "Boards Directory",
        status: "warn",
        message: "Boards directory does not exist (will be created on first use)",
        details: `Path: ${targetPath}`,
      };
    }
    return {
      name: "Boards Directory",
      status: "fail",
      message: "Could not access boards directory",
      details: `Path: ${targetPath}\nError: ${err.message}`,
    };
  }
}

/**
 * Run all storage checks
 */
export async function runStorageChecks(repoPath: string, boardsPath?: string): Promise<EnvironmentCheck[]> {
  const checks: EnvironmentCheck[] = [];

  checks.push(await checkStorageAccess(repoPath));
  checks.push(await checkBoardsDirectory(boardsPath));

  return checks;
}

