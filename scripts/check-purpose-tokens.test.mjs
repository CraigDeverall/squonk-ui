import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { findOwnMotion, findRawTokenUses } from "./check-purpose-tokens.mjs";

async function fixture(files) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "purpose-tokens-"));
  for (const [name, source] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, name)), { recursive: true });
    await writeFile(path.join(dir, name), source);
  }
  return dir;
}

test("flags raw scale steps in component CSS and code", async () => {
  const dir = await fixture({
    "a/a.module.css": ".a { gap: var(--squonk-spacing-sm); color: var(--squonk-colors-text-primary); }",
    "b/b.tsx": "const bg = theme.colors.background.default;",
  });
  const problems = await findRawTokenUses(dir);
  assert.equal(problems.length, 3);
});

test("flags raw relief tokens: components take a relief posture instead", async () => {
  const dir = await fixture({
    "a/a.module.css": ".a { background-image: var(--squonk-relief-raised-fill); box-shadow: var(--squonk-roles-relief-control-edge); }",
    "b/b.tsx": "const fill = theme.relief.glass.raised.fill;",
  });
  assert.deepEqual(
    (await findRawTokenUses(dir)).map((p) => p.split(" ")[1]).sort(),
    ["--squonk-relief-raised-fill", "theme.relief.glass.raised.fill"],
  );
});

test("flags raw switch tokens: components read the purposes a switch sets", async () => {
  const dir = await fixture({
    "a/a.module.css": ".a { background-image: var(--squonk-switches-button-case); box-shadow: var(--squonk-roles-type-button-case); }",
    "b/b.tsx": "const fill = theme.switches.buttonCase;",
  });
  assert.deepEqual(
    (await findRawTokenUses(dir)).map((p) => p.split(" ")[1]).sort(),
    ["--squonk-switches-button-case", "theme.switches.buttonCase"],
  );
});

test("accepts purpose, component, presentation and tone tokens", async () => {
  const dir = await fixture({
    "a/a.module.css": ".a { gap: var(--squonk-roles-space-field-gap); padding: var(--squonk-components-button-padding-inline-default); height: var(--squonk-presentation-control-height-default); color: var(--squonk-colors-tone-error-solid); }",
  });
  assert.deepEqual(await findRawTokenUses(dir), []);
});

test("accepts the motion level, but not raw motion steps", async () => {
  const dir = await fixture({
    "a/a.module.css": ".a { scale: calc(1 - var(--squonk-motion-level-reduced, 0)); }",
    "b/b.module.css": ".b { translate: 0 var(--squonk-motion-distances-md); }",
  });
  const problems = await findRawTokenUses(dir);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /squonk-motion-distances-md/);
});

test("skips files that declare a scale API, and tests and stories", async () => {
  const dir = await fixture({
    "a/a.tsx": "// purpose-tokens: scale-api — gap is the consumer's choice\nconst gap = `var(--squonk-spacing-${step})`;",
    "b/b.test.tsx": "const x = 'var(--squonk-spacing-sm)';",
  });
  assert.deepEqual(await findRawTokenUses(dir), []);
});

test("flags motion a component declares itself", async () => {
  const dir = await fixture({
    "a/a.module.css": ".a {\n  transition: var(--squonk-roles-motion-feedback);\n}\n.b {\n  animation: spin 1s;\n}\n@keyframes spin {\n  to { rotate: 1turn; }\n}",
  });
  assert.equal((await findOwnMotion(dir)).length, 3);
});

test("accepts motion settings, and the Motion components' own stylesheet", async () => {
  const dir = await fixture({
    "a/a.module.css": ".a {\n  --motion-property: rotate;\n  --motion-duration: var(--squonk-components-a-turn);\n}",
    "animation/motion/motion.module.css": ".pop {\n  animation: squonk-pop-in 1s;\n}",
  });
  assert.deepEqual(await findOwnMotion(dir), []);
});

test("flags motion in any other animation stylesheet", async () => {
  const dir = await fixture({ "animation/reveal/reveal.module.css": ".root {\n  transition: opacity 1s;\n}" });
  assert.equal((await findOwnMotion(dir)).length, 1);
});
