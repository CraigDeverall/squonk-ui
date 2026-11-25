// Reads the design catalog shipped in the installed @squonk/ui and answers the
// lookup tools from it.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { LIBRARY, type Project } from "./project.ts";

export type CatalogEntry = {
  id: string;
  kind: string;
  title: string;
  purpose?: string;
  importPath?: string;
  category?: string;
  exports?: string[];
  types?: string[];
  patterns?: { id: string }[];
  guidance?: unknown;
  documentationSections?: unknown;
  stories?: { export: string; id: string }[];
  components?: string[];
  [key: string]: unknown;
};

export type Catalog = { components: CatalogEntry[]; recipes: CatalogEntry[] };

export function loadCatalog(project: Project): Catalog {
  const require = createRequire(path.join(project.root, "package.json"));
  const file = require.resolve(`${LIBRARY}/catalog.json`);
  const catalog = JSON.parse(readFileSync(file, "utf8"));
  return { components: catalog.components ?? [], recipes: catalog.recipes ?? [] };
}

function firstSentence(text = ""): string {
  const plain = text.replace(/`/g, "");
  const end = plain.search(/\.(\s|$)/);
  return end === -1 ? plain : plain.slice(0, end + 1);
}

/** One line per component: what to import and what it is for. */
export function summarise(entry: CatalogEntry) {
  return {
    id: entry.id,
    title: entry.title,
    import: entry.importPath,
    exports: entry.exports ?? [],
    purpose: firstSentence(entry.purpose),
    patterns: (entry.patterns ?? []).map((p) => p.id),
  };
}

/**
 * Ranks components against a free-text query. Matches in the title and export
 * names count most, then patterns, then the purpose text, so "date" finds
 * DatePicker before components that merely mention dates.
 */
export function findComponents(catalog: Catalog, query?: string) {
  const all = catalog.components;
  const words = (query ?? "").toLowerCase().split(/\W+/).filter(Boolean);
  if (words.length === 0) return all.map(summarise);
  const scored = all.map((entry) => {
    const names = [entry.id, entry.title, ...(entry.exports ?? [])].join(" ").toLowerCase();
    const patterns = (entry.patterns ?? []).map((p) => p.id).join(" ").toLowerCase();
    const purpose = (entry.purpose ?? "").toLowerCase();
    let score = 0;
    for (const word of words) {
      if (names.includes(word)) score += 5;
      if (patterns.includes(word)) score += 2;
      if (purpose.includes(word)) score += 1;
    }
    return { entry, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => summarise(s.entry));
}

/** The full entry, without the hashes and test paths that only CI needs. */
export function getComponent(catalog: Catalog, id: string): CatalogEntry | undefined {
  const needle = id.toLowerCase();
  const entry = [...catalog.components, ...catalog.recipes].find(
    (e) => e.id === needle || e.title.toLowerCase() === needle || (e.exports ?? []).some((x) => x.toLowerCase() === needle),
  );
  if (!entry) return undefined;
  const rest = { ...entry };
  delete rest.hashes;
  delete rest.tests;
  return rest;
}
