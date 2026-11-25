// The MCP server: component lookup from the installed catalog, the design
// guides, and the library's own stories shown with live controls.
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { findComponents, getComponent, loadCatalog, summarise, type Catalog, type CatalogEntry } from "./catalog.ts";
import { findGuides, getGuide, guideForUrl, guideUri, loadGuides, type Guide } from "./guides.ts";
import { PreviewServer } from "./preview-server.ts";
import { loadProject, type Project } from "./project.ts";
import { Screenshots } from "./screenshot.ts";
import { ShellBuilder } from "./shell/build.ts";
import { closeStories, findStories, loadStories, type StoriesManifest } from "./stories.ts";
import { exampleThemeDocument, resolveCustomTheme, starterTheme, type CustomTheme } from "./themes.ts";

const VERSION: string = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
const STORY_URI = "ui://squonk-ui/story";
/**
 * MCP Apps hosts sandbox the story page and block outside resources unless
 * the resource asks for them. Everything the page needs is inline except the
 * example themes' web fonts, so it asks for Google Fonts and nothing else.
 */
const STORY_RESOURCE_META = {
  ui: { csp: { resourceDomains: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"] } },
};
const CATALOG_URI = "squonk-ui://catalog";
const COMPONENT_URI = "squonk-ui://components/{id}";
const GUIDES_URI = "squonk-ui://guides";
const GUIDE_URI = "squonk-ui://guides/{id}";

const INSTRUCTIONS = `Tools for building UI with @squonk/ui, the app's React component library.
Before writing UI: find_components to see what exists, then get_component for props, guidance and pitfalls. Compose library components; don't restyle them or rebuild what exists.
Before designing a screen, a form or anything with status, labels or overlays: find_guidance for the design system's rules (Foundations, Patterns, Forms), then get_guide to read the one that applies. Follow it.
Not sure which component fits a job (a status, a modal or a drawer, a list or a table, a page layout)? get_guide patterns-choosing-components first: it maps each job to components, with when to use and when not to.
The same catalog and guides are readable as resources: squonk-ui://catalog, squonk-ui://components/{id}, squonk-ui://guides and squonk-ui://guides/{id}.
After writing UI: look at it in the running app with the browser access you have (a Playwright or browser MCP server, your built-in browser, or ask the user to open the dev server's URL), in light and dark and at a phone width, and fix what you see.
To show the user a library component or example screen, and let them try it: list_stories to find a story, then preview_story. It renders the story from the installed @squonk/ui with a Controls panel for its props; hosts that show MCP Apps show it in the chat, and every host gets a local URL.
When the user describes a look (colours, type, roundness, density, mood) rather than only markup, design a theme: get_theme for the starter or an example theme to copy, change it as asked, and pass it to preview_story as customTheme (or { basedOn: "tidepool", ...changes }). Show it on a few stories, and give the user the final document to use in their SquonkThemeProvider.`;

const text = (value: string): CallToolResult => ({ content: [{ type: "text", text: value }] });
const json = (value: unknown): CallToolResult => text(JSON.stringify(value, null, 2));
const failure = (value: string): CallToolResult => ({ ...text(value), isError: true });

type Context = { project: Project; catalog: Catalog; guides: Guide[]; stories?: StoriesManifest; shells: ShellBuilder; previews: PreviewServer; screenshots: Screenshots };

export function createServer(root: string) {
  let context: Context | undefined;
  // Loaded on first use, so the server starts (and explains itself) even before
  // @squonk/ui is installed.
  const load = (): Context => {
    if (context) return context;
    const project = loadProject(root);
    const shells = new ShellBuilder(project);
    const stories = loadStories(project);
    context = {
      project,
      catalog: loadCatalog(project),
      guides: loadGuides(project),
      stories,
      shells,
      previews: new PreviewServer(shells, () => stories?.stories ?? []),
      screenshots: new Screenshots(project),
    };
    // Warm the page so the first story is quick.
    if (stories) shells.shell().catch(() => {});
    return context;
  };
  const guarded =
    <A,>(handler: (args: A, ctx: Context) => Promise<CallToolResult> | CallToolResult) =>
    async (args: A) => {
      try {
        return await handler(args, load());
      } catch (error) {
        return failure(error instanceof Error ? error.message : String(error));
      }
    };

  // A component's patterns point at the guide that explains them, when it shipped.
  const withGuides = (entry: CatalogEntry, guides: Guide[]): CatalogEntry => ({
    ...entry,
    patterns: (entry.patterns as { id: string; url?: string }[] | undefined)?.map((pattern) => ({ ...pattern, guide: guideForUrl(guides, pattern.url) })),
  });

  const server = new McpServer({ name: "squonk-ui", version: VERSION }, { instructions: INSTRUCTIONS });

  server.registerTool(
    "find_components",
    {
      title: "Find @squonk/ui components",
      description:
        "Search the installed @squonk/ui catalog. Returns each match's import path, exported names, one-line purpose and the UX patterns it belongs to. Leave `query` empty to list every component. Use before writing any UI so you compose what exists instead of rebuilding it.",
      inputSchema: { query: z.string().optional().describe("Words describing the need, e.g. 'date input', 'confirmation dialog', 'empty list'.") },
      annotations: { readOnlyHint: true },
    },
    guarded(({ query }: { query?: string }, { catalog, project }) => {
      const matches = findComponents(catalog, query);
      if (matches.length === 0) return text(`No component matches "${query}". Call find_components with no query to list all ${catalog.components.length}.`);
      return json({ library: `@squonk/ui@${project.libraryVersion}`, matches });
    }),
  );

  server.registerTool(
    "get_component",
    {
      title: "Get a @squonk/ui component",
      description:
        "Full catalog entry for one component or composition recipe: import path, exports and types, purpose, documented sections, accessibility guidance and common pitfalls. Accepts an id ('text-field'), a title ('Text Field') or an export name ('TextField').",
      inputSchema: { id: z.string().describe("Component id, title or export name.") },
      annotations: { readOnlyHint: true },
    },
    guarded(({ id }: { id: string }, { catalog, guides }) => {
      const entry = getComponent(catalog, id);
      return entry ? json(withGuides(entry, guides)) : failure(`No component "${id}". Use find_components to search.`);
    }),
  );

  server.registerTool(
    "find_guidance",
    {
      title: "Find @squonk/ui design guidance",
      description:
        "Search the design system's guides: Foundations (colour, type, space, shape, motion, icons, accessibility, theme, purpose tokens), Patterns (choosing components, page layouts and app shells, navigation, overlays, menus, search and filters, lists, tables and cards, dashboards, settings, loading, empty states, onboarding, destructive actions, labels such as Badge or Tag, imagery, writing, density) and Forms. Returns each match's id, summary and section headings. Leave `query` empty to list every guide. Use before designing a screen, then read the guide with get_guide.",
      inputSchema: { query: z.string().optional().describe("What you're designing or deciding, e.g. 'badge or tag', 'form errors', 'confirm delete', 'spacing'.") },
      annotations: { readOnlyHint: true },
    },
    guarded(({ query }: { query?: string }, { guides }) => {
      if (guides.length === 0) return text("This version of @squonk/ui ships no guides. Update @squonk/ui to read them.");
      const matches = findGuides(guides, query);
      if (matches.length === 0) return text(`No guide matches "${query}". Call find_guidance with no query to list all ${guides.length}.`);
      return json(matches);
    }),
  );

  server.registerTool(
    "get_guide",
    {
      title: "Read a @squonk/ui design guide",
      description:
        "One design guide in full, as markdown: the rules, do and don't examples with their JSX, and links to the components involved (squonk-ui://components/{id}) and other guides (squonk-ui://guides/{id}). Accepts an id ('patterns-labels-badge-or-tag') or a title ('Labels: Badge or Tag').",
      inputSchema: { id: z.string().describe("Guide id or title, from find_guidance.") },
      annotations: { readOnlyHint: true },
    },
    guarded(({ id }: { id: string }, { guides }) => {
      const guide = getGuide(guides, id);
      return guide ? text(guide.text) : failure(`No guide "${id}". Use find_guidance to search.`);
    }),
  );

  const NO_STORIES = "This version of @squonk/ui ships no stories. Update @squonk/ui to list and preview them.";

  server.registerTool(
    "list_stories",
    {
      title: "List @squonk/ui stories",
      description:
        "List the Storybook stories shipped with the installed @squonk/ui: every component's variants and states, and the example screens (kind 'demo', such as the member dashboard). With no arguments it lists every story, briefly: its id (for preview_story), 'Component / Story' name, component and a short description; example screens also say kind 'demo'. Filter by `component` (id, title or export name), search with `query` (best match first), or both.",
      inputSchema: {
        query: z.string().optional().describe("Words describing what to show, e.g. 'button danger', 'searchable select', 'dashboard'."),
        component: z.string().optional().describe("Only this component's stories: an id ('nav-list'), title ('Nav List') or export name ('NavList'), or a demo's id."),
        limit: z.number().int().min(1).optional().describe("At most this many matches. Absent lists them all."),
      },
      annotations: { readOnlyHint: true },
    },
    guarded(({ query, component, limit }: { query?: string; component?: string; limit?: number }, { catalog, stories, project }) => {
      if (!stories) return text(NO_STORIES);
      const matches = findStories(stories, catalog, { query, component });
      if (matches.length === 0) {
        const scope = component ? ` for component "${component}"` : "";
        return text(`No story matches${query ? ` "${query}"` : ""}${scope}. Call list_stories with a component or other words; there are ${stories.stories.length} stories.`);
      }
      const shown = limit ? matches.slice(0, limit) : matches;
      // Unindented: the full listing is every story, so keep it small.
      return text(JSON.stringify({
        library: `@squonk/ui@${project.libraryVersion}`,
        total: matches.length,
        ...(matches.length > shown.length ? { note: `Showing ${shown.length} of ${matches.length}. Raise or drop limit to see them all.` } : {}),
        stories: shown,
      }));
    }),
  );

  registerAppTool(
    server,
    "preview_story",
    {
      title: "Preview a @squonk/ui story",
      description: `Show one of the library's Storybook stories to the user, rendered with the app's installed @squonk/ui, with a Controls panel for its props, a light/dark switch, widths and a reset, so they can try the component or example screen in the chat. Find the id with list_stories.
This shows library stories, not your own code: to check UI you wrote, open the running app with your browser tools.
Returns a local URL to the same page for hosts that can't show it inline. Set screenshot to see it yourself (needs Playwright in the app).`,
      inputSchema: {
        storyId: z.string().min(1).describe("Story id from list_stories, e.g. 'functional-button--primary'."),
        theme: z.enum(["light", "dark"]).optional().describe("Initial colour mode. Defaults to the host's theme, else light."),
        width: z.number().int().min(240).max(2560).optional().describe("Frame width in CSS pixels, e.g. 375 for a phone. Absent fills the space."),
        exampleTheme: z
          .string()
          .optional()
          .describe("Show it in one of the docs' example themes, by id: squonk (the library's own, the default), kauri, fieldbook, tidepool, meridian, monolith, wayfinder or aurora. The page also has a Theme picker."),
        args: z.record(z.string(), z.unknown()).optional().describe("Prop values to start from, on top of the story's own, e.g. { \"variant\": \"danger\" }. JSON values only."),
        customTheme: z
          .object({
            basedOn: z.string().optional().describe("An example theme's id to copy and change, e.g. 'tidepool'. Absent starts from the library's defaults."),
            name: z.string().optional().describe("A name for the page's Theme picker."),
            version: z.literal(1).optional(),
            primitives: z.record(z.string(), z.unknown()).optional().describe("Raw inputs: colors and darkColors palettes, spacingPx, fontPx, radii, fontFamily (a Google Fonts family loads), motion, relief, switches and sliders. See get_theme."),
            bindings: z.record(z.string(), z.string()).optional().describe("Colour getters re-pointed at palette keys, e.g. { \"colors.link\": \"accent\" }."),
            addedPrimitives: z.record(z.string(), z.object({ light: z.string(), dark: z.string() })).optional().describe("Custom palette keys with light and dark values."),
            roleBindings: z
              .record(z.string(), z.union([z.string(), z.object({ light: z.string(), dark: z.string() }).strict()]))
              .optional()
              .describe("Purposes re-pointed at a raw token ('spacing.lg'), another purpose ('roles.color.link') or a literal ('12px'). A value may also be { light, dark } to differ by mode."),
          })
          .optional()
          .describe("A theme the user is designing: a theme document, optionally basedOn an example theme. Validated with the installed library's parser; errors come back to you. Get a starting point from get_theme. Takes precedence over exampleTheme."),
        screenshot: z.boolean().optional().describe("Also return a PNG of the rendered story, and whether it rendered without errors."),
      },
      _meta: { ui: { resourceUri: STORY_URI } },
    },
    guarded(async ({ screenshot, ...input }: { storyId: string; theme?: "light" | "dark"; width?: number; args?: Record<string, unknown>; exampleTheme?: string; customTheme?: CustomTheme; screenshot?: boolean }, ctx) => {
      if (!ctx.stories) return failure(NO_STORIES);
      // The page applies the theme; check it here first, so a mistake comes back to the agent.
      let themeLine: string | undefined;
      if (input.customTheme) {
        const resolved = await resolveCustomTheme(ctx.project, ctx.stories, input.customTheme);
        if (!resolved.ok) return failure(resolved.error);
        themeLine = `In the custom theme "${resolved.theme.name}".`;
      } else if (input.exampleTheme && !exampleThemeDocument(ctx.stories, input.exampleTheme)) {
        return failure(`No example theme "${input.exampleTheme}". Use one of: ${(ctx.stories.exampleThemes ?? []).map((t) => t.id).join(", ")}.`);
      }
      const story = ctx.stories.stories.find((s) => s.id === input.storyId);
      if (!story) {
        const close = closeStories(ctx.stories, ctx.catalog, input.storyId);
        return failure(`No story "${input.storyId}".${close.length ? ` Close matches: ${close.join(", ")}.` : ""} Use list_stories to search.`);
      }
      if (story.unavailable) return failure(`${story.title} / ${story.name} can't be shown outside Storybook: ${story.unavailable}`);
      const url = await ctx.previews.url(input);
      const lines = [
        `Showing ${story.title} / ${story.name} (${story.id}) from @squonk/ui@${ctx.project.libraryVersion}, with its controls.`,
        `Local URL: ${url} (works while this session runs).`,
        ...(themeLine ? [themeLine] : []),
      ];
      if (!screenshot) return text(lines.join("\n"));
      if (!ctx.screenshots.available()) {
        lines.push("No screenshot: Playwright isn't installed in this app (npm i -D playwright && npx playwright install chromium).");
        return text(lines.join("\n"));
      }
      const { png, status } = await ctx.screenshots.capture(url, input.width ?? 1024);
      lines.push(status?.state === "error" ? `It failed to render: ${status.message}` : "It rendered without errors.");
      return { content: [{ type: "text", text: lines.join("\n") }, { type: "image", data: png.toString("base64"), mimeType: "image/png" }] };
    }),
  );

  server.registerTool(
    "get_theme",
    {
      title: "Get a @squonk/ui theme to start from",
      description:
        "A theme object to design from. With an example theme's id (squonk, kauri, fieldbook, tidepool, meridian, monolith, wayfinder, aurora) it returns that theme's document to copy and change. With no id it returns a starter: the library's default primitives as a document, what each switch, choice and slider does, the shared purposes most worth re-pointing, and the example themes. Pass the result, changed as the user asks, to preview_story as customTheme.",
      inputSchema: {
        id: z.string().optional().describe("An example theme's id. Absent returns the starter."),
      },
      annotations: { readOnlyHint: true },
    },
    guarded(async ({ id }: { id?: string }, { project, stories }) => {
      if (!id) return text(JSON.stringify(await starterTheme(project, stories)));
      const theme = exampleThemeDocument(stories, id);
      if (!theme) return failure(`No example theme "${id}". Use one of: ${(stories?.exampleThemes ?? []).map((t) => t.id).join(", ")}, or omit id for the starter.`);
      return json(theme);
    }),
  );

  // The catalog as resources too, for hosts and agents that read or attach
  // context rather than calling tools: the whole thing, and one entry each.
  server.registerResource(
    "@squonk/ui catalog",
    CATALOG_URI,
    {
      title: "@squonk/ui component catalog",
      description: "Every component and composition recipe in the installed @squonk/ui: import path, exports and types, purpose, guidance and UX patterns.",
      mimeType: "application/json",
    },
    async (uri) => {
      const { catalog } = load();
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(catalog, null, 2) }] };
    },
  );

  server.registerResource(
    "@squonk/ui component",
    new ResourceTemplate(COMPONENT_URI, {
      list: async () => {
        const { catalog } = load();
        return {
          resources: [...catalog.components, ...catalog.recipes].map((entry) => ({
            uri: COMPONENT_URI.replace("{id}", entry.id),
            name: entry.title,
            description: summarise(entry).purpose,
            mimeType: "application/json",
          })),
        };
      },
      complete: { id: (value) => load().catalog.components.map((entry) => entry.id).filter((id) => id.startsWith(value)) },
    }),
    {
      title: "@squonk/ui component",
      description: "The full catalog entry for one component or recipe, as get_component returns it.",
      mimeType: "application/json",
    },
    async (uri, { id }) => {
      const { catalog, guides } = load();
      const entry = getComponent(catalog, String(id));
      if (!entry) throw new Error(`No component "${id}". Read ${CATALOG_URI} or use find_components.`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(withGuides(entry, guides), null, 2) }] };
    },
  );

  // The guides as resources: an index, and one markdown page each.
  server.registerResource(
    "@squonk/ui guides",
    GUIDES_URI,
    {
      title: "@squonk/ui design guides",
      description: "Every design guide (Foundations, Patterns, Forms, Getting started): id, title, summary and the resource to read it from.",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const { guides } = load();
      const lines = guides.map((g) => `- [${g.section} / ${g.title}](${guideUri(g.id)}): ${g.summary}`);
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: `# @squonk/ui design guides\n\n${lines.join("\n")}\n` }] };
    },
  );

  server.registerResource(
    "@squonk/ui guide",
    new ResourceTemplate(GUIDE_URI, {
      list: async () => ({
        resources: load().guides.map((g) => ({ uri: guideUri(g.id), name: `${g.section} / ${g.title}`, description: g.summary, mimeType: "text/markdown" })),
      }),
      complete: { id: (value) => load().guides.map((g) => g.id).filter((id) => id.startsWith(value)) },
    }),
    {
      title: "@squonk/ui design guide",
      description: "One design guide in full, as markdown, as get_guide returns it.",
      mimeType: "text/markdown",
    },
    async (uri, { id }) => {
      const guide = getGuide(load().guides, String(id));
      if (!guide) throw new Error(`No guide "${id}". Read ${GUIDES_URI} or use find_guidance.`);
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: guide.text }] };
    },
  );

  registerAppResource(
    server,
    "@squonk/ui story",
    STORY_URI,
    { description: "A @squonk/ui Storybook story with live controls, rendered with the app's installed @squonk/ui.", _meta: STORY_RESOURCE_META },
    async () => {
      const { shells } = load();
      return { contents: [{ uri: STORY_URI, mimeType: RESOURCE_MIME_TYPE, text: await shells.shell(), _meta: STORY_RESOURCE_META }] };
    },
  );

  const close = async () => {
    context?.previews.close();
    await context?.screenshots.close();
  };
  return { server, close };
}

export async function serve(root: string) {
  const { server, close } = createServer(root);
  await server.connect(new StdioServerTransport());
  const stop = () => void close().finally(() => process.exit(0));
  process.stdin.on("close", stop);
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
