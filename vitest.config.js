import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    include: ["backend/tests/**/*.test.js"],
    testTimeout: 10000
  }
});
