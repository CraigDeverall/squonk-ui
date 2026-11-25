// Storybook writes its own <title> into the built site ("storybook - Storybook")
// and offers no setting for it. Search engines and link previews that fall
// back to the title would show that, so after `storybook build` this puts the
// og:title from .storybook/manager-head.html there instead. Storybook still
// sets the title for each page once it is running.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Returns the page with its <title> replaced by its og:title. */
export function withSiteTitle(html) {
  const title = /<meta\s+property="og:title"\s+content="([^"]+)"/.exec(
    html
  )?.[1];
  if (!title)
    throw new Error(
      "The built page has no og:title (see .storybook/manager-head.html)."
    );
  if (!/<title>[^<]*<\/title>/.test(html))
    throw new Error("The built page has no <title> to replace.");
  return html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const file = resolve(
    import.meta.dirname,
    "..",
    process.argv[2] ?? "storybook-static/index.html"
  );
  await writeFile(file, withSiteTitle(await readFile(file, "utf8")));
}
