/**
 * Easing curves a theme's motion is built from.
 *
 * A spring is drawn as a CSS `linear()` easing: points sampled from a damped
 * spring settling from 0 to 1, so it overshoots and settles without any
 * JavaScript at run time. `bounce` sets how far it overshoots: 0 is no
 * spring at all (the theme's plain arrival curve is used instead), 0.5 a
 * clear but polite bounce (16% past), 1 the most the library allows.
 */

const SAMPLES = 40;

/** Position of a unit spring at time `t` (0 → 1), for damping ratio `zeta` (< 1). */
function springAt(t: number, zeta: number): number {
  // Stiff enough that the spring is settled (within 0.1%) by t = 1.
  const omega = 6.9 / zeta;
  const damped = omega * Math.sqrt(1 - zeta * zeta);
  const decay = Math.exp(-zeta * omega * t);
  return 1 - decay * (Math.cos(damped * t) + ((zeta * omega) / damped) * Math.sin(damped * t));
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * A CSS `linear()` easing for a spring with the given bounce (0–1), or
 * `undefined` for no bounce. Overshoot rises with bounce: about 4% at 0.2,
 * 16% at 0.5, 37% at 1.
 */
export function springEasing(bounce: number): string | undefined {
  if (!Number.isFinite(bounce) || bounce <= 0) return undefined;
  const zeta = Math.max(0.3, 1 - Math.min(bounce, 1) * 0.7 - 0.15);
  const points: string[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    points.push(String(i === SAMPLES ? 1 : round(springAt(t, zeta))));
  }
  return `linear(${points.join(", ")})`;
}

/** The furthest a spring with this bounce travels past its end, as a fraction (0.12 = 12%). */
export function springOvershoot(bounce: number): number {
  const easing = springEasing(bounce);
  if (!easing) return 0;
  const values = easing.slice(7, -1).split(",").map(Number);
  return round(Math.max(...values) - 1);
}

/**
 * Sample any easing the library uses (a `cubic-bezier()`, `linear()`, or
 * a keyword) at `steps + 1` evenly spaced times, for drawing curves in the
 * docs and easing numbers in JavaScript. Unknown values sample as linear.
 */
export function sampleEasing(easing: string, steps = 48): number[] {
  const fn = easingFunction(easing);
  return Array.from({ length: steps + 1 }, (_, i) => fn(i / steps));
}

const KEYWORDS: Record<string, [number, number, number, number]> = {
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

/** An easing as a function of progress (0–1). */
export function easingFunction(easing: string): (t: number) => number {
  const value = easing.trim();
  const bezier = /^cubic-bezier\(([^)]+)\)$/.exec(value);
  const points = bezier ? bezier[1].split(",").map(Number) : KEYWORDS[value];
  if (points && points.length === 4 && points.every(Number.isFinite)) {
    const [x1, y1, x2, y2] = points;
    return (t) => cubicBezier(x1, y1, x2, y2, t);
  }
  const linear = /^linear\((.+)\)$/.exec(value);
  if (linear) {
    const stops = linear[1].split(",").map((s) => Number(s.trim().split(/\s+/)[0]));
    if (stops.length > 1 && stops.every(Number.isFinite)) {
      return (t) => {
        const at = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
        const i = Math.min(Math.floor(at), stops.length - 2);
        return stops[i] + (stops[i + 1] - stops[i]) * (at - i);
      };
    }
  }
  return (t) => t;
}

function cubicBezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bez = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  // Find s where the curve's x equals x, by bisection (robust for any valid curve).
  let lo = 0;
  let hi = 1;
  let s = x;
  for (let i = 0; i < 30; i++) {
    s = (lo + hi) / 2;
    if (bez(x1, x2, s) < x) lo = s;
    else hi = s;
  }
  return bez(y1, y2, s);
}
