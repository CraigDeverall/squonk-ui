#!/usr/bin/env node
/**
 * Regenerates .storybook/addons/theme-controller/data/google-fonts.json from
 * Google's live font metadata. Run when you want to pick up newly-added Google
 * Fonts in the theme manager dropdown.
 *
 *   node scripts/generate-google-fonts-list.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(
  __dirname,
  "../.storybook/addons/theme-controller/data/google-fonts.json"
);
const SOURCE = "https://fonts.google.com/metadata/fonts";

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Failed to fetch ${SOURCE}: ${res.status}`);
const meta = await res.json();

const compact = meta.familyMetadataList.map((f) => {
  const weights = new Set();
  let italic = false;
  for (const code of Object.keys(f.fonts ?? {})) {
    if (code.endsWith("i")) {
      italic = true;
      weights.add(Number(code.slice(0, -1)));
    } else {
      weights.add(Number(code));
    }
  }
  return {
    family: f.family,
    category: f.category,
    weights: [...weights].sort((a, b) => a - b),
    italic,
    variable: (f.axes ?? []).length > 0,
    popularity: f.popularity,
  };
});

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(compact));
console.log(`Wrote ${compact.length} fonts to ${OUT_PATH}`);
