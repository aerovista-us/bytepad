"use client";

import { useState, useEffect } from "react";
import { isElectron, measureIpcLatency, getBridgeHealth } from "../lib/bridge";

/**
 * Cross-surface debug overlay
 * Toggle with Ctrl+Alt+D
 * Shows: surface type, driver, IPC health, offline state
 */
export function DebugOverlay() {
  const [visible, setVisible] = useState(false);
  const [ipcLatency, setIpcLatency] = useState<number>(-1);
  const [bridgeHealth, setBridgeHealth] = useState(getBridgeHealth());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Only show in development or with debug flag
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_DEBUG) {
      return;
    }

    // Keyboard shortcut: Ctrl+Alt+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === "d") {
        e.preventDefault();
        setVisible(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Update IPC latency periodically
    const updateLatency = async () => {
      if (isElectron() && visible) {
        const latency = await measureIpcLatency();
        setIpcLatency(latency);
        setBridgeHealth(getBridgeHealth());
      }
    };

    let interval: NodeJS.Timeout | null = null;
    if (visible) {
      updateLatency();
      interval = setInterval(updateLatency, 2000);
    }

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (interval) clearInterval(interval);
    };
  }, [visible]);

  // Don't render in production without debug flag
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_DEBUG) {
    return null;
  }

  if (!visible) {
    return null;
  }

  // Determine surface type
  const surfaceType = isElectron()
    ? "electron"
    : typeof window !== "undefined" && "serviceWorker" in navigator
    ? "pwa"
    : typeof window !== "undefined" && window.location.pathname.includes("/panel")
    ? "panel"
    : "web";

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white text-xs font-mono p-3 rounded shadow-lg z-50 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold">BytePad Debug</div>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1">
        <div>
          <span className="text-gray-400">Surface:</span>{" "}
          <span className="text-yellow-400">{surfaceType.toUpperCase()}</span>
        </div>

        {isElectron() && (
          <>
            <div>
              <span className="text-gray-400">IPC:</span>{" "}
              <span
                className={
                  ipcLatency >= 0
                    ? ipcLatency < 100
                      ? "text-green-400"
                      : ipcLatency < 500
                      ? "text-yellow-400"
                      : "text-red-400"
                    : "text-gray-400"
                }
              >
                {ipcLatency >= 0 ? `${ipcLatency.toFixed(0)}ms` : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Bridge:</span>{" "}
              <span
                className={bridgeHealth.available ? "text-green-400" : "text-red-400"}
              >
                {bridgeHealth.available ? "OK" : "FAIL"}
              </span>
            </div>
            {bridgeHealth.lastError && (
              <div className="text-red-400 text-xs truncate">
                Error: {bridgeHealth.lastError.message}
              </div>
            )}
          </>
        )}

        <div>
          <span className="text-gray-400">Network:</span>{" "}
          <span className={isOnline ? "text-green-400" : "text-red-400"}>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        {/* Storage driver info would go here - requires driver manager integration */}
        <div>
          <span className="text-gray-400">Storage:</span>{" "}
          <span className="text-gray-400">N/A</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
        Press Ctrl+Alt+D to toggle
      </div>
    </div>
  );
}

