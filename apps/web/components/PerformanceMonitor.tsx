"use client";

import { useEffect, useState } from "react";
import { getMemoryUsage } from "../utils/performance";

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    memory: null as number | null,
    renderCount: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const memory = getMemoryUsage();
      setMetrics((prev) => ({
        memory,
        renderCount: prev.renderCount + 1,
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV === "production") {
    return null; // Don't show in production
  }

  const formatMemory = (bytes: number | null) => {
    if (!bytes) return "N/A";
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded font-mono">
      <div>Memory: {formatMemory(metrics.memory)}</div>
      <div>Updates: {metrics.renderCount}</div>
    </div>
  );
}

