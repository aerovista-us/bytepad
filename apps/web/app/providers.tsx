"use client";

import { BytePadCore } from "bytepad-core";
import { indexedDbDriver } from "bytepad-storage";
import { TagGeneratorPlugin } from "bytepad-plugins";
import React, { createContext, useEffect, useState } from "react";

export const CoreContext = createContext<any>(null);

export function CoreProvider({ children }: { children: React.ReactNode }) {
  const [core, setCore] = useState<any>(null);

  useEffect(() => {
    const engine = new BytePadCore({
      storage: indexedDbDriver("bytepad-web")
    });

    engine.registerPlugin(TagGeneratorPlugin);

    engine.init().then(() => setCore(engine));
  }, []);

  return (
    <CoreContext.Provider value={core}>
      {children}
    </CoreContext.Provider>
  );
}
