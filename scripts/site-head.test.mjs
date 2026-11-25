import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { withSiteTitle } from "./storybook-site-title.mjs";

const root = resolve(import.meta.dirname, "..");
const head = readFileSync(
  resolve(root, ".storybook/manager-head.html"),
  "utf8"
);
const SITE = "https://ui.squonkstack.io/";

function content(attribute, name) {
  return new RegExp(
    `<meta\\s+${attribute}="${name}"\\s+content="([^"]*)"`
  ).exec(head)?.[1];
}

test("the head carries everything a link preview reads", () => {
  for (const property of [
    "og:type",
    "og:site_name",
    "og:url",
    "og:title",
    "og:description",
    "og:image",
    "og:image:alt",
  ]) {
    assert.ok(content("property", property), `${property} is missing`);
  }
  for (const name of [
    "description",
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
  ]) {
    assert.ok(content("name", name), `${name} is missing`);
  }
  assert.equal(content("property", "og:url"), SITE);
  assert.equal(content("name", "twitter:card"), "summary_large_image");
  assert.equal(
    content("name", "twitter:image"),
    content("property", "og:image")
  );
  // Search results cut a description at about 160 characters.
  assert.ok(content("name", "description").length <= 160);
});

test("search engines may index the site and show its image large", () => {
  assert.match(content("name", "robots"), /\bindex\b/);
  assert.match(content("name", "robots"), /max-image-preview:large/);
});

test("the structured data parses and agrees with the tags", () => {
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(
    head
  )?.[1];
  assert.ok(json, "no JSON-LD block");
  const graph = JSON.parse(json)["@graph"];
  const site = graph.find((node) => node["@type"] === "WebSite");
  const code = graph.find((node) => node["@type"] === "SoftwareSourceCode");
  assert.equal(site.url, SITE);
  assert.equal(site.name, content("property", "og:site_name"));
  assert.equal(code.image, content("property", "og:image"));
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  assert.equal(code.name, pkg.name);
  assert.equal(
    code.codeRepository,
    pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "")
  );
});

test("the preview image exists at the size the head declares", () => {
  const address = content("property", "og:image");
  assert.ok(address.startsWith(SITE), "previews need an absolute address");
  const png = readFileSync(resolve(root, "public", address.slice(SITE.length)));
  assert.equal(png.toString("latin1", 1, 4), "PNG");
  assert.equal(
    String(png.readUInt32BE(16)),
    content("property", "og:image:width")
  );
  assert.equal(
    String(png.readUInt32BE(20)),
    content("property", "og:image:height")
  );
  // Some apps skip a preview image over about 300 KB.
  assert.ok(png.length < 300_000, `og image is ${png.length} bytes`);
});

test("withSiteTitle puts the og:title in the built page's title", () => {
  const built = `<html><head><title>storybook - Storybook</title>${head}</head></html>`;
  assert.ok(
    withSiteTitle(built).includes(
      `<title>${content("property", "og:title")}</title>`
    )
  );
  assert.throws(
    () => withSiteTitle("<html><head><title>x</title></head></html>"),
    /og:title/
  );
});
