// Renders the documentation site's app icons from public/favicon.svg.
// Run `node scripts/generate-pwa-icons.mjs` after the favicon changes.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const svg = await readFile(resolve(root, "public/favicon.svg"), "utf8");

// `scale` is the mark's share of the canvas. Maskable icons keep the mark inside
// the central 80% safe zone; iOS fills transparency with black, so its icon
// and the maskable one sit on white.
const icons = [
  { file: "icon-192.png", size: 192, scale: 0.88 },
  { file: "icon-512.png", size: 512, scale: 0.88 },
  {
    file: "icon-maskable-512.png",
    size: 512,
    scale: 0.6,
    background: "#ffffff",
  },
  {
    file: "apple-touch-icon.png",
    size: 180,
    scale: 0.75,
    background: "#ffffff",
  },
];

const browser = await chromium.launch();
try {
  for (const { file, size, scale, background } of icons) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
    });
    const mark = Math.round(size * scale);
    await page.setContent(`<!doctype html>
      <style>
        html, body { margin: 0; width: ${size}px; height: ${size}px; background: ${background ?? "transparent"}; }
        body { display: grid; place-items: center; }
        svg { width: ${mark}px; height: ${mark}px; display: block; }
      </style>
      ${svg.replace(/^<\?xml[^>]*>\s*/, "")}`);
    await page.screenshot({
      path: resolve(root, "public/pwa", file),
      omitBackground: !background,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
