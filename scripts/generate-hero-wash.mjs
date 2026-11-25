#!/usr/bin/env node
// Paints the watercolour wash behind the Introduction page's hero, once per
// colour mode, and writes it as a small opaque WebP: the light wash on white,
// the dark one on black. The page blends it in (multiply drops the white,
// screen drops the black), so it suits any theme's page colour, and fades it
// out with a mask. Deterministic (seeded), so a re-run reproduces the files.
//
//   node scripts/generate-hero-wash.mjs
//
// Uses Playwright's Chromium to draw on a canvas and encode the WebP.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src/documentation-imports/landing");

// Painted small: the wash is soft, and the page scales it up.
const WIDTH = 1200;
const HEIGHT = 640;
const QUALITY = 0.82;

/** Ribbons of pigment: hue, saturation, lightness, alpha and where they sweep. */
const PALETTES = {
  light: {
    pigments: [
      [3, 84, 64, 0.3], // Squonk red
      [211, 90, 60, 0.26], // Squonk blue
      [262, 60, 74, 0.24], // lilac
      [24, 90, 76, 0.22], // peach
      [200, 70, 70, 0.2], // sky
    ],
    edge: 0.16,
    ground: "#ffffff",
  },
  dark: {
    pigments: [
      [3, 80, 52, 0.3],
      [211, 85, 50, 0.3],
      [262, 70, 58, 0.3],
      [24, 85, 55, 0.18],
      [205, 80, 52, 0.24],
    ],
    edge: 0.12,
    ground: "#000000",
  },
};

// Runs in the browser page (page.evaluate), where document exists.
/* global document */
function paint({ width, height, pigments, edge, ground, seed, quality }) {
  // Mulberry32: a small seeded PRNG so the wash is reproducible.
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, width, height);
  const hsla = ([h, sat, l], a) => `hsla(${h}, ${sat}%, ${l}%, ${a})`;

  // One wisp: a long curve sweeping across, drawn as many soft, offset
  // strokes so its body blooms like wet pigment and its edge pools darker.
  const wisp = (pigment, index) => {
    const [h, sat, l, alpha] = pigment;
    const baseY = height * (0.12 + 0.62 * ((index + rand() * 0.6) / pigments.length));
    const amp = height * (0.08 + rand() * 0.14);
    const freq = 0.6 + rand() * 0.9;
    const phase = rand() * Math.PI * 2;
    const tilt = (rand() - 0.5) * height * 0.35;
    const thickness = height * (0.06 + rand() * 0.1);
    const point = (t, wobble) => {
      const x = -width * 0.1 + t * width * 1.2;
      const y =
        baseY +
        tilt * (t - 0.5) +
        Math.sin(t * Math.PI * 2 * freq + phase) * amp +
        Math.sin(t * Math.PI * 7 + phase * 2) * amp * 0.12 +
        wobble;
      return [x, y];
    };
    const curve = (wobble, widthScale) => {
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const t = i / 120;
        // Thicker in the middle, tapering at the ends, like a brush stroke.
        const taper = Math.sin(Math.PI * t) ** 0.7;
        const [x, y] = point(t, wobble * taper);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        ctx.lineWidth = thickness * widthScale * (0.35 + taper);
      }
      ctx.stroke();
    };
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // The bloom: wide, very soft passes.
    for (let pass = 0; pass < 10; pass++) {
      ctx.filter = `blur(${18 + rand() * 30}px)`;
      ctx.strokeStyle = hsla([h, sat, l + (rand() - 0.5) * 8], alpha * 0.22);
      curve((rand() - 0.5) * thickness * 1.4, 0.8 + rand() * 0.9);
    }
    // The pooled edges: thin, slightly darker lines either side.
    for (const side of [-1, 1]) {
      ctx.filter = `blur(${2 + rand() * 3}px)`;
      ctx.strokeStyle = hsla([h, Math.min(100, sat + 10), l - 14], edge * alpha * 2.2);
      ctx.lineWidth = 1.5 + rand() * 2;
      ctx.beginPath();
      for (let i = 8; i <= 112; i++) {
        const t = i / 120;
        const taper = Math.sin(Math.PI * t) ** 0.7;
        const [x, y] = point(t, side * thickness * 0.55 * taper + (rand() - 0.5) * 2);
        if (i === 8) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  pigments.forEach((pigment, i) => wisp(pigment, i));
  // A second, fainter round of the same pigments for depth.
  pigments.forEach((pigment, i) => wisp([pigment[0], pigment[1], pigment[2], pigment[3] * 0.5], i + 0.5));

  ctx.filter = "none";
  return canvas.toDataURL("image/webp", quality);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const [mode, palette] of Object.entries(PALETTES)) {
    const dataUrl = await page.evaluate(paint, { width: WIDTH, height: HEIGHT, quality: QUALITY, seed: 20261108, ...palette });
    const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
    const file = path.join(outDir, `hero-wash-${mode}.webp`);
    await writeFile(file, bytes);
    console.log(`${path.relative(root, file)}: ${(bytes.length / 1024).toFixed(1)} KB`);
  }
} finally {
  await browser.close();
}
