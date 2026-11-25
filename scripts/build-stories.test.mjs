import test from 'node:test';
import assert from 'node:assert/strict';
import { argTypesFromProps, readStoriesFile, storyFiles } from './build-stories.mjs';
import { buildCatalog } from './design-catalog.mjs';

test('the stories bundle covers every component and demo story, with the catalog\'s ids', async () => {
  const files = storyFiles();
  assert.ok(files.includes('src/components/functional/button/button.stories.tsx'));
  assert.ok(files.includes('src/demos/member-dashboard.stories.tsx'));
  assert.ok(files.every((file) => file.startsWith('src/components/') || file.startsWith('src/demos/')));
  // list_stories pairs manifest entries with catalog entries by story id.
  const catalog = await buildCatalog();
  const catalogIds = [...catalog.components, ...catalog.recipes].flatMap((entry) => entry.stories.map((s) => s.id)).sort();
  const ids = files.flatMap((file) => readStoriesFile(file).stories.map((s) => s.id)).sort();
  assert.deepEqual(ids, catalogIds);
});

test('reads a stories file without running it', () => {
  const button = readStoriesFile('src/components/functional/button/button.stories.tsx');
  assert.equal(button.title, 'Components/Actions/Button');
  assert.deepEqual(button.component, { name: 'Button', from: './button' });
  const primary = button.stories.find((s) => s.exportName === 'Primary');
  assert.equal(primary.id, 'functional-button--primary');
  assert.equal(primary.name, 'Primary');
  const demo = readStoriesFile('src/demos/member-dashboard.stories.tsx');
  assert.match(demo.stories[0].description, /row menus/);
});

test('turns props into Storybook-style controls', () => {
  const argTypes = argTypesFromProps({
    variant: { type: { name: 'enum', raw: 'Variant', value: [{ value: '"primary"' }, { value: '"secondary"' }, { value: '"ghost"' }, { value: '"danger"' }, { value: '"solid"' }] }, description: 'Visual style.', required: false },
    shape: { type: { name: 'enum', value: [{ value: '"pill"' }, { value: '"rounded"' }] }, required: false },
    disabled: { type: { name: 'boolean' }, defaultValue: { value: 'false' }, required: false },
    count: { type: { name: 'number' }, required: true },
    label: { type: { name: 'string' }, required: false },
    children: { type: { name: 'ReactNode' }, required: false },
    onChange: { type: { name: '((value: string) => void)' }, required: false },
    options: { type: { name: 'SelectOption<T>[]' }, required: true },
    as: { type: { name: 'ElementType' }, required: false },
    className: { type: { name: 'string' }, required: false },
  });
  assert.deepEqual(argTypes.variant.options, ['primary', 'secondary', 'ghost', 'danger', 'solid']);
  assert.deepEqual(argTypes.variant.control, { type: 'select' });
  assert.deepEqual(argTypes.shape.control, { type: 'inline-radio' });
  assert.deepEqual(argTypes.disabled.control, { type: 'boolean' });
  assert.equal(argTypes.disabled.table.defaultValue.summary, 'false');
  assert.deepEqual(argTypes.count.control, { type: 'number' });
  assert.equal(argTypes.count.type.required, true);
  assert.deepEqual(argTypes.label.control, { type: 'text' });
  assert.deepEqual(argTypes.children.control, { type: 'text' });
  assert.equal(argTypes.onChange.control, false);
  assert.deepEqual(argTypes.options.control, { type: 'object' });
  assert.equal(argTypes.as, undefined);
  assert.equal(argTypes.className, undefined);
});
