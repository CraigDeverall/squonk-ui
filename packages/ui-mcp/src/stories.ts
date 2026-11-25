// Reads the stories manifest shipped in the installed @squonk/ui
// (dist/stories/manifest.json) and answers list_stories from it, without
// loading the stories bundle itself.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Catalog, CatalogEntry } from "./catalog.ts";
import type { Project } from "./project.ts";

export type StoryEntry = {
  /** Storybook story id, e.g. "functional-button--primary". */
  id: string;
  /** Storybook title, e.g. "Components/Actions/Button". */
  title: string;
  /** The story's display name, e.g. "Primary". */
  name: string;
  kind: "component" | "demo";
  /** Catalog id of the component (or the demo's recipe id). */
  component: string;
  export: string;
  /** The story's own JSDoc, when it has one. */
  description?: string;
  /** How many controls its component's props give it. */
  controls?: number;
  /** Why it can't be shown outside Storybook, when it can't. */
  unavailable?: string;
};

export type StoriesManifest = {
  schemaVersion: number;
  library?: string;
  /** The docs' example themes a preview can show a story in, as theme objects to copy. */
  exampleThemes?: { id: string; name: string; description?: string; primitives?: Record<string, unknown>; roleBindings?: Record<string, string | { light: string; dark: string }> }[];
  stories: StoryEntry[];
};

/** The manifest, or undefined when this @squonk/ui version ships no stories. */
export function loadStories(project: Project): StoriesManifest | undefined {
  const file = path.join(project.libraryDir, "dist", "stories", "manifest.json");
  if (!existsSync(file)) return undefined;
  const manifest = JSON.parse(readFileSync(file, "utf8")) as StoriesManifest;
  return { ...manifest, stories: manifest.stories ?? [] };
}

const firstSentence = (text = "") => {
  const plain = text.replace(/`/g, "").replace(/\s+/g, " ").trim();
  const end = plain.search(/\.(\s|$)/);
  return end === -1 ? plain : plain.slice(0, end + 1);
};

const words = (text?: string) => (text ?? "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/** Resolves a component id, title or export name (or a demo's id) to its catalog id. */
export function resolveComponent(catalog: Catalog, stories: StoryEntry[], name: string): string | undefined {
  const needle = name.toLowerCase().trim();
  const kebab = needle.replace(/\s+/g, "-");
  const entry = [...catalog.components, ...catalog.recipes].find(
    (e: CatalogEntry) => e.id === kebab || e.title.toLowerCase() === needle || (e.exports ?? []).some((x) => x.toLowerCase() === needle),
  );
  if (entry) return entry.id;
  return stories.find((s) => s.component === kebab)?.component;
}

/**
 * One story in a listing, kept short so the whole set fits in a reply: its
 * id, "Component / Story" name, kind, component and a short description.
 * preview_story loads the story itself.
 */
export type StorySummary = { id: string; name: string; kind?: "demo"; component: string; description?: string; unavailable?: string };

/** The longest description a listing carries, in characters. */
const DESCRIPTION_LIMIT = 90;

const shorten = (value: string) => (value.length <= DESCRIPTION_LIMIT ? value : `${value.slice(0, DESCRIPTION_LIMIT - 1).trimEnd()}…`);

function summarise(story: StoryEntry, catalog: Catalog): StorySummary {
  const entry = [...catalog.components, ...catalog.recipes].find((e) => e.id === story.component);
  const description = story.description ? firstSentence(story.description) : entry?.purpose ? firstSentence(entry.purpose) : undefined;
  const owner = story.title.split("/").pop()?.trim() ?? story.title;
  return {
    id: story.id,
    name: `${owner} / ${story.name}`,
    // Most stories are components; only demos say so, to keep listings short.
    ...(story.kind === "demo" ? { kind: story.kind } : {}),
    component: story.component,
    ...(description ? { description: shorten(description) } : {}),
    ...(story.unavailable ? { unavailable: story.unavailable } : {}),
  };
}

/**
 * Ranks stories against a free-text query, optionally within one component.
 * The component's id, title and exports count most, then the story's name,
 * then its Storybook path and description, so "select searchable" finds
 * Select's Searchable story first.
 */
export function findStories(manifest: StoriesManifest, catalog: Catalog, { query, component }: { query?: string; component?: string } = {}): StorySummary[] {
  let pool = manifest.stories;
  if (component) {
    const id = resolveComponent(catalog, pool, component);
    pool = id ? pool.filter((s) => s.component === id) : [];
  }
  const terms = words(query);
  if (terms.length === 0) return pool.map((s) => summarise(s, catalog));
  const scored = pool.map((story, index) => {
    const entry = [...catalog.components, ...catalog.recipes].find((e) => e.id === story.component);
    const names = new Set([...words(story.component), ...words(entry?.title), ...(entry?.exports ?? []).flatMap(words)]);
    const storyName = new Set([...words(story.name), ...words(story.export)]);
    const where = new Set(words(story.title));
    const about = `${story.description ?? ""} ${entry?.purpose ?? ""}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (names.has(term)) score += 5;
      if (storyName.has(term)) score += 4;
      else if ([...storyName].some((w) => w.startsWith(term))) score += 2;
      if (where.has(term)) score += 2;
      if (about.includes(term)) score += 1;
    }
    if (story.id === query?.trim()) score += 100;
    return { story, score, index };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((s) => summarise(s.story, catalog));
}

/** Story ids that look like `id`, for a helpful "no such story" error. */
export function closeStories(manifest: StoriesManifest, catalog: Catalog, id: string, limit = 5): string[] {
  const query = id.replace(/--/g, " ").replace(/-/g, " ");
  return findStories(manifest, catalog, { query })
    .slice(0, limit)
    .map((s) => s.id);
}
