/**
 * Loads Google Fonts on demand into both the Storybook manager iframe
 * (where the picker dropdown previews each font in its own face) and the
 * preview iframe (where the canvas renders the chosen font via the theme).
 *
 * Idempotent per (document, family) — re-requesting an already-loaded
 * family is a no-op. Multiple weights for the same family are coalesced
 * into a single <link>.
 */

import type { GoogleFontEntry } from "./data/google-fonts";

const ATTR = "data-squonk-gfont";

/** Common rendering weights — enough for body + headings without
 *  pulling the whole family. Picker UI only needs 400 to preview. */
const DEFAULT_WEIGHTS = [400, 500, 600, 700] as const;

/**
 * Build the Google Fonts CSS URL for one family. We snap the requested
 * weights to whatever the family actually ships, because asking for a
 * weight the family doesn't have makes Google return a 400 and the
 * stylesheet never resolves.
 */
export function buildGoogleFontUrl(
  font: GoogleFontEntry,
  weights: readonly number[] = DEFAULT_WEIGHTS,
  display: "swap" | "block" | "fallback" | "optional" = "swap"
): string {
  const available = new Set(font.weights);
  const wanted = weights.filter((w) => available.has(w));
  const finalWeights = wanted.length > 0 ? wanted : font.weights.slice(0, 1);
  const familyParam = font.family.replace(/ /g, "+");
  // css2 syntax: `family=Name:wght@400;700`
  const weightSpec =
    finalWeights.length > 0 ? `:wght@${finalWeights.join(";")}` : "";
  return `https://fonts.googleapis.com/css2?family=${familyParam}${weightSpec}&display=${display}`;
}

/**
 * Inject a <link rel="stylesheet"> for a Google Font into the given
 * document if one with the same family hasn't already been added. Marks
 * the link with data-squonk-gfont="<family>" so subsequent calls can
 * detect the existing copy.
 */
export function loadGoogleFontInto(
  doc: Document,
  font: GoogleFontEntry,
  weights?: readonly number[]
): void {
  const existing = doc.querySelector<HTMLLinkElement>(
    `link[${ATTR}="${cssEscape(font.family)}"]`
  );
  if (existing) return;

  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.setAttribute(ATTR, font.family);
  link.href = buildGoogleFontUrl(font, weights);
  doc.head.appendChild(link);
}

/**
 * The CSS font-family stack to apply once a Google Font is loaded.
 * Falls back to a category-appropriate system font so consumers still
 * get sensible rendering while the web font is in flight.
 */
export function fontFamilyStackFor(font: GoogleFontEntry): string {
  const fallback = categoryFallback(font.category);
  return `"${font.family}", ${fallback}`;
}

function categoryFallback(category: string): string {
  switch (category.toLowerCase()) {
    case "serif":
      return 'Georgia, "Times New Roman", serif';
    case "display":
      return "system-ui, sans-serif";
    case "handwriting":
      return '"Brush Script MT", cursive';
    case "monospace":
      return 'Menlo, Monaco, Consolas, "Courier New", monospace';
    case "sans serif":
    default:
      return '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  }
}

/**
 * Escape a font family name for use inside a CSS attribute selector.
 * Family names can contain spaces and punctuation; using CSS.escape
 * keeps selectors valid (`Roboto Mono` → `Roboto\\ Mono`).
 */
function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/(["\\])/g, "\\$1");
}
