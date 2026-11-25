import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const publicDir = resolve(import.meta.dirname, "../public");
const manifest = JSON.parse(
  readFileSync(resolve(publicDir, "manifest.webmanifest"), "utf8")
);

// A PNG's width and height are big-endian at bytes 16 and 20 of its IHDR chunk.
const pngSize = (file) => {
  const bytes = readFileSync(file);
  return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
};

test("the manifest offers the icons installers need", () => {
  const png = manifest.icons.filter((icon) => icon.type === "image/png");
  for (const size of ["192x192", "512x512"]) {
    assert.ok(
      png.some((icon) => icon.sizes === size && icon.purpose === "any"),
      `${size} icon`
    );
  }
  assert.ok(
    png.some((icon) => icon.purpose === "maskable"),
    "maskable icon"
  );
});

test("every manifest icon exists at its declared size", () => {
  for (const icon of manifest.icons) {
    const file = resolve(publicDir, icon.src);
    assert.ok(existsSync(file), icon.src);
    if (icon.type === "image/png")
      assert.equal(pngSize(file), icon.sizes, icon.src);
  }
});

test("the head links the manifest, touch icon and service worker that exist", () => {
  const head = readFileSync(
    resolve(import.meta.dirname, "../.storybook/manager-head.html"),
    "utf8"
  );
  for (const [pattern, file] of [
    [/rel="manifest"\s+href="([^"]+)"/, "manifest"],
    [/rel="apple-touch-icon"\s+href="([^"]+)"/, "touch icon"],
    [/serviceWorker\.register\("([^"]+)"\)/, "service worker"],
  ]) {
    const href = head.match(pattern)?.[1];
    assert.ok(href, `${file} link`);
    assert.ok(existsSync(resolve(publicDir, href)), `${file}: ${href}`);
  }
});
