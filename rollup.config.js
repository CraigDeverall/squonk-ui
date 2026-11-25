import { readFile } from "fs/promises";
import path from "path";
import dts from "rollup-plugin-dts";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";
import { fileURLToPath } from "url";
import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import ts from "typescript";
import preserveDirectives from "rollup-plugin-preserve-directives";
import { discoverEntries } from "./scripts/discover-component-entries.mjs";
import { cssModules } from "./scripts/rollup-plugin-css-modules.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(
  await readFile(new URL("./package.json", import.meta.url), "utf-8")
);

// Mirror tsconfig.json's `paths` exactly — an alias that exists in only one of
// the two toolchains either fails typecheck or mis-resolves at bundle time.
const aliasEntries = [
  { find: "@src", replacement: "./src" },
  { find: "@components", replacement: "./src/components" },
  { find: "@hooks", replacement: "./src/hooks" },
  { find: "@utils", replacement: "./src/utils" },
];

const isExternal = (id) => {
  // Externalize dependencies AND peer-deps (consumer provides them).
  // Critical for tree-shaking: dependencies are never bundled into our
  // dist — consumers' bundlers pull only the parts actually referenced
  // by the components they import.
  const externals = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ];
  if (externals.some((p) => id === p || id.startsWith(`${p}/`))) {
    return true;
  }
  // Externalize Storybook — its runtime accesses `document` at module
  // load (e.g. react-textarea-autosize), which breaks SSR consumers.
  // The main entry must not pull Storybook in at all; docs-only exports
  // live under `@squonk/ui/docs` and consumers there are expected to
  // have Storybook installed.
  return (
    id === "storybook" ||
    id.startsWith("storybook/") ||
    id.startsWith("@storybook/")
  );
};

function typescriptBuild() {
  let watchMode = false;
  const compiler = typescript({
    tsconfig: path.resolve(__dirname, "tsconfig.rollup.json"),
    typescript: {
      ...ts,
      createWatchProgram(host) {
        // The plugin uses TS's watch compiler even for a one-shot build. On
        // macOS TS 5.7 retains filesystem watchers after program.close(), keeping
        // Rollup alive after every output is written. One-shot builds need only
        // the initial compilation; register watchers exclusively in watch mode.
        const idleWatcher = () => ({ close() {} });
        return ts.createWatchProgram(watchMode ? host : {
          ...host,
          watchFile: idleWatcher,
          watchDirectory: idleWatcher,
        });
      },
    },
    declaration: false,
    declarationMap: false,
  });
  const buildStart = compiler.buildStart;
  return {
    ...compiler,
    buildStart(options) {
      watchMode = this.meta.watchMode === true;
      return buildStart.call(this, options);
    },
  };
}

// Stateful compiler/minifier plugins belong to one Rollup build. Sharing them
// between the preserved library and docs builds also shares their watcher state.
const buildPlugins = ({ preserveModules = false, css } = {}) => [
  nodeResolve(),
  // The library build emits styles.css. The docs build emits docs.css with
  // only the docs helpers' styles; component styles come from styles.css.
  css === "docs"
    ? cssModules({ fileName: "docs.css", include: (file) => !file.startsWith("src/components/") })
    : cssModules({ emit: css === "library", fileName: "styles.css", tokens: "src/theme/tokens.css" }),
  commonjs(),
  typescriptBuild(),
  // Re-attach `"use client"` (and other top-of-file directives) to the
  // output chunks. Without this, components that rely on browser-only
  // APIs (theme-modifier, reveal) lose their directive after typescript
  // transformation and Next.js App Router consumers see "useState in a
  // server component" errors.
  ...(preserveModules ? [preserveDirectives()] : []),
  terser({
    // Terser is happy to strip directives by default — opt back in so
    // preserveDirectives' work survives minification.
    format: { comments: "some", preserve_annotations: true },
    compress: { directives: false },
  }),
  alias({ entries: aliasEntries }),
];

const entries = await discoverEntries();
const componentInputs = entries.map((e) => e.srcPath);

/**
 * The headline build: one rollup pass that emits one .mjs and one .cjs
 * per source module via preserveModules. This gives consumers
 * per-component bundles at predictable paths (mirroring src/), so the
 * package.json exports map can point `./button` → `./dist/components/
 * functional/button/button.mjs` etc. Combined with the externalized
 * dependencies (Ark UI, TanStack Table, etc.), consumers who
 * import a single component get only that component's code.
 */
const preservedBundle = {
  input: ["src/index.ts", ...componentInputs],
  output: [
    {
      dir: "dist",
      format: "esm",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src",
      entryFileNames: "[name].mjs",
      chunkFileNames: "_chunks/[name]-[hash].mjs",
    },
    {
      dir: "dist",
      format: "cjs",
      // ESM-only dependencies such as Color expose a default namespace when
      // loaded by require(); handle those alongside native CommonJS packages.
      interop: "auto",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src",
      entryFileNames: "[name].cjs",
      chunkFileNames: "_chunks/[name]-[hash].cjs",
      // CJS interop: named exports from ESM modules need explicit
      // re-exports in the .cjs wrapper to be reachable as `require()`
      // destructures.
      exports: "named",
    },
  ],
  external: isExternal,
  plugins: buildPlugins({ preserveModules: true, css: "library" }),
};

const dtsBundle = {
  input: "src/index.ts",
  output: { file: "./dist/index.d.ts", format: "es" },
  plugins: [dts(), tsConfigPaths()],
};

const docsBundle = {
  input: "src/docs.ts",
  output: [
    {
      file: "./dist/docs.mjs",
      format: "esm",
      sourcemap: true,
      inlineDynamicImports: true,
      banner: '"use client";',
    },
    {
      file: "./dist/docs.cjs",
      format: "cjs",
      interop: "auto",
      sourcemap: true,
      inlineDynamicImports: true,
      banner: '"use client";',
    },
  ],
  external: isExternal,
  plugins: buildPlugins({ css: "docs" }),
};

const docsDtsBundle = {
  input: "src/docs.ts",
  output: { file: "./dist/docs.d.ts", format: "es" },
  plugins: [dts(), tsConfigPaths()],
};

export default [preservedBundle, dtsBundle, docsBundle, docsDtsBundle];
