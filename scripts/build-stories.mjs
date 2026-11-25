#!/usr/bin/env node
// Bundles the component and example stories into dist/stories, so
// @squonk/ui-mcp's preview_story tool can show them, with their controls, in
// an agent's chat. Runs after rollup: library modules the stories import are
// left as imports of the built dist modules (one copy of each component, styled
// by styles.css), and only story code, demos and Storybook-authoring helpers
// are bundled in.
//
// Writes:
//   dist/stories/stories.mjs    the registry: every story with its meta and controls
//   dist/stories/stories.css    styles of the bundled-in modules (demos, story helpers)
//   dist/stories/manifest.json  the same registry without code, for listing
import * as esbuild from 'esbuild';
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import docgen from 'react-docgen-typescript';
import { storyNameFromExport, toId } from 'storybook/internal/csf';
import { sourceMetadata } from './design-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'stories');
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

/**
 * Stories that can't run outside Storybook, with the reason the tool gives.
 * Everything else in the component and example folders is previewable.
 */
export const UNAVAILABLE = {};

const posix = (p) => p.split(path.sep).join('/');

/** Every component and demo stories file, relative to the repository root. */
export function storyFiles(root = ROOT) {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.stories.tsx')) files.push(posix(path.relative(root, full)));
    }
  };
  walk(path.join(root, 'src/components'));
  for (const name of readdirSync(path.join(root, 'src/demos'))) if (name.endsWith('.stories.tsx')) files.push(`src/demos/${name}`);
  return files.sort();
}

const unwrap = (node) => node && (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) ? unwrap(node.expression) : node;
const jsDocText = (node) => {
  const docs = (node.jsDoc ?? []).map((doc) => (typeof doc.comment === 'string' ? doc.comment : (doc.comment ?? []).map((c) => c.text).join(''))).filter(Boolean);
  return docs.length ? docs.join('\n').replace(/\s+/g, ' ').trim() : undefined;
};

/**
 * What the stories file says about itself, read without running it: its title
 * and id (as the design catalog reads them), each story's export, display name
 * and JSDoc, and which module the meta's `component` comes from.
 */
export function readStoriesFile(file, root = ROOT) {
  const source = readFileSync(path.join(root, file), 'utf8');
  const { title, storyId, exports } = sourceMetadata(source, file);
  if (!title) throw new Error(`${file} has no meta title`);
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imports = new Map();
  const stories = new Map();
  let component;
  for (const node of tree.statements) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) for (const e of bindings.elements) imports.set(e.name.text, { from: node.moduleSpecifier.text, name: (e.propertyName ?? e.name).text });
      if (node.importClause?.name) imports.set(node.importClause.name.text, { from: node.moduleSpecifier.text, name: 'default' });
    }
    if (ts.isVariableStatement(node)) {
      for (const d of node.declarationList.declarations) {
        const init = unwrap(d.initializer);
        if (!ts.isIdentifier(d.name) || !init) continue;
        const exported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
        if (d.name.text === 'meta' && ts.isObjectLiteralExpression(init)) {
          for (const p of init.properties) if (ts.isPropertyAssignment(p) && p.name.getText(tree) === 'component' && ts.isIdentifier(unwrap(p.initializer))) component = unwrap(p.initializer).text;
        }
        if (exported) {
          let name;
          if (ts.isObjectLiteralExpression(init)) {
            for (const p of init.properties) if (ts.isPropertyAssignment(p) && p.name.getText(tree) === 'name' && ts.isStringLiteralLike(p.initializer)) name = p.initializer.text;
          }
          stories.set(d.name.text, { name, description: jsDocText(node) });
        }
      }
    }
    if (ts.isFunctionDeclaration(node) && node.name && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      stories.set(node.name.text, { description: jsDocText(node) });
    }
  }
  const metaId = storyId ?? toId(title);
  return {
    file,
    title,
    component: component && imports.get(component) ? { name: imports.get(component).name, from: imports.get(component).from } : undefined,
    stories: exports.map((exportName) => {
      const name = stories.get(exportName)?.name ?? storyNameFromExport(exportName);
      return { exportName, id: toId(metaId, storyNameFromExport(exportName)), name, description: stories.get(exportName)?.description };
    }),
  };
}

/** Resolves a relative or `@src/` import from a stories file to a source file. */
function resolveSource(fromFile, specifier) {
  let base;
  if (specifier.startsWith('.')) base = path.resolve(ROOT, path.dirname(fromFile), specifier);
  else if (specifier.startsWith('@src/')) base = path.join(SRC, specifier.slice(5));
  else if (specifier.startsWith('@components/')) base = path.join(SRC, 'components', specifier.slice(12));
  else return undefined;
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return undefined;
}

/** Props never offered as controls: they need code, not a value. */
const HIDDEN_PROPS = new Set(['as', 'ref', 'key', 'className', 'style']);

const literal = (raw) => {
  const value = raw.trim();
  if (/^".*"$|^'.*'$/.test(value)) return value.slice(1, -1);
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return undefined;
};

/**
 * Storybook-style argTypes from a component's props, as Storybook's docgen
 * would infer them: literal unions become a select (or radio when short),
 * booleans a switch, numbers and strings an input. Functions get no control.
 * Complex types (arrays, objects) are kept with `control: "object"`; the page
 * shows them only when the story sets a value.
 */
export function argTypesFromProps(props) {
  const argTypes = {};
  for (const [name, prop] of Object.entries(props)) {
    if (HIDDEN_PROPS.has(name) || /^aria-|^data-/.test(name)) continue;
    const type = prop.type?.name ?? '';
    const entry = { name, description: prop.description || undefined, type: { required: Boolean(prop.required) }, table: {} };
    if (prop.defaultValue?.value !== undefined) entry.table.defaultValue = { summary: String(prop.defaultValue.value) };
    entry.table.type = { summary: prop.type?.raw ?? type };
    if (type === 'enum') {
      const values = (prop.type.value ?? []).map((v) => literal(String(v.value))).filter((v) => v !== undefined);
      const all = (prop.type.value ?? []).filter((v) => v.value !== 'undefined');
      if (values.length && values.every((v) => typeof v === 'boolean')) entry.control = { type: 'boolean' };
      else if (values.length && values.length === all.length) {
        entry.options = values;
        entry.control = { type: values.length <= 4 ? 'inline-radio' : 'select' };
      } else entry.control = { type: 'object' };
    } else if (type === 'boolean') entry.control = { type: 'boolean' };
    else if (type === 'number') entry.control = { type: 'number' };
    else if (type === 'string' || type === 'ReactNode' || type === 'ReactElement' || type === 'string | number') entry.control = { type: 'text' };
    else if (/=>/.test(type) || /^\(\(/.test(type)) entry.control = false;
    else entry.control = { type: 'object' };
    entry.type.name = entry.control === false ? 'function' : entry.control.type;
    argTypes[name] = entry;
  }
  return argTypes;
}

/** Inferred argTypes for each component file, keyed by "<file>#<export>". */
function inferArgTypes(files) {
  const targets = [...new Set(files.map((f) => f.componentFile).filter(Boolean))];
  if (!targets.length) return {};
  const parser = docgen.withCustomConfig(path.join(ROOT, 'tsconfig.json'), {
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    savePropValueAsString: true,
    // The library's own props, not the DOM's or React Aria's.
    propFilter: (prop) => !prop.parent || !/node_modules/.test(prop.parent.fileName),
  });
  const byKey = {};
  for (const doc of parser.parse(targets)) {
    byKey[`${path.resolve(ROOT, doc.filePath)}#${doc.displayName}`] = argTypesFromProps(doc.props ?? {});
  }
  return byKey;
}

/**
 * Storybook APIs the stories use, replaced for a page without Storybook. The
 * args hooks read from a context the preview page provides, so a story that
 * updates its own args (a controlled Switch) moves the page's controls too.
 */
const SHIMS = {
  'storybook/preview-api': `
    import { createContext, useContext } from "react";
    export const StoryArgsContext = createContext(null);
    const none = { args: {}, update: () => {}, reset: () => {}, globals: {}, parameters: {} };
    export function useArgs() { const c = useContext(StoryArgsContext) ?? none; return [c.args, c.update, c.reset]; }
    export function useGlobals() { const c = useContext(StoryArgsContext) ?? none; return [c.globals, () => {}]; }
    export function useParameter(key, fallback) { const c = useContext(StoryArgsContext) ?? none; return c.parameters?.[key] ?? fallback; }
    export function useStoryContext() { return useContext(StoryArgsContext)?.context ?? {}; }
    const channel = { on() {}, off() {}, once() {}, emit() {}, addListener() {}, removeListener() {} };
    export const addons = { getChannel: () => channel };
  `,
  'storybook/test': `
    export function fn(impl) {
      const calls = [];
      const spy = (...args) => { calls.push(args); return impl ? impl(...args) : undefined; };
      spy.mock = { calls };
      spy.mockName = () => spy;
      spy.mockImplementation = (next) => { impl = next; return spy; };
      return spy;
    }
    export const expect = () => { throw new Error("storybook/test assertions don't run outside Storybook"); };
    export const userEvent = {};
    export const within = () => ({});
    export const waitFor = async (callback) => callback();
  `,
  'storybook/internal/core-events': `
    export const SET_GLOBALS = "setGlobals";
    export const GLOBALS_UPDATED = "globalsUpdated";
    export const UPDATE_GLOBALS = "updateGlobals";
    export const STORY_ARGS_UPDATED = "storyArgsUpdated";
    export const UPDATE_STORY_ARGS = "updateStoryArgs";
    export const RESET_STORY_ARGS = "resetStoryArgs";
  `,
};

function storybookShims() {
  return {
    name: 'storybook-shims',
    setup(build) {
      build.onResolve({ filter: /^(storybook|@storybook)(\/|$)/ }, (args) => {
        if (args.path in SHIMS) return { path: args.path, namespace: 'storybook-shim' };
        return { errors: [{ text: `${args.path} (imported by ${posix(path.relative(ROOT, args.importer))}) has no shim for previews outside Storybook. Add one to SHIMS in scripts/build-stories.mjs.` }] };
      });
      build.onLoad({ filter: /.*/, namespace: 'storybook-shim' }, (args) => ({ contents: SHIMS[args.path], loader: 'js', resolveDir: ROOT }));
    },
  };
}

/**
 * Leaves every library module that rollup built as an import of its dist file,
 * so stories share the one copy of each component (and its context) that the
 * app imports, styled by styles.css. Modules without a dist file, or whose dist
 * file lacks an export the stories need (rollup drops unused ones), are bundled.
 */
function libraryModules(inline) {
  return {
    name: 'library-modules',
    setup(build) {
      build.onResolve({ filter: /^(\.|\/|@src\/|@components\/|@hooks\/|@utils\/)/ }, async (args) => {
        if (args.pluginData?.resolving || !['file', ''].includes(args.namespace)) return undefined;
        const result = await build.resolve(args.path, { kind: args.kind, resolveDir: args.resolveDir, importer: args.importer, pluginData: { resolving: true } });
        if (result.errors.length || result.external) return undefined;
        const rel = posix(path.relative(SRC, result.path));
        if (rel.startsWith('..') || !/\.(tsx?|jsx?)$/.test(rel) || rel.endsWith('.stories.tsx') || inline.has(rel)) return { path: result.path };
        const built = path.join(DIST, rel.replace(/\.(tsx?|jsx?)$/, '.mjs'));
        if (!existsSync(built)) return { path: result.path };
        return { path: `./${posix(path.relative(OUT, built))}`, external: true };
      });
    },
  };
}

function externals() {
  // Zod is what the form demos validate with; apps that build forms have it,
  // and @squonk/ui-mcp supplies its own copy to apps that don't.
  const names = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {}), 'zod'];
  return names.flatMap((name) => [name, `${name}/*`]);
}

function entrySource(files, argTypes) {
  const lines = [
    `export { StoryArgsContext } from "storybook/preview-api";`,
    `export { SquonkThemeProvider } from ${JSON.stringify(path.join(SRC, 'theme/theme-provider.tsx'))};`,
    // The docs' example themes, so a preview can show a story in each.
    `export { EXAMPLE_THEMES, themeFonts } from ${JSON.stringify(path.join(SRC, 'design-system/themes/themes.ts'))};`,
  ];
  const records = [];
  files.forEach((file, i) => {
    lines.push(`import * as s${i} from ${JSON.stringify(path.join(ROOT, file.file))};`);
    const types = file.componentFile ? argTypes[`${file.componentFile}#${file.component.name}`] : undefined;
    lines.push(`const a${i} = ${JSON.stringify(types ?? {})};`);
    for (const story of file.stories) {
      const info = { id: story.id, title: file.title, name: story.name, ...(UNAVAILABLE[story.id] ? { unavailable: UNAVAILABLE[story.id] } : {}) };
      records.push(`{ ...${JSON.stringify(info)}, get meta() { return s${i}.default; }, get story() { return s${i}[${JSON.stringify(story.exportName)}]; }, argTypes: a${i} }`);
    }
  });
  lines.push(`export const stories = [\n${records.join(',\n')}\n];`);
  return lines.join('\n');
}

/** The listing written beside the bundle: everything but the code. */
/**
 * The docs' example themes as plain theme objects (id, name, description,
 * primitives, roleBindings), for listing and for the MCP server's get_theme
 * without loading the bundle. Their source is bundled and run once here.
 */
export async function exampleThemes() {
  const result = await esbuild.build({
    entryPoints: [path.join(SRC, 'design-system/themes/themes.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
  });
  const url = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`;
  const { EXAMPLE_THEMES } = await import(url);
  return EXAMPLE_THEMES.map(({ id, name, description, primitives, roleBindings }) => ({ id, name, description, primitives, roleBindings }));
}

export function manifestEntries(files, argTypes) {
  return files.flatMap((file) => {
    const kind = file.file.startsWith('src/demos/') ? 'demo' : 'component';
    const component = kind === 'component' ? path.basename(path.dirname(file.file)) : path.basename(file.file, '.stories.tsx');
    const types = file.componentFile ? argTypes[`${file.componentFile}#${file.component.name}`] : undefined;
    return file.stories.map((story) => ({
      id: story.id,
      title: file.title,
      name: story.name,
      kind,
      component,
      export: story.exportName,
      ...(story.description ? { description: story.description } : {}),
      controls: Object.keys(types ?? {}).length,
      ...(UNAVAILABLE[story.id] ? { unavailable: UNAVAILABLE[story.id] } : {}),
    }));
  });
}

async function bundle(files, argTypes, inline) {
  return esbuild.build({
    stdin: { contents: entrySource(files, argTypes), resolveDir: ROOT, sourcefile: 'stories-entry.js', loader: 'js' },
    bundle: true,
    outfile: path.join(OUT, 'stories.mjs'),
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    // Identifiers stay readable so the CSS-module class names (demo-shell_shell)
    // can't collide with the library's or an app's.
    minifyWhitespace: true,
    minifySyntax: true,
    legalComments: 'none',
    tsconfig: path.join(ROOT, 'tsconfig.json'),
    external: externals(),
    loader: { '.woff2': 'file', '.woff': 'file', '.svg': 'dataurl', '.png': 'dataurl' },
    plugins: [storybookShims(), libraryModules(inline)],
    metafile: true,
    logLevel: 'silent',
  });
}

/**
 * Bundles the output once more against dist, which fails on any import of an
 * export the dist module doesn't have. Returns the source modules to bundle in
 * instead.
 */
async function missingExports() {
  try {
    await esbuild.build({
      entryPoints: [path.join(OUT, 'stories.mjs')],
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'browser',
      external: externals(),
      loader: { '.css': 'empty' },
      logLevel: 'silent',
    });
    return [];
  } catch (error) {
    const modules = new Set();
    for (const e of error.errors ?? []) {
      const match = /No matching export in "([^"]+)"/.exec(e.text);
      if (!match) throw error;
      modules.add(posix(path.relative(DIST, path.resolve(OUT, match[1]))).replace(/\.mjs$/, ''));
    }
    // Back to the source file: the dist path without its extension.
    return [...modules].map((stem) => ['.tsx', '.ts'].map((ext) => `${stem}${ext}`).find((rel) => existsSync(path.join(SRC, rel))) ?? `${stem}.ts`);
  }
}

export async function buildStories() {
  if (!existsSync(path.join(DIST, 'index.mjs'))) throw new Error('Build the library first: dist/index.mjs is missing.');
  const started = Date.now();
  const files = storyFiles().map((file) => {
    const read = readStoriesFile(file);
    const componentFile = read.component ? resolveSource(file, read.component.from) : undefined;
    return { ...read, componentFile };
  });
  const argTypes = inferArgTypes(files);
  mkdirSync(OUT, { recursive: true });
  const inline = new Set();
  let result;
  for (let attempt = 0; ; attempt++) {
    result = await bundle(files, argTypes, inline);
    const missing = (await missingExports()).filter((rel) => !inline.has(rel));
    if (!missing.length) break;
    if (attempt > 5) throw new Error(`Stories still import exports missing from dist: ${missing.join(', ')}`);
    for (const rel of missing) inline.add(rel);
  }
  const manifest = { schemaVersion: 1, library: pkg.version, exampleThemes: await exampleThemes(), stories: manifestEntries(files, argTypes) };
  writeFileSync(path.join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const bundled = Object.keys(result.metafile.inputs).filter((input) => input.startsWith('src/') && !input.endsWith('.stories.tsx'));
  if (process.argv.includes('--analyze')) console.log(await esbuild.analyzeMetafile(result.metafile));
  return { files, manifest, bundled, inline: [...inline], ms: Date.now() - started };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildStories().then(
    ({ manifest, bundled, inline, ms }) => {
      const size = (name) => (existsSync(path.join(OUT, name)) ? `${Math.round(statSync(path.join(OUT, name)).size / 1024)} KB` : 'none');
      console.log(`Stories bundled: ${manifest.stories.length} stories, stories.mjs ${size('stories.mjs')}, stories.css ${size('stories.css')}, in ${(ms / 1000).toFixed(1)}s.`);
      if (process.argv.includes('--verbose')) {
        console.log(`Bundled source modules (${bundled.length}):\n  ${bundled.join('\n  ')}`);
        if (inline.length) console.log(`Bundled because dist lacks an export:\n  ${inline.join('\n  ')}`);
      }
    },
    (error) => {
      console.error(error.errors?.map((e) => e.text).join('\n') ?? error.message);
      process.exitCode = 1;
    },
  );
}
