// Reads the design guides shipped in the installed @squonkstack/ui (Foundations,
// Patterns with Forms, Getting started) and answers the guidance tools from them.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { LIBRARY, type Project } from "./project.ts";

export type Guide = {
  id: string;
  title: string;
  section: string;
  summary: string;
  docsUrl: string;
  text: string;
};

export const guideUri = (id: string) => `squonk-ui://guides/${id}`;

/** The installed guides, or none for a @squonkstack/ui from before they shipped. */
export function loadGuides(project: Project): Guide[] {
  const require = createRequire(path.join(project.root, "package.json"));
  let file: string;
  try {
    file = require.resolve(`${LIBRARY}/guides.json`);
  } catch {
    return [];
  }
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, "utf8")).guides ?? [];
}

// Words too common to tell guides apart.
const STOP_WORDS = new Set(["or", "and", "the", "to", "of", "in", "on", "for", "with", "vs", "an", "is", "it", "how", "what", "when", "which", "do", "should", "use", "my", "be"]);

const headings = (guide: Guide) => [...guide.text.matchAll(/^#{2,3} (.+)$/gm)].map((m) => m[1]);

/** One line per guide: where to read it and what it covers. */
export function summariseGuide(guide: Guide) {
  return { id: guide.id, uri: guideUri(guide.id), title: guide.title, section: guide.section, summary: guide.summary, sections: headings(guide) };
}

/**
 * Ranks guides against a free-text query: the title counts most, then section
 * headings, then how often the words appear in the text. "badge or tag" finds
 * the Badge-or-Tag pattern before pages that mention badges in passing.
 */
export function findGuides(guides: Guide[], query?: string) {
  const words = (query ?? "").toLowerCase().split(/\W+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  if (words.length === 0) return guides.map(summariseGuide);
  const scored = guides.map((guide) => {
    const title = `${guide.section} ${guide.title}`.toLowerCase();
    const heads = headings(guide).join(" ").toLowerCase();
    const text = guide.text.toLowerCase();
    let score = 0;
    for (const word of words) {
      if (title.includes(word)) score += 8;
      if (heads.includes(word)) score += 3;
      score += Math.min(text.split(word).length - 1, 5);
    }
    return { guide, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => summariseGuide(s.guide));
}

/** One guide by id ("patterns-labels-badge-or-tag"), title ("Labels: Badge or Tag") or docs link. */
export function getGuide(guides: Guide[], id: string): Guide | undefined {
  const needle = id.toLowerCase().replace(/^squonk-ui:\/\/guides\//, "");
  const fromDocs = needle.match(/\/docs\/([a-z0-9-]+?)--docs/)?.[1];
  return guides.find((g) => g.id === needle || g.id === fromDocs || g.title.toLowerCase() === needle);
}

/** The guide behind a catalog pattern link, if it shipped. */
export function guideForUrl(guides: Guide[], url?: string): string | undefined {
  const id = url?.match(/\/docs\/([a-z0-9-]+?)--docs/)?.[1];
  return id && guides.some((g) => g.id === id) ? guideUri(id) : undefined;
}
