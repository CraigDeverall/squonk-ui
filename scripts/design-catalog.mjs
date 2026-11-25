#!/usr/bin/env node
// Inventory source and documented contracts without executing submitted code.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { storyNameFromExport, toId } from 'storybook/internal/csf';
import { buildGuides } from './design-guides.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The docs page that explains each pattern.
const patternPages = {
  typography: 'foundations-typography',
  'responsive-layout': 'foundations-space-and-layout',
  'app-navigation': 'patterns-app-navigation',
  'forms-validation': 'patterns-forms-overview',
  'choices-preferences': 'patterns-choosing-a-selection-control',
  'command-menus': 'patterns-menus-and-commands',
  'modal-confirmation': 'patterns-destructive-actions',
  'async-feedback': 'patterns-toasts-alerts-and-dialogs',
  'empty-error-recovery': 'patterns-empty-and-error-states',
  'data-tables': 'patterns-tables-and-grids',
  'identity-metadata': 'patterns-labels-badge-or-tag',
  'linkable-cards': 'patterns-cards-and-landing-sections',
  'marketing-pricing': 'patterns-cards-and-landing-sections',
  'qr-handoff': 'patterns-qr-handoff',
  'data-visualization': 'patterns-data-visualization',
  printing: 'patterns-printing',
  motion: 'foundations-motion',
  'theme-density': 'foundations-theme',
  'choosing-components': 'patterns-choosing-components',
  'page-layouts': 'patterns-page-layouts-and-app-shells',
  'search-filtering': 'patterns-search-filtering-and-sorting',
  collections: 'patterns-lists-tables-and-cards',
  dashboards: 'patterns-dashboards-and-summaries',
  settings: 'patterns-settings-and-preferences',
  onboarding: 'patterns-onboarding-and-first-run',
  'loading-progress': 'patterns-loading-and-progress',
  imagery: 'patterns-illustrations-icons-and-images',
  microcopy: 'patterns-writing-for-the-interface',
  'density-registers': 'patterns-density-and-registers',
};
const patternUrl = (name) => `?path=/docs/${patternPages[name]}--docs`;
const groups = {
  typography: ['code', 'heading', 'kbd', 'text', 'section-heading', 'currency'],
  'responsive-layout': ['aspect-ratio', 'block', 'centered', 'container', 'divider', 'grid', 'hstack', 'inline', 'scroll-box', 'spacer', 'vstack', 'cluster', 'media-object', 'page', 'split', 'card', 'section', 'resizable-panels'],
  'app-navigation': ['header', 'footer', 'sidebar', 'link', 'icon', 'breadcrumb', 'tabs', 'drawer', 'nav-list'],
  'forms-validation': ['button', 'text-field', 'currency-field', 'checkbox', 'select', 'tooltip', 'icon-button', 'textarea', 'fieldset', 'checkbox-group', 'accordion', 'form'],
  'choices-preferences': ['radio', 'switch', 'checkbox', 'select', 'checkbox-group'],
  'command-menus': ['dropdown-menu', 'kbd', 'icon', 'tooltip', 'icon-button', 'popover'],
  'modal-confirmation': ['modal', 'button', 'drawer'],
  'async-feedback': ['alert', 'toast', 'spinner', 'skeleton', 'progress-bar', 'infinite-list'],
  'empty-error-recovery': ['empty-state', 'alert', 'accordion', 'illustration'],
  'data-tables': ['table', 'icon-button', 'tag', 'pagination', 'tabs', 'infinite-list', 'currency'],
  'identity-metadata': ['avatar', 'badge', 'media-object', 'tag', 'popover', 'relative-time'],
  'linkable-cards': ['interactive-card', 'card', 'link'],
  'marketing-pricing': ['section', 'section-heading', 'card', 'grid', 'illustration'],
  'qr-handoff': ['qr-code'],
  'data-visualization': ['line-chart', 'area-chart', 'bar-chart', 'donut-chart', 'scatter-chart', 'sparkline', 'network-graph', 'stat', 'meter', 'table', 'card', 'grid'],
  printing: ['printable', 'button', 'link', 'table', 'card', 'scroll-box'],
  motion: ['motion'],
  'theme-density': ['presentation', 'theme-modifier', 'theme-style-block'],
  'choosing-components': ['button', 'icon-button', 'link', 'dropdown-menu', 'modal', 'drawer', 'popover', 'tooltip', 'accordion', 'tabs', 'alert', 'toast', 'badge', 'tag', 'select', 'radio', 'checkbox', 'checkbox-group', 'switch', 'skeleton', 'spinner', 'progress-bar', 'empty-state', 'table', 'stat', 'meter', 'nav-list', 'breadcrumb'],
  'page-layouts': ['page', 'header', 'footer', 'sidebar', 'nav-list', 'section', 'section-heading', 'container', 'grid', 'split', 'centered', 'scroll-box', 'drawer', 'resizable-panels'],
  'search-filtering': ['table', 'text-field', 'select', 'popover', 'checkbox-group', 'tag', 'tabs', 'empty-state'],
  collections: ['table', 'media-object', 'interactive-card', 'card', 'grid', 'infinite-list', 'pagination', 'divider', 'avatar'],
  dashboards: ['stat', 'card', 'grid', 'alert', 'sparkline', 'meter', 'interactive-card', 'tabs'],
  settings: ['switch', 'radio', 'select', 'fieldset', 'button', 'text-field', 'modal'],
  onboarding: ['empty-state', 'illustration', 'progress-bar', 'alert', 'card'],
  'loading-progress': ['skeleton', 'spinner', 'progress-bar', 'button', 'infinite-list'],
  imagery: ['icon', 'illustration', 'avatar', 'aspect-ratio', 'icon-button'],
  microcopy: ['button', 'link', 'text-field', 'alert', 'toast', 'empty-state', 'badge'],
  'density-registers': ['presentation', 'section', 'header', 'theme-style-block', 'theme-modifier'],
};
// Demos are full-page stories without MDX guides, so their purpose lives here.
const recipeMetadata = {
  'member-sign-in': {
    patterns: ['forms-validation', 'async-feedback'],
    purpose: 'Sign-in for members, chapter leads and Society staff: enclosed tabs choose the audience, a validated form with a membership-number help popover and a server error on the password, and an accordion of sign-in help.',
  },
  'join-the-society': {
    patterns: ['forms-validation', 'choices-preferences', 'modal-confirmation'],
    purpose: 'A long membership application: titled sections, radio and checkbox groups with conditional follow-up questions, searchable chapter and interest selects, an error summary, and a review drawer with accordion summaries before joining.',
  },
  'member-dashboard': {
    patterns: ['app-navigation', 'data-tables', 'modal-confirmation', 'async-feedback', 'forms-validation'],
    purpose: 'A member account overview: balance cards with an explanation popover, tabs for membership accounts (row menus), filterable paged sighting reports and an activity feed that loads on scroll, and a validated payment form in a modal confirmed by a toast.',
  },
  'log-a-sighting': {
    patterns: ['forms-validation', 'modal-confirmation', 'async-feedback'],
    purpose: 'A sighting report with measurement inputs, cross-field validation, term help in tooltips and a popover, a live summary beside the form with an accordion explaining it, and a confirmation before logging.',
  },
  'dues-instalment-plan': {
    patterns: ['choices-preferences', 'forms-validation', 'data-tables', 'modal-confirmation'],
    purpose: 'An overdue dues summary and an instalment plan builder: a choice that reveals frequency, count and start-date questions with cross-field rules, a live schedule table with its plan fee, optional reasons, and a confirmation.',
  },
  'society-secretary': {
    patterns: ['data-tables', 'empty-error-recovery', 'modal-confirmation', 'identity-metadata', 'async-feedback', 'command-menus'],
    purpose: 'The Society secretary\'s case work queue: workload figures with a progress bar, tabs for my, team and closed cases, search with a filter popover and removable filter tags, a selectable sortable paged grid with bulk actions, an empty state, and a case drawer with history, notes, contact buttons and a recorded decision.',
  },
  'sighting-insights': {
    patterns: ['data-visualization', 'app-navigation', 'data-tables'],
    purpose: 'A Society leadership dashboard: a period select driving a row of stats with change and trend, a stacked area chart of sightings by kind, a donut of payment channels, a horizontal bar chart by chapter, a verification rate against its target, a sortable chapter table with sparklines, and an operations tab with a scatter chart of caseload, capacity meters and progress bars.',
  },
  'account-settings': {
    patterns: ['forms-validation', 'choices-preferences', 'qr-handoff', 'modal-confirmation', 'async-feedback', 'identity-metadata', 'command-menus', 'linkable-cards'],
    purpose: 'A member settings page: a validated contact form with avatar, fieldset and counted textarea; notification switches that save as they change and roll back on failure; statement preferences; two-step sign-in with a QR code, set-up key and recovery codes to copy; a paged list of signed-in devices that loads behind skeletons; keyboard shortcuts; and a destructive confirmation, beside a help column of guide cards and questions.',
  },
  'theme-showcase': {
    patterns: ['theme-density', 'forms-validation', 'data-visualization'],
    purpose: 'The same buttons, fields, tags, badges, stat, progress, sparkline, alert and tabs in every example theme, each on its own page colour with its palette and the purpose-token bindings that make it look different.',
  },
};
const hash = text => createHash('sha256').update(text).digest('hex');
const sorted = values => [...new Set(values)].sort();
const exported = node => node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
const unwrap = node => node && (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) ? unwrap(node.expression) : node;

export function sourceMetadata(source, path) {
  const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const values = [], types = [], imports = [];
  let title, storyId;
  for (const node of tree.statements) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === '@src/components') {
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings) && !node.importClause.isTypeOnly) {
        imports.push(...bindings.elements.filter(e => !e.isTypeOnly).map(e => (e.propertyName ?? e.name).text));
      }
    }
    if (exported(node)) {
      if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) types.push(node.name.text);
      else if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) { if (node.name) values.push(node.name.text); }
      else if (ts.isVariableStatement(node)) for (const d of node.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) throw new Error(`Unsupported exported destructuring in ${path}`);
        values.push(d.name.text);
      }
    }
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const e of node.exportClause.elements) (node.isTypeOnly || e.isTypeOnly ? types : values).push(e.name.text);
    }
    if (ts.isVariableStatement(node)) for (const d of node.declarationList.declarations) {
      const initializer = unwrap(d.initializer);
      if (d.name.getText(tree) !== 'meta' || !initializer || !ts.isObjectLiteralExpression(initializer)) continue;
      for (const p of initializer.properties) if (ts.isPropertyAssignment(p) && ts.isStringLiteral(p.initializer)) {
        if (p.name.getText(tree) === 'title') title = p.initializer.text;
        if (p.name.getText(tree) === 'id') storyId = p.initializer.text;
      }
    }
  }
  return { exports: sorted(values), types: sorted(types), imports: sorted(imports), title, storyId };
}

export function documentationMetadata(source) {
  // Only inspect document prose; source examples must not create phantom headings.
  const prose = source.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
  const heading = prose.match(/^# (.+)$/m);
  if (!heading) throw new Error('Documentation requires a visible title');
  const body = prose.slice(heading.index + heading[0].length);
  const sections = [...body.matchAll(/^## (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)]
    .map(m => ({ title: m[1].trim(), content: m[2].trim() }));
  const intro = body.split(/^## /m)[0];
  const purpose = intro.split(/\n\s*\n/).map(p => p.trim()).find(p => /^(?:`|[A-Z](?:[a-z]|\s))/.test(p));
  if (!purpose) throw new Error(`Documentation requires purpose prose: ${heading[1]}`);
  return { title: heading[1], purpose: purpose.replace(/\s+/g, ' '), sections };
}

export async function buildCatalog(root = ROOT) {
  const components = [], recipes = [];
  async function read(path) { return readFile(join(root, path), 'utf8'); }
  async function entry(path, kind, patterns) {
    const documentation = path.replace(/(?:\.stories)?\.tsx$/, '.mdx');
    const storySource = kind === 'component' ? path.replace(/\.tsx$/, '.stories.tsx') : path;
    const [source, docs, stories] = await Promise.all([read(path), read(documentation), read(storySource)]);
    const tests = await Promise.all((await readdir(join(root, dirname(path)))).filter(name => /\.test\.(?:tsx?|mjs)$/.test(name)).sort().map(async name => {
      const testPath = `${dirname(path)}/${name}`;
      return { path: testPath, kind: name.endsWith('.test.tsx') ? 'Playwright component' : name.endsWith('.test.ts') ? 'Vitest unit' : 'Node', sha256: hash(await read(testPath)) };
    }));
    const api = sourceMetadata(source, path), metadata = sourceMetadata(stories, storySource), guidance = documentationMetadata(docs);
    if (!metadata.title || !metadata.exports.length) throw new Error(`Missing story metadata: ${storySource}`);
    const id = metadata.storyId ?? toId(metadata.title);
    return {
      id: path.split('/').at(-1).replace(/(?:\.stories)?\.tsx$/, ''), kind, title: guidance.title,
      source: path, documentation, storySource,
      hashes: { source: hash(source), documentation: hash(docs), stories: hash(stories) },
      docsUrl: `?path=/docs/${id}--docs`, purpose: guidance.purpose,
      tests,
      patterns: patterns.map(name => ({ id: name, url: patternUrl(name) })),
      documentationSections: guidance.sections.map(s => s.title),
      guidance: Object.fromEntries(guidance.sections.filter(s => /accessibility|pitfalls|contract|ownership|production boundary|interaction and states/i.test(s.title)).map(s => [s.title, s.content])),
      stories: metadata.exports.map(name => ({ export: name, id: toId(id, storyNameFromExport(name)), url: `?path=/story/${toId(id, storyNameFromExport(name))}` })),
      ...(kind === 'component' ? { importPath: `@squonkstack/ui/${path.split('/').at(-2)}`, category: path.split('/')[2], exports: api.exports, types: api.types } : { components: metadata.imports }),
    };
  }
  const base = 'src/components';
  for (const bucket of (await readdir(join(root, base), { withFileTypes: true })).filter(x => x.isDirectory()).map(x => x.name).sort()) {
    for (const name of (await readdir(join(root, base, bucket), { withFileTypes: true })).filter(x => x.isDirectory()).map(x => x.name).sort()) {
      const path = `${base}/${bucket}/${name}/${name}.tsx`;
      const files = await readdir(join(root, base, bucket, name));
      if (!files.includes(`${name}.tsx`)) continue;
      const patterns = Object.entries(groups).filter(([, names]) => names.includes(name)).map(([id]) => id);
      if (!patterns.length) throw new Error(`Assign a documented UX pattern to new module ${path}`);
      const component = await entry(path, 'component', patterns);
      if (!component.documentationSections.some(s => /^Accessibility/.test(s)) || !component.documentationSections.some(s => /pitfalls/i.test(s))) {
        throw new Error(`Document accessibility and pitfalls for ${name}`);
      }
      components.push(component);
    }
  }
  for (const file of (await readdir(join(root, 'src/demos'))).filter(x => x.endsWith('.stories.tsx')).sort()) {
    const name = file.replace('.stories.tsx', '');
    const recipe = recipeMetadata[name];
    if (!recipe) throw new Error(`Assign documented UX patterns and a purpose to recipe ${name}`);
    const path = `src/demos/${file}`;
    const source = await read(path);
    const metadata = sourceMetadata(source, path);
    if (!metadata.title || !metadata.exports.length) throw new Error(`Missing story metadata: ${path}`);
    const id = metadata.storyId ?? toId(metadata.title);
    const tests = (await readdir(join(root, 'src/demos'))).filter(x => x.startsWith(`${name}.`) && /\.test\.(?:tsx?|mjs)$/.test(x)).sort();
    recipes.push({
      id: name, kind: 'composition-recipe', title: metadata.title.split('/').at(-1),
      source: path, storySource: path,
      hashes: { source: hash(source) },
      purpose: recipe.purpose,
      tests: await Promise.all(tests.map(async x => ({ path: `src/demos/${x}`, kind: x.endsWith('.test.tsx') ? 'Playwright component' : 'Vitest unit', sha256: hash(await read(`src/demos/${x}`)) }))),
      patterns: recipe.patterns.map(p => ({ id: p, url: patternUrl(p) })),
      stories: metadata.exports.map(e => ({ export: e, id: toId(id, storyNameFromExport(e)), url: `?path=/story/${toId(id, storyNameFromExport(e))}` })),
      components: metadata.imports,
    });
  }
  components.sort((a, b) => a.id.localeCompare(b.id));
  const ids = components.map(c => c.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate component subpath');
  return {
    schemaVersion: 1,
    scope: 'Published component modules and Storybook composition recipes. Theme providers are documented separately on the Theme page.',
    evidence: 'Source-derived inventory and documented contracts; not a claim of executed interaction, visual or assistive-technology tests.',
    components, recipes,
  };
}

export function renderComponentList(catalog) {
  const rows = catalog.components.map(c => {
    const tests = c.tests.length ? c.tests.map(t => `[${t.kind} file](${t.path})`).join(', ') : 'No colocated test file';
    return `| [${c.title}](${c.source}) | ${c.category} | \`${c.importPath}\` | [Guide](${c.documentation}); ${c.stories.length} stories | ${tests} |`;
  });
  const recipes = catalog.recipes.map(r => `| [${r.title}](${r.source}) | [Story](${r.stories[0].url}) | ${r.stories.length} | ${r.tests.length ? r.tests.map(t => `[${t.kind} file](${t.path})`).join(', ') : 'No colocated test file'} |`);
  return `# Component List

Generated by \`node scripts/design-catalog.mjs\` from component modules, documentation, stories and colocated test files. Run \`node scripts/design-catalog.mjs --check\` to verify this document and [the machine-readable catalog](public/design-catalog.json) together. Update source documentation rather than editing generated tables.

## Scope and evidence

The inventory contains **${catalog.components.length} component modules** and **${catalog.recipes.length} composition recipes**. A module can export several components or helpers; this is a module count, not an exported-symbol count. Each component has an implementation, MDX guide and Storybook stories. The catalog also records exact exports, type names, UX-pattern links, documented contracts and content hashes.

“File” means the named test exists, not that it passed. Documentation and story counts do not certify visual appearance, accessibility or production readiness. Run the repository's appropriate checks and inspect their results. Style and animation modules follow the governed test exception in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md); a missing colocated file is reported without inferring either compliance or failure.

Theme providers and theme utilities are documented separately in [the Theme guide](src/theme/theme.mdx). Patterns span multiple components; use the [UX pattern guide](src/design-system/design-system.mdx) for those compositions. No planned or hypothetical component is counted as implemented.

## Prerequisites for development

Use the pinned Node version in [.nvmrc](.nvmrc), the engine requirements in [package.json](package.json), and npm. Canonical visual baselines use the repository's Linux/Docker test workflow. Inspect active Docker projects before starting it: only one project's local stack may run at a time. Static catalog checks do not require Docker.

## Component modules

| Module | Category | Public import | Documentation and stories | Test source inventory |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

## Composition recipes

Recipes are full-page demos, mostly Squonk Society member and staff screens, built from local fixture data. They have no MDX guides; they are not connected applications.

| Recipe | Story | Stories | Test source inventory |
| --- | --- | --- | --- |
${recipes.join('\n')}
`;
}

export async function writeCatalog({ root = ROOT, check = false } = {}) {
  const catalog = await buildCatalog(root);
  const guides = { schemaVersion: 1, guides: await buildGuides(root, catalog) };
  const outputs = [
    ['public/design-catalog.json', `${JSON.stringify(catalog, null, 2)}\n`],
    ['public/design-guides.json', `${JSON.stringify(guides, null, 2)}\n`],
    ['COMPONENT_LIST.md', renderComponentList(catalog)],
  ];
  if (check) {
    for (const [path, output] of outputs) if (await readFile(join(root, path), 'utf8') !== output) throw new Error(`Design catalog drift in ${path}: run node scripts/design-catalog.mjs`);
  } else for (const [path, output] of outputs) await writeFile(join(root, path), output);
  return catalog;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeCatalog({ check: process.argv.includes('--check') }).then(c => console.log(`Design catalog ${process.argv.includes('--check') ? 'verified' : 'written'}: ${c.components.length} modules, ${c.recipes.length} recipes.`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
