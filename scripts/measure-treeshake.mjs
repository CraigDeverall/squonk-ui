#!/usr/bin/env node
/**
 * Smoke-test the tree-shaking story by spinning up a tiny consumer
 * project that installs @squonk/ui from this repo (via file: dep) and
 * bundles a tiny entry with esbuild. Compares barrel-import vs subpath
 * import to show the practical delta.
 *
 *   node scripts/measure-treeshake.mjs button Button
 *
 * Requires the library to be built (run `npm run build` first).
 */
import { mkdir, rm, writeFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const componentName = process.argv[2] ?? "button";
const exportName =
  process.argv[3] ??
  componentName.charAt(0).toUpperCase() + componentName.slice(1);

const TMP = join(tmpdir(), `squonk-ui-treeshake-${componentName}`);
const ROOT = process.cwd();

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });

await writeFile(
  join(TMP, "package.json"),
  JSON.stringify(
    {
      name: "treeshake-probe",
      private: true,
      type: "module",
      dependencies: {
        "@squonk/ui": `file:${ROOT}`,
      },
    },
    null,
    2
  )
);

// Only externalize what a real consumer app would externalize: peer
// deps (React, ReactDOM). Regular dependencies must be
// bundled in so we see how much of them the consumer's final bundle would
// actually contain.
const externals = ["react", "react-dom", "react/jsx-runtime"];

console.log("Installing probe (linking @squonk/ui from this repo)...");
const install = spawnSync(
  "npm",
  ["install", "--silent", "--no-audit", "--no-fund", "--no-package-lock"],
  { cwd: TMP, stdio: "inherit" }
);
if (install.status !== 0) {
  console.error("npm install failed");
  process.exit(1);
}

const samples = [
  {
    label: "barrel    @squonk/ui",
    source: `import { ${exportName} } from "@squonk/ui";\nexport default ${exportName};\n`,
  },
  {
    label: `subpath   @squonk/ui/${componentName}`,
    source: `import { ${exportName} } from "@squonk/ui/${componentName}";\nexport default ${exportName};\n`,
  },
];

console.log(`\nBundling <${exportName}> via esbuild (consumer-style):\n`);

for (const [i, sample] of samples.entries()) {
  const entry = join(TMP, `entry-${i}.tsx`);
  const out = join(TMP, `bundle-${i}.mjs`);
  await writeFile(entry, sample.source);

  const esbuildBin = join(ROOT, "node_modules/.bin/esbuild");
  const args = [
    entry,
    "--bundle",
    `--outfile=${out}`,
    "--format=esm",
    "--platform=browser",
    "--minify",
    "--tree-shaking=true",
    ...externals.map((e) => `--external:${e}`),
  ];
  const r = spawnSync(esbuildBin, args, { cwd: TMP, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`esbuild failed for sample ${i}`);
    process.exit(1);
  }
  const s = await stat(out);
  console.log(`  ${sample.label.padEnd(36)} ${(s.size).toString().padStart(6)} B`);
}

console.log(`\nArtifacts left in ${TMP} for inspection.\n`);
