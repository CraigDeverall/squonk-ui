/**
 * Surface relief: the subtle gradients and opposing edge strokes that make a
 * surface look raised off the page or recessed into it.
 *
 * Relief is drawn as two layers over a component's own colours, never in
 * place of them:
 * - a `fill`: a translucent `background-image` over the background colour,
 *   lit on one side and shaded on the other;
 * - an `edge`: inset box-shadows along the borders, a highlight on the lit
 *   edge and a shade on the far one.
 *
 * Both follow one light source (`lightAngle`), which also turns the theme's
 * drop shadows, so every surface agrees about where the light comes from.
 * At the default depth and sheen of 0 nothing is drawn.
 */

/** The shape of the relief: how light falls across a surface. */
export const RELIEF_PROFILES = ["soft", "bevel", "glass", "pillow", "print"] as const;
export type ReliefProfile = (typeof RELIEF_PROFILES)[number];

/** How the fill combines with the colour beneath it. */
export const RELIEF_BLENDS = ["normal", "soft-light", "overlay"] as const;
export type ReliefBlend = (typeof RELIEF_BLENDS)[number];

/** How strongly each kind of relief takes the theme's depth. */
export const RELIEF_STRENGTHS = {
  /** Controls: buttons, select triggers, switch thumbs, the selected segment. */
  raised: 1,
  /** Large areas: cards, panels and the header, where a full gradient would be heavy. */
  raisedSubtle: 0.5,
  /** Wells: fields, tracks, filled cards, and controls while pressed. */
  recessed: 0.8,
} as const;
export type ReliefStrength = keyof typeof RELIEF_STRENGTHS;

export interface ReliefSettings {
  /** 0–1: how far a surface's tone shifts across its face. */
  depth: number;
  /** 0–1: the strength of the highlight and shade strokes along its edges. */
  sheen: number;
  /** Where the light comes from, in degrees clockwise from above. */
  angle: number;
  blend: ReliefBlend;
  /** Dark surfaces show highlights far more and shading far less. */
  dark: boolean;
}

/** The two layers of one kind of relief. */
export interface ReliefLayers {
  /** A `background-image` value: a gradient, or `none`. */
  fill: string;
  /** A `box-shadow` value: inset strokes, or a transparent no-op shadow. */
  edge: string;
}

/** A box-shadow that draws nothing, so it can sit in a shadow list. */
export const NO_SHADOW = "0 0 #0000";
export const FLAT: ReliefLayers = { fill: "none", edge: NO_SHADOW };

const round = (n: number, places = 3) => {
  const f = 10 ** places;
  const v = Math.round(n * f) / f;
  return Object.is(v, -0) ? 0 : v;
};
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const white = (a: number) => `rgb(255 255 255 / ${round(clamp01(a))})`;
const black = (a: number) => `rgb(0 0 0 / ${round(clamp01(a))})`;

/** A length for a shadow offset: `0` when zero (as the theme has always written it), else pixels. */
const len = (n: number) => (round(n, 2) === 0 ? "0" : `${round(n, 2)}px`);

/** The light angle normalised to [0, 360). */
export const normaliseAngle = (angle: number) => ((angle % 360) + 360) % 360;

/**
 * The offset of a drop shadow `distance` long, falling away from the light.
 * At 0° (light from above) it is `0 {distance}px`, as the theme's shadows
 * have always been written.
 */
export function shadowOffset(angle: number, distance: number): string {
  const rad = (normaliseAngle(angle) * Math.PI) / 180;
  return `${len(-Math.sin(rad) * distance)} ${len(Math.cos(rad) * distance)}`;
}

/**
 * An offset for a hard (unblurred) shadow falling away from the light, as
 * `x y`: scaled so its longer side is `distance`, so a diagonal light gives
 * an even `3px 3px` rather than a shorter `2.12px 2.12px`.
 */
export function inkOffset(angle: number, distance: number): string {
  const rad = (normaliseAngle(angle) * Math.PI) / 180;
  const x = -Math.sin(rad);
  const y = Math.cos(rad);
  const longest = Math.max(Math.abs(x), Math.abs(y));
  return `${len((x / longest) * distance)} ${len((y / longest) * distance)}`;
}

/**
 * The relief layers for one profile and strength.
 * `raised` and `raisedSubtle` catch the light; `recessed` is shaded on the
 * lit side and catches light on its far lip.
 */
export function reliefLayers(profile: ReliefProfile, strength: ReliefStrength, s: ReliefSettings): ReliefLayers {
  const amount = RELIEF_STRENGTHS[strength];
  const a = amount * clamp01(s.depth);
  const sheen = clamp01(s.sheen);
  if (a === 0 && sheen === 0) return FLAT;

  const rad = (normaliseAngle(s.angle) * Math.PI) / 180;
  // An inset shadow offset away from the light paints the lit edge.
  const ux = -Math.sin(rad);
  const uy = Math.cos(rad);
  const inset = (width: number, blur: number, color: string, litEdge = true) => {
    const k = litEdge ? width : -width;
    return `inset ${len(ux * k)} ${len(uy * k)} ${blur === 0 ? "0" : `${blur}px`} ${color}`;
  };
  const edges = (...shadows: string[]) => shadows.join(", ");
  const gradient = `${round(normaliseAngle(s.angle + 180), 2)}deg`;

  const hiK = s.dark ? 0.55 : 1;
  const shK = s.dark ? 1.8 : 1;
  // Blending eats contrast, so a blended fill gets more to work with.
  const blendK = s.blend === "normal" ? 1 : 1.8;
  const hi = 0.22 * a * hiK * blendK;
  const sh = 0.16 * a * shK * blendK;
  const sheenHi = sheen * 0.6 * hiK * amount;
  const sheenSh = sheen * 0.3 * shK * amount;

  if (strength === "recessed") {
    switch (profile) {
      case "print":
        return {
          fill: "none",
          edge: edges(inset(2, 0, black(0.3 * a * shK + 0.05 * sheen)), inset(2, 0, white(sheenHi), false)),
        };
      case "bevel":
        return {
          fill: `linear-gradient(${gradient}, ${black(sh * 0.4)}, transparent 60%)`,
          edge: edges(inset(1, 0, black(0.25 * a * shK + sheenSh)), inset(1, 0, white(sheenHi), false)),
        };
      default:
        return {
          fill: `linear-gradient(${gradient}, ${black(sh)} 0%, transparent 45%, ${white(hi * 0.5)} 100%)`,
          edge: edges(inset(2, 4, black(0.18 * a * shK)), inset(1, 0, white(sheenHi * 0.7), false)),
        };
    }
  }

  switch (profile) {
    case "soft":
      return {
        fill: `linear-gradient(${gradient}, ${white(hi)} 0%, transparent 55%, ${black(sh)} 100%)`,
        edge: edges(inset(1, 0, white(sheenHi)), inset(1, 0, black(sheenSh), false)),
      };
    case "bevel":
      return {
        fill: `linear-gradient(${gradient}, ${white(hi * 0.35)}, ${black(sh * 0.35)})`,
        edge: edges(inset(1, 0, white(sheenHi * 1.4)), inset(1, 0, black(sheenSh * 1.6 + 0.15 * a), false)),
      };
    case "glass":
      return {
        fill: `linear-gradient(${gradient}, ${white(hi * 1.7)} 0%, ${white(hi * 0.7)} 47%, transparent 50%, ${black(sh * 0.7)} 100%)`,
        edge: edges(inset(1, 0, white(sheenHi * 1.5)), `inset 0 0 0 1px ${white(sheen * 0.12 * hiK)}`),
      };
    case "pillow": {
      const x = round(50 + 45 * Math.sin(rad), 1);
      const y = round(50 - 60 * Math.cos(rad), 1);
      return {
        fill: `radial-gradient(130% 95% at ${x}% ${y}%, ${white(hi * 1.4)}, transparent 62%), linear-gradient(${gradient}, transparent 35%, ${black(sh * 1.2)} 100%)`,
        edge: edges(inset(1, 1, white(sheenHi)), inset(2, 3, black(sheenSh), false)),
      };
    }
    case "print":
      return {
        fill: "none",
        edge: edges(inset(2, 0, white(0.35 * a * hiK + sheenHi * 0.5)), inset(2, 0, black(0.28 * a * shK), false)),
      };
  }
}
