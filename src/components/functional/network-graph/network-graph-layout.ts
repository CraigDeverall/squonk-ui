import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

/**
 * The graph logic behind NetworkGraph, kept free of React and the DOM so it
 * can be unit-tested: where nodes sit, who neighbours whom, what a hidden
 * kind removes, where an arrow key goes and how a link is drawn.
 */

/** The least a node needs for layout and navigation. */
export interface GraphNodeLike {
  id: string;
  kind?: string;
  /** How large the node is drawn, as a multiple of the usual: larger nodes keep more room clear. */
  size?: number;
}

/** The least a link needs for layout and navigation. */
export interface GraphLinkLike {
  source: string;
  target: string;
  kind?: string;
}

export interface GraphPoint {
  x: number;
  y: number;
}

/** Where each node sits, by id, in the graph's own coordinates (0,0 is its middle). */
export type GraphPositions = Record<string, GraphPoint>;

/** Kinds that are not drawn. */
export interface GraphHiddenKinds {
  nodes?: readonly string[];
  links?: readonly string[];
}

/** Fixed geometry, in graph units (CSS pixels at zoom 1). */
export const NODE_RADIUS = 12;
/** The resting length of a link: room for a link label between two node labels. */
export const LINK_DISTANCE = 130;
/** Space each node keeps clear around its edge, so labels under nodes rarely collide. */
const COLLIDE_CLEARANCE = 36;
const CHARGE = -700;
const CHARGE_REACH = 900;
const PULL_TO_MIDDLE = 0.04;
/** Ticks for a layout from scratch: d3-force's default cooling runs for 300. */
const FULL_TICKS = 300;
/** Ticks to settle a few new nodes among pinned ones. */
const JOIN_TICKS = 120;
/** Ticks to settle the whole graph again from where it was, when nodes may move. */
const RESETTLE_TICKS = 200;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const round = (value: number) => Math.round(value * 100) / 100;

/** The links whose two ends both exist and differ. */
function soundLinks<L extends GraphLinkLike>(nodes: readonly GraphNodeLike[], links: readonly L[]): L[] {
  const ids = new Set(nodes.map((node) => node.id));
  return links.filter((link) => link.source !== link.target && ids.has(link.source) && ids.has(link.target));
}

/** Each node's neighbours: the nodes one link away, in either direction. */
export function buildNeighbours(
  nodes: readonly GraphNodeLike[],
  links: readonly GraphLinkLike[],
): Map<string, Set<string>> {
  const neighbours = new Map<string, Set<string>>(nodes.map((node) => [node.id, new Set<string>()]));
  for (const link of soundLinks(nodes, links)) {
    neighbours.get(link.source)!.add(link.target);
    neighbours.get(link.target)!.add(link.source);
  }
  return neighbours;
}

/**
 * The part of the graph on show: nodes whose kind is not hidden, and links
 * whose kind is not hidden and whose two ends are both on show.
 */
export function visibleGraph<N extends GraphNodeLike, L extends GraphLinkLike>(
  nodes: readonly N[],
  links: readonly L[],
  hidden: GraphHiddenKinds = {},
): { nodes: N[]; links: L[] } {
  const hiddenNodes = new Set(hidden.nodes ?? []);
  const hiddenLinks = new Set(hidden.links ?? []);
  const shown = nodes.filter((node) => node.kind === undefined || !hiddenNodes.has(node.kind));
  return {
    nodes: shown,
    links: soundLinks(shown, links).filter((link) => link.kind === undefined || !hiddenLinks.has(link.kind)),
  };
}

/** A string that changes only when the set of nodes or the set of links does. */
export function graphSignature(nodes: readonly GraphNodeLike[], links: readonly GraphLinkLike[]): string {
  return `${nodes.map((node) => node.id).join("\u0001")}\u0002${links
    .map((link) => `${link.source}\u0003${link.target}`)
    .join("\u0001")}`;
}

/** A node's drawn size as a multiple of the usual, clamped to 0.5–3. */
export const sizeScale = (size: number | undefined) =>
  size !== undefined && Number.isFinite(size) ? Math.min(3, Math.max(0.5, size)) : 1;

/** The radius a node is drawn at, in graph units. */
export const nodeRadius = (node: GraphNodeLike | undefined) => NODE_RADIUS * sizeScale(node?.size);

export interface SimNode extends SimulationNodeDatum {
  id: string;
  radius: number;
}

function withForces(simulation: Simulation<SimNode, undefined>, links: readonly GraphLinkLike[]) {
  const simLinks: SimulationLinkDatum<SimNode>[] = links.map((link) => ({ source: link.source, target: link.target }));
  return simulation
    .force(
      "link",
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
        .id((node) => node.id)
        .distance((link) => {
          const ends = link as unknown as { source: SimNode; target: SimNode };
          return LINK_DISTANCE + ends.source.radius + ends.target.radius - 2 * NODE_RADIUS;
        }),
    )
    .force("charge", forceManyBody<SimNode>().strength(CHARGE).distanceMax(CHARGE_REACH))
    .force("collide", forceCollide<SimNode>((node) => node.radius + COLLIDE_CLEARANCE))
    .force("x", forceX<SimNode>(0).strength(PULL_TO_MIDDLE))
    .force("y", forceY<SimNode>(0).strength(PULL_TO_MIDDLE));
}

function settle(simNodes: SimNode[], links: readonly GraphLinkLike[], ticks: number, alpha: number) {
  withForces(forceSimulation(simNodes).stop().alpha(alpha), links).tick(ticks);
}

/**
 * A running force simulation for a graph the reader can drag: it starts
 * at rest from `positions` (so nothing jumps), and moves only when it is
 * reheated, as when a node is dragged. Nodes in `pinned` stay where they
 * are. The caller starts it, reads node positions on each tick, and stops
 * it when done.
 */
export function createLiveSimulation(
  nodes: readonly GraphNodeLike[],
  links: readonly GraphLinkLike[],
  positions: GraphPositions,
  pinned: ReadonlySet<string> = new Set(),
): Simulation<SimNode, undefined> {
  const simNodes: SimNode[] = nodes.map((node) => {
    const point = positions[node.id] ?? { x: 0, y: 0 };
    const fixed = pinned.has(node.id);
    return { id: node.id, radius: nodeRadius(node), x: point.x, y: point.y, fx: fixed ? point.x : null, fy: fixed ? point.y : null };
  });
  return withForces(forceSimulation(simNodes).stop().alpha(0), soundLinks(nodes, links));
}

/** The positions of a simulation's nodes, rounded like a computed layout. */
export function simulationPositions(simulation: Simulation<SimNode, undefined>): GraphPositions {
  return Object.fromEntries(simulation.nodes().map((node) => [node.id, { x: round(node.x ?? 0), y: round(node.y ?? 0) }]));
}

export interface LayoutGraphInput {
  nodes: readonly GraphNodeLike[];
  links: readonly GraphLinkLike[];
  /** The positions from the last layout. Nodes found here do not move, unless `loose` is set. */
  previous?: GraphPositions;
  /**
   * Let the nodes found in `previous` move too. Each starts where it was and
   * the whole graph settles again, so the nodes left after others go draw
   * together instead of keeping the gaps.
   */
  loose?: boolean;
}

/**
 * A force-directed layout, computed to rest.
 *
 * With no `previous` positions every node is placed from scratch. With
 * them, each node that already has a position keeps it exactly, and only
 * the new nodes are placed: each starts beside the neighbours it links to
 * (or at the rim when it links to nothing placed) and settles among the
 * pinned nodes. Nodes that have gone are dropped. The result depends only
 * on the input, so the same graph always lays out the same way.
 */
export function layoutGraph({ nodes, links, previous, loose = false }: LayoutGraphInput): GraphPositions {
  const sound = soundLinks(nodes, links);
  const kept = previous ? nodes.filter((node) => previous[node.id]) : [];

  if (!previous || kept.length === 0) {
    const simNodes: SimNode[] = nodes.map((node) => ({ id: node.id, radius: nodeRadius(node) }));
    settle(simNodes, sound, FULL_TICKS, 1);
    return Object.fromEntries(simNodes.map((node) => [node.id, { x: round(node.x ?? 0), y: round(node.y ?? 0) }]));
  }

  const placed = new Map<string, GraphPoint>(kept.map((node) => [node.id, previous[node.id]]));
  const joining = nodes.filter((node) => !placed.has(node.id));
  if (joining.length === 0 && !loose) return Object.fromEntries(placed);

  // The middle and reach of what is already placed.
  const middle = { x: 0, y: 0 };
  for (const point of placed.values()) {
    middle.x += point.x / placed.size;
    middle.y += point.y / placed.size;
  }
  let reach = 0;
  for (const point of placed.values()) reach = Math.max(reach, Math.hypot(point.x - middle.x, point.y - middle.y));

  // Seed each new node beside its placed neighbours, working outwards so a
  // chain of new nodes hangs off the node it joins.
  const neighbours = buildNeighbours(nodes, sound);
  const seeds = new Map<string, GraphPoint>();
  const waiting = [...joining];
  let turn = 0;
  while (waiting.length) {
    let index = waiting.findIndex((node) =>
      [...neighbours.get(node.id)!].some((id) => placed.has(id) || seeds.has(id)),
    );
    const linked = index >= 0;
    if (!linked) index = 0;
    const [node] = waiting.splice(index, 1);
    if (linked) {
      const anchors = [...neighbours.get(node.id)!]
        .map((id) => placed.get(id) ?? seeds.get(id))
        .filter((point): point is GraphPoint => Boolean(point));
      const anchor = {
        x: anchors.reduce((sum, point) => sum + point.x, 0) / anchors.length,
        y: anchors.reduce((sum, point) => sum + point.y, 0) / anchors.length,
      };
      // Away from the middle, fanned so several joining one node spread out.
      const outward = Math.atan2(anchor.y - middle.y, anchor.x - middle.x) || 0;
      const angle = outward + (((turn % 5) - 2) * Math.PI) / 7;
      seeds.set(node.id, {
        x: anchor.x + Math.cos(angle) * LINK_DISTANCE * 0.7,
        y: anchor.y + Math.sin(angle) * LINK_DISTANCE * 0.7,
      });
    } else {
      const angle = turn * GOLDEN_ANGLE;
      seeds.set(node.id, {
        x: middle.x + Math.cos(angle) * (reach + LINK_DISTANCE),
        y: middle.y + Math.sin(angle) * (reach + LINK_DISTANCE),
      });
    }
    turn += 1;
  }

  const simNodes: SimNode[] = nodes.map((node) => {
    const pinned = placed.get(node.id);
    const radius = nodeRadius(node);
    if (pinned && loose) return { id: node.id, radius, x: pinned.x, y: pinned.y };
    if (pinned) return { id: node.id, radius, x: pinned.x, y: pinned.y, fx: pinned.x, fy: pinned.y };
    const seed = seeds.get(node.id)!;
    return { id: node.id, radius, x: seed.x, y: seed.y };
  });
  settle(simNodes, sound, loose ? RESETTLE_TICKS : JOIN_TICKS, 0.5);
  return Object.fromEntries(
    simNodes.map((node) => [
      node.id,
      (!loose && placed.get(node.id)) || { x: round(node.x ?? 0), y: round(node.y ?? 0) },
    ]),
  );
}

export type GraphNavigationKey =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "Home"
  | "End"
  | "PageUp"
  | "PageDown";

const DIRECTIONS: Partial<Record<GraphNavigationKey, GraphPoint>> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

/**
 * The node a navigation key moves focus to, or `null` to stay put.
 *
 * - An arrow key goes to the connected node that lies most nearly in that
 *   direction (the nearer one when two lie the same way). Nodes behind the
 *   arrow are never chosen.
 * - Page Down and Page Up go to the next and previous node in the order
 *   given, without wrapping, so nodes with no links can be reached.
 * - Home and End go to the first and last node.
 */
export function nextFocusId(
  key: GraphNavigationKey,
  currentId: string,
  nodes: readonly GraphNodeLike[],
  links: readonly GraphLinkLike[],
  positions: GraphPositions,
): string | null {
  const index = nodes.findIndex((node) => node.id === currentId);
  if (index < 0) return nodes[0]?.id ?? null;
  const other = (id: string | undefined) => (id !== undefined && id !== currentId ? id : null);
  if (key === "Home") return other(nodes[0]?.id);
  if (key === "End") return other(nodes[nodes.length - 1]?.id);
  if (key === "PageDown") return other(nodes[index + 1]?.id);
  if (key === "PageUp") return other(nodes[index - 1]?.id);

  const direction = DIRECTIONS[key];
  const from = positions[currentId];
  if (!direction || !from) return null;
  let best: { id: string; angle: number; distance: number } | null = null;
  for (const id of buildNeighbours(nodes, links).get(currentId) ?? []) {
    const to = positions[id];
    if (!to) continue;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const along = dx * direction.x + dy * direction.y;
    if (distance === 0 || along <= 0) continue;
    const angle = Math.acos(Math.min(1, along / distance));
    if (!best || angle < best.angle - 1e-6 || (Math.abs(angle - best.angle) <= 1e-6 && distance < best.distance)) {
      best = { id, angle, distance };
    }
  }
  return best?.id ?? null;
}

/** A label cut to `max` characters, ending in an ellipsis when it was cut. */
export function truncateLabel(label: string, max = 24): string {
  const text = label.trim();
  const characters = Array.from(text);
  if (characters.length <= max) return text;
  return `${characters.slice(0, max - 1).join("").trimEnd()}…`;
}

/** Pan and zoom: a point at (x, y) is drawn at the middle of the box plus (tx, ty) plus k × (x, y). */
export interface GraphView {
  k: number;
  x: number;
  y: number;
}

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 4;
/** Room kept around the nodes for the labels under and beside them. */
const FIT_PADDING = { x: 72, y: 44 };

export const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));

/**
 * The view that shows every given position inside a box of the given size.
 * It never zooms in past `maxZoom` (1 by default), so a small graph keeps
 * its natural size unless the caller asks for more.
 */
export function fitView(points: readonly GraphPoint[], width: number, height: number, maxZoom = 1): GraphView {
  if (points.length === 0 || width <= 0 || height <= 0) return { k: 1, x: 0, y: 0 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  const spanX = maxX - minX + FIT_PADDING.x * 2;
  const spanY = maxY - minY + FIT_PADDING.y * 2;
  const k = clampZoom(Math.min(maxZoom, width / spanX, height / spanY));
  return { k, x: round(-k * ((minX + maxX) / 2)), y: round(-k * ((minY + maxY) / 2)) };
}

/** The view after zooming by `factor`, keeping the point at (px, py) from the middle of the box where it is. */
export function zoomView(view: GraphView, factor: number, px = 0, py = 0): GraphView {
  const k = clampZoom(view.k * factor);
  const ratio = k / view.k;
  return { k, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio };
}

export type GraphNodeShape = "circle" | "square" | "diamond" | "triangle" | "hexagon";

/** The outline of a node shape centred on 0,0, as SVG path data. Each shape has about the same visual weight. */
export function shapePath(shape: GraphNodeShape, radius: number): string {
  const r = radius;
  const polygon = (sides: number, size: number, turn: number) =>
    `M${Array.from({ length: sides }, (_, i) => {
      const angle = turn + (i * 2 * Math.PI) / sides;
      return `${round(Math.cos(angle) * size)},${round(Math.sin(angle) * size)}`;
    }).join("L")}Z`;
  switch (shape) {
    case "square": {
      const half = round(r * 0.88);
      return `M${-half},${-half}H${half}V${half}H${-half}Z`;
    }
    case "diamond":
      return polygon(4, r * 1.2, -Math.PI / 2);
    case "triangle":
      return polygon(3, r * 1.3, -Math.PI / 2);
    case "hexagon":
      return polygon(6, r * 1.08, 0);
    default:
      return `M${-r},0A${r},${r} 0 1,0 ${r},0A${r},${r} 0 1,0 ${-r},0Z`;
  }
}

/** Gap between a node's edge and the end of a link, and the arrowhead's size. */
const LINK_GAP = 5;
const ARROW_LENGTH = 9;
const ARROW_HALF_WIDTH = 4.5;
/** How far apart two links between the same pair of nodes bow. */
export const PARALLEL_LINK_SPREAD = 28;

export interface LinkGeometry {
  /** The link's line, from the source's edge to the base of the arrowhead. */
  path: string;
  /** The arrowhead, a closed triangle whose tip touches the target's edge. */
  arrow: string;
  /** The middle of the line, where the label sits. */
  labelX: number;
  labelY: number;
}

export interface LinkGeometryOptions {
  /** The target node's radius, when it differs from the source's. */
  targetRadius?: number;
  /** How much larger than usual to draw the arrowhead, for a thick line. Defaults to 1. */
  arrowScale?: number;
}

/**
 * How to draw a link from `source` to `target`. `bow` bends it sideways
 * (to the left of its direction when positive) so links between the same
 * two nodes do not lie on top of each other. `radius` is the source node's.
 */
export function linkGeometry(
  source: GraphPoint,
  target: GraphPoint,
  bow = 0,
  radius = NODE_RADIUS,
  { targetRadius = radius, arrowScale = 1 }: LinkGeometryOptions = {},
): LinkGeometry {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  // The control point of the curve: the midpoint pushed sideways.
  const cx = (source.x + target.x) / 2 + uy * bow * 2;
  const cy = (source.y + target.y) / 2 - ux * bow * 2;
  const unit = (fromX: number, fromY: number, toX: number, toY: number) => {
    const d = Math.hypot(toX - fromX, toY - fromY) || 1;
    return { x: (toX - fromX) / d, y: (toY - fromY) / d };
  };
  const leave = unit(source.x, source.y, cx, cy);
  const arrive = unit(cx, cy, target.x, target.y);
  const startX = source.x + leave.x * (radius + LINK_GAP);
  const startY = source.y + leave.y * (radius + LINK_GAP);
  const tipX = target.x - arrive.x * (targetRadius + LINK_GAP);
  const tipY = target.y - arrive.y * (targetRadius + LINK_GAP);
  const arrowLength = ARROW_LENGTH * arrowScale;
  const halfWidth = ARROW_HALF_WIDTH * arrowScale;
  const baseX = tipX - arrive.x * arrowLength;
  const baseY = tipY - arrive.y * arrowLength;
  const p = (value: number) => round(value);
  return {
    path: bow
      ? `M${p(startX)},${p(startY)}Q${p(cx)},${p(cy)} ${p(baseX)},${p(baseY)}`
      : `M${p(startX)},${p(startY)}L${p(baseX)},${p(baseY)}`,
    arrow: `M${p(tipX)},${p(tipY)}L${p(baseX - arrive.y * halfWidth)},${p(baseY + arrive.x * halfWidth)}L${p(
      baseX + arrive.y * halfWidth,
    )},${p(baseY - arrive.x * halfWidth)}Z`,
    labelX: p((source.x + 2 * cx + target.x) / 4),
    labelY: p((source.y + 2 * cy + target.y) / 4),
  };
}

/**
 * The sideways bow of each link, in order, so that links sharing the same
 * two nodes (in either direction) fan out instead of overlapping. A link
 * that is alone between its nodes is straight (0).
 */
export function linkBows(links: readonly GraphLinkLike[]): number[] {
  const groups = new Map<string, number[]>();
  links.forEach((link, i) => {
    const key = link.source < link.target ? `${link.source}\u0001${link.target}` : `${link.target}\u0001${link.source}`;
    groups.set(key, [...(groups.get(key) ?? []), i]);
  });
  const bows = new Array<number>(links.length).fill(0);
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    members.forEach((i, place) => {
      const offset = (place - (members.length - 1) / 2) * PARALLEL_LINK_SPREAD;
      // Bow is relative to the link's own direction; flip it for links that
      // run against the pair's canonical direction so they part, not cross.
      bows[i] = links[i].source < links[i].target ? offset : -offset;
    });
  }
  return bows;
}

/**
 * A part of the graph to light up around one node.
 *
 * - `neighbours`: the node and every node one link away, either way.
 * - `outgoing`: the node and the nodes its arrows point at.
 * - `incoming`: the node and the nodes whose arrows point at it.
 * - `downstream`: everything reachable by following arrows from the node.
 * - `upstream`: everything that reaches the node by following arrows.
 */
export type GraphStructure = "neighbours" | "outgoing" | "incoming" | "downstream" | "upstream";

/** The nodes in a lit-up part of the graph, and the links in it, by their index in the links given. */
export interface GraphHighlight {
  nodes: Set<string>;
  links: Set<number>;
}

/** The links whose two ends are both in `ids`, by index. */
export function linksAmong(ids: ReadonlySet<string>, links: readonly GraphLinkLike[]): Set<number> {
  const among = new Set<number>();
  links.forEach((link, index) => {
    if (ids.has(link.source) && ids.has(link.target)) among.add(index);
  });
  return among;
}

/** The part of the graph `structure` names around the node `id`. */
export function highlightStructure(
  structure: GraphStructure,
  id: string,
  links: readonly GraphLinkLike[],
): GraphHighlight {
  const nodes = new Set([id]);
  const lit = new Set<number>();
  if (structure === "downstream" || structure === "upstream") {
    const forward = structure === "downstream";
    const queue = [id];
    while (queue.length) {
      const from = queue.shift()!;
      links.forEach((link, index) => {
        const [near, far] = forward ? [link.source, link.target] : [link.target, link.source];
        if (near !== from) return;
        lit.add(index);
        if (!nodes.has(far)) {
          nodes.add(far);
          queue.push(far);
        }
      });
    }
    return { nodes, links: lit };
  }
  links.forEach((link, index) => {
    const out = link.source === id && structure !== "incoming";
    const into = link.target === id && structure !== "outgoing";
    if (!out && !into) return;
    lit.add(index);
    nodes.add(out ? link.target : link.source);
  });
  return { nodes, links: lit };
}
