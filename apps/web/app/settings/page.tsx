"use client";

import { BackupManager } from "../../components/BackupManager";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Backup & Recovery</h2>
          <BackupManager />
        </section>
      </div>
    </div>
  );
}

