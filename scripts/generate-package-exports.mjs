#!/usr/bin/env node
/**
 * Regenerates the `exports` map in package.json from the live
 * component list so consumers can do `import { Button } from
 * "@squonk/ui/button"` and get a per-component bundle with maximum
 * tree-shaking. Run automatically as part of `prebuild`.
 *
 * The main entry (`@squonk/ui`) is preserved unchanged — it points at
 * the barrel bundle with `sideEffects: false`, so it tree-shakes fine
 * for any modern bundler. The per-component subpaths exist as
 * belt-and-braces for older bundlers and for consumers who want
 * explicit per-import boundaries.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverEntries, distPath } from "./discover-component-entries.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const PKG = join(ROOT, "package.json");

const pkg = JSON.parse(await readFile(PKG, "utf8"));
const entries = await discoverEntries();

const exportsMap = {
  ".": {
    types: "./dist/index.d.ts",
    import: "./dist/index.mjs",
    require: "./dist/index.cjs",
  },
  "./docs": {
    types: "./dist/docs.d.ts",
    import: "./dist/docs.mjs",
    require: "./dist/docs.cjs",
  },
  "./styles.css": "./dist/styles.css",
  "./docs.css": "./dist/docs.css",
  "./fonts.css": "./dist/fonts.css",
  // Agent guidance and the component catalog, versioned with the code.
  "./skill": "./skills/use-squonk-ui/SKILL.md",
  "./catalog.json": "./dist/design-catalog.json",
  "./guides.json": "./dist/design-guides.json",
  // Lint rules for consuming apps; plain JavaScript, so not part of the build.
  "./eslint": {
    types: "./eslint/index.d.ts",
    default: "./eslint/index.js",
  },
  "./package.json": "./package.json",
};

for (const { subpath, srcPath } of entries) {
  // Skip if this would clash with a hand-curated entry.
  const key = `./${subpath}`;
  if (key in exportsMap) continue;
  exportsMap[key] = {
    types: distPath(srcPath, ".d.ts"),
    import: distPath(srcPath, ".mjs"),
    require: distPath(srcPath, ".cjs"),
  };
}

pkg.exports = exportsMap;

// Keep the legacy main/module/types fields pointing at the barrel so
// non-exports-aware tools (older Webpack, some bundler plugins) still
// resolve correctly.
pkg.main = "./dist/index.cjs";
pkg.module = "./dist/index.mjs";
pkg.types = "./dist/index.d.ts";

const next = JSON.stringify(pkg, null, 2) + "\n";

if (process.argv.includes("--check")) {
  // CI drift gate: the committed package.json must already match what this
  // generator would produce — otherwise a component was added/removed without
  // running the build and the published exports map is stale.
  const current = await readFile(PKG, "utf8");
  if (current !== next) {
    console.error(
      "package.json exports map is out of date — run `node scripts/generate-package-exports.mjs` (or `npm run build`) and commit the result."
    );
    process.exit(1);
  }
  console.log(`exports map up to date (${Object.keys(exportsMap).length} entries)`);
} else {
  await writeFile(PKG, next);
  console.log(`Wrote ${Object.keys(exportsMap).length} export entries`);
}
