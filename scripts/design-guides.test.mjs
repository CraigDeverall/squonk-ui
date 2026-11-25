import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildGuides, docsId, rewriteImports } from "./design-guides.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await readFile(path.join(root, "public/design-catalog.json"), "utf8"));
const guides = await buildGuides(root, catalog);
const guide = (id) => guides.find((g) => g.id === id);

test("ids follow Storybook's docs ids", () => {
  assert.equal(docsId("Patterns/Labels: Badge or Tag"), "patterns-labels-badge-or-tag");
  assert.equal(docsId("Patterns/Forms/The basics"), "patterns-forms-the-basics");
});

test("library imports read as an app writes them", () => {
  assert.equal(rewriteImports('import { Alert } from "../../components";'), 'import { Alert } from "@squonk/ui";');
  assert.equal(rewriteImports('import { useAppForm } from "../../components/functional/form/form";'), 'import { useAppForm } from "@squonk/ui/form";');
});

test("covers Foundations, Patterns, Forms and the agent pages, but no component pages", () => {
  for (const id of ["foundations-colour", "foundations-purpose-tokens", "foundations-motion", "patterns-overview", "patterns-labels-badge-or-tag", "patterns-forms-the-basics", "get-started-working-with-your-agent"]) {
    assert.ok(guide(id), `missing ${id}`);
  }
  assert.ok(!guides.some((g) => g.id.startsWith("components-") || g.id.startsWith("contributing-")));
});

test("keeps the rules and turns live examples into code", () => {
  const badge = guide("patterns-labels-badge-or-tag").text;
  assert.match(badge, /\*\*A Badge reports\. A Tag names\.\*\*/);
  assert.match(badge, /\*\*Don't:\*\* A sentence in a badge\.[^]*```tsx\n<span><Badge tone="info">/);
  assert.match(badge, /export function IdentityExample\(\)/, "an example component is inlined as source");
  assert.doesNotMatch(badge, /<(Meta|HideSbBar|DoDont|Example)\b/);
});

test("inlines form examples with public imports", () => {
  const basics = guide("patterns-forms-the-basics").text;
  assert.match(basics, /import \{ useAppForm \} from "@squonk\/ui\/form";/);
  assert.doesNotMatch(basics, /from "\.\.?\//);
});

test("generates the theme's tables from source", () => {
  assert.match(guide("foundations-colour").text, /\| Accent \| `--squonk-roles-color-accent` \|/);
  assert.match(guide("foundations-motion").text, /\| `--squonk-roles-motion-feedback-in` \| transitions\.instant \|/);
  assert.match(guide("foundations-purpose-tokens").text, /\| `--squonk-components-button-padding-inline-\{register\}` \|/);
});

test("links resolve to guides and components, never to the docs site", () => {
  const known = new Set([...guides.map((g) => `guides/${g.id}`), ...catalog.components.map((c) => `components/${c.id}`)]);
  for (const g of guides) {
    assert.doesNotMatch(g.text, /\?path=/, `${g.id} still links to the docs site`);
    for (const [, target] of g.text.matchAll(/\(squonk-ui:\/\/([a-z-]+\/[a-z0-9-]+)\)/g)) assert.ok(known.has(target), `${g.id} → ${target}`);
    assert.ok(g.summary.length > 20, `${g.id} needs a summary`);
  }
});

test("summaries are prose, never example code", () => {
  for (const g of guides) assert.doesNotMatch(g.summary, /^(\/\*\*|function |const |export |import |<)/, `${g.id}: ${g.summary}`);
});

test("covers the component chooser and the screen-level patterns", () => {
  for (const id of ["patterns-choosing-components", "patterns-page-layouts-and-app-shells", "patterns-search-filtering-and-sorting", "patterns-lists-tables-and-cards", "patterns-loading-and-progress", "patterns-writing-for-the-interface", "patterns-density-and-registers"]) {
    assert.ok(guide(id), `missing ${id}`);
  }
  assert.match(guide("patterns-choosing-components").text, /\*\*Modal or drawer\?\*\*/);
});
