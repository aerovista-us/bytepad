"use client";

import { BytePadCore } from "bytepad-core";
import { indexedDbDriver, DriverManager } from "bytepad-storage";
import { TagGeneratorPlugin } from "bytepad-plugins";
import React, { createContext, useEffect, useState } from "react";
import type { CoreInstance } from "bytepad-types";

export const CoreContext = createContext<CoreInstance | null>(null);

/**
 * CoreProvider - Provides BytePadCore instance to the application
 * 
 * Uses DriverManager for panel context (with NXDrive support when available),
 * falls back to direct IndexedDB driver for regular web app.
 */
export function CoreProvider({ children }: { children: React.ReactNode }) {
  const [core, setCore] = useState<CoreInstance | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Detect if we're in panel context
    const isPanel = typeof window !== "undefined" && window.location.pathname.includes("/panel");
    
    const initializeCore = async () => {
      let storage;
      
      if (isPanel) {
        // Panel: Use DriverManager with NXDrive → IndexedDB fallback
        // When NXCore API is available, set nxdrivePath here
        const manager = new DriverManager({
          // nxdrivePath: "/srv/NXDrive/bytepad/boards.json", // Uncomment when API available
          indexedDbName: "bytepad-panel",
        });
        
        try {
          // Initialize manager and use it as storage
          await manager.initialize();
          storage = manager;
        } catch (err) {
          console.warn("DriverManager initialization failed, falling back to IndexedDB:", err);
          storage = indexedDbDriver("bytepad-panel");
        }
      } else {
        // Regular web app: Use IndexedDB directly
        storage = indexedDbDriver("bytepad-web");
      }
      
      const engine = new BytePadCore({
        storage: storage
      });

      // Listen for core errors
      engine.events.on("coreError", (errorData: any) => {
        console.error("Core error:", errorData);
        setError(new Error(errorData.type || "Unknown error"));
      });

      engine.registerPlugin(TagGeneratorPlugin);

      await engine.init();
      setCore(engine);
    };

    initializeCore().catch((err) => {
      console.error("Failed to initialize BytePad core", err);
      setError(err);
    });
  }, []);

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded">
        <h2 className="text-xl font-bold text-red-800 mb-2">
          Failed to initialize BytePad
        </h2>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <CoreContext.Provider value={core}>
      {children}
    </CoreContext.Provider>
  );
}
