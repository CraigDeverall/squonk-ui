#!/usr/bin/env node
/**
 * Writes `src/theme/tokens.css` — every `--squonk-*` custom property of the default
 * light theme, as a `:root` block. Providers set these at runtime; the file
 * exists so the variables are discoverable by IDE autocomplete and coding
 * agents, and so components render with defaults when no provider is mounted.
 *
 *   node scripts/generate-tokens-css.mjs          # regenerate
 *   node scripts/generate-tokens-css.mjs --check  # fail if out of date
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = fileURLToPath(new URL("../src/theme/tokens.css", import.meta.url));

const load = (file) => runnerImport(file, { root: ROOT, configFile: false }).then((r) => r.module);
const [{ renderTokensCss }, { theme }] = await Promise.all([
  load("/src/theme/theme-css-vars.ts"),
  load("/src/theme/theme.ts"),
]);
const css = renderTokensCss(theme);

if (process.argv.includes("--check")) {
  const current = await readFile(OUT, "utf8").catch(() => "");
  if (current !== css) {
    console.error("src/theme/tokens.css is out of date. Run `npm run tokens:generate`.");
    process.exit(1);
  }
  console.log("src/theme/tokens.css is up to date.");
} else {
  await writeFile(OUT, css);
  console.log(`Wrote ${OUT}`);
}
