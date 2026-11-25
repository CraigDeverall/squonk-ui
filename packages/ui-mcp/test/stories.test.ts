import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import type { Catalog } from "../src/catalog.ts";
import { parseStoryPath, storyPath } from "../src/preview-server.ts";
import { createServer } from "../src/server.ts";
import { closeStories, findStories, resolveComponent, type StoriesManifest } from "../src/stories.ts";

const catalog: Catalog = {
  components: [
    { id: "button", kind: "component", title: "Button", exports: ["Button"], purpose: "Triggers an action. Use it for commands." },
    { id: "select", kind: "component", title: "Select", exports: ["Select"], purpose: "Pick one option from a list." },
    { id: "nav-list", kind: "component", title: "Nav List", exports: ["NavList", "NavListItem"], purpose: "Links between sections of an app." },
  ],
  recipes: [{ id: "member-dashboard", kind: "composition-recipe", title: "Member Dashboard", purpose: "A member account overview: balances and sightings." }],
};

const manifest: StoriesManifest = {
  schemaVersion: 1,
  stories: [
    { id: "functional-button--primary", title: "Components/Actions/Button", name: "Primary", kind: "component", component: "button", export: "Primary" },
    { id: "functional-button--danger", title: "Components/Actions/Button", name: "Danger", kind: "component", component: "button", export: "Danger", description: "For destructive actions. Ask first." },
    { id: "functional-select--default", title: "Components/Inputs/Select", name: "Default", kind: "component", component: "select", export: "Default" },
    { id: "functional-select--searchable", title: "Components/Inputs/Select", name: "Searchable", kind: "component", component: "select", export: "Searchable", description: "Type to filter a long list." },
    { id: "components-navigation-navlist--indicator-styles", title: "Components/Navigation/NavList", name: "Indicator Styles", kind: "component", component: "nav-list", export: "IndicatorStyles" },
    { id: "examples-member-dashboard--overview", title: "Examples/Member Dashboard", name: "Overview", kind: "demo", component: "member-dashboard", export: "Overview" },
  ],
};

describe("findStories", () => {
  it("ranks the component's name, then the story's name, above descriptions", () => {
    expect(findStories(manifest, catalog, { query: "searchable select" }).map((s) => s.id)).toEqual([
      "functional-select--searchable",
      "functional-select--default",
    ]);
    expect(findStories(manifest, catalog, { query: "button danger" })[0].id).toBe("functional-button--danger");
  });

  it("filters by component id, title or export name, and finds demos", () => {
    for (const component of ["nav-list", "Nav List", "NavList", "NavListItem"]) {
      expect(findStories(manifest, catalog, { component }).map((s) => s.id)).toEqual(["components-navigation-navlist--indicator-styles"]);
    }
    expect(findStories(manifest, catalog, { component: "member-dashboard" })[0].kind).toBe("demo");
    expect(findStories(manifest, catalog, { query: "dashboard" })[0].id).toBe("examples-member-dashboard--overview");
    expect(findStories(manifest, catalog, { component: "nope" })).toEqual([]);
  });

  it("lists everything without a query, describing each in one sentence", () => {
    const all = findStories(manifest, catalog);
    expect(all).toHaveLength(manifest.stories.length);
    // The story's own JSDoc first, else its component's purpose.
    expect(all.find((s) => s.id === "functional-button--danger")?.description).toBe("For destructive actions.");
    expect(all.find((s) => s.id === "functional-button--primary")?.description).toBe("Triggers an action.");
  });

  it("keeps each listing short: a 'Component / Story' name and a capped description, no Storybook path", () => {
    const long = { ...manifest, stories: [{ ...manifest.stories[1], description: `${"A very long sentence about this story ".repeat(5)}end.` }] };
    const [only] = findStories(long, catalog);
    expect(only.name).toBe("Button / Danger");
    expect(only).not.toHaveProperty("title");
    expect(only.description!.length).toBeLessThanOrEqual(90);
    expect(only.description!.endsWith("…")).toBe(true);
  });

  it("suggests close ids for a mistyped one", () => {
    expect(closeStories(manifest, catalog, "functional-buton--primary")[0]).toBe("functional-button--primary");
    expect(resolveComponent(catalog, manifest.stories, "Select")).toBe("select");
  });
});

describe("story URLs", () => {
  it("round-trip the story's input through the query string", () => {
    const input = { storyId: "functional-button--primary", theme: "dark" as const, width: 375, args: { variant: "danger" }, exampleTheme: "tidepool" };
    expect(parseStoryPath(storyPath(input))).toEqual(input);
    expect(parseStoryPath("/story/x?width=9999&theme=pink&exampleTheme=%3Cscript%3E")).toEqual({ storyId: "x" });
    expect(parseStoryPath("/p/123")).toBeUndefined();
  });
});

describe("preview_story", async () => {
  const connect = async (root: string) => {
    const { server } = createServer(root);
    const client = new Client({ name: "stories-test", version: "0" });
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
    return client;
  };

  it("validates its input before running", async () => {
    const client = await connect(process.cwd());
    for (const args of [{}, { storyId: "" }, { storyId: "x", width: 100 }, { storyId: "x", theme: "sepia" }, { storyId: "x", args: "variant=danger" }]) {
      const result = await client.callTool({ name: "preview_story", arguments: args });
      expect(result.isError, JSON.stringify(args)).toBe(true);
    }
  });

  const repo = fileURLToPath(new URL("../../..", import.meta.url));
  const built = fileURLToPath(new URL("../../../dist/stories/manifest.json", import.meta.url));
  it.skipIf(!existsSync(built))("fails on an unknown story with close matches, against the built library", async () => {
    const client = await connect(repo);
    const result = await client.callTool({ name: "preview_story", arguments: { storyId: "functional-buton--primary" } });
    expect(result.isError).toBe(true);
    expect((result.content as { text: string }[])[0].text).toMatch(/Close matches: functional-button--primary/);
  });

  it.skipIf(!existsSync(built))("the shipped manifest lists component and demo stories with Storybook ids", () => {
    const shipped = JSON.parse(readFileSync(built, "utf8")) as StoriesManifest;
    expect(shipped.schemaVersion).toBe(1);
    const ids = shipped.stories.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const story of shipped.stories) {
      expect(story).toMatchObject({ id: expect.stringMatching(/^[a-z0-9-]+--[a-z0-9-]+$/), title: expect.any(String), name: expect.any(String), component: expect.any(String) });
      expect(["component", "demo"]).toContain(story.kind);
    }
    expect(ids).toContain("functional-button--primary");
    expect(shipped.stories.some((s) => s.kind === "demo")).toBe(true);
    // The example themes a preview can show stories in.
    expect(shipped.exampleThemes?.map((t) => t.id)).toEqual(expect.arrayContaining(["squonk", "tidepool", "aurora"]));
  });
});
