"use client";

import { clsx } from "clsx";
import type { Simulation } from "d3-force";
import React from "react";
import { createPortal } from "react-dom";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { Motion } from "../../animation/motion/motion";
import { motionTiming } from "../../animation/motion/motion-timing";
import {
  CollapseIcon,
  ExpandIcon,
  FullscreenIcon,
  PinIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "../../functional-primitive/icon/icon";
import { IconButton } from "../icon-button/icon-button";
import {
  linkAnimationDuration,
  linkThickness,
  nodeColor,
  resolveLinkKind,
  resolveNodeKind,
  type NetworkGraphHiddenKinds,
  type NetworkGraphLink,
  type NetworkGraphLinkKinds,
  type NetworkGraphNode,
  type NetworkGraphNodeKinds,
  type NetworkGraphNodeShape,
} from "./network-graph-kinds";
import {
  NODE_RADIUS,
  buildNeighbours,
  createLiveSimulation,
  fitView,
  graphSignature,
  highlightStructure,
  layoutGraph,
  linkBows,
  linkGeometry,
  linksAmong,
  nextFocusId,
  nodeRadius,
  shapePath,
  simulationPositions,
  truncateLabel,
  visibleGraph,
  zoomView,
  type GraphHighlight,
  type GraphNavigationKey,
  type GraphPositions,
  type GraphStructure,
  type GraphView,
  type SimNode,
} from "./network-graph-layout";
import styles from "./network-graph.module.css";

export { NetworkGraphLegend, type NetworkGraphLegendProps } from "./network-graph-legend";
export type {
  NetworkGraphHiddenKinds,
  NetworkGraphLink,
  NetworkGraphLinkAnimation,
  NetworkGraphLinkKind,
  NetworkGraphLinkKinds,
  NetworkGraphNode,
  NetworkGraphNodeKind,
  NetworkGraphNodeKinds,
  NetworkGraphNodeShape,
  NetworkGraphTone,
  NetworkGraphVariant,
} from "./network-graph-kinds";

/** A part of the graph to light up around a node. See `hoverHighlight`. */
export type NetworkGraphStructure = GraphStructure;

/**
 * What to light up while the reader points at a node or moves keyboard focus
 * to it: a named structure, or a function that returns the ids of the nodes
 * to keep lit (the node itself always is). Links between two lit nodes stay
 * lit; everything else is set back.
 */
export type NetworkGraphHighlight =
  | "none"
  | NetworkGraphStructure
  | ((node: NetworkGraphNode, graph: { nodes: readonly NetworkGraphNode[]; links: readonly NetworkGraphLink[] }) => Iterable<string>);

/**
 * How nodes are placed.
 *
 * - `static`: computed once to rest. Nothing moves unless the reader drags it.
 * - `force`: a live simulation. Dragging a node pulls the nodes linked to it,
 *   and the graph settles again when it is let go. Pinned nodes stay put.
 */
export type NetworkGraphLayout = "static" | "force";

/** What `renderNode` is told about the node it draws. */
export interface NetworkGraphNodeState {
  /** The radius to draw within, in graph units: the usual 12 times the node's `size`. The node's centre is 0,0. */
  radius: number;
  /** The node's CSS colour: its `tone`, or its kind's colour. */
  color: string;
  /** The shape its kind gives it. */
  shape: NetworkGraphNodeShape;
  /** Its kind's label. */
  kindLabel: string;
  selected: boolean;
  /** The reader is pointing at it, or has moved keyboard focus to it. */
  hovered: boolean;
  /** Set back, because it is outside the selection or the lit structure. */
  dimmed: boolean;
  pinned: boolean;
}

export interface NetworkGraphProps {
  /**
   * The things in the graph. A node keeps its place for as long as its `id`
   * stays in this list, so add and remove nodes freely as data arrives.
   */
  nodes: readonly NetworkGraphNode[];
  /** The relationships, each drawn as an arrow from `source` to `target`. Links to a missing node are not drawn. */
  links: readonly NetworkGraphLink[];
  /**
   * What the graph shows, as a short phrase ("Suppliers and the contracts
   * between them"). It names the graph and its table for assistive
   * technology and is not shown.
   */
  label: string;
  /** Describes each node kind by key: its legend label, colour and shape. Share it with the legend. */
  nodeKinds?: NetworkGraphNodeKinds;
  /** Describes each link kind by key: its legend label, colour and line. Share it with the legend. */
  linkKinds?: NetworkGraphLinkKinds;
  /** Node kinds and link kinds to leave out of the drawing. Hiding a kind moves nothing else. */
  hiddenKinds?: NetworkGraphHiddenKinds;
  /** The selected node's `id`, or `null` for none, when the parent holds the selection. */
  selectedId?: string | null;
  /** The node selected at first, when the graph holds the selection itself. */
  defaultSelectedId?: string | null;
  /** Called with the node's `id` when the reader selects one, and with `null` when they clear the selection. */
  onSelectionChange?: (selectedId: string | null) => void;
  /** Shown in place of the drawing when `nodes` is empty. Defaults to "No data to show". */
  empty?: React.ReactNode;
  /** Merged onto the root element. Set the graph's height here or on its parent. */
  className?: string;
  /** Merged onto the root element. */
  style?: React.CSSProperties;
  /**
   * Fit the view again whenever the shown nodes change or the box changes
   * size, such as while the reader types a search that narrows the graph.
   * The view moves there smoothly unless motion is reduced. Off by default:
   * the view is fitted once and then left to the reader.
   */
  autoFit?: boolean;
  /**
   * Let the nodes already drawn move when nodes come or go, so what is left
   * after a search, or after hiding a kind, draws together instead of
   * keeping the gaps. The nodes
   * glide to their new places unless motion is reduced. Off by default:
   * a drawn node keeps its place.
   */
  settleOnChange?: boolean;
  /**
   * The furthest a fit may zoom in. Defaults to 1, so a small graph keeps
   * its natural size. Raise it to let a few nodes fill the box.
   */
  maxFitZoom?: number;
  /** Adds a Full screen button. Full screen covers the window, and the browser's full screen when it allows it. */
  allowFullscreen?: boolean;
  /** Shown over the top of the graph in full screen, such as the search and filters the page shows above it. */
  fullscreenToolbar?: React.ReactNode;
  /** Shown on a card at the inline end in full screen, such as the details of the selected node. */
  fullscreenAside?: React.ReactNode;
  /** Called with `true` when the graph enters full screen and `false` when it leaves. */
  onFullscreenChange?: (fullscreen: boolean) => void;
  /**
   * What to light up while the reader points at a node or moves keyboard
   * focus to it, such as `downstream` to show everything a supplier feeds.
   * Defaults to `none`: pointing shows the node's link labels only.
   */
  hoverHighlight?: NetworkGraphHighlight;
  /** How nodes are placed: computed once (`static`, the default) or a live simulation (`force`). */
  layout?: NetworkGraphLayout;
  /**
   * Whether the reader can drag nodes. Defaults to `true` with the `force`
   * layout and `false` otherwise. With the `static` layout a dragged node
   * stays where it is dropped and nothing else moves.
   */
  draggableNodes?: boolean;
  /**
   * The ids of pinned nodes, when the parent holds them. A pinned node shows
   * a pin and stays where it is while the `force` layout moves the rest.
   */
  pinnedIds?: readonly string[];
  /** The nodes pinned at first, when the graph holds the pins itself. */
  defaultPinnedIds?: readonly string[];
  /**
   * Called with every pinned id when the reader pins or unpins a node, by
   * double-clicking it or pressing P while it has focus. Pinning is on with
   * the `force` layout, or when any of the pin props is given.
   */
  onPinnedChange?: (pinnedIds: string[]) => void;
  /**
   * Draws the inside of each node in place of its shape, icon and image, as
   * SVG centred on 0,0. The graph still draws the label, the selection and
   * focus rings, the pin and the hit area. Use `state.radius` to size the
   * drawing and `state.color` to colour it, so kinds and tones still apply.
   */
  renderNode?: (node: NetworkGraphNode, state: NetworkGraphNodeState) => React.ReactNode;
}

/** How much one press of a zoom button changes the scale. */
const ZOOM_STEP = 1.4;
/** A pointer that travels less than this between down and up is a click, not a drag. */
const CLICK_TRAVEL = 4;
/** Two clicks on one node within this many milliseconds are a double-click. */
const DOUBLE_CLICK_MS = 350;
/** How close to the edge a focused node may sit before the view pans to show it. */
const FOCUS_MARGIN = 48;
/** The gap between a node's edge and its label. */
const LABEL_GAP = 16;
/** How hot a dragged node keeps the live layout. */
const DRAG_HEAT = 0.3;
/** Dots travelling along a link with the `particles` animation. */
const PARTICLES = 3;
/** Height kept clear at the bottom when fitting: the zoom buttons and their inset. */
const CONTROLS_STRIP = 48;
const NAVIGATION_KEYS: readonly string[] = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
];

/** The box in full screen: the whole window, over the page. */
const FULLSCREEN_BOX: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  width: "auto",
  height: "auto",
  maxWidth: "none",
  maxHeight: "none",
  margin: 0,
  zIndex: "var(--squonk-roles-layer-fixed)",
};

/** The token for the room kept between the full screen toolbar or aside and the nodes a fit places. */
const OVERLAY_GAP_VAR = "--squonk-components-network-graph-overlay-gap";

/**
 * Whether a move can run frame by frame. A hidden page gets no animation
 * frames, so a move started there would wait until the page shows again.
 */
const canAnimate = () =>
  typeof requestAnimationFrame === "function" && !(typeof document !== "undefined" && document.hidden);

/** Eases in and out, for view moves run from JavaScript. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const viewTransform = (size: { width: number; height: number }, view: GraphView) =>
  `translate(${size.width / 2 + view.x} ${size.height / 2 + view.y}) scale(${view.k})`;

/** How wide an icon is drawn on a node, as a share of the node's radius: 14 on the usual 12. */
const NODE_ICON_SCALE = 14 / NODE_RADIUS;

/** An icon, centred on its node. The icon sizes to the font size and draws in `color`. */
function NodeIcon({ icon, radius = NODE_RADIUS }: { icon: React.ReactNode; radius?: number }) {
  if (!icon) return null;
  const size = radius * NODE_ICON_SCALE;
  return (
    <g
      className={styles.nodeIcon}
      transform={`translate(${-size / 2} ${-size / 2})`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {icon}
    </g>
  );
}

/** The entries of `from` for the ids `to` has. */
function pickPositions(from: GraphPositions, to: GraphPositions): GraphPositions {
  const picked: GraphPositions = {};
  for (const id of Object.keys(to)) if (from[id]) picked[id] = from[id];
  return picked;
}

interface Leaving {
  node: NetworkGraphNode;
  point: { x: number; y: number };
}

interface Gesture {
  pointers: Map<number, { x: number; y: number }>;
  travel: number;
  /** The node the gesture started on, if any. */
  nodeId: string | null;
  /** Whether the gesture is moving that node, not the view. */
  dragging: boolean;
  /** The last click on a node, to tell a double-click. */
  lastClick: { nodeId: string; at: number } | null;
}

/**
 * A node-link graph: things as nodes, the relationships between them as
 * arrows, laid out by force so connected things sit together. The reader
 * can pan, zoom and select a node to see its neighbourhood. It fills the
 * box its parent gives it. Use it to show how things connect; to look
 * things up or compare them, use a Table.
 */
export function NetworkGraph({
  nodes,
  links,
  label,
  nodeKinds,
  linkKinds,
  hiddenKinds,
  selectedId,
  defaultSelectedId = null,
  onSelectionChange,
  empty,
  className,
  style,
  autoFit = false,
  settleOnChange = false,
  maxFitZoom = 1,
  allowFullscreen = false,
  fullscreenToolbar,
  fullscreenAside,
  onFullscreenChange,
  hoverHighlight = "none",
  layout: layoutMode = "static",
  draggableNodes,
  pinnedIds,
  defaultPinnedIds,
  onPinnedChange,
  renderNode,
}: NetworkGraphProps) {
  const themeVars = useThemeCssVars();
  const portalVars = useThemeCssVars({ portal: true });
  const rootRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const sceneRef = React.useRef<SVGGElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const asideRef = React.useRef<HTMLDivElement>(null);
  const nodeElements = React.useRef(new Map<string, SVGGElement>());
  const gesture = React.useRef<Gesture>({ pointers: new Map(), travel: 0, nodeId: null, dragging: false, lastClick: null });
  const seenIds = React.useRef<Set<string> | null>(null);
  const clipId = `${React.useId().replace(/[^A-Za-z0-9_-]/g, "")}-network-graph-image`;
  const simulation = React.useRef<Simulation<SimNode, undefined> | null>(null);
  /** Set when positions change because a node was dragged or the live layout moved it, so they do not glide. */
  const directMove = React.useRef(false);

  // What shows: the nodes and links whose kinds are not hidden.
  const shown = visibleGraph(nodes, links, hiddenKinds);

  // Layout: computed to rest over what shows, and only extended when nodes
  // come or go, so nothing that is already drawn moves. Hiding a kind counts
  // as its nodes going, so with `settleOnChange` the rest draw together. A
  // node that leaves and comes back, as a search narrows and widens, returns
  // to the place it had.
  const signature = graphSignature(shown.nodes, shown.links);
  const [layout, setLayout] = React.useState(() => {
    const placed = layoutGraph({ nodes: shown.nodes, links: shown.links });
    return { signature, positions: placed, remembered: placed };
  });
  let positions: GraphPositions = layout.positions;
  if (layout.signature !== signature) {
    positions = layoutGraph({
      nodes: shown.nodes,
      links: shown.links,
      previous: { ...layout.remembered, ...layout.positions },
      loose: settleOnChange,
    });
    setLayout({ signature, positions, remembered: { ...layout.remembered, ...positions } });
  }
  // The latest positions, for the effects below. Effects run in order, so
  // this one keeps it current before they read it.
  const positionsRef = React.useRef(positions);
  React.useEffect(() => {
    positionsRef.current = positions;
  });

  // Where each node is drawn. With `settleOnChange` a node that moved glides
  // from where it was drawn to its new place; a new node starts at its place.
  const [glide, setGlide] = React.useState<GraphPositions | null>(null);
  const glideRef = React.useRef<{ frame: number; at: GraphPositions } | null>(null);
  const drawnAt: GraphPositions = glide ? { ...positions, ...pickPositions(glide, positions) } : positions;
  const lastDrawn = React.useRef<GraphPositions>(positions);
  React.useLayoutEffect(() => {
    const from = glideRef.current?.at ?? lastDrawn.current;
    if (glideRef.current) cancelAnimationFrame(glideRef.current.frame);
    glideRef.current = null;
    lastDrawn.current = positions;
    // A dragged node follows the pointer, and the live layout moves on its own clock.
    const direct = directMove.current;
    directMove.current = false;
    if (!settleOnChange || direct) {
      setGlide(null);
      return;
    }
    const timing = motionTiming(svgRef.current, "--squonk-roles-motion-layout");
    const moved = Object.keys(positions).some(
      (id) => from[id] && (from[id].x !== positions[id].x || from[id].y !== positions[id].y),
    );
    if (!moved || timing.ms <= 0 || timing.reduced || !canAnimate()) {
      setGlide(null);
      return;
    }
    let began: number | null = null;
    const step = (now: number) => {
      began ??= now;
      const t = Math.min(1, (now - began) / timing.ms);
      if (t >= 1) {
        glideRef.current = null;
        setGlide(null);
        return;
      }
      const e = easeInOut(t);
      const at: GraphPositions = {};
      for (const [id, to] of Object.entries(positions)) {
        const start = from[id] ?? to;
        at[id] = { x: start.x + (to.x - start.x) * e, y: start.y + (to.y - start.y) * e };
      }
      lastDrawn.current = at;
      setGlide(at);
      glideRef.current = { frame: requestAnimationFrame(step), at };
    };
    setGlide(from);
    glideRef.current = { frame: requestAnimationFrame(step), at: from };
  }, [positions, settleOnChange]);
  React.useEffect(
    () => () => {
      if (glideRef.current) cancelAnimationFrame(glideRef.current.frame);
    },
    [],
  );

  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);
  const [view, setView] = React.useState<GraphView | null>(null);
  const [panning, setPanning] = React.useState(false);
  const [ownSelectedId, setOwnSelectedId] = React.useState<string | null>(defaultSelectedId);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = React.useState<number | null>(null);
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const [lastFocusedId, setLastFocusedId] = React.useState<string | null>(null);
  const [keyboardFocusId, setKeyboardFocusId] = React.useState<string | null>(null);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [ownPinnedIds, setOwnPinnedIds] = React.useState<readonly string[]>(defaultPinnedIds ?? []);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [leaving, setLeaving] = React.useState<{ items: Leaving[]; ms: number; easing: string } | null>(null);
  /** A view move in progress: its animation frame and the view it last drew. */
  const tween = React.useRef<{ frame: number; view: GraphView } | null>(null);
  const fitKey = React.useRef<string | null>(null);
  /** Fit once more after the next change of size, as entering or leaving full screen makes. */
  const pendingFit = React.useRef(false);
  const browserFullscreen = React.useRef(false);
  const lastShown = React.useRef(new Map<string, Leaving>());
  const leavingTimer = React.useRef<number | undefined>(undefined);

  const neighbours = buildNeighbours(shown.nodes, shown.links);
  const shownIds = new Set(shown.nodes.map((node) => node.id));
  const labels = new Map(nodes.map((node) => [node.id, node.label]));
  const byId = new Map(nodes.map((node) => [node.id, node]));

  const pinned = new Set(pinnedIds ?? ownPinnedIds);
  const pinnedKey = [...pinned].sort().join("\u0001");
  const pinnable =
    layoutMode === "force" || pinnedIds !== undefined || defaultPinnedIds !== undefined || onPinnedChange !== undefined;
  const draggable = draggableNodes ?? layoutMode === "force";

  // The structure lit around the node pointed at, dragged or focused from the keyboard.
  const pointedId = draggingId ?? hoveredId ?? keyboardFocusId;
  let lit: GraphHighlight | null = null;
  if (hoverHighlight !== "none" && pointedId !== null && shownIds.has(pointedId)) {
    if (typeof hoverHighlight === "function") {
      const ids = new Set([pointedId, ...hoverHighlight(byId.get(pointedId)!, shown)].filter((id) => shownIds.has(id)));
      lit = { nodes: ids, links: linksAmong(ids, shown.links) };
    } else {
      lit = highlightStructure(hoverHighlight, pointedId, shown.links);
    }
  }

  const chosenId = selectedId !== undefined ? selectedId : ownSelectedId;
  // A selection that is hidden or gone highlights nothing.
  const activeId = chosenId !== null && shownIds.has(chosenId) ? chosenId : null;
  const near = activeId ? new Set([activeId, ...(neighbours.get(activeId) ?? [])]) : null;
  const tabStopId =
    lastFocusedId !== null && shownIds.has(lastFocusedId) ? lastFocusedId : (activeId ?? shown.nodes[0]?.id ?? null);

  const select = (id: string | null) => {
    if (id === chosenId) return;
    if (selectedId === undefined) setOwnSelectedId(id);
    onSelectionChange?.(id);
  };

  const togglePin = (id: string) => {
    const next = pinned.has(id) ? [...pinned].filter((pinnedId) => pinnedId !== id) : [...pinned, id];
    if (pinnedIds === undefined) setOwnPinnedIds(next);
    onPinnedChange?.(next);
  };

  // The first time there is something to draw and a box to draw it in, fit
  // it. After that the view is the reader's: new data never moves it.
  const hasNodes = shown.nodes.length > 0;
  // Fit above the strip the zoom buttons sit in, so no node lands under them,
  // and in full screen clear of the toolbar and the aside.
  const fitted = (box: { width: number; height: number }, { top, end } = { top: 0, end: 0 }): GraphView => {
    const fit = fitView(
      shown.nodes.map((node) => positions[node.id]).filter(Boolean),
      Math.max(1, box.width - end),
      Math.max(1, box.height - CONTROLS_STRIP - top),
      maxFitZoom,
    );
    return { ...fit, x: fit.x - end / 2, y: fit.y + (top - CONTROLS_STRIP) / 2 };
  };
  let currentView = view;
  if (view === null && size && hasNodes) {
    currentView = fitted(size);
    setView(currentView);
  } else if (view !== null && nodes.length === 0) {
    currentView = null;
    setView(null);
  }

  /** The room the full screen toolbar and aside take, measured when a fit runs from an event. */
  const overlayRoom = () => {
    const element = rootRef.current;
    const root = element?.getBoundingClientRect();
    const toolbar = fullscreen ? toolbarRef.current?.getBoundingClientRect() : undefined;
    const aside = fullscreen ? asideRef.current?.getBoundingClientRect() : undefined;
    // The theme's gap between the overlay and the nodes, as the stylesheet uses it.
    const gap = element ? parseFloat(getComputedStyle(element).getPropertyValue(OVERLAY_GAP_VAR)) || 0 : 0;
    return {
      top: root && toolbar ? Math.max(0, toolbar.bottom - root.top + gap) : 0,
      end: root && aside ? Math.max(0, root.right - aside.left + gap) : 0,
    };
  };

  /** Ends a view move where it stands, so a gesture carries on from what the reader sees. */
  const stopTween = () => {
    const running = tween.current;
    if (!running) return;
    cancelAnimationFrame(running.frame);
    tween.current = null;
    setView(running.view);
  };

  /**
   * Moves the view to `target`. The move writes the drawing's transform on
   * each animation frame without rendering, and commits the view at the end.
   * With motion reduced or off it jumps.
   */
  const animateTo = (target: GraphView) => {
    const start = tween.current?.view ?? currentView;
    if (tween.current) cancelAnimationFrame(tween.current.frame);
    tween.current = null;
    const timing = motionTiming(svgRef.current, "--squonk-roles-motion-layout");
    const box = size;
    if (!start || !box || !sceneRef.current || timing.ms <= 0 || timing.reduced || !canAnimate()) {
      setView(target);
      return;
    }
    let began: number | null = null;
    const step = (now: number) => {
      began ??= now;
      const t = Math.min(1, (now - began) / timing.ms);
      if (t >= 1) {
        tween.current = null;
        setView(target);
        return;
      }
      const e = easeInOut(t);
      const at = { k: start.k + (target.k - start.k) * e, x: start.x + (target.x - start.x) * e, y: start.y + (target.y - start.y) * e };
      sceneRef.current?.setAttribute("transform", viewTransform(box, at));
      tween.current = { frame: requestAnimationFrame(step), view: at };
    };
    tween.current = { frame: requestAnimationFrame(step), view: start };
  };

  React.useEffect(
    () => () => {
      if (tween.current) cancelAnimationFrame(tween.current.frame);
      window.clearTimeout(leavingTimer.current);
    },
    [],
  );

  // In full screen, the room the toolbar and aside take, as it changes: an
  // aside appears when a node is selected, and a toolbar can wrap or grow.
  const [overlaySize, setOverlaySize] = React.useState("");
  const hasToolbar = Boolean(fullscreenToolbar);
  const hasAside = Boolean(fullscreenAside);
  React.useEffect(() => {
    if (!fullscreen || typeof ResizeObserver === "undefined") return;
    // The observer reports each element as soon as it starts watching it, and on every change after.
    const observer = new ResizeObserver(() => {
      const toolbar = toolbarRef.current?.getBoundingClientRect();
      const aside = asideRef.current?.getBoundingClientRect();
      setOverlaySize(`${Math.round(toolbar?.height ?? 0)}x${Math.round(aside?.width ?? 0)}`);
    });
    for (const element of [toolbarRef.current, asideRef.current]) if (element) observer.observe(element);
    return () => observer.disconnect();
  }, [fullscreen, hasToolbar, hasAside]);
  // An aside that goes away stops being observed, so its room is read again here.
  const overlayKey = fullscreen ? `${overlaySize}\u0003${hasToolbar}\u0003${hasAside}` : "";

  // Fit again when what shows, the box or the full screen overlay changes:
  // always with `autoFit`, and once after entering or leaving full screen.
  const shownKey = shown.nodes.map((node) => node.id).join("\u0001");
  React.useEffect(() => {
    if (!size || !hasNodes) return;
    const key = `${shownKey}\u0002${size.width}x${size.height}\u0002${overlayKey}`;
    const changed = fitKey.current !== null && fitKey.current !== key;
    fitKey.current = key;
    if (!changed || !(autoFit || pendingFit.current)) return;
    pendingFit.current = false;
    animateTo(fitted(size, overlayRoom()));
  });

  // Nodes that leave fade out where they stood. With motion reduced or off
  // they are simply gone.
  React.useEffect(() => {
    const before = lastShown.current;
    const now = new Map<string, Leaving>();
    for (const node of shown.nodes) {
      const point = drawnAt[node.id];
      if (point) now.set(node.id, { node, point });
    }
    lastShown.current = now;
    const gone = [...before.values()].filter((item) => !now.has(item.node.id));
    if (gone.length === 0) return;
    const timing = motionTiming(svgRef.current, "--squonk-roles-motion-layout", "--squonk-roles-motion-exit");
    if (timing.ms <= 0 || timing.reduced) return;
    window.clearTimeout(leavingTimer.current);
    setLeaving({ items: gone, ms: timing.ms, easing: timing.easing });
    leavingTimer.current = window.setTimeout(() => setLeaving(null), timing.ms);
    // Only a change in what shows starts a fade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownKey]);

  React.useEffect(() => {
    const svg = svgRef.current;
    if (!leaving || !svg) return;
    svg.querySelectorAll<SVGGElement>("[data-leaving-id]").forEach((element) => {
      if (typeof element.animate === "function") {
        element.animate([{ opacity: 1 }, { opacity: 0 }], { duration: leaving.ms, easing: leaving.easing, fill: "forwards" });
      }
    });
  }, [leaving]);

  const changeFullscreen = (on: boolean) => {
    pendingFit.current = true;
    setFullscreen(on);
    onFullscreenChange?.(on);
  };
  const enterFullscreen = () => {
    changeFullscreen(true);
    // The whole page goes full screen, not the graph alone, so menus and
    // popovers the toolbar opens still show.
    const page = document.documentElement;
    if (document.fullscreenEnabled && !document.fullscreenElement && typeof page.requestFullscreen === "function") {
      page.requestFullscreen().then(
        () => {
          browserFullscreen.current = true;
        },
        () => undefined,
      );
    }
  };
  const exitFullscreen = () => {
    changeFullscreen(false);
    if (browserFullscreen.current) {
      browserFullscreen.current = false;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    }
  };

  // Escape leaves full screen, unless something inside used it first: a
  // selection to clear, or a field. The browser's own full screen leaves on
  // Escape by itself.
  React.useEffect(() => {
    if (!fullscreen) return;
    const onChange = () => {
      if (browserFullscreen.current && !document.fullscreenElement) {
        browserFullscreen.current = false;
        changeFullscreen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || browserFullscreen.current) return;
      const target = event.target as Element | null;
      if (target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      exitFullscreen();
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  React.useEffect(
    () => () => {
      if (browserFullscreen.current && document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    },
    [],
  );

  // Full screen covers the page, so the page behind it leaves the tab order
  // and assistive technology (inert), and focus moves to the way out. Leaving
  // gives focus back to the Full screen button. Menus and popovers the toolbar
  // opens later attach after this runs, so they stay usable.
  const wasFullscreen = React.useRef(false);
  React.useEffect(() => {
    const root = rootRef.current;
    if (!fullscreen || !root) {
      if (wasFullscreen.current) {
        wasFullscreen.current = false;
        root?.querySelector<HTMLButtonElement>('button[aria-label="Full screen"]')?.focus();
      }
      return;
    }
    wasFullscreen.current = true;
    const behind = [...document.body.children].filter(
      (element): element is HTMLElement => element !== root && element instanceof HTMLElement && !element.inert,
    );
    for (const element of behind) element.inert = true;
    root.querySelector<HTMLButtonElement>('button[aria-label="Exit full screen"]')?.focus();
    return () => {
      for (const element of behind) element.inert = false;
    };
  }, [fullscreen]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((previous) =>
        previous && previous.width === width && previous.height === height ? previous : { width, height },
      );
    });
    observer.observe(root);
    return () => observer.disconnect();
    // Full screen draws the graph in a new element, so watch that one.
  }, [fullscreen]);

  // Wheel zooms about the pointer. React's wheel listener is passive, so
  // the page would scroll too; this one can stop it.
  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : 1);
      const px = event.clientX - rect.left - rect.width / 2;
      const py = event.clientY - rect.top - rect.height / 2;
      stopTween();
      setView((previous) => previous && zoomView(previous, Math.exp(-delta * 0.0015), px, py));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
    // Full screen draws the graph in a new element, so listen on that one.
  }, [fullscreen]);

  // The live layout: a simulation at rest over the nodes on show, made again
  // when they come or go. It moves only while a node is dragged.
  React.useEffect(() => {
    if (layoutMode !== "force") return;
    const live = createLiveSimulation(
      shown.nodes,
      shown.links,
      positionsRef.current,
      new Set(pinnedKey ? pinnedKey.split("\u0001") : []),
    );
    live.on("tick", () => {
      const next = simulationPositions(live);
      directMove.current = true;
      setLayout((previous) =>
        previous.signature === signature
          ? { ...previous, positions: next, remembered: { ...previous.remembered, ...next } }
          : previous,
      );
    });
    simulation.current = live;
    return () => {
      live.stop();
      simulation.current = null;
    };
    // Made again only when the nodes or links on show change; pins are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutMode, signature]);

  // Pinned nodes stay where they are; unpinned ones rejoin the live layout.
  React.useEffect(() => {
    const live = simulation.current;
    if (!live) return;
    const ids = new Set(pinnedKey ? pinnedKey.split("\u0001") : []);
    for (const simNode of live.nodes()) {
      if (simNode.id === gesture.current.nodeId && gesture.current.dragging) continue;
      simNode.fx = ids.has(simNode.id) ? simNode.x : null;
      simNode.fy = ids.has(simNode.id) ? simNode.y : null;
    }
  }, [pinnedKey, signature]);

  // Nodes that join later, and their links, fade in where they will stay.
  // With motion reduced or off they are simply there. Only a change in the
  // nodes on show starts it, not a node moving.
  React.useEffect(() => {
    const before = seenIds.current;
    seenIds.current = new Set(Object.keys(positionsRef.current));
    const svg = svgRef.current;
    if (!before || !svg || typeof svg.animate !== "function") return;
    const timing = motionTiming(svg, "--squonk-roles-motion-layout", "--squonk-roles-motion-enter");
    if (timing.ms <= 0 || timing.reduced) return;
    const isNew = (id: string | undefined) => id !== undefined && !before.has(id);
    svg.querySelectorAll<SVGGElement>("[data-node-id], [data-link-source]").forEach((element) => {
      const { nodeId, linkSource, linkTarget } = element.dataset;
      if (isNew(nodeId) || isNew(linkSource) || isNew(linkTarget)) {
        element.animate([{ opacity: 0, offset: 0 }], { duration: timing.ms, easing: timing.easing });
      }
    });
  }, [signature]);

  const zoomBy = (factor: number) => {
    const from = tween.current?.view ?? currentView;
    if (from) animateTo(zoomView(from, factor));
  };
  const fit = () => {
    if (size) animateTo(fitted(size, overlayRoom()));
  };

  /** A point on the screen in the graph's own coordinates. */
  const toGraph = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg || !size || !currentView) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left - size.width / 2 - currentView.x) / currentView.k,
      y: (clientY - rect.top - size.height / 2 - currentView.y) / currentView.k,
    };
  };

  /** Moves a dragged node: in the live layout it pulls its neighbours; otherwise it moves alone. */
  const moveNode = (id: string, clientX: number, clientY: number) => {
    const point = toGraph(clientX, clientY);
    if (!point) return;
    const live = simulation.current;
    const simNode = live?.nodes().find((candidate) => candidate.id === id);
    if (live && simNode) {
      simNode.fx = point.x;
      simNode.fy = point.y;
      if (live.alphaTarget() < DRAG_HEAT) live.alphaTarget(DRAG_HEAT).restart();
      return;
    }
    directMove.current = true;
    setLayout((previous) => ({
      ...previous,
      positions: { ...previous.positions, [id]: point },
      remembered: { ...previous.remembered, [id]: point },
    }));
  };

  const endDrag = (id: string) => {
    const live = simulation.current;
    const simNode = live?.nodes().find((candidate) => candidate.id === id);
    if (live && simNode) {
      live.alphaTarget(0);
      // Let go, an unpinned node rejoins the layout; a pinned one stays where it was dropped.
      if (!pinned.has(id)) {
        simNode.fx = null;
        simNode.fy = null;
      }
    }
    setDraggingId(null);
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    stopTween();
    const state = gesture.current;
    if (state.pointers.size === 0) {
      const element = (event.target as Element).closest<SVGGElement>("[data-node-id]");
      state.travel = 0;
      state.nodeId = element?.dataset.nodeId ?? null;
      state.dragging = false;
    }
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const state = gesture.current;
    const last = state.pointers.get(event.pointerId);
    if (!last) return;
    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    if (state.pointers.size === 1) {
      state.travel += Math.hypot(dx, dy);
      state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (state.travel < CLICK_TRAVEL) return;
      // Dragging a node moves it; dragging anything else pans.
      if (draggable && state.nodeId !== null) {
        if (!state.dragging) {
          state.dragging = true;
          setDraggingId(state.nodeId);
        }
        moveNode(state.nodeId, event.clientX, event.clientY);
        return;
      }
      if (!panning) setPanning(true);
      setView((previous) => previous && { ...previous, x: previous.x + dx, y: previous.y + dy });
      return;
    }
    // Two fingers: zoom by how far they part, about the point between them,
    // and pan by how far that point moves.
    const other = [...state.pointers.entries()].find(([id]) => id !== event.pointerId)?.[1];
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (!other) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const before = Math.hypot(last.x - other.x, last.y - other.y) || 1;
    const after = Math.hypot(event.clientX - other.x, event.clientY - other.y) || 1;
    const midX = (event.clientX + other.x) / 2 - rect.left - rect.width / 2;
    const midY = (event.clientY + other.y) / 2 - rect.top - rect.height / 2;
    state.travel += CLICK_TRAVEL;
    setView((previous) => {
      if (!previous) return previous;
      const zoomed = zoomView(previous, after / before, midX, midY);
      return { ...zoomed, x: zoomed.x + dx / 2, y: zoomed.y + dy / 2 };
    });
  };

  const endPointer = (event: React.PointerEvent<SVGSVGElement>, cancelled: boolean) => {
    const state = gesture.current;
    if (!state.pointers.delete(event.pointerId) || state.pointers.size > 0) return;
    if (panning) setPanning(false);
    if (state.dragging && state.nodeId !== null) {
      endDrag(state.nodeId);
      state.dragging = false;
      return;
    }
    if (cancelled || state.travel >= CLICK_TRAVEL) return;
    // A second click on the same node soon after the first pins or unpins it.
    const now = event.timeStamp;
    const previous = state.lastClick;
    if (pinnable && state.nodeId !== null && previous?.nodeId === state.nodeId && now - previous.at < DOUBLE_CLICK_MS) {
      state.lastClick = null;
      togglePin(state.nodeId);
      return;
    }
    state.lastClick = state.nodeId !== null ? { nodeId: state.nodeId, at: now } : null;
    // A click: on a node it selects (or, on the selected node, clears);
    // on the background it clears.
    select(state.nodeId !== null && state.nodeId !== chosenId ? state.nodeId : null);
  };

  const onNodeKeyDown = (event: React.KeyboardEvent<SVGGElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(id === chosenId ? null : id);
      return;
    }
    if (pinnable && (event.key === "p" || event.key === "P") && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      togglePin(id);
      return;
    }
    if (!NAVIGATION_KEYS.includes(event.key)) return;
    event.preventDefault();
    const next = nextFocusId(event.key as GraphNavigationKey, id, shown.nodes, shown.links, positions);
    // preventScroll: moving focus never scrolls the page or the graph's box.
    if (next) nodeElements.current.get(next)?.focus({ preventScroll: true });
  };

  const onKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    // Escape clears a selection; with none, it is left for a dialog or drawer.
    if (event.key !== "Escape" || chosenId === null) return;
    event.preventDefault();
    event.stopPropagation();
    select(null);
  };

  const onNodeFocus = (event: React.FocusEvent<SVGGElement>, id: string) => {
    setFocusedId(id);
    setLastFocusedId(id);
    // Focus from the keyboard lights the hover structure; a click's focus does not.
    let fromKeyboard: boolean;
    try {
      fromKeyboard = event.currentTarget.matches(":focus-visible");
    } catch {
      fromKeyboard = false;
    }
    setKeyboardFocusId(fromKeyboard ? id : null);
    const point = positions[id];
    if (!size || !currentView || !point) return;
    // A node that is in view never moves the view when it takes focus. Only a
    // node focused from the keyboard while wholly out of view is brought just
    // inside the edge, so every node can be reached without a mouse.
    const x = size.width / 2 + currentView.x + currentView.k * point.x;
    const y = size.height / 2 + currentView.y + currentView.k * point.y;
    const outside = x < 0 || x > size.width || y < 0 || y > size.height;
    if (!outside) return;
    const shiftX = x < FOCUS_MARGIN ? FOCUS_MARGIN - x : x > size.width - FOCUS_MARGIN ? size.width - FOCUS_MARGIN - x : 0;
    const shiftY =
      y < FOCUS_MARGIN ? FOCUS_MARGIN - y : y > size.height - FOCUS_MARGIN ? size.height - FOCUS_MARGIN - y : 0;
    if (shiftX || shiftY) setView((previous) => previous && { ...previous, x: previous.x + shiftX, y: previous.y + shiftY });
  };

  const bows = linkBows(shown.links);
  const drawnLinks = shown.links.map((link, index) => {
    const kind = resolveLinkKind(linkKinds, link.kind);
    const source = drawnAt[link.source];
    const target = drawnAt[link.target];
    const thickness = linkThickness(link.thickness, kind);
    const inUse = [hoveredId, focusedId, activeId].some((id) => id !== null && (id === link.source || id === link.target));
    return {
      link,
      index,
      kind,
      thickness,
      animation: link.animation ?? kind.animation,
      duration: linkAnimationDuration(link.animationDuration, kind),
      text: link.label ?? kind.label,
      geometry:
        source && target
          ? linkGeometry(source, target, bows[index], nodeRadius(byId.get(link.source)), {
              targetRadius: nodeRadius(byId.get(link.target)),
              arrowScale: thickness ? Math.max(1, Math.sqrt(thickness / 1.5)) : 1,
            })
          : null,
      labelled: hoveredLink === index || inUse,
      highlighted: lit !== null && lit.links.has(index),
      dimmed: lit ? !lit.links.has(index) : activeId !== null && link.source !== activeId && link.target !== activeId,
    };
  });
  const hasImages = shown.nodes.some((node) => node.image);

  const connectionCount = (id: string) => {
    const count = neighbours.get(id)?.size ?? 0;
    return count === 0 ? "no connections" : count === 1 ? "1 connection" : `${count} connections`;
  };
  const showDescriptions = shown.nodes.some((node) => node.description);
  // In full screen the graph is drawn at the end of the body, so no
  // transformed or clipped ancestor can hold it inside the page.
  const scope = fullscreen ? portalVars : themeVars;

  const drawing = (
    <div
      ref={rootRef}
      role="group"
      aria-label={label}
      className={clsx(styles.root, className)}
      data-fullscreen={fullscreen || undefined}
      // Full screen sets its box inline, so a height the page gives the graph cannot hold it in place.
      style={{ ...scope.style, ...style, ...(fullscreen ? FULLSCREEN_BOX : null) }}
    >
      {scope.provide(
        <>
          <svg
            ref={svgRef}
            className={styles.svg}
            focusable="false"
            data-panning={panning || undefined}
            data-dragging={draggingId !== null || undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(event) => endPointer(event, false)}
            onPointerCancel={(event) => endPointer(event, true)}
            onKeyDown={onKeyDown}
          >
            {hasImages ? (
              <defs>
                <clipPath id={clipId} clipPathUnits="objectBoundingBox">
                  <circle cx="0.5" cy="0.5" r="0.5" />
                </clipPath>
              </defs>
            ) : null}
            {size && currentView ? (
              <g ref={sceneRef} transform={viewTransform(size, currentView)}>
                {leaving ? (
                  <g aria-hidden="true">
                    {leaving.items
                      .filter((item) => !shownIds.has(item.node.id))
                      .map(({ node, point }) => {
                        const kind = resolveNodeKind(nodeKinds, node.kind);
                        const radius = nodeRadius(node);
                        return (
                          <Motion.Shift key={node.id}>
                            <g
                              className={clsx(styles.node, styles.leaving)}
                              transform={`translate(${point.x} ${point.y})`}
                              data-variant={node.variant ?? "solid"}
                              data-leaving-id={node.id}
                              style={{ "--network-graph-node-color": nodeColor(node.tone, kind) } as React.CSSProperties}
                            >
                              <path className={styles.nodeShape} d={shapePath(kind.shape, radius)} />
                              <NodeIcon icon={node.icon ?? kind.icon} radius={radius} />
                              <text className={styles.nodeLabel} y={radius + LABEL_GAP}>
                                {truncateLabel(node.label)}
                              </text>
                            </g>
                          </Motion.Shift>
                        );
                      })}
                  </g>
                ) : null}
                <g>
                  {drawnLinks.map(({ link, index, kind, geometry, dimmed, highlighted, thickness, animation, duration }) =>
                    geometry ? (
                      <Motion.Shift key={`${link.source}\u0001${link.target}\u0001${link.kind ?? ""}\u0001${index}`}>
                        <g
                          className={styles.link}
                          data-link-source={link.source}
                          data-link-target={link.target}
                          data-variant={link.variant ?? kind.variant}
                          data-animation={animation !== "none" ? animation : undefined}
                          data-dimmed={dimmed || undefined}
                          data-highlighted={highlighted || undefined}
                          style={
                            {
                              ...(kind.color ? { "--network-graph-link-color": kind.color } : {}),
                              ...(thickness ? { "--network-graph-link-width": `${thickness}px` } : {}),
                              ...(animation !== "none" ? { "--motion-loop-duration": `${duration}ms` } : {}),
                            } as React.CSSProperties
                          }
                          onPointerEnter={() => setHoveredLink(index)}
                          onPointerLeave={() => setHoveredLink((current) => (current === index ? null : current))}
                        >
                          {animation === "flow" ? (
                            <Motion.Flow>
                              <path className={styles.linkLine} d={geometry.path} />
                            </Motion.Flow>
                          ) : animation === "pulse" ? (
                            <Motion.Pulse>
                              <path className={styles.linkLine} d={geometry.path} />
                            </Motion.Pulse>
                          ) : (
                            <path className={styles.linkLine} d={geometry.path} />
                          )}
                          <path className={styles.linkArrow} d={geometry.arrow} />
                          {animation === "particles"
                            ? Array.from({ length: PARTICLES }, (_, particle) => (
                                <Motion.Travel key={particle}>
                                  <circle
                                    className={styles.linkParticle}
                                    r={2.5 + (thickness ?? 1.5) * 0.4}
                                    style={
                                      {
                                        offsetPath: `path("${geometry.path}")`,
                                        "--motion-loop-delay": `${(-duration * particle) / PARTICLES}ms`,
                                      } as React.CSSProperties
                                    }
                                  />
                                </Motion.Travel>
                              ))
                            : null}
                          <path className={styles.linkHit} d={geometry.path} />
                        </g>
                      </Motion.Shift>
                    ) : null,
                  )}
                </g>
                <g>
                  {shown.nodes.map((node) => {
                    const point = drawnAt[node.id];
                    if (!point) return null;
                    const kind = resolveNodeKind(nodeKinds, node.kind);
                    const radius = nodeRadius(node);
                    const color = nodeColor(node.tone, kind);
                    const selected = node.id === activeId;
                    const isPinned = pinned.has(node.id);
                    const dimmed = lit ? !lit.nodes.has(node.id) : near !== null && !near.has(node.id);
                    const name = [node.label, kind.label, node.description, connectionCount(node.id), isPinned ? "pinned" : null]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <g
                        key={node.id}
                        ref={(element) => {
                          if (element) nodeElements.current.set(node.id, element);
                          else nodeElements.current.delete(node.id);
                        }}
                        className={styles.node}
                        transform={`translate(${point.x} ${point.y})`}
                        role="button"
                        tabIndex={node.id === tabStopId ? 0 : -1}
                        aria-label={name}
                        aria-pressed={selected}
                        data-node-id={node.id}
                        data-kind={node.kind}
                        data-variant={node.variant ?? "solid"}
                        data-selected={selected || undefined}
                        data-dimmed={dimmed || undefined}
                        data-highlighted={(lit !== null && lit.nodes.has(node.id)) || undefined}
                        data-pinned={isPinned || undefined}
                        data-draggable={draggable || undefined}
                        data-dragging={draggingId === node.id || undefined}
                        style={{ "--network-graph-node-color": color } as React.CSSProperties}
                        onKeyDown={(event) => onNodeKeyDown(event, node.id)}
                        onClick={(event) => {
                          // Pointer clicks are handled when the pointer lifts; this is
                          // for activation by assistive technology, which sends no pointer.
                          if (event.detail === 0) select(node.id === chosenId ? null : node.id);
                        }}
                        onFocus={(event) => onNodeFocus(event, node.id)}
                        onBlur={() => {
                          setFocusedId((current) => (current === node.id ? null : current));
                          setKeyboardFocusId((current) => (current === node.id ? null : current));
                        }}
                        onPointerEnter={() => setHoveredId(node.id)}
                        onPointerLeave={() => setHoveredId((current) => (current === node.id ? null : current))}
                      >
                        <title>{node.description ? `${node.label} (${node.description})` : node.label}</title>
                        <circle className={styles.nodeHit} r={radius + 4} />
                        <circle className={styles.focusRing} r={radius + 9} />
                        <circle className={styles.selectionRing} r={radius + 5} />
                        {renderNode ? (
                          <g className={styles.nodeCustom}>
                            {renderNode(node, {
                              radius,
                              color,
                              shape: kind.shape,
                              kindLabel: kind.label,
                              selected,
                              hovered: pointedId === node.id,
                              dimmed,
                              pinned: isPinned,
                            })}
                          </g>
                        ) : node.image ? (
                          <>
                            <circle className={styles.nodeImageRing} r={radius + 1.5} />
                            <image
                              className={styles.nodeImage}
                              href={node.image}
                              x={-radius}
                              y={-radius}
                              width={radius * 2}
                              height={radius * 2}
                              preserveAspectRatio="xMidYMid slice"
                              clipPath={`url(#${clipId})`}
                            />
                          </>
                        ) : (
                          <>
                            <path className={styles.nodeShape} d={shapePath(kind.shape, radius)} />
                            <NodeIcon icon={node.icon ?? kind.icon} radius={radius} />
                          </>
                        )}
                        {isPinned ? (
                          <g className={styles.pin} transform={`translate(${radius * 0.8} ${-radius * 0.8})`} aria-hidden="true">
                            <circle r={6.5} />
                            <g transform="translate(-4 -4)" style={{ fontSize: 8 }}>
                              <PinIcon />
                            </g>
                          </g>
                        ) : null}
                        <text className={styles.nodeLabel} y={radius + LABEL_GAP} aria-hidden="true">
                          {truncateLabel(node.label)}
                        </text>
                      </g>
                    );
                  })}
                </g>
                <g aria-hidden="true">
                  {drawnLinks.map(({ link, index, text, geometry, labelled, dimmed }) =>
                    geometry && labelled && text ? (
                      <text
                        key={`${link.source}\u0001${link.target}\u0001${index}`}
                        className={styles.linkLabel}
                        data-dimmed={dimmed || undefined}
                        x={geometry.labelX}
                        y={geometry.labelY}
                      >
                        {truncateLabel(text, 32)}
                      </text>
                    ) : null,
                  )}
                </g>
              </g>
            ) : null}
          </svg>

          {nodes.length === 0 ? (
            <>
              <div className={styles.empty}>{empty ?? "No data to show"}</div>
              {fullscreen ? (
                <div className={styles.controls}>
                  <IconButton icon={<CollapseIcon />} label="Exit full screen" onClick={exitFullscreen} />
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className={styles.controls}>
                <IconButton icon={<ZoomOutIcon />} label="Zoom out" onClick={() => zoomBy(1 / ZOOM_STEP)} />
                <IconButton icon={<ZoomInIcon />} label="Zoom in" onClick={() => zoomBy(ZOOM_STEP)} />
                <IconButton icon={<FullscreenIcon />} label="Fit to view" onClick={fit} />
                {allowFullscreen ? (
                  <IconButton
                    icon={fullscreen ? <CollapseIcon /> : <ExpandIcon />}
                    label={fullscreen ? "Exit full screen" : "Full screen"}
                    onClick={fullscreen ? exitFullscreen : enterFullscreen}
                  />
                ) : null}
              </div>
              <div className={styles.visuallyHidden}>
                <table>
                  <caption>{label}: nodes</caption>
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Kind</th>
                      {showDescriptions ? <th scope="col">Description</th> : null}
                      <th scope="col">Connected to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.nodes.map((node) => (
                      <tr key={node.id}>
                        <th scope="row">{node.label}</th>
                        <td>{resolveNodeKind(nodeKinds, node.kind).label}</td>
                        {showDescriptions ? <td>{node.description}</td> : null}
                        <td>
                          {[...(neighbours.get(node.id) ?? [])].map((id) => labels.get(id) ?? id).join(", ") || "Nothing"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table>
                  <caption>{label}: links</caption>
                  <thead>
                    <tr>
                      <th scope="col">From</th>
                      <th scope="col">To</th>
                      <th scope="col">Relationship</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drawnLinks.map(({ link, index, text }) => (
                      <tr key={index}>
                        <td>{labels.get(link.source) ?? link.source}</td>
                        <td>{labels.get(link.target) ?? link.target}</td>
                        <td>{text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {/* In full screen the overlay and the way out stay, even when a search
              leaves nothing to draw. Last, so it draws over the rest. */}
          {fullscreen && (fullscreenToolbar || fullscreenAside) ? (
            <div className={styles.overlay}>
              {fullscreenToolbar ? (
                <div ref={toolbarRef} className={styles.overlayToolbar}>
                  {fullscreenToolbar}
                </div>
              ) : null}
              {fullscreenAside ? (
                <div ref={asideRef} className={styles.overlayAside}>
                  {fullscreenAside}
                </div>
              ) : null}
            </div>
          ) : null}
        </>,
      )}
    </div>
  );
  return fullscreen && typeof document !== "undefined" ? createPortal(drawing, document.body) : drawing;
}
