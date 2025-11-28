"use client";

import { useState, useEffect } from "react";
import { DriverManager, type DriverStatus } from "bytepad-storage";

/**
 * Storage diagnostics page
 * Shows active driver, health, fallback reason, and last error
 */
export default function StorageDiagnosticsPage() {
  const [driverManager, setDriverManager] = useState<DriverManager | null>(null);
  const [statuses, setStatuses] = useState<DriverStatus[]>([]);
  const [activeDriver, setActiveDriver] = useState<string>("");
  const [fallbackReason, setFallbackReason] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_DEBUG) {
      return;
    }

    initializeDriverManager();
  }, []);

  const initializeDriverManager = async () => {
    try {
      // Create driver manager with appropriate options for web environment
      const manager = new DriverManager({
        indexedDbName: "bytepad-web",
        // NXDrive and FS paths would be set based on environment
      });

      await manager.initialize();

      setDriverManager(manager);
      setStatuses(manager.getDriverStatuses());
      setActiveDriver(manager.getActiveDriverName());
      setFallbackReason(manager.getFallbackReason());
      setIsInitialized(true);
    } catch (error: any) {
      console.error("Failed to initialize driver manager:", error);
    }
  };

  const refreshStatus = async () => {
    if (!driverManager) return;

    try {
      await driverManager.initialize();
      setStatuses(driverManager.getDriverStatuses());
      setActiveDriver(driverManager.getActiveDriverName());
      setFallbackReason(driverManager.getFallbackReason());
    } catch (error) {
      console.error("Failed to refresh status:", error);
    }
  };

  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_DEBUG) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Storage Diagnostics</h1>
        <p className="text-red-600">This page is only available in development mode.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Storage Driver Diagnostics</h1>

      {!isInitialized ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p>Initializing driver manager...</p>
        </div>
      ) : (
        <>
          {/* Active Driver */}
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <h2 className="text-lg font-semibold mb-2">Active Driver</h2>
            <div className="space-y-1 text-sm">
              <div>
                <strong>Driver:</strong>{" "}
                <span className="font-mono bg-gray-200 px-2 py-1 rounded">{activeDriver}</span>
              </div>
              {fallbackReason && (
                <div>
                  <strong>Fallback Reason:</strong>{" "}
                  <span className="text-yellow-600">{fallbackReason}</span>
                </div>
              )}
              {!fallbackReason && (
                <div className="text-green-600">✓ Using primary driver (no fallback)</div>
              )}
            </div>
          </div>

          {/* Driver Statuses */}
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Driver Status</h2>
              <button
                onClick={refreshStatus}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
            <div className="space-y-3">
              {statuses.map((status) => (
                <div
                  key={status.name}
                  className={`p-3 rounded border ${
                    status.name === activeDriver
                      ? "bg-blue-50 border-blue-300"
                      : status.healthy
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{status.name}</span>
                        {status.name === activeDriver && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                            ACTIVE
                          </span>
                        )}
                        <span
                          className={`text-sm ${
                            status.healthy ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {status.healthy ? "✓ Healthy" : "✗ Unhealthy"}
                        </span>
                      </div>
                      {status.health && (
                        <div className="mt-2 text-sm text-gray-600">
                          {status.health.message && (
                            <div>Message: {status.health.message}</div>
                          )}
                          {status.health.lastError && (
                            <div className="mt-1 text-red-600">
                              Error: {status.health.lastError.message}
                            </div>
                          )}
                        </div>
                      )}
                      {status.lastError && (
                        <div className="mt-2 text-sm text-red-600">
                          Last Error: {status.lastError.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Driver Capabilities */}
          {driverManager && (
            <div className="mb-6 p-4 bg-gray-100 rounded">
              <h2 className="text-lg font-semibold mb-2">Driver Capabilities</h2>
              <div className="space-y-2 text-sm">
                {(() => {
                  const driver = driverManager.getDriver();
                  return (
                    <>
                      <div>
                        <strong>Supports Transactions:</strong>{" "}
                        {driver.supportsTransactions?.() ? "Yes" : "No"}
                      </div>
                      <div>
                        <strong>Supports Backup:</strong>{" "}
                        {driver.supportsBackup?.() ? "Yes" : "No"}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Test Operations */}
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <h2 className="text-lg font-semibold mb-2">Test Operations</h2>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  if (!driverManager) return;
                  try {
                    const boards = await driverManager.load();
                    alert(`Successfully loaded ${boards.length} board(s)`);
                  } catch (error: any) {
                    alert(`Failed to load: ${error.message}`);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test Load
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-semibold mb-2">Usage</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>This page shows the status of all storage drivers</li>
              <li>The active driver is highlighted in blue</li>
              <li>Drivers are checked in order: NXDrive → Filesystem → IndexedDB</li>
              <li>If a driver fails, the manager automatically falls back to the next one</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

