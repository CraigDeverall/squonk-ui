import { MOTION_LEVEL_VARS } from "../../../theme/motion-level";

/** A CSS time (`200ms`, `0.4s`) in milliseconds; 0 when it isn't one. */
export function parseTime(value: string): number {
  const v = value.trim();
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return 0;
  if (v.endsWith("ms")) return n;
  if (v.endsWith("s")) return n * 1000;
  return n;
}

export interface MotionTiming {
  /** The duration in ms, already scaled by the motion level (0 when motion is off). */
  ms: number;
  /** The CSS easing to use. */
  easing: string;
  /** Whether motion is reduced: nothing should travel or grow. */
  reduced: boolean;
}

/**
 * Timing for motion run from JavaScript (Layout, Count, toasts leaving),
 * read from the purpose tokens and motion level that apply to `el`, so it
 * follows the theme, any nested theme scope and the motion level exactly as
 * the CSS recipes do.
 */
export function motionTiming(el: Element | null | undefined, durationVar: string, easingVar = "--squonk-roles-motion-standard"): MotionTiming {
  if (!el || typeof getComputedStyle === "undefined") return { ms: 0, easing: "linear", reduced: false };
  const style = getComputedStyle(el);
  const number = (name: string, fallback: number) => {
    const value = parseFloat(style.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };
  const time = Math.max(0, number(MOTION_LEVEL_VARS.time, 1));
  return {
    ms: parseTime(style.getPropertyValue(durationVar)) * time,
    easing: style.getPropertyValue(easingVar).trim() || "ease",
    reduced: number(MOTION_LEVEL_VARS.reduced, 0) >= 1,
  };
}
