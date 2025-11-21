"use client";

import { useContext, useState, useEffect } from "react";
import { CoreContext } from "../app/providers";
import type { BackupMetadata } from "bytepad-storage/backup";

export function BackupManager() {
  const core = useContext(CoreContext);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!core) return;

    const updateBackups = () => {
      setBackups(core.listBackups());
    };

    updateBackups();

    core.events.on("backupCreated", updateBackups);
    core.events.on("backupRestored", updateBackups);

    return () => {
      core.events.off("backupCreated", updateBackups);
      core.events.off("backupRestored", updateBackups);
    };
  }, [core]);

  if (!core) return null;

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      await core.createBackup();
      setBackups(core.listBackups());
    } catch (err) {
      console.error("Failed to create backup:", err);
      alert("Failed to create backup. Check console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    if (!confirm("Are you sure you want to restore this backup? This will replace all current data.")) {
      return;
    }

    try {
      await core.restoreBackup(backupId);
      alert("Backup restored successfully!");
      window.location.reload(); // Reload to reflect changes
    } catch (err) {
      console.error("Failed to restore backup:", err);
      alert("Failed to restore backup. Check console for details.");
    }
  };

  const handleExport = async (backupId: string) => {
    try {
      const jsonData = await core.exportBackup(backupId);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bytepad-backup-${backupId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export backup:", err);
      alert("Failed to export backup. Check console for details.");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      
      // Try to import as backup first, then as legacy data
      try {
        await core.importBackup(text);
        setBackups(core.listBackups());
        alert("Backup imported successfully!");
      } catch (backupErr) {
        // If backup import fails, try legacy format
        try {
          const boards = await core.importLegacyData(text);
          alert(`Successfully imported ${boards.length} board(s) from legacy BytePad format!`);
          window.location.reload(); // Reload to show imported data
        } catch (legacyErr) {
          throw new Error("Failed to import as backup or legacy format. Please check the file format.");
        }
      }
    } catch (err: any) {
      console.error("Failed to import:", err);
      alert(`Failed to import: ${err.message || err}`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="border rounded p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Backups</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCreateBackup}
            disabled={isCreating}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Backup"}
          </button>
          <label className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">
            Import Backup
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {backups.length === 0 ? (
        <p className="text-gray-500 text-sm">No backups yet. Create one to get started.</p>
      ) : (
        <div className="space-y-2">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-2 bg-white border rounded"
            >
              <div>
                <div className="font-medium">
                  {formatDate(backup.timestamp)}
                </div>
                <div className="text-sm text-gray-500">
                  {backup.boardCount} board{backup.boardCount !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(backup.id)}
                  className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Restore
                </button>
                <button
                  onClick={() => handleExport(backup.id)}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

