import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Only pick up *.test.ts (no JSX). The *.test.tsx files in src/components/**
    // belong to Playwright CT (run via `npm run test`) and must not be invoked here.
    include: ["src/**/*.test.ts", ".storybook/**/*.test.ts"],
    exclude: ["node_modules", "dist", "test-results", "playwright-report"],
    environment: "node",
  },
});
