// Writes sitemap.xml into the built Storybook so search engines find every
// documentation page, not just the home page. Storybook addresses pages with
// `?path=/docs/<id>`, and lists them in the index.json it builds; robots.txt
// (in public/) points crawlers here. Runs after `storybook build`.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SITE = "https://ui.squonkstack.io/";

const escape = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The sitemap for a Storybook index.json: the home page, then each docs page. */
export function sitemap(index, site = SITE) {
  const ids = Object.values(index.entries ?? {})
    .filter((entry) => entry.type === "docs")
    .map((entry) => entry.id)
    .sort();
  const urls = [site, ...ids.map((id) => `${site}?path=/docs/${id}`)];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${escape(url)}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const dir = resolve(
    import.meta.dirname,
    "..",
    process.argv[2] ?? "storybook-static"
  );
  const index = JSON.parse(await readFile(resolve(dir, "index.json"), "utf8"));
  await writeFile(resolve(dir, "sitemap.xml"), sitemap(index));
}
