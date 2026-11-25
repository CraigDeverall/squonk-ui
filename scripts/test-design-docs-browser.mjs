import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('storybook-static');
const output = resolve(process.env.DESIGN_BROWSER_OUTPUT_DIR ?? 'test-results/design-docs');
await mkdir(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  try {
    const path = resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
    if (!path.startsWith(`${root}${sep}`) && path !== root) { response.writeHead(403).end(); return; }
    const filename = path === root ? resolve(root, 'index.html') : path;
    const body = await readFile(filename);
    response.writeHead(200, { 'Content-Type': types[extname(filename)] ?? 'application/octet-stream' }); response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
let browser;
const origin = `http://127.0.0.1:${server.address().port}`;
const evidence = [];
const ROLE_KEY = 'squonk-theme-controller:role-bindings:v1';

// The Theme panel lists the tokens a story uses, edits purposes live, and
// keeps role bindings through import and reset.
async function checkThemePanel(browser) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  page.setDefaultTimeout(30000);
  const inStory = () => page.waitForFunction(() => /In this story \([1-9]/.test(globalThis.document.body.innerText));
  await page.goto(`${origin}/?path=/story/functional-checkbox--default`);
  const expand = page.getByRole('button', { name: 'Expand Theme panel' });
  if (await expand.count()) await expand.click();
  const dock = page.locator('[aria-label="Theme controller"]').first();
  await inStory();
  // Sections start collapsed and remember being opened (in local storage).
  const inStorySection = dock.locator('details', { has: page.locator(':scope > summary', { hasText: /^In this story/ }) }).first();
  const openInStory = async () => {
    if (!(await inStorySection.evaluate(el => el.open))) await inStorySection.locator(':scope > summary').click();
  };
  assert.equal(await inStorySection.evaluate(el => el.open), false, 'panel sections start collapsed');
  await openInStory();
  const canvas = page.frameLocator('#storybook-preview-iframe');
  const gap = () => canvas.locator('label').first().evaluate(el => globalThis.getComputedStyle(el.parentElement).columnGap);
  const before = await gap();
  await dock.getByLabel('Binding for roles.space.choiceGap').first().selectOption('spacing.xl');
  for (let i = 0; i < 50 && (await gap()) === before; i++) await page.waitForTimeout(100);
  assert.notEqual(await gap(), before, 'a re-pointed purpose reaches the canvas');
  assert.equal(await page.evaluate(k => localStorage.getItem(k), ROLE_KEY), '{"roles.space.choiceGap":"spacing.xl"}');
  await page.screenshot({ path: resolve(output, 'theme-panel-checkbox.png') });

  await dock.getByRole('button', { name: /reset/i }).first().click();
  await page.waitForFunction(k => localStorage.getItem(k) === '{}', ROLE_KEY);

  // Every shared purpose is editable in the Purpose tokens section,
  // including the radius roles the theme computes itself.
  await dock.locator('summary', { hasText: /^Purpose tokens$/ }).click();
  await dock.locator('summary', { hasText: /^radius \(/ }).click();
  const radius = dock.getByLabel('Binding for roles.radius.control').last();
  assert.ok((await radius.locator('option').allTextContents()).some(o => o.includes('borders.radius.full')), 'radius roles offer the radius scale');
  await radius.selectOption('borders.radius.full');
  // A purpose's value can be clicked and typed over.
  await dock.locator('summary', { hasText: /^motion \(/ }).click();
  await dock.getByRole('button', { name: /Change the value of roles\.motion\.feedback/ }).last().click();
  const feedback = dock.getByLabel('Custom value for roles.motion.feedback').last();
  assert.match(await feedback.inputValue(), /ms/, 'the editor opens with the current value');
  await feedback.fill('50ms ease-out');
  await feedback.press('Enter');
  await page.waitForFunction(k => localStorage.getItem(k)?.includes('"roles.motion.feedback":"50ms ease-out"'), ROLE_KEY);
  await page.waitForFunction(k => localStorage.getItem(k)?.includes('roles.radius.control'), ROLE_KEY);
  await page.screenshot({ path: resolve(output, 'theme-panel-purposes.png') });
  await dock.getByRole('button', { name: /reset/i }).first().click();
  await page.waitForFunction(k => localStorage.getItem(k) === '{}', ROLE_KEY);

  await dock.getByRole('button', { name: 'Import' }).click();
  await dock.locator('textarea').fill(JSON.stringify({ version: 1, roleBindings: { 'roles.radius.control': 'borders.radius.none' } }));
  await dock.getByRole('button', { name: /apply/i }).click();
  await page.waitForFunction(k => localStorage.getItem(k)?.includes('roles.radius.control'), ROLE_KEY);
  // A re-pointed purpose reaches what a docs page draws itself, not only its
  // stories: the landing page's theme picker. (The hero's cluster of cards
  // keeps each card's own example theme on purpose, so it is not checked.)
  await page.goto(`${origin}/?path=/docs/get-started-introduction--docs`);
  const landing = page.frameLocator('#storybook-preview-iframe');
  await landing.getByRole('button', { name: /Theme/ }).first().waitFor();
  await page.waitForFunction(() => {
    const frame = globalThis.document.querySelector('#storybook-preview-iframe')?.contentDocument;
    const trigger = frame?.querySelector('button[aria-haspopup="listbox"]');
    return trigger && globalThis.getComputedStyle(trigger).borderTopLeftRadius === '0px';
  });
  await dock.getByRole('button', { name: /reset/i }).first().click();
  await page.waitForFunction(k => localStorage.getItem(k) === '{}', ROLE_KEY);

  // Component tokens appear only where their component is on the page.
  await page.goto(`${origin}/?path=/story/functional-button--primary`);
  await inStory();
  assert.equal(await inStorySection.evaluate(el => el.open), true, 'an opened section stays open');
  await openInStory();
  await dock.getByText('components.button.', { exact: false }).first().waitFor();
  assert.equal(await dock.getByText('components.checkbox.', { exact: false }).count(), 0);
  // Tokens read through a shorthand (transition, padding) count too.
  const used = await dock.locator('details', { has: page.locator('summary', { hasText: /^In this story/ }) }).first().innerText();
  for (const path of ['roles.motion.feedbackIn', 'roles.motion.feedback', 'components.button.padding']) {
    assert.ok(used.includes(path), `In this story lists ${path}`);
  }
  await page.screenshot({ path: resolve(output, 'theme-panel-button.png') });
  await page.close();
  return { id: 'theme-panel', usedTokens: 'pass', liveBinding: 'pass', reset: 'pass', import: 'pass', componentScoping: 'pass' };
}

// The Theme page lists every layer of the theme, purposes with their
// binding and reason, and can be searched.
async function checkThemeValues(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  await page.goto(`${origin}/iframe.html?id=foundations-theme--docs&viewMode=docs`);
  const viewer = page.getByRole('region', { name: /Computed theme/ });
  await viewer.waitFor();
  const groups = await viewer.locator('summary').allInnerTexts();
  for (const group of ['primitives', 'spacing', 'colors (derived)', 'roles', 'components']) {
    assert.ok(groups.some(text => text.startsWith(group)), `the Theme page lists ${group}`);
  }
  await page.getByLabel('Find a token').fill('feedbackIn');
  await viewer.getByText('transitions.instant').waitFor();
  await viewer.getByText(/^Entering hover, press/).waitFor();
  await viewer.screenshot({ path: resolve(output, 'theme-values-search.png') });
  await page.close();
  return { id: 'theme-values', layers: 'pass', search: 'pass' };
}

// The landing page's cards are library components; clicking one moves the
// whole Storybook to that page, as a markdown link would.
async function checkLandingNavigation(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  await page.goto(`${origin}/?path=/docs/get-started-introduction--docs`);
  const canvas = page.frameLocator('#storybook-preview-iframe');
  await canvas.getByRole('link', { name: /Build an app/ }).click();
  await page.waitForURL(/path=\/docs\/get-started-getting-started--docs/);
  await canvas.getByRole('heading', { level: 1, name: 'Getting started' }).waitFor();
  await page.close();
  return { id: 'landing-navigation', pass: true };
}

try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_BROWSER_CHANNEL ? { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL } : {}) });
  // Every docs page the catalog points agents at must exist in this build.
  const index = JSON.parse(await readFile(resolve(root, 'index.json'), 'utf8')).entries;
  const catalog = JSON.parse(await readFile(resolve('public/design-catalog.json'), 'utf8'));
  const linked = new Set([...catalog.components, ...catalog.recipes].flatMap(entry => [entry.docsUrl, ...entry.patterns.map(p => p.url)]).filter(Boolean));
  const missing = [...linked].map(url => url.replace(/^\?path=\/(docs|story)\//, '')).filter(id => !index[id]);
  assert.deepEqual(missing, [], 'catalog links resolve to Storybook pages');

  for (const id of ['get-started-introduction--docs', 'foundations-overview--docs', 'examples-society-secretary--work-queue', 'examples-dues-instalment-plan--new-arrangement']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (/cannot be a descendant|cannot contain a nested|validateDOMNesting/i.test(m.text())) errors.push(m.text()); });
    await page.goto(`${origin}/iframe.html?id=${id}&viewMode=${id.endsWith('docs') ? 'docs' : 'story'}`);
    page.setDefaultTimeout(15000);
    await page.locator('h1:visible, h2:visible, input:visible').first().waitFor().catch(async error => {
      await page.screenshot({ path: resolve(output, `${id}-failure.png`), fullPage: true });
      console.error({ id, errors, body: (await page.locator('body').innerText()).slice(0, 3000) }); throw error;
    });
    if (id.includes('introduction')) {
      await page.getByRole('heading', { level: 1, name: /Build interfaces that look right/ }).waitFor();
      assert.ok(await page.getByText('npx @squonk/ui', { exact: true }).isVisible(), 'the setup command is on the landing page');
    } else if (id.includes('foundations')) {
      await page.getByRole('heading', { level: 1, name: /Foundations/ }).waitFor();
    } else if (id.includes('society-secretary')) {
      const search = page.getByRole('searchbox', { name: 'Search cases', exact: true });
      await search.fill('Wiremu');
      await page.getByText('Wiremu Banks', { exact: true }).waitFor();
      assert.equal(await page.getByText('Aroha Ngata', { exact: true }).count(), 0);
      await search.fill('missing member');
      await page.getByText('No cases match', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Clear search and filters' }).click();
      await page.getByText('Aroha Ngata', { exact: true }).waitFor();
    } else {
      await page.getByRole('heading', { level: 1, name: 'Set up a dues instalment plan' }).waitFor();
      // The native input sits under its styled label, so choose it the way a person would.
      await page.getByText('Pay in instalments', { exact: true }).click();
      assert.equal(await page.getByRole('radio', { name: 'Pay in instalments', exact: true }).isChecked(), true);
      await page.getByRole('button', { name: /How often/ }).waitFor();
    }
    await page.screenshot({ path: resolve(output, `${id}.png`), fullPage: true, animations: 'disabled' });
    const nesting = await page.locator('p p, p div, p section, p h1, p h2, p h3').count();
    assert.equal(nesting, 0, 'no block content nested in paragraphs');
    assert.deepEqual(errors, []);
    let mobile;
    if (!id.endsWith('docs')) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: resolve(output, `${id}-mobile.png`), fullPage: true, animations: 'disabled' });
      mobile = await page.evaluate(() => ({ width: globalThis.document.documentElement.clientWidth, scrollWidth: globalThis.document.documentElement.scrollWidth }));
      if (mobile.scrollWidth > mobile.width + 1) console.error(await page.evaluate(() => [...globalThis.document.querySelectorAll('body *')].filter(element => element.getBoundingClientRect().right > 391).slice(-20).map(element => ({ tag: element.tagName, text: element.textContent.slice(0, 80), right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width }))));
      assert.ok(mobile.scrollWidth <= mobile.width + 1, `No document overflow on mobile: ${JSON.stringify(mobile)}`);
    }
    evidence.push({ id, interactions: 'pass', nesting: 'pass', pageErrors: errors.length, ...(mobile ? { mobile } : {}) });
    await page.close();
  }
  evidence.push(await checkThemePanel(browser));
  evidence.push(await checkThemeValues(browser));
  evidence.push(await checkLandingNavigation(browser));
  await writeFile(resolve(output, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Design docs browser checks passed: ${output}`);
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
