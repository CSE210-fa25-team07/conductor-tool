import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "backend/tests/",
        "frontend/js/__tests__/",
        "*.config.js"
      ]
    },
    include: ["**/*.test.js", "**/*.spec.js"],
    exclude: ["node_modules", "dist"]
  }
});
