"use client";

import { BytePadCore } from "bytepad-core";
import { indexedDbDriver } from "bytepad-storage";
import { TagGeneratorPlugin } from "bytepad-plugins";
import React, { createContext, useEffect, useState } from "react";
import type { CoreInstance } from "bytepad-types";

export const CoreContext = createContext<CoreInstance | null>(null);

export function CoreProvider({ children }: { children: React.ReactNode }) {
  const [core, setCore] = useState<CoreInstance | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const engine = new BytePadCore({
      storage: indexedDbDriver("bytepad-web")
    });

    // Listen for core errors
    engine.events.on("coreError", (errorData: any) => {
      console.error("Core error:", errorData);
      setError(new Error(errorData.type || "Unknown error"));
    });

    engine.registerPlugin(TagGeneratorPlugin);

    engine.init()
      .then(() => setCore(engine))
      .catch((err) => {
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
