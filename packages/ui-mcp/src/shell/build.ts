// Bundles the story page against the app's installed React and @squonkstack/ui,
// including the stories bundle the library ships in dist/stories, so a story
// renders exactly what the app would. The result is one self-contained HTML
// file (scripts, styles and fonts inline) because MCP Apps hosts sandbox the
// page and block outside resources by default. It is cached under
// node_modules/.cache, keyed by the library build it came from.
import * as esbuild from "esbuild";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Project } from "../project.ts";
import type { StoryInput } from "./protocol.ts";

/** Shipped as source: esbuild compiles it with the app's modules. */
const RUNTIME = fileURLToPath(new URL("../../src/shell/story-runtime.tsx", import.meta.url));
const OWN_VERSION: string = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version;

export class NoStoriesError extends Error {}

/** The installed library's stories bundle, or an error saying how to get one. */
export function storiesBundle(project: Project): { js: string; css: string; manifest: string } {
  const dir = path.join(project.libraryDir, "dist", "stories");
  const js = path.join(dir, "stories.mjs");
  if (!existsSync(js)) {
    throw new NoStoriesError(`@squonkstack/ui@${project.libraryVersion} ships no stories bundle. Update @squonkstack/ui to preview its stories.`);
  }
  return { js, css: path.join(dir, "stories.css"), manifest: path.join(dir, "manifest.json") };
}

function cacheKey(project: Project): string {
  // A linked or locally rebuilt library keeps its version, so include the build time.
  const stamp = [project.libraryVersion, OWN_VERSION, statSync(RUNTIME).mtimeMs, statSync(fileURLToPath(import.meta.url)).mtimeMs];
  for (const file of ["package.json", "dist/index.mjs", "dist/styles.css", "dist/stories/stories.mjs"]) {
    const full = path.join(project.libraryDir, file);
    if (existsSync(full)) stamp.push(statSync(full).mtimeMs);
  }
  return createHash("sha256").update(stamp.join("|")).digest("hex").slice(0, 16);
}

/**
 * Makes @squonkstack/ui, React (and Zod, which the form demos use) resolve from
 * the app, not from this package, so the page's controls, the library and the
 * stories share one copy. An app without Zod gets this package's own.
 */
function appModules(project: Project): esbuild.Plugin {
  const own = path.dirname(fileURLToPath(import.meta.url));
  return {
    name: "app-modules",
    setup(build) {
      build.onResolve({ filter: /^(react|react-dom|scheduler|zod|@squonkstack\/ui)(\/.*)?$/ }, async (args) => {
        if (args.pluginData?.fromApp) return undefined;
        for (const resolveDir of [project.root, own]) {
          const result = await build.resolve(args.path, { kind: args.kind, resolveDir, pluginData: { fromApp: true } });
          if (!result.errors.length) return { path: result.path };
        }
        return undefined;
      });
    },
  };
}

function storiesModule(project: Project): esbuild.Plugin {
  const bundle = storiesBundle(project);
  const contents = [
    `import "@squonkstack/ui/fonts.css";`,
    `import "@squonkstack/ui/styles.css";`,
    existsSync(bundle.css) ? `import ${JSON.stringify(bundle.css)};` : "",
    `export * from ${JSON.stringify(bundle.js)};`,
    // The page's own controls are library components too.
    `export { Button, Presentation, RadioGroup, Select, Switch, TextField, Textarea, parseThemeDocument } from "@squonkstack/ui";`,
  ].join("\n");
  return {
    name: "squonk-ui-stories",
    setup(build) {
      build.onResolve({ filter: /^virtual:squonk-ui-stories$/ }, () => ({ path: "stories", namespace: "squonk-ui" }));
      build.onLoad({ filter: /.*/, namespace: "squonk-ui" }, () => ({ contents, resolveDir: project.root, loader: "js" }));
    },
  };
}

async function bundlePage(project: Project, outdir: string) {
  const result = await esbuild.build({
    entryPoints: [RUNTIME],
    bundle: true,
    write: false,
    outdir,
    format: "esm",
    platform: "browser",
    target: "es2022",
    minify: true,
    legalComments: "none",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    loader: { ".woff2": "dataurl", ".woff": "dataurl" },
    plugins: [storiesModule(project), appModules(project)],
    logLevel: "silent",
  });
  const js = result.outputFiles.filter((f) => f.path.endsWith(".js")).map((f) => f.text).join("\n");
  const css = result.outputFiles.filter((f) => f.path.endsWith(".css")).map((f) => f.text).join("\n");
  return { js, css };
}

function page(css: string, js: string, data?: string): string {
  const safeJs = js.replace(/<\/script/gi, "<\\/script");
  return [
    `<!doctype html><html lang="en"><head><meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<meta name="color-scheme" content="light dark"><title>@squonkstack/ui story</title>`,
    `<style>${css}\n${CHROME_CSS}</style></head><body><div id="story-root"></div>`,
    data ? `<script>${data}</script>` : "",
    `<script type="module">${safeJs}</script></body></html>`,
  ].join("");
}

/** Layout of the page around the story. The controls themselves are library components. */
const CHROME_CSS = `
html,body{margin:0;background:var(--squonk-roles-color-page)}
.sv{background:var(--squonk-roles-color-page);color:var(--squonk-roles-color-text);font-family:var(--squonk-roles-type-font)}
.sv[data-mode=light]{color-scheme:light}
.sv[data-mode=dark]{color-scheme:dark}
.sv-bar{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--squonk-roles-color-divider)}
.sv-title{display:flex;flex-direction:column;margin-right:auto;min-width:0}
.sv-path{font-size:12px;color:var(--squonk-roles-color-text-supporting)}
.sv-width,.sv-theme{width:170px}
.sv-width label,.sv-theme label{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
.sv-stage{overflow:auto;padding:24px 16px}
.sv-stage[data-fullscreen]{padding:0;height:640px}
.sv-frame{margin:0 auto;box-sizing:border-box;max-width:100%;display:flex;align-items:center;justify-content:center;min-height:120px}
.sv-frame>*{min-width:0;max-width:100%}
.sv-frame[data-fullscreen]{display:block}
.sv-frame[data-fullscreen]>*{width:100%}
.sv-panel{border-top:1px solid var(--squonk-roles-color-divider);padding:12px}
.sv-panel-title{margin:0 0 8px;font-size:13px;font-weight:600}
.sv-controls{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px 16px;align-items:start}
.sv-control-wide{grid-column:1/-1}
.sv-json textarea{font-family:ui-monospace,monospace;font-size:12px}
.sv-note{margin:0;font-size:13px;color:var(--squonk-roles-color-text-supporting)}
.sv-error{margin:0;padding:12px;font:12px/1.5 ui-monospace,monospace;white-space:pre-wrap;overflow:auto;color:#b42318;background:#fef3f2}
.sv-waiting{font:13px system-ui,sans-serif;padding:16px;opacity:.7}
`;

export class ShellBuilder {
  private pending?: Promise<{ css: string; js: string; html: string }>;
  private key?: string;

  constructor(private project: Project) {}

  private cacheDir() {
    return path.join(this.project.root, "node_modules", ".cache", "squonk-ui-mcp");
  }

  private async load() {
    const key = cacheKey(this.project);
    if (this.pending && this.key === key) return this.pending;
    this.key = key;
    this.pending = (async () => {
      const dir = this.cacheDir();
      const file = path.join(dir, `story-${key}.json`);
      if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
      const { js, css } = await bundlePage(this.project, dir);
      const built = { js, css, html: page(css, js) };
      try {
        mkdirSync(dir, { recursive: true });
        writeFileSync(file, JSON.stringify(built));
      } catch {
        // A read-only node_modules only costs a rebuild next start.
      }
      return built;
    })();
    this.pending.catch(() => (this.pending = undefined));
    return this.pending;
  }

  /** The page as an MCP App resource: it waits for the tool call. */
  async shell(): Promise<string> {
    return (await this.load()).html;
  }

  /** The page with one story's input inlined, for the local preview server. */
  async standalone(input: StoryInput): Promise<string> {
    const { css, js } = await this.load();
    const data = `window.__PRODUCT_UI_STORY__=${JSON.stringify(input).replace(/</g, "\\u003c")}`;
    return page(css, js, data);
  }
}
