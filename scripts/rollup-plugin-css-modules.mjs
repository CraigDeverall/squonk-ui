/**
 * Compiles `*.module.css` imports with Lightning CSS for the library build.
 * Each import becomes a JS module exporting its scoped class names; the CSS
 * is collected and emitted once as `styles.css`, prefixed with the
 * generated design tokens (`src/theme/tokens.css`).
 *
 * Storybook and Playwright CT use Vite's built-in CSS-module support instead.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { transform } from "lightningcss";

export function cssModules({ emit = true, fileName = "styles.css", tokens, include = () => true } = {}) {
  const sheets = new Map();
  return {
    name: "squonk-css-modules",
    transform(code, id) {
      if (!id.endsWith(".module.css")) return null;
      const filename = path.relative(process.cwd(), id);
      const result = transform({
        filename,
        code: Buffer.from(code),
        cssModules: { pattern: "squonk_[local]_[hash]" },
      });
      if (include(filename)) sheets.set(filename, result.code.toString());
      const classes = Object.fromEntries(
        Object.entries(result.exports).map(([local, { name, composes }]) => [
          local,
          [name, ...composes.map((c) => c.name)].join(" "),
        ])
      );
      return { code: `export default ${JSON.stringify(classes)};`, map: { mappings: "" } };
    },
    async generateBundle() {
      if (!emit) return;
      const modules = [...sheets]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([file, css]) => `/* ${file} */\n${css}`);
      const source = [
        ...(tokens ? [await readFile(tokens, "utf8")] : []),
        ...modules,
      ].join("\n");
      this.emitFile({ type: "asset", fileName, source });
    },
  };
}
