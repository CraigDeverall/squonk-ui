import { kebab } from "./theme-css-vars";

/**
 * The parts of a tone palette (`--squonk-colors-tone-<tone>-<part>`), and the
 * local custom property a component's CSS reads each one from.
 */
export const TONE_PARTS = [
  "solid",
  "contrast",
  "subtle",
  "on-subtle",
  "outline-text",
  "wash",
  "on-wash",
  "wash-border",
] as const;

export type TonePart = (typeof TONE_PARTS)[number];

export type ToneStyle = Record<`--tone-${TonePart}`, string>;

export interface ToneProps {
  "data-tone": string;
  style?: ToneStyle;
}

// A colour key becomes part of a variable name; anything else is not a key.
const KEY = /^[A-Za-z][A-Za-z0-9_-]*$/;

/**
 * What a component spreads on its root for a `tone` prop.
 *
 * A built-in tone is just `data-tone`, styled by the component's own
 * `[data-tone="…"]` rule. Any other tone is a colour the theme added
 * (`addedColorPrimitives`): `data-tone="custom"` plus the local `--tone-*`
 * properties pointed at that colour's palette, so one
 * `[data-tone="custom"]` rule (or the variant rules that already read
 * `--tone-*`) covers every added colour. This only builds variable names;
 * the colours are derived once by the theme.
 */
export function toneProps(tone: string, builtIn: readonly string[]): ToneProps {
  if (builtIn.includes(tone) || !KEY.test(tone)) return { "data-tone": tone };
  const key = kebab(tone);
  const style = Object.fromEntries(
    TONE_PARTS.map((part) => [`--tone-${part}`, `var(--squonk-colors-tone-${key}-${part})`]),
  ) as ToneStyle;
  return { "data-tone": "custom", style };
}
