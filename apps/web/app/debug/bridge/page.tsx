"use client";

import { useState, useEffect } from "react";
import { isElectron, measureIpcLatency, getBridgeHealth, type BridgeHealth } from "../../../lib/bridge";

/**
 * Bridge diagnostics page
 * Only accessible in development or with debug flag
 */
export default function BridgeDiagnosticsPage() {
  const [health, setHealth] = useState<BridgeHealth | null>(null);
  const [latency, setLatency] = useState<number>(-1);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string; duration?: number }>>({});
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_DEBUG) {
      // Redirect in production unless debug flag is set
      return;
    }

    updateHealth();
    const interval = setInterval(updateHealth, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateHealth = async () => {
    const currentHealth = getBridgeHealth();
    setHealth(currentHealth);

    if (isElectron()) {
      const measuredLatency = await measureIpcLatency();
      setLatency(measuredLatency);
    }
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setIsRunning(true);
    const start = performance.now();
    try {
      await testFn();
      const duration = performance.now() - start;
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, duration },
      }));
    } catch (error: any) {
      const duration = performance.now() - start;
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message, duration },
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const testGetAllBoards = () => {
    if (!window.electronAPI) return Promise.resolve();
    return runTest("getAllBoards", () => window.electronAPI!.getAllBoards());
  };

  const testCanUndo = () => {
    if (!window.electronAPI) return Promise.resolve();
    return runTest("canUndo", () => window.electronAPI!.canUndo());
  };

  const testCreateBoard = () => {
    if (!window.electronAPI) return Promise.resolve();
    return runTest("createBoard", () => 
      window.electronAPI!.createBoard({ name: "Test Board", theme: "default" })
    );
  };

  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_DEBUG) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Bridge Diagnostics</h1>
        <p className="text-red-600">This page is only available in development mode.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">IPC Bridge Diagnostics</h1>

      {/* Environment Info */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Environment</h2>
        <div className="space-y-1 text-sm">
          <div>
            <strong>Running in Electron:</strong> {isElectron() ? "Yes" : "No"}
          </div>
          <div>
            <strong>Electron API Available:</strong> {typeof window !== "undefined" && window.electronAPI ? "Yes" : "No"}
          </div>
          {isElectron() && window.electronAPI && (
            <>
              <div>
                <strong>Platform:</strong> {window.electronAPI.platform}
              </div>
              <div>
                <strong>Node Version:</strong> {window.electronAPI.versions.node}
              </div>
              <div>
                <strong>Chrome Version:</strong> {window.electronAPI.versions.chrome}
              </div>
              <div>
                <strong>Electron Version:</strong> {window.electronAPI.versions.electron}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Health Status */}
      {health && (
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">Bridge Health</h2>
          <div className="space-y-1 text-sm">
            <div>
              <strong>Available:</strong>{" "}
              <span className={health.available ? "text-green-600" : "text-red-600"}>
                {health.available ? "Yes" : "No"}
              </span>
            </div>
            {latency >= 0 && (
              <div>
                <strong>Latency:</strong>{" "}
                <span className={latency < 100 ? "text-green-600" : latency < 500 ? "text-yellow-600" : "text-red-600"}>
                  {latency.toFixed(2)}ms
                </span>
              </div>
            )}
            {health.lastError && (
              <div>
                <strong>Last Error:</strong>{" "}
                <span className="text-red-600">{health.lastError.message}</span>
                {health.lastError.classification && (
                  <span className="ml-2 text-gray-600">
                    ({health.lastError.classification})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Suite */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">IPC Tests</h2>
        <div className="space-y-2">
          <button
            onClick={testGetAllBoards}
            disabled={!isElectron() || isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Test getAllBoards
          </button>
          <button
            onClick={testCanUndo}
            disabled={!isElectron() || isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 ml-2"
          >
            Test canUndo
          </button>
          <button
            onClick={testCreateBoard}
            disabled={!isElectron() || isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 ml-2"
          >
            Test createBoard
          </button>
        </div>

        {Object.keys(testResults).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(testResults).map(([testName, result]) => (
              <div
                key={testName}
                className={`p-2 rounded ${
                  result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{testName}</span>
                  <span className={result.success ? "text-green-600" : "text-red-600"}>
                    {result.success ? "✓" : "✗"}
                  </span>
                </div>
                {result.duration !== undefined && (
                  <div className="text-sm text-gray-600">
                    Duration: {result.duration.toFixed(2)}ms
                  </div>
                )}
                {result.error && (
                  <div className="text-sm text-red-600 mt-1">{result.error}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2">Usage</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>This page helps diagnose IPC bridge issues in Electron</li>
          <li>Run tests to verify IPC operations are working</li>
          <li>Check latency - should be &lt;100ms for local operations</li>
          <li>If tests fail, check Electron main process logs</li>
        </ul>
      </div>
    </div>
  );
}

