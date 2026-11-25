import React from "react";
import { createPortal } from "react-dom";
import { useSquonkTheme } from "../../theme/theme-context";
import { AppliedCssVarsContext, RootCssVarsContext, cssVariablesFor } from "../../theme/use-theme-css-vars";
import styles from "./landing.module.css";

/** The frame's own document. Loading it (rather than using the blank one a src-less frame starts with) gives a load event to mount on. */
const FRAME_DOC = "<!doctype html><html><head></head><body></body></html>";

/** The longest the screen waits for its stylesheets before showing anyway. */
const STYLES_TIMEOUT_MS = 4000;

/** Settles once the stylesheet has loaded or failed (or already had). */
const loaded = (link: HTMLLinkElement) =>
  new Promise<void>((resolve) => {
    if (link.sheet) return resolve();
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
  });

/**
 * A live screen inside a device: the children render into a small iframe at
 * a real screen size (so their media queries see a phone or a laptop, not
 * the docs page), scaled down to fit. They stay in this React tree through
 * a portal, so they follow the docs theme, colour mode and theme panel as
 * they change. The screen is a picture, not a second app: it is inert and
 * hidden from assistive technology, and mounts only as it nears the view.
 *
 * The frame loads a document of its own and the children mount into it on
 * its load event, again if it ever loads a new one, so they never land in a
 * document the browser then replaces or never paints. The screen stays
 * hidden until the children are in, styled and scaled, then fades in.
 */
export function DeviceScreen({
  label,
  width,
  height,
  children,
}: {
  /** Names the frame, for anyone who reaches it anyway. */
  label: string;
  /** The screen's CSS size, as a real device would report it. */
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [near, setNear] = React.useState(false);
  const [scale, setScale] = React.useState(0);
  const [mount, setMount] = React.useState<HTMLElement | null>(null);
  const [styled, setStyled] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const stopCopying = React.useRef<() => void>(undefined);

  // Mount when it comes within a screen of the view. The root is the box's
  // own document: with the implicit root, inside Storybook's preview frame,
  // the margin would apply to the top window and the screen would only mount
  // once actually in view.
  React.useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && setNear(true), {
      root: box.ownerDocument,
      rootMargin: "100% 0px",
    });
    io.observe(box);
    return () => io.disconnect();
  }, []);

  // Scale the full-size screen to the box.
  React.useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    // A ResizeObserver reports the starting size too.
    const ro = new ResizeObserver(() => setScale(box.clientWidth / width));
    ro.observe(box);
    return () => ro.disconnect();
  }, [width]);

  // Each time the frame loads a document, copy the page's styles into it
  // (component CSS, tokens, fonts, kept in step as more load) and mount the
  // children in its body.
  const onLoad = React.useCallback((event: React.SyntheticEvent<HTMLIFrameElement>) => {
    const doc = event.currentTarget.contentDocument;
    stopCopying.current?.();
    if (!doc?.body) return;
    const sheets: Promise<void>[] = [];
    const copy = (node: Node) => {
      if (node instanceof HTMLStyleElement || (node instanceof HTMLLinkElement && node.rel === "stylesheet")) {
        const clone = doc.head.appendChild(node.cloneNode(true));
        if (clone instanceof HTMLLinkElement) sheets.push(loaded(clone));
      }
    };
    document.head.childNodes.forEach(copy);
    const observer = new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach(copy)));
    observer.observe(document.head, { childList: true });
    let current = true;
    stopCopying.current = () => {
      current = false;
      observer.disconnect();
    };
    doc.body.style.margin = "0";
    setStyled(false);
    setMount(doc.body);
    const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, STYLES_TIMEOUT_MS));
    void Promise.race([Promise.all(sheets), timeout]).then(() => current && setStyled(true));
  }, []);

  React.useEffect(() => () => stopCopying.current?.(), []);

  // Show it once the children are in, styled and scaled: a frame later, so
  // they have laid out, reading the frame's layout so it is done.
  const ready = Boolean(mount && styled && scale > 0);
  React.useEffect(() => {
    if (!ready || !mount) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        void mount.offsetHeight;
        setShown(true);
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [ready, mount]);

  return (
    <div ref={boxRef} className={styles.screen} style={{ aspectRatio: `${width} / ${height}` }}>
      {near && (
        <iframe
          className={styles.screenFrame}
          data-shown={shown || undefined}
          title={label}
          aria-hidden="true"
          tabIndex={-1}
          inert
          srcDoc={FRAME_DOC}
          onLoad={onLoad}
          style={{ width, height, transform: `scale(${scale})` }}
        />
      )}
      {mount && createPortal(<FrameTheme>{children}</FrameTheme>, mount)}
    </div>
  );
}

/** Writes the current theme onto the frame's own :root, so its components start from it. */
function FrameTheme({ children }: { children: React.ReactNode }) {
  const theme = useSquonkTheme();
  const vars = cssVariablesFor(theme);
  const css = React.useMemo(
    () =>
      `:root{color-scheme:${theme.mode};${Object.entries(vars).map(([name, value]) => `${name}:${value}`).join(";")}}` +
      "body{background-color:var(--squonk-roles-color-page);color:var(--squonk-roles-color-text);font-family:var(--squonk-roles-type-font)}",
    [theme.mode, vars],
  );
  return (
    <RootCssVarsContext.Provider value={vars}>
      <AppliedCssVarsContext.Provider value={null}>
        <style>{css}</style>
        {children}
      </AppliedCssVarsContext.Provider>
    </RootCssVarsContext.Provider>
  );
}
