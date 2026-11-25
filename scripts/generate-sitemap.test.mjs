import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { SITE, sitemap } from "./generate-sitemap.mjs";

const root = resolve(import.meta.dirname, "..");

test("the sitemap lists the home page and each docs page, not stories", () => {
  const xml = sitemap({
    entries: {
      "b--docs": { id: "b--docs", type: "docs" },
      "a--docs": { id: "a--docs", type: "docs" },
      "a--default": { id: "a--default", type: "story" },
    },
  });
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, [
    SITE,
    `${SITE}?path=/docs/a--docs`,
    `${SITE}?path=/docs/b--docs`,
  ]);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
});

test("robots.txt points crawlers at the sitemap", () => {
  const robots = readFileSync(resolve(root, "public/robots.txt"), "utf8");
  assert.match(robots, new RegExp(`^Sitemap: ${SITE}sitemap\\.xml$`, "m"));
});
