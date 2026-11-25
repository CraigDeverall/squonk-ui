"use client";

import { clsx } from "clsx";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { mergeProps, mergeRefs, useFocusRing, useHover, useMove } from "react-aria";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { Motion } from "../../animation/motion/motion";
import {
  fitLayout,
  initialLayout,
  isCollapsed,
  movePair,
  pairRange,
  resolveConstraints,
  type PanelConstraints,
  type PanelSize,
  type ResolvedConstraints,
} from "./resizable-layout";
import styles from "./resizable-panels.module.css";

export type { PanelSize } from "./resizable-layout";

/** Which way a ResizablePanels group lays its panels out. */
export type ResizableOrientation = "horizontal" | "vertical";

/** How a ResizableHandle looks at rest. */
export type ResizableHandleAppearance = "line" | "bar" | "grip";

// ─── Group context ──────────────────────────────────────────────────────

interface PanelCallbacks {
  onResize?: (size: number) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface PanelInfo {
  elRef: React.RefObject<HTMLElement | null>;
  callbacks: React.RefObject<PanelCallbacks>;
  constraints: PanelConstraints;
}

interface Layout {
  ids: string[];
  sizes: number[];
  /** Computed before the group was measured: pixel sizes aren't known yet. */
  provisional: boolean;
}

interface GroupContextValue {
  orientation: ResizableOrientation;
  layout: Layout | null;
  resolved: ResolvedConstraints[];
  links: Record<string, [string | undefined, string | undefined]>;
  registerPanel: (id: string, info: PanelInfo) => () => void;
  registerHandle: (id: string, elRef: React.RefObject<HTMLElement | null>) => () => void;
  /** The latest layout, constraints and measured length, for event handlers. */
  current: React.RefObject<{ layout: Layout | null; resolved: ResolvedConstraints[]; groupPx: number; defaultLayout?: number[] }>;
  /** Each panel's last open size, to restore when it expands. */
  lastOpen: React.RefObject<Record<string, number>>;
  commit: (sizes: number[]) => void;
  setDragging: (dragging: boolean) => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

function useGroup(component: string): GroupContextValue {
  const group = useContext(GroupContext);
  if (!group) throw new Error(`${component} must be rendered inside ResizablePanels.`);
  return group;
}

const FOLLOWING = 4; // Node.DOCUMENT_POSITION_FOLLOWING, without touching Node during SSR.

const sameNumbers = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((value, i) => Math.abs(value - b[i]) < 0.0001);
const sameIds = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id, i) => id === b[i]);

// ─── ResizablePanels ────────────────────────────────────────────────────

export interface ResizablePanelsProps extends Omit<React.ComponentPropsWithRef<"div">, "children"> {
  /**
   * Which way the panels sit: `horizontal` puts them side by side with
   * vertical handles between them, `vertical` stacks them with horizontal
   * handles. Defaults to `horizontal`.
   */
  orientation?: ResizableOrientation;
  /**
   * Starting sizes, one percentage per panel in order, overriding each
   * panel's `defaultSize`. Pass back what `onLayout` gave you to restore a
   * saved layout. Ignored when the number of sizes doesn't match the panels.
   * Read once, when the group first lays out.
   */
  defaultLayout?: number[];
  /**
   * Called with every panel's size, as percentages in order, whenever the
   * layout changes: when it first lays out, while a handle moves, and when
   * the group's size forces a panel back within its limits. Save it to
   * restore the layout with `defaultLayout`.
   */
  onLayout?: (sizes: number[]) => void;
  /** `ResizablePanel`s with a `ResizableHandle` between each pair. */
  children?: React.ReactNode;
}

/**
 * An area split into panels the user can resize: `ResizablePanel`s with a
 * `ResizableHandle` between each pair. Drag a handle, or focus it and use
 * the arrow keys. The group fills its container, so give the container a
 * size (a page region, a fixed-height card).
 *
 * ```tsx
 * <ResizablePanels>
 *   <ResizablePanel defaultSize={25} minSize="200px" maxSize={40}>…</ResizablePanel>
 *   <ResizableHandle label="Resize sidebar" />
 *   <ResizablePanel>…</ResizablePanel>
 * </ResizablePanels>
 * ```
 */
export function ResizablePanels({
  orientation = "horizontal",
  defaultLayout,
  onLayout,
  children,
  className,
  style,
  ref,
  ...otherProps
}: ResizablePanelsProps) {
  const themeVars = useThemeCssVars();
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const [panels, setPanels] = useState<Record<string, PanelInfo>>({});
  const [handles, setHandles] = useState<Record<string, React.RefObject<HTMLElement | null>>>({});
  const [structure, setStructure] = useState<{ order: string[]; links: GroupContextValue["links"] }>({ order: [], links: {} });
  const [groupPx, setGroupPx] = useState(0);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [dragging, setDragging] = useState(false);

  const registerPanel = useCallback((id: string, info: PanelInfo) => {
    setPanels((prev) => ({ ...prev, [id]: info }));
    return () =>
      setPanels((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
  }, []);

  const registerHandle = useCallback((id: string, elRef: React.RefObject<HTMLElement | null>) => {
    setHandles((prev) => ({ ...prev, [id]: elRef }));
    return () =>
      setHandles((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
  }, []);

  // Panels in document order, and the panels on either side of each handle.
  useLayoutEffect(() => {
    const before = (x: HTMLElement | null | undefined, y: HTMLElement | null | undefined) =>
      Boolean(x && y && x.compareDocumentPosition(y) & FOLLOWING);
    const order = Object.keys(panels).sort((p, q) => (before(panels[p].elRef.current, panels[q].elRef.current) ? -1 : 1));
    const links: GroupContextValue["links"] = {};
    for (const [handleId, handleRef] of Object.entries(handles)) {
      let prev: string | undefined;
      let next: string | undefined;
      for (const id of order) {
        if (before(panels[id].elRef.current, handleRef.current)) prev = id;
        else if (next === undefined) next = id;
      }
      links[handleId] = [prev, next];
    }
    // Document order is only known once the panels are in the DOM.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStructure((current) =>
      sameIds(current.order, order) &&
      Object.keys(links).length === Object.keys(current.links).length &&
      Object.entries(links).every(([id, [p, n]]) => current.links[id]?.[0] === p && current.links[id]?.[1] === n)
        ? current
        : { order, links },
    );
  }, [panels, handles]);

  // The length the panels share: the group's, less its handles.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const horizontal = orientation === "horizontal";
    const measure = () => {
      let total = 0;
      for (const id of structure.order) {
        const rect = panels[id]?.elRef.current?.getBoundingClientRect();
        if (rect) total += horizontal ? rect.width : rect.height;
      }
      setGroupPx((prev) => (Math.abs(prev - total) < 0.5 ? prev : total));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const handleRef of Object.values(handles)) if (handleRef.current) observer.observe(handleRef.current);
    return () => observer.disconnect();
  }, [orientation, structure.order, panels, handles]);

  const resolved = useMemo(
    () => structure.order.map((id) => resolveConstraints(panels[id]?.constraints ?? {}, groupPx)),
    [structure.order, panels, groupPx],
  );

  const current = useRef<{ layout: Layout | null; resolved: ResolvedConstraints[]; groupPx: number; defaultLayout?: number[] }>({
    layout: null,
    resolved: [],
    groupPx: 0,
    defaultLayout,
  });
  useLayoutEffect(() => {
    current.current = { layout, resolved, groupPx, defaultLayout: current.current.defaultLayout ?? defaultLayout };
  });

  // Lay out the panels, and keep them within their limits as the group, the
  // panels or their limits change.
  useLayoutEffect(() => {
    const order = structure.order;
    if (!order.length) return;
    const measured = groupPx > 0;
    setLayout((prev) => {
      let sizes: number[];
      if (!prev || (prev.provisional && measured)) {
        sizes = initialLayout(resolved, current.current.defaultLayout);
      } else if (sameIds(prev.ids, order)) {
        sizes = fitLayout(prev.sizes, resolved);
      } else {
        const known = new Map(prev.ids.map((id, i) => [id, prev.sizes[i]]));
        sizes = fitLayout(order.map((id, i) => known.get(id) ?? resolved[i].default ?? 100 / order.length), resolved);
      }
      const provisional = !measured && (prev?.provisional ?? true);
      return prev && prev.provisional === provisional && sameIds(prev.ids, order) && sameNumbers(prev.sizes, sizes)
        ? prev
        : { ids: order, sizes, provisional };
    });
  }, [structure.order, resolved, groupPx]);

  const lastOpen = useRef<Record<string, number>>({});
  const reported = useRef<Record<string, number>>({});
  const onLayoutRef = useRef(onLayout);
  useLayoutEffect(() => {
    onLayoutRef.current = onLayout;
  });

  useEffect(() => {
    if (!layout || layout.provisional) return;
    const { resolved: limits } = current.current;
    const seen: Record<string, number> = {};
    layout.ids.forEach((id, i) => {
      const size = layout.sizes[i];
      const limit = limits[i];
      const closed = limit ? isCollapsed(size, limit) : false;
      if (!closed) lastOpen.current[id] = size;
      seen[id] = size;
      const before = reported.current[id];
      if (before === undefined || Math.abs(before - size) > 0.0001) {
        const callbacks = panels[id]?.callbacks.current;
        callbacks?.onResize?.(size);
        const wasClosed = before !== undefined && limit ? isCollapsed(before, limit) : false;
        if (before !== undefined && wasClosed !== closed) callbacks?.onCollapsedChange?.(closed);
      }
    });
    reported.current = seen;
    onLayoutRef.current?.([...layout.sizes]);
    // Only a new layout should report; `panels` is read for its callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  const commit = useCallback((sizes: number[]) => {
    setLayout((prev) => (prev && !sameNumbers(prev.sizes, sizes) ? { ...prev, sizes, provisional: false } : prev));
  }, []);

  const value = useMemo<GroupContextValue>(
    () => ({
      orientation,
      layout,
      resolved,
      links: structure.links,
      registerPanel,
      registerHandle,
      current,
      lastOpen,
      commit,
      setDragging,
    }),
    [orientation, layout, resolved, structure.links, registerPanel, registerHandle, commit],
  );

  return (
    <div
      ref={mergedRef}
      className={clsx(styles.root, className)}
      style={{ ...themeVars.style, ...style }}
      data-orientation={orientation}
      data-dragging={dragging || undefined}
      {...otherProps}
    >
      <GroupContext.Provider value={value}>{themeVars.provide(children)}</GroupContext.Provider>
    </div>
  );
}

// ─── ResizablePanel ─────────────────────────────────────────────────────

export interface ResizablePanelProps extends Omit<React.ComponentPropsWithRef<"div">, "children"> {
  /**
   * The panel's id, which its handle's `aria-controls` points at. Generated
   * when left out; set it when the layout's panels come and go, so each
   * keeps its size.
   */
  id?: string;
  /**
   * Starting size: a number is a percentage of the group, a string such as
   * `"240px"` is pixels. Panels without one share what the others leave.
   */
  defaultSize?: PanelSize;
  /** The smallest the panel can be: a percentage, or pixels as `"200px"`. Defaults to 0. */
  minSize?: PanelSize;
  /** The largest the panel can be: a percentage, or pixels as `"480px"`. Defaults to 100. */
  maxSize?: PanelSize;
  /**
   * Let the panel collapse: dragging it past halfway below its `minSize`
   * snaps it to `collapsedSize`, and Enter on its handle collapses or
   * expands it. Defaults to `false`.
   */
  collapsible?: boolean;
  /** The size of a collapsed panel: 0 hides it, `"48px"` leaves a rail of icons. Defaults to 0. */
  collapsedSize?: PanelSize;
  /** Called with the panel's size, as a percentage of the group, whenever it changes. */
  onResize?: (size: number) => void;
  /** Called when a collapsible panel collapses (`true`) or expands (`false`). */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** The panel's content. The panel clips it: put a scrolling region inside for long content. */
  children?: React.ReactNode;
}

/**
 * One panel of a `ResizablePanels` group. It clips its content to its size;
 * give long content its own scrolling region (`ScrollBox`) inside.
 */
export function ResizablePanel({
  id: idProp,
  defaultSize,
  minSize,
  maxSize,
  collapsible = false,
  collapsedSize,
  onResize,
  onCollapsedChange,
  children,
  className,
  style,
  ref,
  ...otherProps
}: ResizablePanelProps) {
  const themeVars = useThemeCssVars();
  const group = useGroup("ResizablePanel");
  const autoId = useId();
  const id = idProp ?? autoId;
  const elRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(elRef, ref), [ref]);
  const callbacks = useRef<PanelCallbacks>({ onResize, onCollapsedChange });
  useLayoutEffect(() => {
    callbacks.current = { onResize, onCollapsedChange };
  });

  const { registerPanel } = group;
  useLayoutEffect(
    () => registerPanel(id, { elRef, callbacks, constraints: { defaultSize, minSize, maxSize, collapsible, collapsedSize } }),
    [registerPanel, id, defaultSize, minSize, maxSize, collapsible, collapsedSize],
  );

  const index = group.layout ? group.layout.ids.indexOf(id) : -1;
  const size = index >= 0 ? group.layout!.sizes[index] : typeof defaultSize === "number" ? defaultSize : undefined;
  const limit = index >= 0 ? group.resolved[index] : undefined;
  const collapsed = size !== undefined && limit ? isCollapsed(size, limit) : false;

  return (
    <div
      ref={mergedRef}
      id={id}
      className={clsx(styles.panel, className)}
      style={{ ...themeVars.style, ...(size !== undefined ? { "--resizable-panel-size": size } : null), ...style } as React.CSSProperties}
      data-collapsed={collapsed || undefined}
      {...otherProps}
    >
      {themeVars.provide(children)}
    </div>
  );
}

// ─── ResizableHandle ────────────────────────────────────────────────────

export interface ResizableHandleProps extends Omit<React.ComponentPropsWithRef<"div">, "children" | "role"> {
  /** The handle's accessible name: say what it resizes ("Resize sidebar"). Defaults to "Resize". */
  label?: string;
  /**
   * How the handle looks at rest: `line` is a hairline like a divider, `bar`
   * adds a short pill in the middle, `grip` a chip of dots. All three
   * thicken and colour the line when pointed at or dragged. Defaults to `line`.
   */
  appearance?: ResizableHandleAppearance;
  /** Fix the panels on either side at their current sizes: the handle can't be moved or focused. Defaults to `false`. */
  disabled?: boolean;
  /** How far one arrow-key press moves the handle, as a percentage of the group. Defaults to 1. */
  step?: number;
  /** How far Shift with an arrow key moves the handle, as a percentage of the group. Defaults to 10. */
  largeStep?: number;
  /** Double-clicking the handle returns the panels on either side to their default sizes. Defaults to `true`. */
  resetOnDoubleClick?: boolean;
}

/**
 * The handle between two `ResizablePanel`s. Drag it, or focus it and use the
 * arrow keys (Shift for bigger steps), Home and End for the smallest and
 * largest sizes, and Enter to collapse or expand a collapsible panel.
 */
export function ResizableHandle({
  label = "Resize",
  appearance = "line",
  disabled = false,
  step = 1,
  largeStep = 10,
  resetOnDoubleClick = true,
  className,
  style,
  ref,
  ...otherProps
}: ResizableHandleProps) {
  const themeVars = useThemeCssVars();
  const group = useGroup("ResizableHandle");
  const handleId = useId();
  const elRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(elRef, ref), [ref]);
  const [dragging, setDragging] = useState(false);

  const { registerHandle, setDragging: setGroupDragging } = group;
  useLayoutEffect(() => registerHandle(handleId, elRef), [registerHandle, handleId]);

  const horizontal = group.orientation === "horizontal";
  const [beforeId, afterId] = group.links[handleId] ?? [];

  /** The panels either side of the handle, by index in the latest layout. */
  const pair = () => {
    const { layout, resolved } = group.current.current;
    if (!layout || !beforeId || !afterId) return null;
    const a = layout.ids.indexOf(beforeId);
    const b = layout.ids.indexOf(afterId);
    if (a < 0 || b < 0 || !resolved[a] || !resolved[b]) return null;
    return { a, b, sizes: layout.sizes, resolved };
  };

  const moveTo = (targetA: number) => {
    const p = pair();
    if (p) group.commit(movePair(p.sizes, p.a, p.b, targetA, p.resolved, "exact"));
  };

  // Pointer drags, measured from where the drag started so a panel held at
  // its limit doesn't creep when the pointer comes back.
  const drag = useRef({ start: [] as number[], moved: 0, rtl: false });
  const { moveProps } = useMove({
    onMoveStart(e) {
      if (e.pointerType === "keyboard") return;
      const el = elRef.current;
      drag.current = {
        start: group.current.current.layout?.sizes ?? [],
        moved: 0,
        rtl: horizontal && !!el && getComputedStyle(el).direction === "rtl",
      };
    },
    onMove(e) {
      if (e.pointerType === "keyboard") return;
      const p = pair();
      const { groupPx } = group.current.current;
      if (!p || groupPx <= 0 || drag.current.start.length !== p.sizes.length) return;
      drag.current.moved += horizontal ? e.deltaX : e.deltaY;
      const delta = (drag.current.moved / groupPx) * 100 * (drag.current.rtl ? -1 : 1);
      const start = drag.current.start;
      group.commit(movePair(start, p.a, p.b, start[p.a] + delta, p.resolved, "drag"));
    },
  });
  // The arrow keys are handled below, with Home, End and Enter.
  const pointerMoveProps = { ...moveProps, onKeyDown: undefined };

  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    // The move hook cancels the press, so focus the handle as a button would be.
    e.currentTarget.focus({ preventScroll: true });
    setDragging(true);
    setGroupDragging(true);
    const end = () => {
      setDragging(false);
      setGroupDragging(false);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  // Keep the resize cursor while the pointer strays off the handle mid-drag.
  useEffect(() => {
    if (!dragging) return;
    const root = document.documentElement;
    const cursor = root.style.cursor;
    root.style.setProperty("cursor", horizontal ? "col-resize" : "row-resize");
    return () => root.style.setProperty("cursor", cursor);
  }, [dragging, horizontal]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const p = pair();
    if (!p) return;
    const { a, b, sizes, resolved } = p;
    const { total, lo, hi } = pairRange(sizes, a, b, resolved);
    const size = sizes[a];
    const closedA = isCollapsed(size, resolved[a]);
    const closedB = isCollapsed(sizes[b], resolved[b]);
    const rtl = horizontal && getComputedStyle(e.currentTarget).direction === "rtl";
    const keys = horizontal ? { ArrowLeft: -1, ArrowRight: 1 } : { ArrowUp: -1, ArrowDown: 1 };
    const direction = keys[e.key as keyof typeof keys];
    if (direction) {
      e.preventDefault();
      const delta = direction * (rtl ? -1 : 1) * (e.shiftKey ? largeStep : step);
      // From collapsed, the first step opens the panel to its minimum.
      if (closedA && delta > 0) moveTo(lo);
      else if (closedB && delta < 0) moveTo(hi);
      else moveTo(Math.min(Math.max(size + delta, lo), hi));
    } else if (e.key === "Home") {
      e.preventDefault();
      moveTo(lo);
    } else if (e.key === "End") {
      e.preventDefault();
      moveTo(hi);
    } else if (e.key === "Enter") {
      // Collapse or expand the panel before the handle, or after it when only that one collapses.
      const target = resolved[a].collapsible ? "a" : resolved[b].collapsible ? "b" : null;
      if (!target) return;
      e.preventDefault();
      const id = target === "a" ? beforeId! : afterId!;
      const r = target === "a" ? resolved[a] : resolved[b];
      const closed = target === "a" ? closedA : closedB;
      const restore = Math.max(group.lastOpen.current[id] ?? r.default ?? r.min, r.min);
      if (target === "a") moveTo(closed ? Math.min(Math.max(restore, lo), hi) : r.collapsed);
      else moveTo(closed ? Math.min(Math.max(total - restore, lo), hi) : total - r.collapsed);
    }
  };

  const onDoubleClick = () => {
    if (disabled || !resetOnDoubleClick) return;
    const p = pair();
    if (!p) return;
    const defaults = initialLayout(p.resolved, group.current.current.defaultLayout);
    const { lo, hi } = pairRange(p.sizes, p.a, p.b, p.resolved);
    moveTo(Math.min(Math.max(defaults[p.a], lo), hi));
  };

  // What the separator reports: the size of the panel before it, in percent.
  let value: { now: number; min: number; max: number } | null = null;
  if (group.layout && beforeId && afterId) {
    const a = group.layout.ids.indexOf(beforeId);
    const b = group.layout.ids.indexOf(afterId);
    if (a >= 0 && b >= 0 && group.resolved[a] && group.resolved[b]) {
      const { lo, hi } = pairRange(group.layout.sizes, a, b, group.resolved);
      const now = group.layout.sizes[a];
      value = { now: Math.round(now), min: Math.round(Math.min(lo, now)), max: Math.round(Math.max(hi, now)) };
    }
  }

  const interactive = disabled
    ? {}
    : mergeProps(hoverProps, focusProps, pointerMoveProps, {
        tabIndex: 0,
        onPointerDown: startDrag,
        onKeyDown,
        onDoubleClick,
      });

  return (
    <div
      {...mergeProps(otherProps, interactive)}
      ref={mergedRef}
      role="separator"
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-label={label}
      aria-controls={beforeId}
      aria-valuenow={disabled ? undefined : value?.now}
      aria-valuemin={disabled ? undefined : value?.min}
      aria-valuemax={disabled ? undefined : value?.max}
      className={clsx(styles.handle, className)}
      style={{ ...themeVars.style, ...style }}
      data-orientation={group.orientation}
      data-appearance={appearance}
      data-hovered={(isHovered && !disabled) || undefined}
      data-dragging={dragging || undefined}
      data-focus-visible={(isFocusVisible && !disabled) || undefined}
      data-disabled={disabled || undefined}
    >
      <Motion.Shift>
        <span className={styles.line} aria-hidden="true" />
      </Motion.Shift>
      {appearance === "bar" && (
        <Motion.Shift>
          <span className={styles.bar} aria-hidden="true" />
        </Motion.Shift>
      )}
      {appearance === "grip" && (
        <Motion.Shift>
          <span className={styles.grip} aria-hidden="true">
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </span>
        </Motion.Shift>
      )}
    </div>
  );
}
