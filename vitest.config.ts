import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    hookTimeout: Infinity,
    testTimeout: Infinity,
  },
  resolve: {
    alias: {},
  },
});
