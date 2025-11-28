import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // Resolve monorepo packages for bundling
      "bytepad-core": resolve(__dirname, "../../packages/bytepad-core/src/index.ts"),
      "bytepad-storage": resolve(__dirname, "../../packages/bytepad-storage/src/index.ts"),
      "bytepad-types": resolve(__dirname, "../../packages/bytepad-types/src/index.ts"),
      "bytepad-plugins": resolve(__dirname, "../../packages/bytepad-plugins/src/index.ts"),
      "bytepad-utils": resolve(__dirname, "../../packages/bytepad-utils/src/index.ts"),
    },
  },
  build: {
    outDir: ".vite/build/main",
    lib: {
      entry: resolve(__dirname, "./src/main/index.ts"),
      formats: ["cjs"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      output: {
        format: "cjs",
        entryFileNames: "index.js",
      },
      external: [
        "electron",
        "path",
        "fs",
        "crypto",
        "os",
        "util",
        "events",
        "eventemitter3",
        "uuid",
        "zod",
        "electron-squirrel-startup",
      ],
    },
  },
});

