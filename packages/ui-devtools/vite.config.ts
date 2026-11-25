import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin, type UserConfig } from "vite";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const controller = resolve(repo, ".storybook/addons/theme-controller");
const shims = resolve(here, "src/panel/shims");

const alias = [
  // The Storybook theme panel runs here unchanged; these stand in for the
  // Storybook modules it talks to.
  { find: "storybook/manager-api", replacement: resolve(shims, "manager-api.ts") },
  { find: "storybook/internal/core-events", replacement: resolve(shims, "core-events.ts") },
  { find: /^@controller\//, replacement: `${controller}/` },
  { find: /^@theme\//, replacement: `${resolve(repo, "src/theme")}/` },
  { find: /^@src\//, replacement: `${resolve(repo, "src")}/` },
  { find: /^@components\//, replacement: `${resolve(repo, "src/components")}/` },
  { find: /^@hooks\//, replacement: `${resolve(repo, "src/hooks")}/` },
  { find: /^@utils\//, replacement: `${resolve(repo, "src/utils")}/` },
  { find: /^@root\//, replacement: `${repo}/` },
];

/** The panel's base primitives come from the site here, not from Storybook's globals. */
const basePrimitivesShim: Plugin = {
  name: "squonk-devtools-base-primitives",
  enforce: "pre",
  resolveId(source, importer) {
    if (source === "./base-primitives" && importer?.startsWith(controller)) {
      return resolve(shims, "base-primitives.ts");
    }
    return null;
  },
};

export default defineConfig(({ mode }): UserConfig => {
  // The content script: one self-contained classic script, no imports.
  if (mode === "content") {
    return {
      root: here,
      publicDir: false,
      resolve: { alias },
      build: {
        outDir: "dist",
        emptyOutDir: false,
        lib: { entry: resolve(here, "src/content.ts"), formats: ["iife"], name: "squonkThemeDevtools", fileName: () => "content.js" },
      },
    };
  }
  // A page built with the library, for test/e2e.mjs to theme.
  if (mode === "fixture") {
    return {
      root: resolve(here, "test/fixture"),
      base: "./",
      publicDir: false,
      resolve: { alias },
      build: {
        outDir: resolve(here, "test/fixture-dist"),
        emptyOutDir: true,
        rollupOptions: {
          input: { index: resolve(here, "test/fixture/index.html"), legacy: resolve(here, "test/fixture/legacy.html") },
        },
      },
    };
  }
  // The side panel and the service worker.
  return {
    root: here,
    base: "./",
    resolve: { alias },
    plugins: [basePrimitivesShim],
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: { sidepanel: resolve(here, "sidepanel.html"), background: resolve(here, "src/background.ts") },
        output: { entryFileNames: "[name].js", chunkFileNames: "assets/[name]-[hash].js", assetFileNames: "assets/[name]-[hash][extname]" },
      },
    },
  };
});
