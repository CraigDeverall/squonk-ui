import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import Module, { createRequire } from "node:module";
import { createEnv } from "yeoman-environment";
import mdxLoader from "@storybook/addon-docs/mdx-loader";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ComponentGenerator from "./index.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const generatorPath = path.join(root, "generators/component/index.js");
const folders = { LayoutPrimitive: "layout-primitive", Layout: "layout", FunctionalPrimitive: "functional-primitive", Functional: "functional" };
const storyGroups = { LayoutPrimitive: "Layout/Primitives", Layout: "Layout", FunctionalPrimitive: "Functional/Primitives", Functional: "Functional" };
async function compile(content) {
  return new Promise((resolve, reject) => {
    mdxLoader.call({ resourcePath: "generated.mdx", getOptions: () => ({}), async: () => (error, result) => error ? reject(error) : resolve(result) }, content);
  });
}
// Node can't load CSS modules or the TypeScript theme hook; the type-check
// below covers them. Stub both so the generated markup can be rendered.
function loadWithStubs(file) {
  const require = createRequire(file);
  const originalLoad = Module._load;
  Module._load = function (request, ...rest) {
    if (request.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (request === "../../../theme/use-theme-css-vars") return { useThemeCssVars: () => ({ style: {}, provide: (children) => children }) };
    return originalLoad.call(this, request, ...rest);
  };
  try {
    return require(file);
  } finally {
    Module._load = originalLoad;
  }
}

async function generate(cwd, options) {
  const env = createEnv({ cwd });
  env.registerStub(ComponentGenerator, "dt:component", generatorPath);
  await env.run("dt:component", { purpose: "Use for a focused composition.", children: true, polymorphic: false, force: true, "skip-install": true, "skip-cache": true, ...options });
}

test("generator emits all four categories, type-safe stories/tests, valid MDX and native void/button markup", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "squonk-generator-"));
  try {
    await symlink(path.join(root, "node_modules"), path.join(cwd, "node_modules"));
    // Generated files import the library by relative path (../../../theme…),
    // as they would in the repo, so mirror src/ beside them: everything but
    // components/, which stays real so nothing is written into the repo.
    await mkdir(path.join(cwd, "src"));
    for (const entry of await readdir(path.join(root, "src"))) {
      if (entry !== "components") await symlink(path.join(root, "src", entry), path.join(cwd, "src", entry));
    }
    const sources = [];
    let index = 0;
    for (const type of Object.keys(folders)) {
      for (const base of ["button", "input"]) {
        const name = `Generated${index++}`;
        await generate(cwd, { name, type, base, polymorphic: type === "Functional" });
        const dir = path.join(cwd, "src/components", folders[type], name.replace("Generated", "generated-"));
        const sourcePath = path.join(dir, `${name.replace("Generated", "generated-")}.tsx`);
        const source = await readFile(sourcePath, "utf8");
        const storySource = await readFile(sourcePath.replace(/\.tsx$/, ".stories.tsx"), "utf8");
        assert.ok(storySource.includes(`title: "${storyGroups[type]}/${name}"`), `${type} must use the supported Storybook group`);
        assert.match(source, /^"use client";/);
        assert.equal(source.includes("as,"), type === "LayoutPrimitive" || type === "Functional");
        if (base === "input" || type === "LayoutPrimitive" || type === "Functional") {
          const typesPath = path.join(dir, "consumer-types.tsx");
          await writeFile(typesPath, `import { ${name} } from "./${name.replace("Generated", "generated-")}";\n// @ts-expect-error Native void elements must reject children.\nconst invalid = <${name}${base === "input" ? "" : ' as="input"'}>Invalid child</${name}>;\nvoid invalid;\n`);
        }
        for (const entry of await readdir(dir)) {
          if (entry.endsWith(".tsx")) sources.push(path.join(dir, entry));
          if (entry.endsWith(".mdx")) await compile(await readFile(path.join(dir, entry), "utf8"));
        }
        const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
        const runtimePath = path.join(dir, "runtime.cjs");
        await writeFile(runtimePath, output);
        const Generated = loadWithStubs(runtimePath)[name];
        const props = base === "input" ? { "aria-label": "Generated input", name: "example" } : { children: "Action" };
        const html = renderToStaticMarkup(React.createElement(Generated, props));
        assert.match(html, /class="root"/);
        assert.match(html, new RegExp(`<${base}\\b`));
        if (base === "button") assert.match(html, /type="button"/);
        else assert.match(html, /name="example"/);
      }
    }
    const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
    const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const program = ts.createProgram([...sources, path.join(root, "src/types/types.d.ts"), path.join(root, "src/types/css-modules.d.ts")], { ...options, noEmit: true });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: (f) => f, getCurrentDirectory: () => root, getNewLine: () => "\n" }));
    // Existing components and invalid path-like names must never be overwritten.
    await assert.rejects(generate(cwd, { name: "Generated0", type: "LayoutPrimitive", base: "button" }), /already exists/);
    await assert.rejects(generate(cwd, { name: "../Escape", type: "Functional", base: "div" }), /PascalCase/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
