import type React from "react";
import { kebab } from "../../../theme/theme-css-vars";
import type { ChartSlot } from "../chart/chart-shared";
import type { GraphHiddenKinds, GraphNodeShape } from "./network-graph-layout";

/**
 * A colour for a node or link: a status tone, or the key of a colour the
 * theme added (`addedColorPrimitives`), such as `"violet"`.
 */
export type NetworkGraphTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | (string & {});

/** The outline a node is drawn with. */
export type NetworkGraphNodeShape = GraphNodeShape;

/** How a node or link is drawn: `dashed` is for the de-emphasised ones. */
export type NetworkGraphVariant = "solid" | "dashed";

/**
 * Motion along a link, to show that something moves along it (money,
 * traffic, goods) and which way.
 *
 * - `flow`: the line marches from source to target.
 * - `particles`: dots travel from source to target.
 * - `pulse`: the line brightens and fades, for a link that is active now.
 * - `none`: still. The default.
 *
 * Motion stops when the reader's device or the app asks for reduced motion,
 * so never let it carry meaning alone: say it in the label too.
 */
export type NetworkGraphLinkAnimation = "none" | "flow" | "particles" | "pulse";

/** One thing in the graph. */
export interface NetworkGraphNode {
  /** Unique among the nodes. Links refer to it, and the node keeps its place while this stays the same. */
  id: string;
  /** The node's name. Long labels are cut short in the drawing; the full text is in the tooltip and the accessible name. */
  label: string;
  /** Which entry of `nodeKinds` describes this node: its legend label, colour and shape. */
  kind: string;
  /** A colour for this node alone, in place of its kind's. Use it for a status, not for decoration. */
  tone?: NetworkGraphTone;
  /**
   * `dashed` draws the node as a muted, dashed outline: something that is
   * de-emphasised or no longer current. Say what it means in `description`.
   * Defaults to `solid`.
   */
  variant?: NetworkGraphVariant;
  /** A few words added to the tooltip, the accessible name and the table, such as what a dashed outline or a tone means ("Closed"). */
  description?: string;
  /**
   * A small picture drawn inside the node, such as a library icon
   * (`<UserIcon />`). It takes the place of its kind's `icon`. Keep it
   * decorative: the kind and label still say what the node is.
   */
  icon?: React.ReactNode;
  /**
   * The URL of an image drawn in a circle in place of the shape, such as a
   * person's photo or a chapter's logo. The node's colour rings it.
   */
  image?: string;
  /**
   * How large the node is drawn, as a multiple of the usual size: 2 is twice
   * as wide. Use it for a measure such as tear volume or headcount, and say what
   * it means near the graph. Clamped to 0.5–3. Defaults to 1.
   */
  size?: number;
}

/** One relationship, drawn as an arrow from `source` to `target`. */
export interface NetworkGraphLink {
  /** The `id` of the node the arrow leaves. */
  source: string;
  /** The `id` of the node the arrow points at. */
  target: string;
  /** Words shown on the link while it, or a node at either end, is hovered, focused or selected. Defaults to its kind's label. */
  label?: string;
  /** Which entry of `linkKinds` describes this link: its legend label, colour and line. */
  kind?: string;
  /** `dashed` for a weaker or indirect relationship. Defaults to its kind's variant, then `solid`. */
  variant?: NetworkGraphVariant;
  /**
   * The line's width in pixels, whatever the zoom, for a measure such as an
   * amount or a volume. Clamped to 0.5–12. Defaults to its kind's, then 1.5.
   */
  thickness?: number;
  /** Motion along the link. Defaults to its kind's, then `none`. */
  animation?: NetworkGraphLinkAnimation;
  /** How long one cycle of the animation takes, in milliseconds: lower is faster. Defaults to its kind's, then 1600. */
  animationDuration?: number;
}

/** What one kind of node is called and how it is drawn. */
export interface NetworkGraphNodeKind {
  /** The kind's name in the legend, tooltips and the table. */
  label: string;
  /** A status tone or a colour the theme added. Leave it and `slot` out to take the next data series colour. */
  tone?: NetworkGraphTone;
  /** A slot (1–8) in the data series palette, to match a series charted elsewhere. */
  slot?: ChartSlot;
  /** The node's outline, so kinds differ by more than colour. Defaults to `circle`. */
  shape?: NetworkGraphNodeShape;
  /**
   * A library icon drawn on every node of this kind and on its legend key,
   * such as `<UserIcon />`. It names the kind at a glance, so kinds can share
   * one shape and still differ by more than colour. A node's own `icon` wins.
   */
  icon?: React.ReactNode;
}

/** What one kind of link is called and how it is drawn. */
export interface NetworkGraphLinkKind {
  /** The kind's name in the legend and the table, and the label of links that have none. */
  label: string;
  /** A status tone or a colour the theme added. Leave it and `slot` out for a plain link. */
  tone?: NetworkGraphTone;
  /** A slot (1–8) in the data series palette. */
  slot?: ChartSlot;
  /** The line for links of this kind, unless a link sets its own. Defaults to `solid`. */
  variant?: NetworkGraphVariant;
  /** The line's width in pixels for links of this kind, unless a link sets its own. Defaults to 1.5. */
  thickness?: number;
  /** Motion along links of this kind, unless a link sets its own. Defaults to `none`. */
  animation?: NetworkGraphLinkAnimation;
  /** How long one cycle of the animation takes, in milliseconds. Defaults to 1600. */
  animationDuration?: number;
}

/** The node kinds and link kinds that are not drawn. */
export type NetworkGraphHiddenKinds = GraphHiddenKinds;

export type NetworkGraphNodeKinds = Record<string, NetworkGraphNodeKind>;
export type NetworkGraphLinkKinds = Record<string, NetworkGraphLinkKind>;

const KEY = /^[A-Za-z][A-Za-z0-9_-]*$/;
const MAX_SLOT = 8;

/** The CSS colour of a tone's solid fill, or `undefined` when the tone is not a usable key. */
const toneColor = (tone: string | undefined) =>
  tone && KEY.test(tone) ? `var(--squonk-colors-tone-${kebab(tone)}-solid)` : undefined;

const slotColor = (slot: number | undefined) =>
  slot && Number.isInteger(slot) && slot >= 1 && slot <= MAX_SLOT ? `var(--squonk-roles-color-data-series${slot})` : undefined;

const NEUTRAL = "var(--squonk-colors-tone-neutral-solid)";

export interface ResolvedNodeKind {
  key: string;
  label: string;
  shape: NetworkGraphNodeShape;
  /** A CSS colour: a tone's or a data series' token. */
  color: string;
  icon?: React.ReactNode;
}

export interface ResolvedLinkKind {
  key: string;
  label: string;
  variant: NetworkGraphVariant;
  /** A CSS colour, or `undefined` for the plain link colour. */
  color: string | undefined;
  thickness: number | undefined;
  animation: NetworkGraphLinkAnimation;
  animationDuration: number | undefined;
}

/**
 * Each node kind with its colour and shape settled. A kind with neither a
 * tone nor a slot takes the data series slot of its position among the
 * described kinds (the first eight; later ones are neutral). A kind that
 * `nodeKinds` does not describe is a neutral circle named by its key.
 */
export function resolveNodeKind(kinds: NetworkGraphNodeKinds | undefined, key: string): ResolvedNodeKind {
  const kind = kinds?.[key];
  if (!kind) return { key, label: key, shape: "circle", color: NEUTRAL, icon: undefined };
  const position = Object.keys(kinds).indexOf(key) + 1;
  return {
    key,
    label: kind.label,
    shape: kind.shape ?? "circle",
    icon: kind.icon,
    color: toneColor(kind.tone) ?? slotColor(kind.slot) ?? slotColor(position) ?? NEUTRAL,
  };
}

/** A node's own colour: its `tone` when it has one, otherwise its kind's. */
export const nodeColor = (tone: string | undefined, kind: ResolvedNodeKind) => toneColor(tone) ?? kind.color;

/** Each link kind with its colour and line settled. A link with no kind, or an undescribed one, is a plain solid link. */
export function resolveLinkKind(kinds: NetworkGraphLinkKinds | undefined, key: string | undefined): ResolvedLinkKind {
  const kind = key === undefined ? undefined : kinds?.[key];
  if (!kind) {
    return {
      key: key ?? "",
      label: key ?? "",
      variant: "solid",
      color: undefined,
      thickness: undefined,
      animation: "none",
      animationDuration: undefined,
    };
  }
  return {
    key: key!,
    label: kind.label,
    variant: kind.variant ?? "solid",
    color: toneColor(kind.tone) ?? slotColor(kind.slot),
    thickness: kind.thickness,
    animation: kind.animation ?? "none",
    animationDuration: kind.animationDuration,
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A link's line width in pixels: its own, then its kind's, clamped to 0.5–12, or `undefined` for the usual 1.5. */
export function linkThickness(own: number | undefined, kind: ResolvedLinkKind): number | undefined {
  const value = own ?? kind.thickness;
  return value !== undefined && Number.isFinite(value) ? clamp(value, 0.5, 12) : undefined;
}

/** A link's animation cycle in milliseconds: its own, then its kind's, at least 200, or 1600. */
export function linkAnimationDuration(own: number | undefined, kind: ResolvedLinkKind): number {
  const value = own ?? kind.animationDuration;
  return value !== undefined && Number.isFinite(value) ? Math.max(200, value) : 1600;
}

/**
 * The kinds a legend lists, in the order they are described, followed by
 * any kinds found in the data that are not described. When `items` is
 * given, only kinds that occur in it are listed, each with its count.
 */
export function legendKinds(
  described: Record<string, unknown> | undefined,
  items: readonly { kind?: string }[] | undefined,
): { key: string; count: number | undefined }[] {
  const keys = Object.keys(described ?? {});
  if (!items) return keys.map((key) => ({ key, count: undefined }));
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.kind !== undefined) counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
  }
  return [...keys.filter((key) => counts.has(key)), ...[...counts.keys()].filter((key) => !keys.includes(key))].map(
    (key) => ({ key, count: counts.get(key) }),
  );
}

/** `hidden` with one kind switched between hidden and shown. */
export function toggleHiddenKind(
  hidden: NetworkGraphHiddenKinds | undefined,
  group: "nodes" | "links",
  key: string,
): NetworkGraphHiddenKinds {
  const current = hidden?.[group] ?? [];
  const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
  return { nodes: [...(hidden?.nodes ?? [])], links: [...(hidden?.links ?? [])], [group]: next };
}
