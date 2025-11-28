import { Command } from "commander";
import * as path from "path";
import { runEnvironmentChecks } from "./doctor/env";
import { runStorageChecks } from "./doctor/storage";
import { runElectronChecks } from "./doctor/electron";
import type { EnvironmentCheck } from "./doctor/env";

/**
 * Doctor command - health checks for BytePad environment
 */

function formatCheck(check: EnvironmentCheck): string {
  const icon = check.status === "pass" ? "✓" : check.status === "warn" ? "⚠" : "✗";
  const color = check.status === "pass" ? "\x1b[32m" : check.status === "warn" ? "\x1b[33m" : "\x1b[31m";
  const reset = "\x1b[0m";

  let output = `${color}${icon}${reset} ${check.name}: ${check.message}\n`;
  if (check.details) {
    output += `   ${check.details}\n`;
  }
  return output;
}

function printSummary(checks: EnvironmentCheck[]): void {
  const passed = checks.filter(c => c.status === "pass").length;
  const warned = checks.filter(c => c.status === "warn").length;
  const failed = checks.filter(c => c.status === "fail").length;

  console.log("\n" + "=".repeat(60));
  console.log("Summary:");
  console.log(`  ✓ Passed: ${passed}`);
  console.log(`  ⚠ Warnings: ${warned}`);
  console.log(`  ✗ Failed: ${failed}`);
  console.log("=".repeat(60) + "\n");

  if (failed > 0) {
    process.exit(1);
  }
}

export function createDoctorCommand(): Command {
  const doctor = new Command("doctor")
    .description("Run health checks for BytePad environment");

  // Main doctor command (runs all checks)
  doctor
    .action(async () => {
      const repoPath = process.cwd();
      console.log("BytePad Doctor - Environment Health Check\n");
      console.log(`Repository: ${repoPath}\n`);

      const allChecks: EnvironmentCheck[] = [];

      // Environment checks
      console.log("Environment Checks:");
      console.log("-".repeat(60));
      const envChecks = await runEnvironmentChecks(repoPath);
      envChecks.forEach(check => {
        console.log(formatCheck(check));
        allChecks.push(check);
      });

      // Storage checks
      console.log("\nStorage Checks:");
      console.log("-".repeat(60));
      const storageChecks = await runStorageChecks(repoPath);
      storageChecks.forEach(check => {
        console.log(formatCheck(check));
        allChecks.push(check);
      });

      // Electron checks
      console.log("\nElectron Checks:");
      console.log("-".repeat(60));
      const electronChecks = await runElectronChecks(repoPath);
      electronChecks.forEach(check => {
        console.log(formatCheck(check));
        allChecks.push(check);
      });

      printSummary(allChecks);
    });

  // Subcommands
  doctor
    .command("env")
    .description("Check environment configuration")
    .action(async () => {
      const repoPath = process.cwd();
      console.log("Environment Checks:\n");
      const checks = await runEnvironmentChecks(repoPath);
      checks.forEach(check => console.log(formatCheck(check)));
      printSummary(checks);
    });

  doctor
    .command("storage")
    .description("Check storage configuration")
    .option("-b, --boards-path <path>", "Path to boards directory")
    .action(async (options: { boardsPath?: string }) => {
      const repoPath = process.cwd();
      console.log("Storage Checks:\n");
      const checks = await runStorageChecks(repoPath, options.boardsPath);
      checks.forEach(check => console.log(formatCheck(check)));
      printSummary(checks);
    });

  doctor
    .command("electron")
    .description("Check Electron app configuration")
    .action(async () => {
      const repoPath = process.cwd();
      console.log("Electron Checks:\n");
      const checks = await runElectronChecks(repoPath);
      checks.forEach(check => console.log(formatCheck(check)));
      printSummary(checks);
    });

  return doctor;
}

