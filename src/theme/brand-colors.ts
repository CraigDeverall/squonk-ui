import chroma from "chroma-js";

/**
 * The colours `deriveFromPrimary` computes from the primary instead of taking
 * them as written: the link, the focus ring and the accent.
 */
export const DERIVED_BRAND_KEYS = ["link", "borderFocus", "accent"] as const;
export type DerivedBrandKey = (typeof DERIVED_BRAND_KEYS)[number];

const DERIVED = new Set<string>(DERIVED_BRAND_KEYS);
export const isDerivedBrandKey = (key: string): key is DerivedBrandKey => DERIVED.has(key);

/** The contrast each derived colour needs on the theme's backgrounds (WCAG). */
export const DERIVED_CONTRAST: Record<DerivedBrandKey, number> = {
  link: 4.5, // text
  borderFocus: 3, // a focus indicator
  accent: 1, // a fill: whatever goes on it picks its own readable colour
};

const cache = new Map<string, string>();

/**
 * The colour, moved only as far as it must go in lightness (keeping its hue
 * and chroma) to reach `ratio` against every background: darker on light
 * backgrounds, lighter on dark ones. Returns it unchanged when it already
 * reads.
 */
export function readableOn(color: string, backgrounds: readonly string[], ratio: number): string {
  if (!chroma.valid(color) || ratio <= 1) return color;
  const valid = backgrounds.filter((bg) => chroma.valid(bg));
  if (!valid.length) return color;
  const key = `${color}|${valid.join(",")}|${ratio}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const reads = (c: chroma.Color) => valid.every((bg) => chroma.contrast(c, bg) >= ratio);
  let out = color;
  if (!reads(chroma(color))) {
    // Light backgrounds need a darker colour; dark ones a lighter colour.
    const meanLuminance = valid.reduce((sum, bg) => sum + chroma(bg).luminance(), 0) / valid.length;
    const darker = meanLuminance > 0.18;
    const [l, c, h] = chroma(color).oklch();
    out = darker ? "#000000" : "#ffffff";
    for (let step = 1; step <= 100; step++) {
      const nextL = darker ? l - (l * step) / 100 : l + ((1 - l) * step) / 100;
      // Ease the chroma off near black and white so the colour stays in gamut.
      const candidate = chroma.oklch(nextL, c * Math.min(1, 4 * nextL * (1 - nextL) + 0.25), Number.isNaN(h) ? 0 : h);
      if (reads(candidate)) {
        out = candidate.hex();
        break;
      }
    }
  }
  cache.set(key, out);
  return out;
}
