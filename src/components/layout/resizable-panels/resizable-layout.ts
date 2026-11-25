/**
 * The arithmetic behind ResizablePanels, kept free of React and the DOM so
 * it can be unit tested. Every size here is a percentage of the space the
 * group's panels share (the group's length minus its handles).
 */

/** A panel size: a number is a percentage of the group, a string such as `"240px"` is pixels. */
export type PanelSize = number | `${number}px` | `${number}%`;

/** The size limits a panel declares. */
export interface PanelConstraints {
  defaultSize?: PanelSize;
  minSize?: PanelSize;
  maxSize?: PanelSize;
  collapsible?: boolean;
  collapsedSize?: PanelSize;
}

/** A panel's limits, all in percent of the group. */
export interface ResolvedConstraints {
  min: number;
  max: number;
  collapsible: boolean;
  collapsed: number;
  default: number | undefined;
}

const EPSILON = 0.001;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * A size in percent of a group `groupPx` pixels long. Pixel sizes need a
 * measured group; before it is measured they are `undefined`.
 */
export function toPercent(size: PanelSize | undefined, groupPx: number): number | undefined {
  if (size === undefined) return undefined;
  if (typeof size === "number") return Number.isFinite(size) ? size : undefined;
  const value = Number.parseFloat(size);
  if (!Number.isFinite(value)) return undefined;
  if (size.trim().endsWith("px")) return groupPx > 0 ? (value / groupPx) * 100 : undefined;
  return value;
}

/** Resolve a panel's limits for a group `groupPx` pixels long. */
export function resolveConstraints(c: PanelConstraints, groupPx: number): ResolvedConstraints {
  const min = clamp(toPercent(c.minSize, groupPx) ?? 0, 0, 100);
  const max = clamp(toPercent(c.maxSize, groupPx) ?? 100, min, 100);
  const collapsible = Boolean(c.collapsible);
  const collapsed = collapsible ? clamp(toPercent(c.collapsedSize, groupPx) ?? 0, 0, min) : 0;
  const def = toPercent(c.defaultSize, groupPx);
  return { min, max, collapsible, collapsed, default: def === undefined ? undefined : clamp(def, 0, 100) };
}

/** Whether a panel at `size` is collapsed. */
export function isCollapsed(size: number, r: ResolvedConstraints): boolean {
  return r.collapsible && size < r.min - EPSILON && Math.abs(size - r.collapsed) < EPSILON * 10;
}

/**
 * Bring sizes within every panel's limits and make them add up to 100,
 * spreading any difference over the panels with room. A collapsible panel
 * below its minimum stays collapsed (when nearer that) rather than growing.
 */
export function fitLayout(sizes: readonly number[], resolved: readonly ResolvedConstraints[]): number[] {
  const out = sizes.map((size, i) => {
    const r = resolved[i];
    if (!r) return size;
    if (r.collapsible && size < r.min && size < (r.collapsed + r.min) / 2) return r.collapsed;
    return clamp(size, r.min, r.max);
  });
  const locked = out.map((size, i) => isCollapsed(size, resolved[i]));
  let diff = 100 - out.reduce((sum, size) => sum + size, 0);
  for (let pass = 0; pass <= out.length && Math.abs(diff) > EPSILON; pass++) {
    const open = out
      .map((size, i) => i)
      .filter((i) => !locked[i] && (diff > 0 ? out[i] < resolved[i].max - EPSILON : out[i] > resolved[i].min + EPSILON));
    if (!open.length) break;
    const share = diff / open.length;
    for (const i of open) {
      const next = clamp(out[i] + share, resolved[i].min, resolved[i].max);
      diff -= next - out[i];
      out[i] = next;
    }
  }
  // The limits can't all hold (the minimums add up to more than the group):
  // the last open panel takes the rest, so the panels still fill the group.
  if (Math.abs(diff) > EPSILON && out.length) {
    const lastOpen = locked.lastIndexOf(false);
    const i = lastOpen === -1 ? out.length - 1 : lastOpen;
    out[i] = Math.max(0, out[i] + diff);
  }
  return out;
}

/** Starting sizes: `defaultLayout` when it fits the panels, else each panel's default, the rest shared equally. */
export function initialLayout(resolved: readonly ResolvedConstraints[], defaultLayout?: readonly number[]): number[] {
  if (defaultLayout && defaultLayout.length === resolved.length && defaultLayout.every(Number.isFinite)) {
    return fitLayout(defaultLayout, resolved);
  }
  const known = resolved.reduce((sum, r) => sum + (r.default ?? 0), 0);
  const unknown = resolved.filter((r) => r.default === undefined).length;
  const share = unknown ? Math.max(0, 100 - known) / unknown : 0;
  return fitLayout(resolved.map((r) => r.default ?? share), resolved);
}

/** The range the panel before a handle can take, given both panels' limits. */
export function pairRange(sizes: readonly number[], a: number, b: number, resolved: readonly ResolvedConstraints[]) {
  const total = sizes[a] + sizes[b];
  const ra = resolved[a];
  const rb = resolved[b];
  const lo = Math.max(ra.min, total - rb.max);
  const hi = Math.min(ra.max, total - rb.min);
  return { total, lo, hi: Math.max(lo, hi) };
}

export type MoveMode = "drag" | "exact";

/**
 * Move the handle between panels `a` and `b` so `a` becomes `targetA`; the
 * two panels trade size and the others stay put. `drag` snaps a collapsible
 * panel shut once it's dragged past halfway between its collapsed size and
 * its minimum; `exact` only collapses a panel asked for its collapsed size.
 */
export function movePair(
  sizes: readonly number[],
  a: number,
  b: number,
  targetA: number,
  resolved: readonly ResolvedConstraints[],
  mode: MoveMode = "drag",
): number[] {
  const out = [...sizes];
  const ra = resolved[a];
  const rb = resolved[b];
  if (!ra || !rb) return out;
  const { total, lo, hi } = pairRange(sizes, a, b, resolved);
  let next: number;
  if (ra.collapsible && targetA < lo && total - ra.collapsed <= rb.max + EPSILON &&
      (mode === "drag" ? targetA < (ra.collapsed + lo) / 2 : Math.abs(targetA - ra.collapsed) < EPSILON)) {
    next = ra.collapsed;
  } else if (rb.collapsible && targetA > hi && total - rb.collapsed <= ra.max + EPSILON &&
      (mode === "drag" ? total - targetA < (rb.collapsed + (total - hi)) / 2 : Math.abs(total - targetA - rb.collapsed) < EPSILON)) {
    next = total - rb.collapsed;
  } else {
    next = clamp(targetA, lo, hi);
  }
  out[a] = next;
  out[b] = total - next;
  return out;
}

