// Renders public/og.png, the 1200x630 card that link previews show when
// someone shares the documentation site (see .storybook/manager-head.html).
//
// The card shows two real screens from the Examples section, captured from a
// running copy of the site. Run it after the landing headline, the brand or
// those examples change:
//
//   node scripts/generate-og-image.mjs                       # screens from the live site
//   node scripts/generate-og-image.mjs http://localhost:6006  # or from `npm run dev`
/* global document -- used in a function that runs in the page */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const site = (process.argv[2] ?? "https://ui.squonkstack.io").replace(
  /\/$/,
  ""
);
const WIDTH = 1200;
const HEIGHT = 630;

const SCREENS = {
  front: { id: "examples-member-dashboard--overview", mode: "dark" },
  back: { id: "examples-sighting-insights--overview", mode: "light" },
};

const mark = (
  await readFile(resolve(root, "public/favicon.svg"), "utf8")
).replace(/^<\?xml[^>]*>\s*/, "");

const browser = await chromium.launch();
try {
  const shots = {};
  for (const [name, { id, mode }] of Object.entries(SCREENS)) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 860 },
      deviceScaleFactor: 1,
      colorScheme: mode,
      reducedMotion: "reduce",
    });
    await context.addInitScript((value) => {
      try {
        localStorage.setItem("squonk-storybook-mode", value);
      } catch {
        /* the page falls back to the colour scheme */
      }
    }, mode);
    const page = await context.newPage();
    await page.goto(`${site}/iframe.html?id=${id}&viewMode=story`, {
      waitUntil: "networkidle",
    });
    await page.waitForSelector("#storybook-root > *");
    await page.waitForTimeout(1200);
    shots[name] = (await page.screenshot({ type: "png" })).toString("base64");
    await context.close();
  }

  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html>
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    position: relative;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #f0f6fc;
    background:
      radial-gradient(900px 520px at 88% 108%, rgba(239, 65, 54, 0.34), transparent 62%),
      radial-gradient(700px 420px at 104% -8%, rgba(239, 65, 54, 0.16), transparent 60%),
      #0d1117;
    -webkit-font-smoothing: antialiased;
  }
  .copy { position: absolute; left: 68px; top: 64px; width: 520px; height: ${HEIGHT - 128}px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 14px; font-size: 30px; letter-spacing: -0.01em; }
  .brand svg { width: 38px; height: 38px; }
  .brand b { font-weight: 700; }
  .brand span { font-weight: 300; }
  h1 { margin-top: 58px; font-size: 55px; line-height: 1.06; font-weight: 700; letter-spacing: -0.028em; text-wrap: balance; }
  h1 em { font-style: normal; color: #ff6a5f; }
  p { margin-top: 26px; font-size: 23px; line-height: 1.4; font-weight: 400; color: #9da7b3; text-wrap: pretty; }
  .url { margin-top: auto; font-size: 21px; font-weight: 500; color: #f0f6fc; display: flex; align-items: center; gap: 12px; }
  .url i { width: 34px; height: 3px; border-radius: 2px; background: #ef4136; }
  .screen {
    position: absolute; width: 760px; border-radius: 14px; overflow: hidden;
    border: 1px solid rgba(240, 246, 252, 0.16);
    box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4);
    transform-origin: top left;
  }
  .screen img { display: block; width: 100%; }
  .back { left: 742px; top: 48px; transform: rotate(-4deg); opacity: 0.96; }
  .front { left: 636px; top: 196px; transform: rotate(-4deg); }
</style>
<div class="screen back"><img src="data:image/png;base64,${shots.back}" alt="" /></div>
<div class="screen front"><img src="data:image/png;base64,${shots.front}" alt="" /></div>
<div class="copy">
  <div class="brand">${mark}<div><b>Squonk</b><span>UI</span></div></div>
  <h1>Build interfaces that look right and <em>work for everyone.</em></h1>
  <p>React components, a theme and patterns. Accessible, light and dark, ready for coding agents.</p>
  <div class="url"><i></i>ui.squonkstack.io</div>
</div>`);
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete)
  );
  await page.screenshot({ path: resolve(root, "public/og.png"), type: "png" });
} finally {
  await browser.close();
}
