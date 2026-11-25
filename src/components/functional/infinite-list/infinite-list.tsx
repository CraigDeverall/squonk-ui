"use client";

import { clsx } from "clsx";
import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { Motion } from "../../animation/motion/motion";
import { Button } from "../button/button";
import { Spinner } from "../spinner/spinner";
import styles from "./infinite-list.module.css";

// The nearest ancestor that scrolls vertically, or null for the page.
function scrollContainer(element: HTMLElement): Element | null {
  for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(parent).overflowY)) return parent;
  }
  return null;
}

export interface InfiniteListProps<T> extends Omit<React.ComponentProps<"div">, "children"> {
  /** Everything loaded so far, in order. */
  items: T[];
  /** Renders one item. It is wrapped in an `<article>`. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** A stable key for each item. */
  getKey: (item: T, index: number) => React.Key;
  /** Whether there is more to load. */
  hasMore: boolean;
  /** Whether a page is loading now. */
  loading?: boolean;
  /** Load the next page. Called when the end of the list nears the screen,
   *  and never while `loading`, after an `error` or once `hasMore` is false. */
  onLoadMore: () => void;
  /** Why the last load failed. Stops loading and offers "Try again". */
  error?: string;
  /** Total number of items, when known. Screen readers announce "item 4 of 120". */
  total?: number;
  /** Names the list, such as "Notices". Required: the feed is a landmark-like region. */
  "aria-label": string;
  /** Start loading this far before the end comes into view, in the page or
   *  in the nearest scrolling container. Defaults to `"600px"`. */
  threshold?: string;
  /** Shown and announced while loading. Defaults to `"Loading more…"`. */
  loadingText?: string;
  /** Shown once everything is loaded. Defaults to `"You've reached the end"`. */
  endText?: string;
  /** Shown when there are no items at all. */
  emptyState?: React.ReactNode;
  /**
   * Show items that arrive while people read, such as live updates from
   * someone else. An item that joins anywhere but the end slides in and
   * flashes the highlight colour once, and the items below glide to make
   * room. Pages loaded at the end, and a list replaced as a whole (a new
   * search), just show. Defaults to false.
   */
  animateArrivals?: boolean;
}

/**
 * The keys of items that arrived since the last render: new keys placed
 * before the last key already shown. Appended pages, the first render and a
 * list replaced as a whole arrive nowhere.
 */
function useArrivals(keys: React.Key[], on: boolean): Set<React.Key> {
  const [state, setState] = React.useState<{ keys: React.Key[]; arrived: Set<React.Key> }>(() => ({
    keys,
    arrived: new Set(),
  }));
  if (state.keys !== keys && state.keys.join("\u0001") !== keys.join("\u0001")) {
    const known = new Set(state.keys);
    let lastKnown = -1;
    keys.forEach((key, index) => {
      if (known.has(key)) lastKnown = index;
    });
    const arrived = new Set<React.Key>();
    if (on && lastKnown >= 0) {
      keys.forEach((key, index) => {
        if (index < lastKnown && !known.has(key)) arrived.add(key);
      });
    }
    // Only a new element plays its arrival, so an earlier arrival can be forgotten.
    setState({ keys, arrived });
    return arrived;
  }
  return state.arrived;
}

/**
 * A list that loads more as people scroll, with no button to press, in
 * the page or inside the nearest scrolling container. It follows the
 * WAI-ARIA feed pattern: each item is an `<article>` with its
 * position in the set, the feed is `aria-busy` while loading, Page Down and
 * Page Up move between items, and Ctrl+End and Ctrl+Home jump past the
 * list so the rest of the page stays reachable. A polite status line
 * announces each load. Only a failed load shows a button, to try again.
 */
export function InfiniteList<T>({
  items,
  renderItem,
  getKey,
  hasMore,
  loading = false,
  onLoadMore,
  error,
  total,
  threshold = "600px",
  loadingText = "Loading more…",
  endText = "You've reached the end",
  emptyState,
  animateArrivals = false,
  className,
  style,
  "aria-label": ariaLabel,
  ...otherProps
}: InfiniteListProps<T>) {
  const themeVars = useThemeCssVars();
  const feedRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const beforeRef = React.useRef<HTMLSpanElement>(null);
  const afterRef = React.useRef<HTMLSpanElement>(null);
  const onLoadMoreRef = React.useRef(onLoadMore);
  React.useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  // What the status line announces after each load.
  const [announcement, setAnnouncement] = React.useState("");
  const loadedBefore = React.useRef(items.length);
  React.useEffect(() => {
    if (loading) return;
    const added = items.length - loadedBefore.current;
    loadedBefore.current = items.length;
    if (added > 0) setAnnouncement(`Loaded ${added} more${hasMore ? "" : `. ${endText}`}`);
  }, [items.length, loading, hasMore, endText]);

  // Observe the sentinel afresh after every change: observing reports the
  // current intersection, so a short page that leaves the end on screen
  // loads again straight away.
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || error) return;
    if (typeof IntersectionObserver === "undefined") return;
    // Inside a scrolling panel, watch the panel: the threshold only extends
    // the observer's own root.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          onLoadMoreRef.current();
        }
      },
      { root: scrollContainer(sentinel), rootMargin: `0px 0px ${threshold} 0px` }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, error, items.length, threshold]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const articles = Array.from(feedRef.current?.querySelectorAll<HTMLElement>(":scope > article") ?? []);
    const current = articles.findIndex((article) => article.contains(document.activeElement));
    if (event.key === "PageDown" || event.key === "PageUp") {
      const next = articles[current + (event.key === "PageDown" ? 1 : -1)];
      if (current === -1 || !next) return;
      event.preventDefault();
      next.focus();
    } else if (event.ctrlKey && (event.key === "End" || event.key === "Home")) {
      event.preventDefault();
      (event.key === "End" ? afterRef : beforeRef).current?.focus();
    }
  };

  const status = error ? "" : loading ? loadingText : announcement;
  const setSize = total ?? (hasMore ? -1 : items.length);
  const keys = items.map((item, index) => getKey(item, index));
  const arrived = useArrivals(keys, animateArrivals);

  const articles = items.map((item, index) => {
    const key = keys[index];
    const article = (
      <article key={key} className={styles.item} tabIndex={-1} aria-posinset={index + 1} aria-setsize={setSize}>
        {themeVars.provide(renderItem(item, index))}
      </article>
    );
    if (!animateArrivals) return article;
    // Every item keeps the same wrappers, so an item never remounts; only a
    // new one plays its arrival.
    const isNew = arrived.has(key);
    return (
      <Motion.Presence key={key} show from="above" playOnMount={isNew}>
        <Motion.Highlight watch={key} playOnMount={isNew}>
          {article}
        </Motion.Highlight>
      </Motion.Presence>
    );
  });

  const feed = (
    <div ref={feedRef} role="feed" aria-label={ariaLabel} aria-busy={loading} className={styles.feed} onKeyDown={onKeyDown}>
      {articles}
    </div>
  );

  return (
    <div className={clsx(styles.root, className)} style={{ ...themeVars.style, ...style }} {...otherProps}>
      <span ref={beforeRef} tabIndex={-1} className={styles.edge}>Start of {ariaLabel}</span>
      {items.length === 0 && !hasMore && !loading && !error && emptyState ? (
        themeVars.provide(emptyState)
      ) : animateArrivals ? (
        // The items below an arrival glide down to make room, and up when one leaves.
        <Motion.Layout fadeIn={false}>{feed}</Motion.Layout>
      ) : (
        feed
      )}
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <div className={styles.footer}>
        {/* The status line announces loading; hide the Spinner's own status. */}
        {loading ? <span aria-hidden="true"><Spinner /></span> : null}
        <span role="status" className={clsx(styles.status, !loading && styles.visuallyHidden)}>{status}</span>
        {error ? (
          <div className={styles.error}>
            <span role="alert">{error}</span>
            <Button variant="secondary" shape="rounded" onClick={() => onLoadMoreRef.current()}>Try again</Button>
          </div>
        ) : null}
        {!hasMore && !loading && !error && items.length > 0 ? <span className={styles.end}>{endText}</span> : null}
      </div>
      <span ref={afterRef} tabIndex={-1} className={styles.edge}>End of {ariaLabel}</span>
    </div>
  );
}
