/**
 * How much motion the app allows: the permission layer of the motion
 * system, separate from the theme's motion character.
 *
 * - `system` (default): full motion, unless the person's device asks for
 *   reduced motion.
 * - `reduced`: as if the device asked for reduced motion, whatever it says.
 *   Nothing travels or grows; overlays and content fade in place,
 *   decorative loops stop and spinners slow down. Use it for an in-app
 *   "Reduce motion" setting.
 * - `none`: no motion at all; every change is immediate and loops hold
 *   still. For screenshots, tests and print views, not people.
 *
 * The level is published as `--squonk-motion-level-*` custom properties that the
 * Motion components read, so it applies before hydration and inside any
 * stylesheet. Scope it to part of a page by setting the same properties on
 * an element (the docs do this for slow motion).
 */
export type MotionLevel = "system" | "reduced" | "none";

/** The custom properties that carry the motion level, with their full-motion values. */
export const MOTION_LEVEL_VARS = {
  /** 1 when motion is reduced: nothing travels or grows. 0 otherwise. */
  reduced: "--squonk-motion-level-reduced",
  /** Every motion duration and delay is multiplied by this: 1 normally, 0 for none, more for slow motion. */
  time: "--squonk-motion-level-time",
  /** Whether decorative loops (shimmer, pulse) run: `running` or `paused`. */
  decor: "--squonk-motion-level-decor",
  /** Whether loops that show work (spinner, progress) run: `running` or `paused`. */
  work: "--squonk-motion-level-work",
} as const;

const LEVELS: Record<Exclude<MotionLevel, "system">, Record<string, string>> = {
  reduced: { [MOTION_LEVEL_VARS.reduced]: "1", [MOTION_LEVEL_VARS.decor]: "paused" },
  none: {
    [MOTION_LEVEL_VARS.reduced]: "1",
    [MOTION_LEVEL_VARS.time]: "0",
    [MOTION_LEVEL_VARS.decor]: "paused",
    [MOTION_LEVEL_VARS.work]: "paused",
  },
};

/** The declarations a motion level sets, or none for `system`. */
export function motionLevelDeclarations(level: MotionLevel | undefined): Record<string, string> {
  return level && level !== "system" ? LEVELS[level] ?? {} : {};
}

/** The declarations a motion level sets, as one CSS declaration string (`a:1;b:2`). */
export function motionLevelCss(level: MotionLevel | undefined): string {
  return Object.entries(motionLevelDeclarations(level))
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
}
