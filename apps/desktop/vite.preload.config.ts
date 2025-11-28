import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: ".vite/build/preload",
    lib: {
      entry: resolve(__dirname, "./src/preload/index.ts"),
      formats: ["cjs"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: [
        "electron",
        "path",
        "fs",
        "crypto",
        "os",
        "util",
        "events",
      ],
    },
  },
});

