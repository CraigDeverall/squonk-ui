import chroma from "chroma-js";

/**
 * The neutral colours a theme's greys come from: page, surfaces, wells, text
 * and borders. `neutralTint` leans these towards the primary colour's hue.
 */
export const NEUTRAL_COLOR_KEYS = [
  "backgroundDefault",
  "backgroundSurface",
  "backgroundSubtle",
  "textPrimary",
  "textSecondary",
  "textMuted",
  "textInverse",
  "borderDefault",
  "borderStrong",
] as const;

export type NeutralColorKey = (typeof NEUTRAL_COLOR_KEYS)[number];

const NEUTRAL = new Set<string>(NEUTRAL_COLOR_KEYS);

/** Whether a colour primitive is one of the neutrals the tint applies to. */
export const isNeutralColorKey = (key: string): key is NeutralColorKey => NEUTRAL.has(key);

/** The chroma a tint of 1 gives a mid-tone grey, in OKLCH. */
const MAX_CHROMA = 0.05;
/** Below this the primary is effectively grey, so it has no hue worth leaning towards. */
const MIN_SOURCE_CHROMA = 0.02;

const cache = new Map<string, string>();

/**
 * Leans a neutral colour towards a hue, keeping its lightness (so contrast
 * holds): the tint is strongest in the mid-tones and fades out towards white
 * and black, as hand-tinted greys do. At `strength` 0 it returns the colour
 * unchanged; at 1 it replaces the colour's own tint entirely.
 *
 * `source` is the colour whose hue the greys take (the theme's primary).
 */
export function tintNeutral(color: string, source: string, strength: number): string {
  if (!(strength > 0) || !chroma.valid(color) || !chroma.valid(source)) return color;
  const key = `${color}|${source}|${strength}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const [, sourceChroma, sourceHue] = chroma(source).oklch();
  if (!(sourceChroma >= MIN_SOURCE_CHROMA) || Number.isNaN(sourceHue)) {
    cache.set(key, color);
    return color;
  }
  const base = chroma(color);
  const alpha = base.alpha();
  const [lightness, a, b] = base.oklab();
  const k = Math.min(1, strength);
  const target = strength * MAX_CHROMA * 4 * lightness * (1 - lightness);
  const hue = (sourceHue * Math.PI) / 180;
  // Keep (1 − k) of the colour's own tint and add the new one, in OKLab.
  const nextA = a * (1 - k) + target * Math.cos(hue);
  const nextB = b * (1 - k) + target * Math.sin(hue);
  const tinted = chroma.oklab(lightness, nextA, nextB).alpha(alpha);
  const out = alpha < 1 ? tinted.css() : tinted.hex();
  cache.set(key, out);
  return out;
}
