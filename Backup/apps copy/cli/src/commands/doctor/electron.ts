import * as path from "path";
import * as fs from "fs/promises";
import type { EnvironmentCheck } from "./env";

/**
 * Electron-specific health checks
 */

/**
 * Check if Electron app structure exists
 */
export async function checkElectronStructure(repoPath: string): Promise<EnvironmentCheck> {
  const electronPath = path.join(repoPath, "apps/desktop");
  const requiredFiles = [
    "package.json",
    "src/main/index.ts",
    "src/preload/index.ts",
    "src/renderer",
  ];

  const missing: string[] = [];
  const present: string[] = [];

  try {
    const stats = await fs.stat(electronPath);
    if (!stats.isDirectory()) {
      return {
        name: "Electron Structure",
        status: "fail",
        message: "apps/desktop is not a directory",
      };
    }

    for (const file of requiredFiles) {
      const filePath = path.join(electronPath, file);
      try {
        await fs.access(filePath);
        present.push(file);
      } catch (err) {
        missing.push(file);
      }
    }

    if (missing.length === 0) {
      return {
        name: "Electron Structure",
        status: "pass",
        message: "Electron app structure is complete",
        details: `Found: ${present.join(", ")}`,
      };
    } else {
      return {
        name: "Electron Structure",
        status: "warn",
        message: `Some Electron files are missing: ${missing.join(", ")}`,
        details: `Present: ${present.join(", ")}`,
      };
    }
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return {
        name: "Electron Structure",
        status: "fail",
        message: "apps/desktop directory not found",
      };
    }
    return {
      name: "Electron Structure",
      status: "warn",
      message: "Could not check Electron structure",
      details: err.message,
    };
  }
}

/**
 * Check if Electron dependencies are installed
 */
export async function checkElectronDependencies(repoPath: string): Promise<EnvironmentCheck> {
  const electronPath = path.join(repoPath, "apps/desktop");
  const nodeModulesPath = path.join(electronPath, "node_modules");
  const electronModulePath = path.join(nodeModulesPath, "electron");

  try {
    await fs.access(electronModulePath);
    return {
      name: "Electron Dependencies",
      status: "pass",
      message: "Electron dependencies are installed",
    };
  } catch (err: any) {
    return {
      name: "Electron Dependencies",
      status: "warn",
      message: "Electron dependencies may not be installed",
      details: "Run: cd apps/desktop && yarn install",
    };
  }
}

/**
 * Check if Electron can be built
 */
export async function checkElectronBuild(repoPath: string): Promise<EnvironmentCheck> {
  const electronPath = path.join(repoPath, "apps/desktop");
  const distPath = path.join(electronPath, "dist");

  try {
    await fs.access(distPath);
    const stats = await fs.stat(distPath);
    
    if (stats.isDirectory()) {
      // Check if dist has content
      const files = await fs.readdir(distPath);
      if (files.length > 0) {
        return {
          name: "Electron Build",
          status: "pass",
          message: "Electron app has been built",
          details: `Found ${files.length} files in dist/`,
        };
      } else {
        return {
          name: "Electron Build",
          status: "warn",
          message: "Electron dist directory is empty",
          details: "Run: cd apps/desktop && yarn build",
        };
      }
    }
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return {
        name: "Electron Build",
        status: "warn",
        message: "Electron app has not been built",
        details: "Run: cd apps/desktop && yarn build",
      };
    }
    return {
      name: "Electron Build",
      status: "warn",
      message: "Could not check Electron build",
      details: err.message,
    };
  }

  return {
    name: "Electron Build",
    status: "warn",
    message: "Could not determine Electron build status",
  };
}

/**
 * Run all Electron checks
 */
export async function runElectronChecks(repoPath: string): Promise<EnvironmentCheck[]> {
  const checks: EnvironmentCheck[] = [];

  checks.push(await checkElectronStructure(repoPath));
  checks.push(await checkElectronDependencies(repoPath));
  checks.push(await checkElectronBuild(repoPath));

  return checks;
}

