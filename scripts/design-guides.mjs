// The design system's guides (Foundations, Patterns with Forms, and the Get
// started pages agents need) as plain markdown, for agents that can't open the
// docs site. Each MDX page keeps its prose, tables and code; live examples
// become their JSX source; tables drawn from the theme are generated from it.
// Written to public/design-guides.json by scripts/design-catalog.mjs.
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { gfm } from 'micromark-extension-gfm';
import { mdxjs } from 'micromark-extension-mdxjs';

/** Pages that become guides, by their Storybook title. */
const INCLUDE = [/^Foundations\//, /^Patterns\//, /^Get started\/(Getting started|Working with your agent)$/];

/** Storybook's id for a title: "Patterns/Labels: Badge or Tag" → "patterns-labels-badge-or-tag". */
export const docsId = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Docs-only components that show something visual and say nothing in text. */
const SKIP = new Set(['Meta', 'HideSbBar', 'ResizableCanvas', 'Canvas', 'Controls', 'LiveThemeViewer', 'FirstScreen', 'AgentSession', 'Landing', 'DocsNavigation', 'ComponentGallery']);
/** Docs helpers whose children are samples, not library usage. */
const SAMPLE = /^(Sample|Swatch|Gap|Radius|Elevation|Space|Type)\w*$/;

async function* mdxFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') yield* mdxFiles(path);
    } else if (entry.name.endsWith('.mdx')) yield path;
  }
}

/** The local names an MDX file imports, with the module each comes from. */
function importsOf(tree, file) {
  const names = new Map();
  for (const node of tree.children) {
    if (node.type !== 'mdxjsEsm') continue;
    for (const statement of node.data?.estree?.body ?? []) {
      if (statement.type !== 'ImportDeclaration') continue;
      const from = statement.source.value;
      const path = from.startsWith('.') ? resolve(dirname(file), from.replace(/\?raw$/, '')) : from;
      for (const spec of statement.specifiers) names.set(spec.local.name, { path, raw: from.endsWith('?raw'), imported: spec.imported?.name ?? 'default' });
    }
  }
  return names;
}

/** Library imports as an app writes them. */
export function rewriteImports(source) {
  return source.replace(/from "((?:\.\.?\/)+)(components|src\/components)(\/[^"]*)?"/g, (_, _up, _dir, rest = '') => {
    const parts = rest.split('/').filter(Boolean);
    return parts.length ? `from "@squonkstack/ui/${parts.at(-1).replace(/\.tsx?$/, '')}"` : 'from "@squonkstack/ui"';
  });
}

const attr = (node, name) => {
  const found = node.attributes?.find((a) => a.name === name);
  if (!found) return undefined;
  return typeof found.value === 'string' ? found.value : found.value?.value;
};

const dedent = (text) => {
  const lines = text.replace(/^\n+|\s+$/g, '').split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
};

const fence = (code, lang = 'tsx') => `\`\`\`${lang}\n${code.trim()}\n\`\`\``;

/** The source of `export function Name` (and any private helpers after it) in an examples module. */
async function exampleSource(module, name) {
  const source = await readFile(module.endsWith('.tsx') ? module : `${module}.tsx`, 'utf8');
  const start = source.indexOf(`export function ${name}(`);
  if (start === -1) return undefined;
  const next = source.indexOf('\nexport ', start + 1);
  return rewriteImports(source.slice(start, next === -1 ? undefined : next)).trim();
}

function tokenRows(node, path) {
  return Object.entries(node).flatMap(([key, value]) => {
    const here = [...path, key];
    if (value && typeof value === 'object' && ('bind' in value || 'registers' in value)) {
      const name = `--squonk-${here.map((p) => p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)).join('-')}`;
      if ('bind' in value) return [`| \`${name}\` | ${value.bind} | ${value.why} |`];
      const binds = Object.entries(value.registers).map(([r, b]) => `${r}: ${b}`).join(', ');
      return [`| \`${name}-{register}\` | ${binds} | ${value.why} |`];
    }
    return value && typeof value === 'object' ? tokenRows(value, here) : [];
  });
}

async function generated(name, node, root) {
  const purpose = await import(resolve(root, 'src/theme/purpose.ts'));
  const table = (kind, group) => {
    const source = kind === 'components' ? purpose.componentPurposes : purpose.rolePurposes;
    return ['| Token | Bound to | Why |', '| --- | --- | --- |', ...tokenRows(source[group], [kind, group])].join('\n');
  };
  if (name === 'PurposeTokenTable') return table(attr(node, 'kind') ?? 'roles', attr(node, 'group'));
  if (name === 'PurposeTokenGroups') {
    const kind = attr(node, 'kind');
    const source = kind === 'components' ? purpose.componentPurposes : purpose.rolePurposes;
    return Object.keys(source).map((group) => `### ${group}\n\n${table(kind, group)}`).join('\n\n');
  }
  const css = await readFile(resolve(root, 'src/theme/tokens.css'), 'utf8');
  const scale = (prefix) => ['| Token | Value |', '| --- | --- |', ...[...css.matchAll(new RegExp(`(--squonk-${prefix}-[a-z0-9-]+): ([^;]+);`, 'g'))].map((m) => `| \`${m[1]}\` | ${m[2]} |`)].join('\n');
  if (name === 'SpaceScale') return scale('spacing');
  if (name === 'TypeScale') return scale('typography-sizes');
  if (name === 'IconGallery') {
    const icons = await readFile(resolve(root, 'src/components/functional-primitive/icon/icon.tsx'), 'utf8');
    const names = [...icons.matchAll(/export const (\w+Icon)\b/g)].map((m) => `\`${m[1]}\``);
    return `Icons, from \`@squonkstack/ui/icon\`: ${names.join(', ')}.`;
  }
  return undefined;
}

/** Turn one page into markdown. */
async function render(file, root, links) {
  const source = await readFile(file, 'utf8');
  const tree = fromMarkdown(source, { extensions: [mdxjs(), gfm()], mdastExtensions: [mdxFromMarkdown(), gfmFromMarkdown()] });
  const imports = importsOf(tree, file);
  const isLibrary = (name) => {
    const from = imports.get(name.split('.')[0])?.path ?? '';
    return /components/.test(from) && !/documentation-imports|foundation-blocks|pattern-blocks|purpose-token/.test(from);
  };
  const usesLibrary = (node) => {
    let found = false;
    const walk = (n) => {
      if (n.type?.startsWith('mdxJsx') && n.name && isLibrary(n.name)) found = true;
      n.children?.forEach(walk);
    };
    node.children?.forEach(walk);
    return found;
  };
  const slice = (node) => source.slice(node.position.start.offset, node.position.end.offset);
  // From the start of the first child's line, so dedent sees its indentation.
  const inner = (node) => node.children.length ? source.slice(source.lastIndexOf('\n', node.children[0].position.start.offset) + 1, node.children.at(-1).position.end.offset) : '';

  const block = async (node) => {
    if (node.type === 'mdxjsEsm' || node.type === 'mdxFlowExpression') return undefined;
    if (node.type !== 'mdxJsxFlowElement') return slice(node);
    const name = node.name ?? '';
    if (SKIP.has(name)) return undefined;
    const made = await generated(name, node, root);
    if (made !== undefined) return made;
    if (name === 'SwatchGrid') {
      const rows = node.children.filter((c) => c.name === 'Swatch').map((s) => `| ${attr(s, 'name')} | \`${attr(s, 'token')}\` | ${attr(s, 'use') ?? ''} |`);
      return ['| Colour | Token | For |', '| --- | --- | --- |', ...rows].join('\n');
    }
    if (name === 'Source') {
      const code = node.attributes.find((a) => a.name === 'code')?.value;
      const ref = imports.get(typeof code === 'object' ? code.value.trim() : '');
      if (!ref?.raw) return undefined;
      return fence(rewriteImports(await readFile(ref.path, 'utf8')), attr(node, 'language') ?? 'tsx');
    }
    if (name === 'InlineCodeExample') {
      const text = inner(node).trim().replace(/^\{`/, '').replace(/`\}$/, '').replace(/\\`/g, '`').replace(/\\\$/g, '$');
      return fence(dedent(text));
    }
    // A named example component: its source is the example.
    if (/Example$/.test(name) && !node.children.length) {
      const ref = imports.get(name);
      const code = ref && (await exampleSource(ref.path, ref.imported));
      return code ? fence(code) : undefined;
    }
    if (name === 'DoDont') return (await Promise.all(node.children.map(block))).filter(Boolean).join('\n\n');
    if (['Do', 'Dont', 'Example', 'Specimen'].includes(name)) {
      const caption = attr(node, 'caption') ?? attr(node, 'label');
      const label = { Do: 'Do', Dont: "Don't", Example: 'Example', Specimen: 'Example' }[name];
      const only = node.children.length === 1 && node.children[0].type === 'mdxJsxFlowElement' && /Example$/.test(node.children[0].name ?? '') ? node.children[0] : undefined;
      const code = only ? await block(only) : usesLibrary(node) ? fence(dedent(inner(node))) : undefined;
      if (!code && !caption) return undefined;
      return [caption ? `**${label}:** ${caption}` : `**${label}:**`, code].filter(Boolean).join('\n\n');
    }
    if (SAMPLE.test(name)) return undefined;
    // Anything else on its own line is a live example: keep its JSX if it uses the library.
    return usesLibrary(node) || isLibrary(name) ? fence(dedent(slice(node))) : undefined;
  };

  const parts = [];
  for (const node of tree.children) {
    const out = await block(node);
    if (out?.trim()) parts.push(out.trim());
  }
  return parts.join('\n\n').replace(/\]\(\?path=\/(docs|story)\/([a-z0-9-]+?)--[a-z0-9-]+\)/g, (match, kind, id) => {
    const target = links.get(id);
    return target ? `](${target})` : match.replace(/\]\(.*\)$/, ']');
  }).replace(/\[([^\]]+)\]\]/g, '$1');
}

// Code blocks hold blank lines too, so drop them before looking for the first paragraph.
const summaryOf = (text) => text.replace(/^```[^]*?^```$/gm, '').split('\n\n').find((p) => p && !/^(#|\||```|\*\*|-|\d\.)/.test(p))?.replace(/\s+/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') ?? '';

/**
 * Every guide, as { id, title, section, docsUrl, summary, text }. `catalog`
 * maps component docs links to squonk-ui://components/{id}.
 */
export async function buildGuides(root, catalog) {
  const pages = [];
  for await (const file of mdxFiles(join(root, 'src'))) {
    const source = await readFile(file, 'utf8');
    const title = source.match(/<Meta title="([^"]+)"/)?.[1];
    if (title && INCLUDE.some((re) => re.test(title))) pages.push({ file, title, id: docsId(title) });
  }
  pages.sort((a, b) => a.id.localeCompare(b.id));
  const links = new Map(pages.map((p) => [p.id, `squonk-ui://guides/${p.id}`]));
  for (const entry of catalog.components) {
    const id = entry.docsUrl?.match(/\/docs\/([a-z0-9-]+?)--docs/)?.[1];
    if (id) links.set(id, `squonk-ui://components/${entry.id}`);
  }
  const guides = [];
  for (const page of pages) {
    const text = await render(page.file, root, links);
    guides.push({
      id: page.id,
      title: page.title.split('/').at(-1),
      section: page.title.split('/').slice(0, -1).join(' / '),
      docsUrl: `?path=/docs/${page.id}--docs`,
      source: relative(root, page.file),
      summary: summaryOf(text.replace(/^# .*\n+/, '')),
      text,
    });
  }
  return guides;
}
