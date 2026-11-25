#!/usr/bin/env node
// Exercise the bytes npm would publish, using the already installed dependency
// graph. No registry access or dependency installation. Suppress pack hooks and
// Husky (npm 10 can still invoke prepare despite --ignore-scripts).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("..", import.meta.url));
const scratch = await mkdtemp(path.join(tmpdir(), "squonk-packed-consumer-"));

function run(command, args, cwd = scratch, timeout = 60000) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout,
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, HUSKY: "0", npm_config_cache: path.join(scratch, "npm-cache"), npm_config_userconfig: path.join(scratch, ".npmrc") },
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} failed (${result.status ?? result.error?.code}):\n${result.stdout ?? ""}${result.stderr ?? ""}`);
  }
  return result.stdout;
}

try {
  // Packing local bytes needs no operator registry credentials/configuration.
  await writeFile(path.join(scratch, ".npmrc"), "");
  const expectedPackage = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const packMetadata = JSON.parse(run("npm", ["pack", "--ignore-scripts", "--foreground-scripts=false", "--json", "--pack-destination", scratch], root));
  // npm <=11 returns an array; npm 12 returns records keyed by package name.
  // Validate the envelope and identity before trusting the tarball filename.
  const keyedMetadata = packMetadata !== null && typeof packMetadata === "object" && !Array.isArray(packMetadata);
  if (keyedMetadata) assert.deepEqual(Object.keys(packMetadata), [expectedPackage.name], "unexpected npm pack package keys");
  const packed = keyedMetadata ? Object.values(packMetadata) : packMetadata;
  assert.ok(Array.isArray(packed), "npm pack metadata must be an array or package-keyed object");
  assert.equal(packed.length, 1, "npm pack must produce exactly one tarball");
  assert.equal(packed[0]?.name, expectedPackage.name, "packed package name mismatch");
  assert.equal(packed[0]?.version, expectedPackage.version, "packed package version mismatch");
  const filename = packed[0]?.filename;
  assert.ok(typeof filename === "string" && filename.endsWith(".tgz") && path.basename(filename) === filename && !filename.includes("\\"), "unsafe npm pack tarball filename");
  assert.ok((await stat(path.join(scratch, filename))).isFile(), "npm pack tarball is missing");
  run("tar", ["-xzf", path.join(scratch, filename), "-C", scratch]);
  const packageDir = path.join(scratch, "package");
  const pkg = JSON.parse(await readFile(path.join(packageDir, "package.json"), "utf8"));
  assert.equal(pkg.license, "MIT", "package license must match the shipped license");
  assert.match(await readFile(path.join(packageDir, "LICENSE"), "utf8"), /MIT License/);
  assert.ok(Array.isArray(pkg.sideEffects) && pkg.sideEffects.includes("**/*.css"), "CSS must be retained by consumer tree shaking");
  assert.ok((await readFile(path.join(packageDir, "dist/styles.css"), "utf8")).trim(), "packed stylesheet must not be empty");
  assert.match(await readFile(path.join(packageDir, "dist/fonts.css"), "utf8"), /@fontsource-variable\/inter/, "packed font stylesheet must load Inter");
  // The shipped agent skill and catalog must describe this exact package: every
  // catalog entry and every import in the skill must resolve to a real export.
  const catalog = JSON.parse(await readFile(path.join(packageDir, pkg.exports["./catalog.json"]), "utf8"));
  assert.ok(catalog.components.length > 0, "packed catalog must list components");
  for (const component of catalog.components) {
    assert.ok(pkg.exports[component.importPath.replace(pkg.name, ".")], `catalog import path is not exported: ${component.importPath}`);
  }
  // The guides ship too, and every link in them resolves to a guide or a catalog entry.
  const { guides } = JSON.parse(await readFile(path.join(packageDir, pkg.exports["./guides.json"]), "utf8"));
  assert.ok(guides.some((guide) => guide.id === "patterns-labels-badge-or-tag"), "packed guides must include the patterns");
  const known = new Set([...guides.map((g) => `guides/${g.id}`), ...catalog.components.map((c) => `components/${c.id}`)]);
  for (const guide of guides) {
    for (const [, target] of guide.text.matchAll(/\(squonk-ui:\/\/([a-z-]+\/[a-z0-9-]+)\)/g)) {
      assert.ok(known.has(target), `guide ${guide.id} links to an unknown ${target}`);
    }
  }
  const skill = await readFile(path.join(packageDir, pkg.exports["./skill"]), "utf8");
  assert.match(skill, /^---\nname: [a-z-]+\ndescription: .+\n---\n/, "packed skill needs name and description frontmatter");
  const skillImports = [...skill.matchAll(/import\s+(?:\{([^}]*)\}\s+from\s+)?"([^"]+)"/g)];
  assert.ok(skillImports.length > 0, "packed skill must show imports");
  for (const [, names = "", specifier] of skillImports) {
    if (!specifier.startsWith(pkg.name)) continue;
    const entry = pkg.exports[specifier.replace(pkg.name, ".")];
    assert.ok(entry, `skill imports a path that is not exported: ${specifier}`);
    const declarations = typeof entry === "object" ? await readFile(path.join(packageDir, entry.types), "utf8") : "";
    for (const name of names.split(",").map((value) => value.trim()).filter(Boolean)) {
      assert.match(declarations, new RegExp(`\\b${name}\\b`), `skill imports ${name}, which ${specifier} does not declare`);
    }
  }
  // `npx @squonk/ui` runs the package's only bin, which may use nothing but
  // Node built-ins and its own files: the library's dependencies are React's.
  assert.equal(typeof pkg.bin, "object", "package.json must declare the setup bin");
  assert.deepEqual(Object.keys(pkg.bin), ["squonk-ui"], "npx runs the only bin, so declare exactly one");
  const binFile = path.resolve(packageDir, pkg.bin["squonk-ui"]);
  assert.ok(binFile.startsWith(`${packageDir}${path.sep}`), "unsafe bin target");
  assert.match(await readFile(binFile, "utf8"), /^#!\/usr\/bin\/env node\n/, "the bin needs a node shebang");
  for (const file of await readdir(path.dirname(binFile))) {
    assert.ok(!file.endsWith(".test.mjs"), `bin tests must not ship: ${file}`);
    const code = await readFile(path.join(path.dirname(binFile), file), "utf8");
    for (const [, specifier] of code.matchAll(/^import\s[^"']*["']([^"']+)["']/gm)) {
      assert.ok(specifier.startsWith("node:") || specifier.startsWith("./"), `the bin may only import Node built-ins and its own files: ${file} imports ${specifier}`);
    }
  }
  assert.match(run(process.execPath, [binFile, "--help"]), /Usage: npx @squonk\/ui/, "the packed bin must run");
  const targets = (value) => typeof value === "string" ? [value] : Object.values(value).flatMap(targets);
  for (const target of targets(pkg.exports)) {
    const resolved = path.resolve(packageDir, target);
    assert.ok(target.startsWith("./") && resolved.startsWith(`${packageDir}${path.sep}`), `unsafe export target: ${target}`);
    assert.ok((await stat(resolved)).isFile(), `missing packed export: ${target}`);
  }
  // Inspect both output formats: directives must survive minification and the
  // pure barrels must not force every utility into a client-only entrypoint.
  const clientPaths = Object.values(pkg.exports)
    .filter((value) => typeof value === "object" && value.import?.startsWith("./dist/components/"))
    .flatMap((value) => [value.import, value.require]);
  clientPaths.push(...["theme-provider", "theme-meta-context"].flatMap((name) => ["mjs", "cjs"].map((ext) => `./dist/theme/${name}.${ext}`)));
  for (const target of clientPaths) {
    const code = await readFile(path.join(packageDir, target), "utf8");
    assert.match(code, /^(?:\s*["']use (?:strict|client)["'];?)+/, `missing directive prologue: ${target}`);
    assert.match(code.slice(0, 100), /["']use client["']/, `lost client boundary: ${target}`);
  }
  // Plain-HTML components must not pull in Ark UI, which only backs components
  // with real behaviour. Follow their emitted local graph in both formats.
  const checked = new Set();
  async function checkIsolatedGraph(file) {
    if (checked.has(file)) return;
    checked.add(file);
    const source = ts.createSourceFile(file, await readFile(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const imports = [];
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require")) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text);
      ts.forEachChild(node, visit);
    }
    visit(source);
    for (const dependency of imports) {
      assert.ok(!/^(react-aria|react-stately|@react-aria\/|@react-stately\/)/.test(dependency), `plain primitive imports React Aria: ${file}`);
      if (dependency.startsWith(".")) await checkIsolatedGraph(path.resolve(path.dirname(file), dependency));
    }
  }
  for (const name of ["badge", "skeleton", "alert", "kbd", "theme-modifier", "theme-style-block"]) {
    for (const condition of ["import", "require"]) await checkIsolatedGraph(path.join(packageDir, pkg.exports[`./${name}`][condition]));
  }

  const modules = path.join(scratch, "node_modules");
  await mkdir(modules);
  for (const entry of await readdir(path.join(root, "node_modules"), { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const source = path.join(root, "node_modules", entry.name);
    if (entry.name === "@squonk") {
      await mkdir(path.join(modules, entry.name), { recursive: true });
      for (const name of await readdir(source)) {
        if (name !== "ui") await symlink(path.join(source, name), path.join(modules, entry.name, name));
      }
    } else {
      await symlink(source, path.join(modules, entry.name));
    }
  }
  await mkdir(path.join(modules, "@squonk"), { recursive: true });
  await symlink(packageDir, path.join(modules, "@squonk/ui"));
  await writeFile(path.join(scratch, "package.json"), JSON.stringify({ private: true, type: "module" }));

  const entries = Object.entries(pkg.exports).filter(([, value]) => typeof value === "object" && value.import && value.require);
  const specifier = (subpath) => subpath === "." ? pkg.name : `${pkg.name}/${subpath.slice(2)}`;
  // Docs helpers intentionally depend on the browser-only Storybook runtime.
  // Their files/types are checked here; Storybook build/browser checks own them.
  const runtimeEntries = entries.filter(([name]) => name !== "./docs").map(([name]) => specifier(name));
  await writeFile(path.join(scratch, "runtime.mjs"), `
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import React from "react";
import { renderToString } from "react-dom/server";
const require = createRequire(import.meta.url);
const failures = [];
for (const name of ${JSON.stringify(runtimeEntries)}) {
  for (const [mode, load] of [["import", () => import(name)], ["require", () => require(name)]]) {
    try { const entry = await load(); assert.ok(Object.keys(entry).length, "empty module"); }
    catch (error) { failures.push(mode + " " + name + ": " + error.message); }
  }
}
assert.deepEqual(failures, [], failures.join("\\n"));
for (const [mode, library] of [["import", await import(${JSON.stringify(pkg.name)})], ["require", require(${JSON.stringify(pkg.name)})]]) {
  const html = renderToString(React.createElement(library.SquonkThemeProvider, null,
    React.createElement(library.Button, null, "Packed button"),
    React.createElement(library.TextField, { label: "Packed text", name: "packed-text" }),
    React.createElement(library.Select, { label: "Packed select", name: "packed-select", options: [{ value: "one", label: "One" }] })
  ));
  assert.match(html, /Packed button/);
  assert.match(html, /Packed text/);
  assert.match(html, /Packed select/);
  console.log(mode + " SSR passed");
}
console.log(${runtimeEntries.length} + " packed runtime entries loaded with import and require");
`);
  process.stdout.write(run(process.execPath, ["runtime.mjs"]));
  // Model a web consumer's DOM/CSS loader environment while still checking all
  // library declarations.
  await writeFile(path.join(scratch, "web-env.d.ts"), 'declare module "*.css" {}\n');
  const typeFailures = [];
  for (const [group, selected] of [["UI", entries.filter(([name]) => name !== "./docs")], ["Docs", entries.filter(([name]) => name === "./docs")]]) {
    const typeImports = selected.map(([name], index) => `import * as entry${index} from ${JSON.stringify(specifier(name))};\nvoid entry${index};`).join("\n");
    for (const [mode, extension, module, moduleResolution] of [
      ["Bundler", "ts", "ESNext", "Bundler"],
      ["NodeNext ESM", "mts", "NodeNext", "NodeNext"],
      ["NodeNext CommonJS", "cts", "NodeNext", "NodeNext"],
    ]) {
      await writeFile(path.join(scratch, `types.${extension}`), typeImports);
      await writeFile(path.join(scratch, "tsconfig.json"), JSON.stringify({
        compilerOptions: { strict: true, noEmit: true, skipLibCheck: false, target: "ES2022", lib: ["ES2022", "DOM", "DOM.Iterable", "ESNext.Collection"], types: ["node", "react"], module, moduleResolution, jsx: "react-jsx" },
        include: [`types.${extension}`, "web-env.d.ts"],
      }));
      try {
        run(process.execPath, [path.join(root, "node_modules/typescript/bin/tsc"), "-p", path.join(scratch, "tsconfig.json")]);
        console.log(`${group} ${mode} declarations passed (skipLibCheck: false)`);
      } catch (error) { typeFailures.push(`${group} ${mode}: ${error.message}`); }
    }
  }
  if (typeFailures.length) throw new Error(typeFailures.join("\n"));
  console.log(`Packed export files and ${entries.length} declaration entries passed (Node ${process.version}; installed dependency graph; docs runtime excluded).`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
