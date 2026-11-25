/*
 * Loads the built extension into Chromium and themes two fixture pages with
 * it: one built with the library (the bridge), one with only the theme's
 * variables (the CSS fallback). The panel is opened as an ordinary tab, where
 * it follows the other tab in the window.
 *
 * Run with `npm run test:e2e -w @squonkstack/ui-devtools` (builds first). Needs
 * Playwright's Chromium: `npx playwright install chromium`. Set
 * E2E_SCREENSHOTS to a directory to keep screenshots.
 */
/* global document, getComputedStyle -- used in functions that run in the page */
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const extension = resolve(here, "../dist");
const fixture = resolve(here, "fixture-dist");
const shots = process.env.E2E_SCREENSHOTS;

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, "http://localhost").pathname;
    const file = join(fixture, path === "/" ? "index.html" : path);
    if (!file.startsWith(fixture)) throw new Error("outside the fixture");
    const body = await readFile(file);
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;

const profile = await mkdtemp(join(tmpdir(), "squonk-devtools-"));
const context = await chromium.launchPersistentContext(profile, {
  channel: "chromium",
  headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});

let failed = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);
};
/** Poll until `read()` satisfies `want`, then report. */
async function eventually(label, read, want) {
  let value;
  for (let i = 0; i < 50; i++) {
    value = await read();
    if (want(value)) return check(label, true, String(value));
    await new Promise((done) => setTimeout(done, 100));
  }
  check(label, false, `last value: ${String(value)}`);
}

try {
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  const id = new URL(worker.url()).host;

  const site = context.pages()[0] ?? (await context.newPage());
  await site.goto(`${base}/index.html`);
  const rootVar = (name) => site.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
  const is = (expected) => (value) => String(value).toLowerCase() === expected;

  check("the site starts on its own theme", (await rootVar("--squonk-colors-primary")).toLowerCase() === "#2255aa");
  const background = (selector) =>
    site.evaluate((s) => {
      const style = getComputedStyle(document.querySelector(s));
      return `${style.backgroundColor} ${style.backgroundImage}`;
    }, selector);
  const buttonBefore = await background("button");
  const color = (selector) => site.evaluate((s) => getComputedStyle(document.querySelector(s)).backgroundColor, selector);
  check("the site's inverted area starts dark", (await color("#inverted")) === "rgb(34, 28, 24)");
  const pageBefore = await rootVar("--squonk-colors-background-default");

  const panel = await context.newPage();
  await panel.goto(`chrome-extension://${id}/sidepanel.html`);
  const status = () => panel.getByTestId("status").innerText();
  await eventually("bridge: the panel reaches the site's provider", status, (text) => text.includes("Live theme"));

  await panel.locator("summary", { hasText: /^Colors$/ }).click();
  const primary = panel.locator('div:has(> span[title="primary"]) input[type="text"]').first();
  await eventually("bridge: the panel shows the site's own primary", () => primary.inputValue(), is("#2255aa"));
  if (shots) await panel.screenshot({ path: join(shots, "panel-bridge.png") });

  await primary.fill("#00aa55");
  await eventually("bridge: an edited primitive reaches the page root", () => rootVar("--squonk-colors-primary"), is("#00aa55"));
  await eventually("bridge: the button repaints from the edit", () => background("button"), (value) => value !== buttonBefore);

  await panel.getByRole("button", { name: "Dark" }).click();
  await eventually("bridge: dark mode changes the page", () => rootVar("--squonk-colors-background-default"), (value) => value !== pageBefore);
  await eventually("bridge: the inverted area turns light", () => color("#inverted"), is("rgb(251, 246, 236)"));
  if (shots) await site.screenshot({ path: join(shots, "site-bridge-edited.png") });
  await panel.getByRole("button", { name: "Light" }).click();
  await eventually("bridge: light mode returns", () => rootVar("--squonk-colors-background-default"), is(pageBefore.toLowerCase()));

  await site.reload();
  await eventually("bridge: edits return after a reload", () => rootVar("--squonk-colors-primary"), is("#00aa55"));

  await site.goto(`${base}/legacy.html`);
  await eventually("fallback: the panel says it is writing variables only", status, (text) => text.includes("CSS variables only"));
  await eventually("fallback: the same site's edits apply as variables", () => rootVar("--squonk-colors-primary"), is("#00aa55"));
  if (shots) await panel.screenshot({ path: join(shots, "panel-fallback.png") });

  await panel.close();
  await eventually("closing the panel restores the page", () => rootVar("--squonk-colors-primary"), is("#ef4237"));
} finally {
  await context.close();
  server.close();
  await rm(profile, { recursive: true, force: true });
}

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("all checks passed");
