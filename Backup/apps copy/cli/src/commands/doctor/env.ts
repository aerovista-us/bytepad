import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";
import { execSync } from "child_process";

/**
 * Environment detection and validation for BytePad
 * Detects unsafe repository locations (network drives, mapped drives, etc.)
 */

export interface EnvironmentCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
  details?: string;
}

/**
 * Check if a path is on a network/mapped drive
 */
export async function checkRepoLocation(repoPath: string): Promise<EnvironmentCheck> {
  const normalizedPath = path.resolve(repoPath);
  const platform = os.platform();

  // Check for UNC paths (Windows network shares)
  if (normalizedPath.startsWith("\\\\") || normalizedPath.startsWith("//")) {
    return {
      name: "Repository Location",
      status: "fail",
      message: "Repository is on a network share (UNC path)",
      details: `Path: ${normalizedPath}\nNetwork shares can cause file system issues and build failures.`,
    };
  }

  // Windows-specific checks
  if (platform === "win32") {
    // Check for mapped drives (Z:, Y:, X:, etc.)
    const driveLetter = normalizedPath.match(/^([A-Z]):/i);
    if (driveLetter) {
      const drive = driveLetter[1].toUpperCase();
      try {
        // Check if it's a mapped network drive
        const drivePath = `${drive}:\\`;
        const stats = await fs.stat(drivePath).catch(() => null);
        
        // Try to detect network drives by checking if it's a remote path
        // This is a heuristic - mapped drives to network shares often have specific characteristics
        if (normalizedPath.startsWith(`${drive}:\\`)) {
          // Additional check: see if we can detect it's a network drive
          // On Windows, we can check the drive type, but that requires native modules
          // For now, we'll warn on common mapped drive letters (Y:, Z:, X:)
          if (["Y", "Z", "X"].includes(drive)) {
            return {
              name: "Repository Location",
              status: "warn",
              message: `Repository may be on a mapped network drive (${drive}:)`,
              details: `Path: ${normalizedPath}\nMapped drives can cause file system issues. Consider using a local drive (C:, D:, etc.).`,
            };
          }
        }
      } catch (err) {
        // Drive check failed, continue
      }
    }

    // Check for Tailscale mounts (common patterns)
    if (normalizedPath.includes("Tailscale") || normalizedPath.includes("tailscale")) {
      return {
        name: "Repository Location",
        status: "warn",
        message: "Repository appears to be on a Tailscale mount",
        details: `Path: ${normalizedPath}\nTailscale mounts can cause file system latency issues.`,
      };
    }
  }

  // Linux/WSL checks
  if (platform === "linux" || platform === "darwin") {
    // Check for WSL mounts
    if (normalizedPath.startsWith("/mnt/")) {
      const mntMatch = normalizedPath.match(/^\/mnt\/([a-z])/i);
      if (mntMatch) {
        return {
          name: "Repository Location",
          status: "warn",
          message: "Repository is on a WSL mount point",
          details: `Path: ${normalizedPath}\nWSL mounts can cause file system performance issues. Consider using a Linux-native path.`,
        };
      }
    }

    // Check for network mounts (common patterns)
    if (normalizedPath.includes("/mnt/network") || normalizedPath.includes("/media/")) {
      // Check if it's a removable drive
      try {
        const stats = await fs.stat(normalizedPath);
        // This is a heuristic - we can't easily detect if /media is network vs USB
        // But we'll warn on /media as it's often external
        if (normalizedPath.startsWith("/media/")) {
          return {
            name: "Repository Location",
            status: "warn",
            message: "Repository may be on a removable/external drive",
            details: `Path: ${normalizedPath}\nExternal drives can cause file system issues.`,
          };
        }
      } catch (err) {
        // Path check failed
      }
    }
  }

  // Check if path is on a local drive (good)
  const isLocal = platform === "win32" 
    ? normalizedPath.match(/^[C-Z]:\\/) && !normalizedPath.startsWith("\\\\")
    : !normalizedPath.startsWith("/mnt/") && !normalizedPath.startsWith("/media/");

  if (isLocal) {
    return {
      name: "Repository Location",
      status: "pass",
      message: "Repository is on a local drive",
      details: `Path: ${normalizedPath}`,
    };
  }

  // Default: unknown, but not explicitly bad
  return {
    name: "Repository Location",
    status: "warn",
    message: "Repository location could not be fully verified",
    details: `Path: ${normalizedPath}`,
  };
}

/**
 * Check Node.js version against .nvmrc
 */
export async function checkNodeVersion(repoPath: string): Promise<EnvironmentCheck> {
  const nvmrcPath = path.join(repoPath, ".nvmrc");
  
  try {
    const nvmrcContent = await fs.readFile(nvmrcPath, "utf-8");
    const requiredVersion = nvmrcContent.trim();
    const currentVersion = process.version.replace("v", "");

    // Simple version comparison (major.minor)
    const requiredMajorMinor = requiredVersion.split(".").slice(0, 2).join(".");
    const currentMajorMinor = currentVersion.split(".").slice(0, 2).join(".");

    if (requiredMajorMinor === currentMajorMinor) {
      return {
        name: "Node.js Version",
        status: "pass",
        message: `Node.js version matches .nvmrc (${requiredVersion})`,
        details: `Current: ${currentVersion}, Required: ${requiredVersion}`,
      };
    } else {
      return {
        name: "Node.js Version",
        status: "fail",
        message: `Node.js version mismatch`,
        details: `Current: ${currentVersion}, Required: ${requiredVersion}\nRun: nvm use (or install Node ${requiredVersion})`,
      };
    }
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return {
        name: "Node.js Version",
        status: "warn",
        message: ".nvmrc file not found",
        details: "Consider adding .nvmrc to pin Node.js version",
      };
    }
    return {
      name: "Node.js Version",
      status: "warn",
      message: "Could not check Node.js version",
      details: err.message,
    };
  }
}

/**
 * Check Yarn installation and version
 */
export async function checkYarn(): Promise<EnvironmentCheck> {
  try {
    const yarnVersion = execSync("yarn --version", { encoding: "utf-8" }).trim();
    return {
      name: "Yarn Installation",
      status: "pass",
      message: `Yarn is installed (${yarnVersion})`,
      details: `Version: ${yarnVersion}`,
    };
  } catch (err: any) {
    return {
      name: "Yarn Installation",
      status: "fail",
      message: "Yarn is not installed or not in PATH",
      details: "Install Yarn: npm install -g yarn",
    };
  }
}

/**
 * Check yarn.lock consistency
 */
export async function checkYarnLock(repoPath: string): Promise<EnvironmentCheck> {
  const lockPath = path.join(repoPath, "yarn.lock");
  const packageJsonPath = path.join(repoPath, "package.json");

  try {
    await fs.access(lockPath);
    await fs.access(packageJsonPath);

    // Check if lockfile is recent (modified within last day of package.json)
    const lockStats = await fs.stat(lockPath);
    const packageStats = await fs.stat(packageJsonPath);

    const lockAge = Date.now() - lockStats.mtimeMs;
    const packageAge = Date.now() - packageStats.mtimeMs;

    // If package.json is newer than lockfile by more than 1 hour, warn
    if (packageStats.mtimeMs > lockStats.mtimeMs + 3600000) {
      return {
        name: "Yarn Lockfile",
        status: "warn",
        message: "yarn.lock may be out of sync with package.json",
        details: "Run: yarn install to update lockfile",
      };
    }

    return {
      name: "Yarn Lockfile",
      status: "pass",
      message: "yarn.lock is present and appears in sync",
    };
  } catch (err: any) {
    if (err.code === "ENOENT" && err.path === lockPath) {
      return {
        name: "Yarn Lockfile",
        status: "fail",
        message: "yarn.lock is missing",
        details: "Run: yarn install to generate lockfile",
      };
    }
    return {
      name: "Yarn Lockfile",
      status: "warn",
      message: "Could not check yarn.lock",
      details: err.message,
    };
  }
}

/**
 * Check package.json engines field
 */
export async function checkEngines(repoPath: string): Promise<EnvironmentCheck> {
  const packageJsonPath = path.join(repoPath, "package.json");

  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    
    if (!packageJson.engines || !packageJson.engines.node) {
      return {
        name: "Package Engines",
        status: "warn",
        message: "package.json missing engines.node field",
        details: "Consider adding: \"engines\": { \"node\": \"20.x\" }",
      };
    }

    const requiredVersion = packageJson.engines.node;
    const currentVersion = process.version.replace("v", "");

    // Simple check - just verify major version matches if specified as "20.x"
    const requiredMajor = requiredVersion.match(/^(\d+)/)?.[1];
    const currentMajor = currentVersion.match(/^(\d+)/)?.[1];

    if (requiredMajor && currentMajor && requiredMajor === currentMajor) {
      return {
        name: "Package Engines",
        status: "pass",
        message: `Node.js version matches engines.node (${requiredVersion})`,
        details: `Current: ${currentVersion}`,
      };
    } else if (requiredMajor && currentMajor) {
      return {
        name: "Package Engines",
        status: "fail",
        message: `Node.js version mismatch with engines.node`,
        details: `Current: ${currentVersion}, Required: ${requiredVersion}`,
      };
    }

    return {
      name: "Package Engines",
      status: "pass",
      message: `engines.node is set (${requiredVersion})`,
    };
  } catch (err: any) {
    return {
      name: "Package Engines",
      status: "warn",
      message: "Could not check package.json engines",
      details: err.message,
    };
  }
}

/**
 * Check packageManager field
 */
export async function checkPackageManager(repoPath: string): Promise<EnvironmentCheck> {
  const packageJsonPath = path.join(repoPath, "package.json");

  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    
    if (!packageJson.packageManager) {
      return {
        name: "Package Manager",
        status: "warn",
        message: "package.json missing packageManager field",
        details: "Consider adding: \"packageManager\": \"yarn@1.22.22\"",
      };
    }

    if (packageJson.packageManager.startsWith("yarn@")) {
      return {
        name: "Package Manager",
        status: "pass",
        message: `packageManager is set to Yarn (${packageJson.packageManager})`,
      };
    } else {
      return {
        name: "Package Manager",
        status: "warn",
        message: `packageManager is not Yarn (${packageJson.packageManager})`,
        details: "This project uses Yarn. Consider updating packageManager field.",
      };
    }
  } catch (err: any) {
    return {
      name: "Package Manager",
      status: "warn",
      message: "Could not check packageManager field",
      details: err.message,
    };
  }
}

/**
 * Check required folders exist
 */
export async function checkRequiredFolders(repoPath: string): Promise<EnvironmentCheck> {
  const requiredFolders = [
    "apps/web",
    "apps/desktop",
    "apps/cli",
    "packages/bytepad-core",
    "packages/bytepad-storage",
    "packages/bytepad-types",
  ];

  const missing: string[] = [];
  const present: string[] = [];

  for (const folder of requiredFolders) {
    const folderPath = path.join(repoPath, folder);
    try {
      const stats = await fs.stat(folderPath);
      if (stats.isDirectory()) {
        present.push(folder);
      } else {
        missing.push(folder);
      }
    } catch (err) {
      missing.push(folder);
    }
  }

  if (missing.length === 0) {
    return {
      name: "Required Folders",
      status: "pass",
      message: "All required folders present",
      details: `Found: ${present.join(", ")}`,
    };
  } else {
    return {
      name: "Required Folders",
      status: "fail",
      message: `Missing required folders: ${missing.join(", ")}`,
      details: `Present: ${present.join(", ")}\nMissing: ${missing.join(", ")}`,
    };
  }
}

/**
 * Run all environment checks
 */
export async function runEnvironmentChecks(repoPath: string): Promise<EnvironmentCheck[]> {
  const checks: EnvironmentCheck[] = [];

  // Check repo location
  checks.push(await checkRepoLocation(repoPath));

  // Check Node version
  checks.push(await checkNodeVersion(repoPath));

  // Check Yarn
  checks.push(await checkYarn());

  // Check lockfile
  checks.push(await checkYarnLock(repoPath));

  // Check engines
  checks.push(await checkEngines(repoPath));

  // Check packageManager
  checks.push(await checkPackageManager(repoPath));

  // Check required folders
  checks.push(await checkRequiredFolders(repoPath));

  return checks;
}

