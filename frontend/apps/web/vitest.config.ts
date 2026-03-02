import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["tests/e2e/**"],
    environmentMatchGlobs: [["src/**/*.dom.test.tsx", "jsdom"]],
    setupFiles: ["./src/test/setup.ts"],
  },
});
