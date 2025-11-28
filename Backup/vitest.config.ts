import { defineConfig } from "vitest/config";
import { resolve } from "path";

/**
 * Vitest configuration for BytePad monorepo
 * Workspace-aware configuration for testing across packages
 */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.next/**",
        "**/__tests__/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "bytepad-core": resolve(__dirname, "./packages/bytepad-core/src"),
      "bytepad-types": resolve(__dirname, "./packages/bytepad-types/src"),
      "bytepad-storage": resolve(__dirname, "./packages/bytepad-storage/src"),
    },
  },
});

