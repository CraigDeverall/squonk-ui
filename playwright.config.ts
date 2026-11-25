import { defineConfig, devices } from "@playwright/experimental-ct-react";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./src",
  // Only *.test.tsx — *.test.ts belongs to Vitest (see vitest.config.ts).
  // Without this, Playwright picks up Vitest files like src/theme/theme.test.ts,
  // which imports `vitest` and its `expect` globals collide with Playwright's.
  testMatch: ["**/*.test.tsx"],

  /* Run tests in files in parallel */

  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { open: "never" }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Port to use for Playwright component endpoint. */
    ctPort: 3100,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    ctTemplateDir: "./test-setup",
  },
  timeout: 10000,

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.CT_BROWSER_CHANNEL ? { channel: process.env.CT_BROWSER_CHANNEL } : {}),
        // Every test, passing or not, shows how it ended in the HTML report.
        // Only here, beside the visual baselines, to keep the report small.
        screenshot: "on",
      },
    },

    // Behavior checks complement canonical Chromium/Linux visual baselines.
    // Keep screenshots in the canonical project; these target engine and mobile interactions.
    ...(!process.env.CT_BROWSER_CHANNEL ? [
      { name: "firefox-behavior", use: { ...devices["Desktop Firefox"] }, ignoreSnapshots: true, grep: /focus|uncontrolled|reset|disabled|dismiss|reduced|timer|queue|contrast|stable|accessible|overflow|tab|keyboard|escape|override|mode/i },
      { name: "webkit-behavior", use: { ...devices["Desktop Safari"] }, ignoreSnapshots: true, grep: /focus|uncontrolled|reset|disabled|dismiss|reduced|timer|queue|contrast|stable|accessible|overflow|tab|keyboard|escape|override|mode/i },
      { name: "mobile-behavior", use: { ...devices["Pixel 5"] }, ignoreSnapshots: true, grep: /focus|uncontrolled|reset|disabled|dismiss|reduced|timer|queue|contrast|stable|accessible|overflow|tab|keyboard|escape/i },
    ] : []),
  ],
});
