/**
 * Single source of truth for the per-component entry list. Used by:
 *   - rollup.config.js   (multi-input + preserveModules build)
 *   - scripts/generate-package-exports.mjs (subpath exports map)
 *
 * A "component entry" is the kebab-named .tsx that lives at
 *   src/components/<bucket>/<name>/<name>.tsx
 *
 * The bucket layer is collapsed in the export map — consumers do
 *   import { Button } from "@squonk/ui/button"
 * not
 *   import { Button } from "@squonk/ui/functional/button"
 * (we want filesystem-internal organisation to be invisible to API users).
 */
import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const COMPONENTS_DIR = join(ROOT, "src/components");

const BUCKETS = [
  "animation",
  "functional",
  "functional-primitive",
  "layout",
  "layout-primitive",
  "style",
];

const EXTRAS = [
  // Theme-side modules that ship as importable subpaths.
  { subpath: "theme", srcPath: "src/theme/index.ts" },
  { subpath: "theme-provider", srcPath: "src/theme/theme-provider.tsx" },
];

/** Returns array of { subpath, srcPath } for every component + extra. */
export async function discoverEntries() {
  const entries = [...EXTRAS];

  for (const bucket of BUCKETS) {
    const bucketDir = join(COMPONENTS_DIR, bucket);
    let names;
    try {
      names = await readdir(bucketDir);
    } catch {
      continue;
    }
    for (const name of names) {
      const compDir = join(bucketDir, name);
      const s = await stat(compDir).catch(() => null);
      if (!s?.isDirectory()) continue;
      const tsx = join(compDir, `${name}.tsx`);
      const exists = await stat(tsx).catch(() => null);
      if (!exists?.isFile()) continue;
      entries.push({
        subpath: name,
        srcPath: relative(ROOT, tsx).replace(/\\/g, "/"),
      });
    }
  }

  // Sort for stable output across runs.
  entries.sort((a, b) => a.subpath.localeCompare(b.subpath));
  return entries;
}

/**
 * Convert a srcPath like "src/components/functional/button/button.tsx" to
 * the corresponding preserveModules-emitted path under dist, with the
 * given extension. Mirrors Rollup's `preserveModulesRoot: "src"`.
 */
export function distPath(srcPath, ext) {
  const withoutSrc = srcPath.replace(/^src\//, "");
  return `./dist/${withoutSrc.replace(/\.(tsx|ts)$/, ext)}`;
}
