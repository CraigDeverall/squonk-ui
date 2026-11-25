#!/usr/bin/env node
// Components bind to purpose tokens (--squonk-roles-*, --squonk-components-*, the
// register-aware --squonk-presentation-*), never to a raw scale step. A file
// that exists to hand the raw scale to consumers (a gap="md" or size="sm"
// prop) says so with a `purpose-tokens: scale-api — <why>` comment.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "node:fs/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Raw scales and palettes. Status tones (colors-tone-*, colors-status-text-*)
// are chosen by a consumer's tone prop, so they count as an API, not a step.
const RAW_VAR = /--squonk-(?:spacing|typography|borders|shadows|relief|switches|transitions|motion(?!-level-)|states|z-indices|colors-(?!tone-|status-text-))[a-z0-9-]*/g;
const RAW_JS = /\btheme\.(?:spacing|typography|borders|shadows|relief|switches|transitions|motion|states|zIndices|colors\.(?!tone\b))[\w.]*/g;
const SCALE_API = /purpose-tokens: scale-api — \S/;
const SKIP = /\.(test|stories|showcase|harness|typecheck)\.tsx?$/;

export async function findRawTokenUses(dir = path.join(root, "src/components")) {
  const problems = [];
  for await (const rel of glob("**/*.{module.css,tsx}", { cwd: dir })) {
    if (SKIP.test(rel)) continue;
    const file = path.join(dir, rel);
    const source = await readFile(file, "utf8");
    if (SCALE_API.test(source)) continue;
    const pattern = rel.endsWith(".css") ? RAW_VAR : new RegExp(`${RAW_VAR.source}|${RAW_JS.source}`, "g");
    source.split("\n").forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      for (const match of line.matchAll(pattern)) problems.push(`${path.relative(root, file)}:${i + 1} ${match[0]}`);
    });
  }
  return problems;
}

// Motion lives in the Motion components (src/components/animation/motion): a
// component wraps the element that moves rather than declaring its own
// animation, transition or keyframes. It may say what moves and for how
// long with --motion-property and --motion-duration.
const OWN_MOTION = /^\s*(?:@keyframes\b|(?:animation|transition)(?:-[a-z-]+)?\s*:)/;

export async function findOwnMotion(dir = path.join(root, "src/components")) {
  const problems = [];
  for await (const rel of glob("**/*.module.css", { cwd: dir })) {
    // The one stylesheet that holds the library's motion.
    if (rel.split(path.sep).join("/") === "animation/motion/motion.module.css") continue;
    const file = path.join(dir, rel);
    const source = await readFile(file, "utf8");
    source.split("\n").forEach((line, i) => {
      if (OWN_MOTION.test(line)) problems.push(`${path.relative(root, file)}:${i + 1} ${line.trim()}`);
    });
  }
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const problems = await findRawTokenUses();
  if (problems.length) {
    console.error(`Components must bind to purpose tokens, not raw scale steps (${problems.length}):\n${problems.join("\n")}`);
    console.error("Use a --squonk-roles-* or --squonk-components-* token (src/theme/purpose.ts), or add one with its reason.");
    process.exit(1);
  }
  const motion = await findOwnMotion();
  if (motion.length) {
    console.error(`Components must take their motion from Motion components, not declare it (${motion.length}):\n${motion.join("\n")}`);
    console.error("Wrap the element that moves in a Motion component (Feedback, Pop, Dim, Slide, Collapse, Shift, Presence, Swap, Highlight, Layout, a loop…) (src/components/animation/motion).");
    process.exit(1);
  }
  console.log("Purpose-token check passed.");
}
