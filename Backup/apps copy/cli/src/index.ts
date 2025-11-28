#!/usr/bin/env node

import { Command } from "commander";
import { BytePadCore } from "bytepad-core";
import { fsDriver } from "bytepad-storage";
import * as fs from "fs/promises";
import * as path from "path";
import { createDoctorCommand } from "./commands/doctor";

const program = new Command();

program
  .name("bytepad")
  .description("BytePad CLI - Export, import, and sync boards")
  .version("3.0.0");

program
  .command("export")
  .description("Export boards to a JSON file")
  .argument("<output-file>", "Output JSON file path")
  .option("-b, --boards-path <path>", "Path to boards directory", "./boards")
  .action(async (outputFile: string, options: { boardsPath: string }) => {
    try {
      const storage = fsDriver(options.boardsPath);
      const core = new BytePadCore({ storage });
      await core.init();

      const boards = core.getAllBoards();
      const output = JSON.stringify(boards, null, 2);

      await fs.writeFile(outputFile, output, "utf-8");
      console.log(`✓ Exported ${boards.length} board(s) to ${outputFile}`);
    } catch (err) {
      console.error("✗ Export failed:", err);
      process.exit(1);
    }
  });

program
  .command("import")
  .description("Import boards from a JSON file")
  .argument("<input-file>", "Input JSON file path")
  .option("-b, --boards-path <path>", "Path to boards directory", "./boards")
  .option("--merge", "Merge with existing boards instead of replacing")
  .action(async (inputFile: string, options: { boardsPath: string; merge?: boolean }) => {
    try {
      const inputData = await fs.readFile(inputFile, "utf-8");
      const importedBoards = JSON.parse(inputData);

      if (!Array.isArray(importedBoards)) {
        throw new Error("Invalid format: expected array of boards");
      }

      const storage = fsDriver(options.boardsPath);
      const core = new BytePadCore({ storage });
      
      if (!options.merge) {
        // Clear existing boards (by deleting the directory)
        try {
          await fs.rm(options.boardsPath, { recursive: true, force: true });
        } catch (err) {
          // Directory might not exist, that's fine
        }
      }

      await core.init();

      let imported = 0;
      for (const boardData of importedBoards) {
        try {
          await core.createBoard(boardData);
          imported++;
        } catch (err) {
          console.warn(`Failed to import board ${boardData.id}:`, err);
        }
      }

      console.log(`✓ Imported ${imported} board(s) from ${inputFile}`);
    } catch (err) {
      console.error("✗ Import failed:", err);
      process.exit(1);
    }
  });

program
  .command("flush-sync")
  .description("Flush the sync queue (process pending sync events)")
  .option("-b, --boards-path <path>", "Path to boards directory", "./boards")
  .action(async (options: { boardsPath: string }) => {
    try {
      const storage = fsDriver(options.boardsPath);
      const core = new BytePadCore({ storage });
      await core.init();

      await core.flushSync();
      console.log("✓ Sync queue flushed");
    } catch (err) {
      console.error("✗ Flush sync failed:", err);
      process.exit(1);
    }
  });

// Add doctor command
program.addCommand(createDoctorCommand());

program.parse();

