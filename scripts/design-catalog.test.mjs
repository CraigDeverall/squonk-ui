import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCatalog, documentationMetadata, sourceMetadata, writeCatalog, renderComponentList } from './design-catalog.mjs';
import { discoverEntries } from './discover-component-entries.mjs';
import mdxLoader from '@storybook/addon-docs/mdx-loader';

test('catalog matches live component entries, exports, recipes and documentation contracts', async () => {
  const catalog = await buildCatalog();
  const actual = (await discoverEntries()).filter(e => e.srcPath.startsWith('src/components/'));
  assert.deepEqual(catalog.components.map(c => c.source).sort(), actual.map(e => e.srcPath).sort());
  assert.equal(catalog.components.length, 80);
  assert.deepEqual(catalog.components.find(c => c.id === 'printable').exports, ['NotPrintable', 'PrintOnly', 'Printable']);
  assert.equal(catalog.recipes.length, 9);
  assert.deepEqual(catalog.components.find(c => c.id === 'modal').exports, ['ConfirmModal', 'Modal']);
  assert.deepEqual(catalog.components.find(c => c.id === 'toast').exports, ['ToastProvider', 'useToast']);
  for (const entry of [...catalog.components, ...catalog.recipes]) {
    assert.ok(entry.purpose.length > 40, entry.id);
    assert.ok(entry.patterns.length && entry.stories.length, entry.id);
    assert.equal(new Set(entry.stories.map(s => s.id)).size, entry.stories.length);
    assert.match(entry.hashes.source, /^[a-f0-9]{64}$/);
  }
  for (const component of catalog.components) assert.ok(Object.keys(component.guidance).length >= 2, component.id);
  for (const recipe of catalog.recipes) assert.equal(recipe.documentation, undefined, `${recipe.id} has no docs page`);
  const markdown = renderComponentList(catalog);
  assert.match(markdown, /\*\*80 component modules\*\*/);
  assert.match(markdown, /\*\*9 composition recipes\*\*/);
  assert.match(markdown, /not that it passed/);
  for (const component of catalog.components) assert.ok(markdown.includes(`[${component.title}](${component.source})`));
  assert.deepEqual(catalog, await buildCatalog(), 'no clock, environment or directory-order variability');
});

test('AST inventory ignores code examples and distinguishes exported values from types', () => {
  const metadata = sourceMetadata(`
    import { Button, type ButtonProps, Text as Caption } from '@src/components';
    const example = 'export const Phantom = {}';
    export interface Props { label: string }
    export type State = 'open' | 'closed';
    export function Widget() {}
    const meta = { title: 'Group/Widget', id: 'special-widget' } satisfies Meta;
    export default meta;
    export const Default = {};
  `, 'fixture.tsx');
  assert.deepEqual(metadata.exports, ['Default', 'Widget']);
  assert.deepEqual(metadata.types, ['Props', 'State']);
  assert.deepEqual(metadata.imports, ['Button', 'Text']);
  assert.equal(metadata.title, 'Group/Widget');
  assert.equal(metadata.storyId, 'special-widget');
});

test('documentation inventory does not treat fenced example headings as documentation', () => {
  const result = documentationMetadata('# Widget\n\nA useful control.\n\n```md\n## Fake heading\n```\n\n## Accessibility\n\nName the control.\n');
  assert.equal(result.purpose, 'A useful control.');
  assert.deepEqual(result.sections.map(s => s.title), ['Accessibility']);
});

test('drift check detects a changed component contract without silently rewriting it', async t => {
  const root = await mkdtemp(join(tmpdir(), 'squonk-catalog-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const base = 'src/components/functional/button';
  await Promise.all(['public', 'src/demos', base].map(path => mkdir(join(root, path), { recursive: true })));
  await writeFile(join(root, base, 'button.tsx'), 'export function Button() {}');
  await writeFile(join(root, base, 'button.stories.tsx'), "const meta = { title: 'Functional/Button' }; export default meta; export const Primary = {};");
  const docs = '# Button\n\nA button activates an action.\n\n## Accessibility\n\nKeep its name visible.\n\n## Pitfalls\n\nDo not nest buttons.\n';
  await writeFile(join(root, base, 'button.mdx'), docs);
  await writeCatalog({ root });
  await writeCatalog({ root, check: true });
  const original = await readFile(join(root, 'public/design-catalog.json'), 'utf8');
  const markdownPath = join(root, 'COMPONENT_LIST.md');
  const originalMarkdown = await readFile(markdownPath, 'utf8');
  await writeFile(markdownPath, `${originalMarkdown}\nHand-edited stale status.\n`);
  await assert.rejects(writeCatalog({ root, check: true }), /drift in COMPONENT_LIST\.md/);
  await writeFile(markdownPath, originalMarkdown);
  await writeFile(join(root, base, 'button.test.tsx'), '// test fixture');
  await assert.rejects(writeCatalog({ root, check: true }), /Design catalog drift/);
  const updated = await buildCatalog(root);
  assert.deepEqual(updated.components[0].tests.map(t => [t.path, t.kind]), [[`${base}/button.test.tsx`, 'Playwright component']]);
  await rm(join(root, base, 'button.test.tsx'));
  await writeFile(join(root, base, 'button.mdx'), `${docs}\nNew contract requirement.\n`);
  await assert.rejects(writeCatalog({ root, check: true }), /Design catalog drift/);
  assert.equal(await readFile(join(root, 'public/design-catalog.json'), 'utf8'), original);
});

test('catalogued component MDX compiles through the installed Storybook compiler', async () => {
  const catalog = await buildCatalog();
  for (const entry of catalog.components) {
    const source = await readFile(entry.documentation, 'utf8');
    await new Promise((resolve, reject) => mdxLoader.call({
      resourcePath: entry.documentation,
      getOptions: () => ({}),
      async: () => (error, code) => error ? reject(error) : resolve(code),
    }, source));
  }
});
