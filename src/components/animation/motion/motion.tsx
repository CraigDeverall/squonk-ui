"use client";

import { clsx } from "clsx";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { easingFunction } from "../../../theme/motion-curves";
import { motionTiming } from "./motion-timing";
import styles from "./motion.module.css";

/**
 * The one element a Motion component animates. Its `className` may be a
 * string or a React Aria render function; the motion class is added to it.
 */
export type MotionChild = React.ReactElement<{ className?: unknown }>;

type ClassNameFn = (values: never) => string | undefined;

/** Add `className` to the single child, keeping its own (string or React Aria function). */
function withMotion(children: MotionChild, className: string) {
  const child = React.Children.only(children);
  const own = child.props.className;
  const merged =
    typeof own === "function"
      ? (values: never) => clsx((own as ClassNameFn)(values), className)
      : clsx(own as string | undefined, className);
  return React.cloneElement(child, { className: merged });
}

/**
 * What a Motion component passes on to its element when another Motion
 * component wraps it, so they nest: a Presence around a Highlight around a
 * Card all reach the Card.
 */
export interface MotionForwardProps {
  /** Added to the element's own class. */
  className?: string;
  /** Merged into the element's own style. */
  style?: React.CSSProperties;
  /** Given the element too, alongside its own ref. */
  ref?: React.Ref<Element>;
}

/** The single child, with whatever an outer Motion component passed on. */
function forward(children: MotionChild, { className, style, ref }: MotionForwardProps): MotionChild {
  let child = React.Children.only(children) as MotionChild;
  if (className) child = withMotion(child, className) as MotionChild;
  if (style) child = withVars(child, style as Record<string, string | number>) as MotionChild;
  if (ref) child = withRef(child, (el) => setRef(ref, el)) as MotionChild;
  return child;
}

/** How quickly something opens: `overlay` for menus and popovers, `arrive` for dialogs, drawers and notifications. */
export type MotionPace = "overlay" | "arrive";

export interface FeedbackProps extends MotionForwardProps {
  /** The control that answers hover, press, focus and selection. */
  children: MotionChild;
  /** A text field or a group around one: focus from any input (not only the keyboard) counts as engaged. */
  field?: boolean;
  /** Fade the same way in and out, for a part that travels (a switch's thumb) rather than changes colour. */
  even?: boolean;
}

/**
 * A control's response to hover, press, focus and selection: it appears the
 * moment the control is touched and fades back to rest. The state may sit on
 * the child, on its parent (a checkbox's box inside its label) or, for
 * selection, on the field around that.
 */
function Feedback({ children, field, even, ...forwarded }: FeedbackProps) {
  return withMotion(forward(children, forwarded), clsx(styles.feedback, field && styles.field, even && styles.even));
}

export interface PopProps extends MotionForwardProps {
  /** The overlay: a React Aria Popover, Tooltip or Modal, or a toast. */
  children: MotionChild;
  /** How quickly it opens. It always closes at the `overlay` pace. Defaults to `overlay`. */
  pace?: MotionPace;
  /** Play as soon as it mounts, for elements with no entering state (toasts). */
  playOnMount?: boolean;
}

/**
 * An overlay fading and growing in as it opens, and shrinking away as it
 * closes. Follows React Aria's `data-entering` and `data-exiting` on the
 * child or on its backdrop.
 */
function Pop({ children, pace = "overlay", playOnMount, ...forwarded }: PopProps) {
  return withMotion(forward(children, forwarded), clsx(styles.pop, pace === "arrive" && styles.arrive, playOnMount && styles.mount));
}

export interface DimProps extends MotionForwardProps {
  /** The backdrop: a React Aria ModalOverlay. */
  children: MotionChild;
  /** How quickly it dims the page. It always clears at the `overlay` pace. Defaults to `overlay`. */
  pace?: MotionPace;
}

/** The page dimming behind a dialog or drawer as it opens, and clearing as it closes. */
function Dim({ children, pace = "overlay", ...forwarded }: DimProps) {
  return withMotion(forward(children, forwarded), clsx(styles.dim, pace === "arrive" && styles.arrive));
}

export interface SlideProps extends MotionForwardProps {
  /** The panel: a React Aria Modal, inside a backdrop that enters and exits. */
  children: MotionChild;
  /** The screen edge it arrives from. Defaults to `end`. */
  from?: "start" | "end" | "bottom";
}

/** A panel arriving from an edge of the screen and retracing its path as it leaves. */
function Slide({ children, from = "end", ...forwarded }: SlideProps) {
  return withMotion(forward(children, forwarded), clsx(styles.slide, from === "start" && styles.start, from === "bottom" && styles.bottom));
}

export interface CollapseProps extends MotionForwardProps {
  /** The panel: a React Aria DisclosurePanel, directly inside its Disclosure. */
  children: MotionChild;
}

/**
 * A disclosure panel growing open and shrinking closed. It takes its height
 * from the `--disclosure-panel-height` React Aria sets while it moves.
 */
function Collapse({ children, ...forwarded }: CollapseProps) {
  return withMotion(forward(children, forwarded), styles.collapse);
}

export interface ShiftProps extends MotionForwardProps {
  /**
   * The element that changes. Name what moves with `--motion-property` in its
   * stylesheet (all properties by default), and optionally its own duration
   * with `--motion-duration`, bound to a component motion token, and a wait
   * before it starts with `--motion-delay`.
   */
  children: MotionChild;
}

/** A small change within the page easing into place: a colour shifting, a chevron turning, an indicator sliding. */
function Shift({ children, ...forwarded }: ShiftProps) {
  return withMotion(forward(children, forwarded), styles.shift);
}

export interface LoopProps extends MotionForwardProps {
  /** The element that loops. */
  children: MotionChild;
}

/** One full turn, repeating: a spinner. Slows down with reduced motion. */
function Spin({ children, ...forwarded }: LoopProps) {
  return withMotion(forward(children, forwarded), styles.spin);
}

/** A bar sweeping across its track, repeating: indeterminate progress. Slows down with reduced motion. */
function Sweep({ children, ...forwarded }: LoopProps) {
  return withMotion(forward(children, forwarded), styles.sweep);
}

/**
 * A highlight passing across a placeholder, repeating: loading skeletons.
 * The child paints the highlight as a 200px-wide background image. Stops with
 * reduced motion.
 */
function Shimmer({ children, ...forwarded }: LoopProps) {
  return withMotion(forward(children, forwarded), styles.shimmer);
}

/** A gentle breathing, repeating: a live status dot. Stops with reduced motion. */
function Pulse({ children, ...forwarded }: LoopProps) {
  return withMotion(forward(children, forwarded), styles.pulse);
}

/**
 * A line's dashes marching from its start to its end, repeating: something
 * flowing along a link. The child sets its own `stroke-dasharray`, and
 * `--motion-flow-period` to the length of one dash and its gap (18px by
 * default). `--motion-loop-duration` sets the pace. Stops with reduced motion.
 */
function Flow({ children, ...forwarded }: LoopProps) {
  return withMotion(forward(children, forwarded), styles.flow);
}

/**
 * Something travelling along a path from start to end, repeating: a dot
 * moving along a line. The child sets `offset-path`; `--motion-loop-duration`
 * sets the pace and a negative `--motion-loop-delay` starts it part way along.
 * Hidden with reduced motion, where it would stand still mid-path.
 */
function Travel({ children, ...forwarded }: LoopProps) {
  return withMotion(forward(children, forwarded), styles.travel);
}


/** The position of the nearest Motion.Stagger child this sits in, if any. */
const StaggerIndex = React.createContext<number | undefined>(undefined);

type StyleValue = React.CSSProperties | ((values: never) => React.CSSProperties | undefined) | undefined;

/** Add custom properties to the child's style, keeping its own (object or React Aria function). */
function withVars(child: React.ReactElement, vars: Record<string, string | number>) {
  const own = (child.props as { style?: StyleValue }).style;
  const style =
    typeof own === "function"
      ? (values: never) => ({ ...own(values), ...vars }) as React.CSSProperties
      : ({ ...own, ...vars } as React.CSSProperties);
  return React.cloneElement(child as React.ReactElement<{ style?: StyleValue }>, { style });
}

/** The child, with its stagger position (or 0, so it never inherits one). */
function useStaggered(child: React.ReactElement) {
  const index = React.useContext(StaggerIndex) ?? 0;
  return withVars(child, { "--motion-index": index });
}

type RefChildProps = { ref?: React.Ref<Element> };

const setRef = (ref: React.Ref<Element> | undefined, node: Element | null) => {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as React.RefObject<Element | null>).current = node;
};

/** Give the child's element to `attach` as well as to the child's own ref. */
function withRef(child: React.ReactElement, attach: (el: Element | null) => void) {
  const own = (child.props as RefChildProps).ref;
  return React.cloneElement(child as React.ReactElement<RefChildProps>, {
    ref: (el: Element | null) => {
      attach(el);
      setRef(own, el);
    },
  });
}

/** A ref and a stable callback that fills it, for withRef. */
function useNode() {
  const node = useRef<Element | null>(null);
  const attach = React.useCallback((el: Element | null) => {
    node.current = el;
  }, []);
  return [node, attach] as const;
}

/** How many times `watch` has changed since mount: 0 until it first changes. */
function useChangeCount(watch: unknown, start = 0) {
  const [seen, setSeen] = useState({ value: watch, count: start });
  if (!Object.is(seen.value, watch)) {
    const next = { value: watch, count: seen.count + 1 };
    setSeen(next);
    return next.count;
  }
  return seen.count;
}

export interface StaggerProps {
  /** The items, in the order they arrive. Each may hold Motion components anywhere inside it. */
  children: React.ReactNode;
}

/**
 * Items arriving one after another rather than all at once. Gives the
 * Motion.Reveal, Presence and Swap inside each child a delay of one
 * stagger step (`--squonk-roles-motion-stagger`) more than the child before, up
 * to twelve steps. Adds no markup.
 */
function Stagger({ children }: StaggerProps) {
  let index = 0;
  return (
    <>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? <StaggerIndex.Provider value={index++}>{child}</StaggerIndex.Provider> : child,
      )}
    </>
  );
}

export interface MotionRevealProps extends MotionForwardProps {
  /** The element that arrives. It must accept a `ref`, `className`, `style` and `onFocusCapture`. */
  children: MotionChild;
  /** Extra delay before it starts, in ms, on top of any Motion.Stagger position. Defaults to 0. */
  delayMs?: number;
  /**
   * How far below its place it starts, in px. Negative starts above.
   * Defaults to the theme's `--squonk-roles-motion-reveal-offset`.
   */
  yOffsetPx?: number;
  /** Play once and stay (default), or again each time it re-enters the viewport. */
  once?: boolean;
  /** How far before the viewport edge it starts, as a CSS margin. Defaults to `-60px`. */
  rootMargin?: string;
}

type RevealChildProps = {
  ref?: React.Ref<Element>;
  style?: React.CSSProperties;
  onFocusCapture?: React.FocusEventHandler;
};

/**
 * Content fading and rising into place as it scrolls into view, for page
 * sections and cards arriving, never for content someone is working with.
 * Content already on screen, or focused, shows at once, and it stays visible
 * if the animation never runs (no IntersectionObserver). With reduced motion
 * it only fades.
 */
function Reveal({ children, delayMs = 0, yOffsetPx, once = true, rootMargin = "-60px", ...forwarded }: MotionRevealProps) {
  const child = forward(children, forwarded) as React.ReactElement<RevealChildProps & { className?: unknown }>;
  const index = React.useContext(StaggerIndex) ?? 0;
  const node = useRef<Element | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const el = node.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const rect = el.getBoundingClientRect();
    const inViewport = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    // Server output and content already visible at hydration stay visible.
    if (inViewport || el.contains(document.activeElement)) {
      setShown(true);
      if (once) return;
    } else {
      setShown(false);
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) obs.disconnect();
        } else if (!once && !el.contains(document.activeElement)) {
          setShown(false);
        }
      },
      { rootMargin },
    );
    observer.current = obs;
    obs.observe(el);
    return () => {
      obs.disconnect();
      observer.current = null;
    };
  }, [once, rootMargin]);

  const own = child.props;
  const moved = withMotion(child, clsx(styles.reveal, shown && styles.revealed)) as React.ReactElement<RevealChildProps>;
  return React.cloneElement(moved, {
    ref: (el: Element | null) => {
      node.current = el;
      setRef(own.ref, el);
    },
    style: {
      ...own.style,
      ...(yOffsetPx === undefined ? {} : { "--motion-reveal-offset": `${yOffsetPx}px` }),
      "--motion-reveal-delay": `${delayMs}ms`,
      "--motion-index": index,
    } as React.CSSProperties,
    onFocusCapture: (event: React.FocusEvent) => {
      own.onFocusCapture?.(event);
      setShown(true);
      if (once) observer.current?.disconnect();
    },
  });
}

/** The side something nudges in from and back out to, or `fade` to only fade. */
export type PresenceFrom = "below" | "above" | "start" | "end" | "fade";

export interface PresenceProps extends MotionForwardProps {
  /** The element that joins and leaves. It must accept a `ref`, `className` and `style`. */
  children: MotionChild;
  /** Whether it's on the page. Turning it off plays the exit, then unmounts it. */
  show: boolean;
  /** The side it nudges in from and out to. Defaults to `below`. */
  from?: PresenceFrom;
  /** Play the entrance when it's shown on first render too. Defaults to false: content there from the start just shows. */
  playOnMount?: boolean;
  /** Called once it has finished leaving and unmounted. */
  onExited?: () => void;
}

type PresenceState = "entering" | "shown" | "exiting" | "gone";

/**
 * An element joining or leaving the page: it fades and nudges in when
 * `show` turns on, and fades and nudges out before it unmounts when `show`
 * turns off. For things that come and go in response to someone's action
 * (an alert dismissed, a row of filters added) that aren't React Aria
 * overlays, which move with Pop, Slide and Dim.
 */
function Presence({ children, show, from = "below", playOnMount = false, onExited, ...forwarded }: PresenceProps) {
  const [state, setState] = useState<PresenceState>(show ? (playOnMount ? "entering" : "shown") : "gone");
  const [lastShow, setLastShow] = useState(show);
  if (show !== lastShow) {
    setLastShow(show);
    setState(show ? "entering" : "exiting");
  }
  const [node, attach] = useNode();
  const exited = useRef(onExited);
  useEffect(() => {
    exited.current = onExited;
  });

  useEffect(() => {
    if (state !== "entering" && state !== "exiting") return;
    const finish = () => setState((s) => (s === "exiting" ? "gone" : s === "entering" ? "shown" : s));
    const el = node.current;
    const running = el && "getAnimations" in el ? el.getAnimations() : [];
    if (running.length === 0) {
      finish();
      return;
    }
    let live = true;
    Promise.all(running.map((animation) => animation.finished)).then(
      () => live && finish(),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [state, node]);

  useEffect(() => {
    if (state === "gone" && !show) exited.current?.();
  }, [state, show]);

  const child = useStaggered(forward(children, forwarded));
  if (state === "gone") return null;
  return withRef(
    withMotion(
      child as MotionChild,
      clsx(
        styles.presence,
        from !== "below" && styles[from],
        state === "entering" && styles.entering,
        state === "exiting" && styles.exiting,
      ),
    ),
    attach,
  );
}

export interface SwapProps extends MotionForwardProps {
  /** The element whose content is replaced. It must accept `className` and `style`. */
  children: MotionChild;
  /** What the content shows (a tab's key, a loading flag, a record id). Each change replays the swap. */
  watch: unknown;
}

/**
 * Content replaced in place easing in: the new content fades and rises a
 * little into place each time `watch` changes. A tab's panel, loaded
 * content replacing its placeholder, the next step of a flow. Nothing plays
 * on first render. An element hidden and shown again (a tab panel) replays
 * it as it shows.
 */
function Swap({ children, watch, ...forwarded }: SwapProps) {
  const count = useChangeCount(watch);
  const child = useStaggered(forward(children, forwarded));
  return withMotion(child as MotionChild, clsx(styles.swap, count > 0 && (count % 2 ? styles.odd : styles.even)));
}

export interface HighlightProps extends MotionForwardProps {
  /** The element that changed. Its own background shows once the highlight fades. */
  children: MotionChild;
  /** The value to watch (a total, an updated-at time, a status). Each change replays the highlight. */
  watch: unknown;
  /**
   * Play the highlight when it first appears too, for something that has
   * just arrived, such as a row added by someone else. Defaults to false:
   * nothing plays on first render.
   */
  playOnMount?: boolean;
}

/**
 * Something that just changed drawing the eye: its background flashes the
 * highlight colour and fades back to its own. For a value updated by
 * someone else or by the system (a recalculated total, a row saved
 * elsewhere), where the change might otherwise go unnoticed. Nothing plays
 * on first render unless `playOnMount` is set.
 */
function Highlight({ children, watch, playOnMount = false, ...forwarded }: HighlightProps) {
  const count = useChangeCount(watch, playOnMount ? 1 : 0);
  return withMotion(forward(children, forwarded), clsx(styles.highlight, count > 0 && (count % 2 ? styles.odd : styles.even)));
}

export interface LayoutProps extends MotionForwardProps {
  /** The container whose direct children move: a list, a stack, a table body. It must accept a `ref`. */
  children: MotionChild;
  /** Fade in children that join. Turn off when they arrive with their own motion (toasts). Defaults to true. */
  fadeIn?: boolean;
  /**
   * Which elements move, as a CSS selector from the container, when they
   * aren't its direct children (`"[data-toast-key]"`). Defaults to the
   * direct children.
   */
  items?: string;
}

const LAYOUT_ID = "squonk-motion-layout";
// Beyond this many children, measuring every change costs more than the
// motion is worth: the list just changes.
const LAYOUT_LIMIT = 150;

const translateOf = (el: Element): [number, number] => {
  const [x = "0", y = "0"] = getComputedStyle(el).translate.split(" ");
  const px = (v: string) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0);
  return [px(x), px(y)];
};

/**
 * A list's items gliding to their new places when it's sorted, filtered,
 * or gains or loses an item, instead of jumping. Joining items fade in.
 * Interrupted glides carry on from where they are. With reduced motion
 * items move at once. Works on any container whose children React keys:
 * it follows the container's children in the DOM.
 */
function Layout({ children, fadeIn = true, items: itemSelector, ...forwarded }: LayoutProps) {
  // State, not a ref: the container may mount later than this (a toast
  // region appears with its first toast).
  const [container, setContainer] = useState<Element | null>(null);
  const fade = useRef(fadeIn);
  useLayoutEffect(() => {
    fade.current = fadeIn;
  });

  useEffect(() => {
    if (!container || typeof MutationObserver === "undefined") return;
    // Places on screen, less any glide under way: where each item's layout
    // puts it. Kept current as the page scrolls or resizes, so only a change
    // to the list itself moves anything.
    const places = new WeakMap<Element, { x: number; y: number }>();
    const isGliding = (el: Element) => el.getAnimations().some((animation) => animation.id === LAYOUT_ID);
    const placeOf = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const [tx, ty] = isGliding(el) ? translateOf(el) : [0, 0];
      return { x: rect.left - tx, y: rect.top - ty };
    };
    const items = () =>
      Array.from(itemSelector ? container.querySelectorAll(itemSelector) : container.children).filter(
        (el): el is HTMLElement => el instanceof HTMLElement,
      );
    const record = () => {
      const kids = items();
      if (kids.length <= LAYOUT_LIMIT) kids.forEach((el) => places.set(el, placeOf(el)));
    };
    record();
    let frame = 0;
    const recordSoon = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(record);
    };

    const settle = () => {
      const kids = items();
      if (kids.length > LAYOUT_LIMIT) return;
      const move = motionTiming(container, "--squonk-roles-motion-layout", "--squonk-roles-motion-standard");
      const join = motionTiming(container, "--squonk-roles-motion-layout", "--squonk-roles-motion-enter");
      for (const el of kids) {
        const before = places.get(el);
        // Where it shows now, including a glide under way, before that stops.
        const [cx, cy] = isGliding(el) ? translateOf(el) : [0, 0];
        el.getAnimations().forEach((animation) => animation.id === LAYOUT_ID && animation.cancel());
        const now = placeOf(el);
        places.set(el, now);
        if (move.ms <= 0) continue;
        if (!before) {
          if (fade.current) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: join.ms, easing: join.easing });
          continue;
        }
        if (move.reduced) continue;
        const dx = before.x + cx - now.x;
        const dy = before.y + cy - now.y;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        const glide = el.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0px 0px" }], {
          duration: move.ms,
          easing: move.easing,
        });
        glide.id = LAYOUT_ID;
      }
    };

    // With an item selector the items may sit deeper (and their lists come
    // and go), so watch the whole subtree.
    const mutations = new MutationObserver((records) => {
      if (!itemSelector) return settle();
      if (records.some((r) => r.addedNodes.length || r.removedNodes.length)) settle();
    });
    mutations.observe(container, { childList: true, subtree: Boolean(itemSelector) });
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(recordSoon);
    resize?.observe(container);
    window.addEventListener("scroll", recordSoon, { capture: true, passive: true });
    window.addEventListener("resize", recordSoon);
    return () => {
      mutations.disconnect();
      resize?.disconnect();
      window.removeEventListener("scroll", recordSoon, { capture: true });
      window.removeEventListener("resize", recordSoon);
      cancelAnimationFrame(frame);
    };
  }, [container, itemSelector]);

  return withRef(forward(children, forwarded), setContainer);
}

export interface CountProps {
  /** The figure. When it changes, the shown figure counts from the old value to this one. */
  value: number;
  /** How to format the figure, as for `Intl.NumberFormat` (`{ style: "currency", currency: "NZD" }`). */
  formatOptions?: Intl.NumberFormatOptions;
  /** The locale to format in (`"en-NZ"`). Defaults to the runtime's; give one when the server's and browser's may differ. */
  locale?: string;
  /** Format the figure yourself instead. Called for every frame of the count. */
  format?: (value: number) => string;
  /** Count up from zero when it first appears. Defaults to false: the figure shows as it is. */
  playOnMount?: boolean;
  /** Merged onto the figure's element. */
  className?: string;
}

const decimalsOf = (n: number) => Math.min((String(n).split(".")[1] ?? "").length, 6);

/**
 * A figure counting to its new value rather than jumping: a total
 * recalculating, a KPI updating. The digits keep one width as it counts.
 * Assistive technology hears only the final value. With reduced motion the
 * figure changes at once.
 */
function Count({ value, formatOptions, locale, format, playOnMount = false, className }: CountProps) {
  const optionsKey = JSON.stringify(formatOptions ?? {});
  const formatter = React.useMemo(
    () => new Intl.NumberFormat(locale, JSON.parse(optionsKey) as Intl.NumberFormatOptions),
    [locale, optionsKey],
  );
  const text = format ?? ((n: number) => formatter.format(n));
  const [shown, setShown] = useState(value);
  const node = useRef<HTMLSpanElement>(null);
  const current = useRef(value);
  const first = useRef(true);

  useLayoutEffect(() => {
    const from = first.current && playOnMount ? 0 : current.current;
    first.current = false;
    const timing = motionTiming(node.current, "--squonk-roles-motion-count", "--squonk-roles-motion-enter");
    if (from === value || timing.ms <= 0 || timing.reduced || typeof requestAnimationFrame === "undefined") {
      current.current = value;
      setShown(value);
      return;
    }
    const ease = easingFunction(timing.easing);
    const decimals = Math.max(decimalsOf(value), decimalsOf(from));
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / timing.ms);
      const next = progress >= 1 ? value : Number((from + (value - from) * ease(progress)).toFixed(decimals));
      current.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    current.current = from;
    setShown(from);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Only a new value starts a count; formatting changes just re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={node} className={clsx(styles.count, className)}>
      <span aria-hidden="true">{text(shown)}</span>
      <span className={styles.countFinal}>{text(value)}</span>
    </span>
  );
}

/**
 * The library's motion. Every animation and transition in a component comes
 * from one of these, so all components move alike, take their timing from the
 * motion purposes (which the theme's motion primitives set) and follow the
 * motion level (`SquonkThemeProvider`'s `motion` prop and the device's
 * reduced-motion setting). Each wraps exactly one element and adds no markup
 * of its own, except `Stagger`, which orders several, and `Count`, which
 * renders a figure.
 */
export const Motion = {
  Feedback,
  Pop,
  Dim,
  Slide,
  Collapse,
  Shift,
  Spin,
  Sweep,
  Shimmer,
  Pulse,
  Flow,
  Travel,
  Reveal,
  Stagger,
  Presence,
  Swap,
  Highlight,
  Layout,
  Count,
};
