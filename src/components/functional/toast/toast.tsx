"use client";

import { clsx } from "clsx";
import React from "react";
import {
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastQueue as AriaToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
} from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { Alert, type AlertTone } from "../alert/alert";
import styles from "./toast.module.css";
import { Motion } from "../../animation/motion/motion";
import { motionTiming } from "../../animation/motion/motion-timing";

export type ToastTone = AlertTone;

export interface ToastOptions {
  /** Semantic color. Defaults to `"info"`. */
  tone?: ToastTone;
  /** Optional bold heading above the message. */
  title?: string;
  /** Toast body. */
  message: React.ReactNode;
  /** Auto-dismiss delay in ms; `0` keeps the toast until dismissed. Defaults to `5000`. */
  duration?: number;
  /** One button inside the toast, such as "Undo". Activating it calls
   *  `onAction`, then dismisses the toast. A toast goes away on its own, so
   *  the same action must also be available elsewhere on the page. */
  action?: ToastAction;
}

export interface ToastAction {
  /** The button's text: a short verb, such as "Undo" or "View". */
  label: string;
  /** Called when the button is activated; the toast is then dismissed. */
  onAction: () => void;
}

export interface ToastHandle {
  /** Show a toast; returns an id usable with `dismiss`. */
  show: (options: ToastOptions) => string;
  /** Sugar for `show({ tone: "success", message })`. */
  success: (message: React.ReactNode, title?: string) => string;
  /** Sugar for `show({ tone: "error", message })`. */
  error: (message: React.ReactNode, title?: string) => string;
  /** Sugar for `show({ tone: "info", message })`. */
  info: (message: React.ReactNode, title?: string) => string;
  /** Sugar for `show({ tone: "warning", message })`. */
  warning: (message: React.ReactNode, title?: string) => string;
  /** Remove a toast early by the id `show` returned. */
  dismiss: (id: string) => void;
}

export type ToastPosition =
  | "top-right"
  | "top-center"
  | "bottom-right"
  | "bottom-center";

export interface ToastProviderProps {
  /** Corner the stack grows from. Defaults to `"bottom-right"`. */
  position?: ToastPosition;
  /** Default auto-dismiss delay in ms for toasts that don't set one. Defaults to `5000`. */
  duration?: number;
  /** Maximum visible notifications. Positive integer; defaults to 3. */
  maxVisible?: number;
  /** Maximum waiting notifications. Positive integer; defaults to 50. */
  maxQueued?: number;
  /** Called instead of displaying a new toast when the queue is full. */
  onOverflow?: (options: ToastOptions) => void;
  /** The app, or the part of it that calls `useToast`. */
  children?: React.ReactNode;
}

const ToastContext = React.createContext<ToastHandle | null>(null);

// How long a closing toast animates out before React Aria removes it: the
// overlay pace of the theme and motion level where the toast is (0 when
// motion is off).
const exitMs = (toast: Element | null) => motionTiming(toast, "--squonk-roles-motion-overlay").ms;

/**
 * React Aria's queue removes a toast the moment it closes. This one marks
 * it as exiting first, so it can animate out, then removes it.
 */
class ExitingToastQueue<T> extends AriaToastQueue<T> {
  private exiting = new Set<string>();

  private listeners = new Set<() => void>();

  subscribeExiting = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  isExiting = (key: string) => this.exiting.has(key);

  close(key: string): void {
    if (this.exiting.has(key)) return;
    const ms = exitMs(typeof document === "undefined" ? null : document.querySelector(`[data-toast-key="${CSS.escape(key)}"]`));
    if (ms <= 0) {
      super.close(key);
      return;
    }
    this.exiting.add(key);
    this.listeners.forEach((listener) => listener());
    setTimeout(() => {
      this.exiting.delete(key);
      super.close(key);
    }, ms);
  }
}

const urgency = (options: ToastOptions) => (options.tone === "error" || options.tone === "warning" ? 0 : 1);

const positiveLimit = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;

/**
 * Imperative access to the toast stack. Must be called under a
 * `ToastProvider`; throws otherwise so a missing provider fails loudly in
 * development instead of silently dropping notifications.
 */
export function useToast(): ToastHandle {
  const handle = React.useContext(ToastContext);
  if (!handle) {
    throw new Error("useToast must be used within a <ToastProvider>.");
  }
  return handle;
}

function ToastItem({ queue, toast, theme }: {
  queue: ExitingToastQueue<ToastOptions>;
  toast: { key: string; content: ToastOptions };
  theme: ReturnType<typeof useThemeCssVars>;
}) {
  const exiting = React.useSyncExternalStore(queue.subscribeExiting, () => queue.isExiting(toast.key), () => false);
  const labelId = React.useId();
  const options = toast.content;
  const action = options.action;
  return (
    // The Alert is the toast's only live region and names it.
    <Motion.Pop pace="arrive" playOnMount>
      <AriaToast toast={toast} className={styles.root} data-toast-key={toast.key} data-exiting={exiting || undefined} aria-labelledby={labelId}>
        {theme.provide(
          <Alert id={labelId} tone={options.tone ?? "info"} title={options.title} onDismiss={() => queue.close(toast.key)}>
            {action ? (
              // A real button after the message: it follows the message in
              // the announcement, and in the tab order sits before Dismiss.
              <div className={styles.content}>
                <div>{options.message}</div>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    action.onAction();
                    queue.close(toast.key);
                  }}
                >
                  {action.label}
                </button>
              </div>
            ) : options.message}
          </Alert>
        )}
      </AriaToast>
    </Motion.Pop>
  );
}

/**
 * Provides the `useToast` hook and renders the toast stack in a portal on
 * `document.body`. Mount once near the app root.
 *
 * Built on React Aria's toast region (an `UNSTABLE_`-prefixed API in React
 * Aria): timers pause while the stack is hovered or focused and while the
 * page is hidden, `F6` or `Alt+T` moves focus to the notifications,
 * `Escape` dismisses a focused toast, and focus is restored when the last
 * focused toast closes. Toasts beyond `maxVisible` wait (errors and warnings
 * first, otherwise in order) and start their timers when shown. Toasts
 * render as elevated `Alert`s, so tones and dark mode follow the ambient
 * theme automatically.
 */
export function ToastProvider({
  position = "bottom-right",
  duration = 5000,
  maxVisible = 3,
  maxQueued = 50,
  onOverflow,
  children,
}: ToastProviderProps) {
  const visibleLimit = positiveLimit(maxVisible, 3);
  const queueLimit = positiveLimit(maxQueued, 50);
  const themeVars = useThemeCssVars({ portal: true });
  const [queue] = React.useState(() => new ExitingToastQueue<ToastOptions>());
  const regionRef = React.useRef<HTMLDivElement>(null);
  // React Aria shows the newest toasts and hides older ones; ours show in
  // order, so toasts wait here until a slot frees.
  const waiting = React.useRef<{ id: string; options: ToastOptions }[]>([]);
  const shown = React.useRef(new Map<string, string>());
  const counter = React.useRef(0);

  const presentNext = React.useRef<() => void>(() => {});
  const present = React.useCallback((id: string, options: ToastOptions) => {
    const delay = options.duration ?? duration;
    const key = queue.add(options, {
      timeout: delay > 0 ? delay : undefined,
      onClose: () => {
        shown.current.delete(id);
        // React Aria removes the closed toast by index after this returns;
        // adding the next one first would shift that index.
        queueMicrotask(() => presentNext.current());
      },
    });
    shown.current.set(id, key);
  }, [duration, queue]);
  React.useEffect(() => {
    presentNext.current = () => {
      const next = waiting.current.shift();
      if (next) present(next.id, next.options);
    };
  }, [present]);

  const show = React.useCallback((options: ToastOptions): string => {
    const id = `toast-${++counter.current}`;
    if (shown.current.size < visibleLimit && waiting.current.length === 0) present(id, options);
    else if (waiting.current.length < queueLimit) {
      // Errors and warnings wait ahead of other tones; each tone keeps its order.
      const rank = urgency(options);
      const at = waiting.current.findIndex((entry) => urgency(entry.options) > rank);
      waiting.current.splice(at === -1 ? waiting.current.length : at, 0, { id, options });
    } else onOverflow?.(options);
    return id;
  }, [onOverflow, present, queueLimit, visibleLimit]);

  const dismiss = React.useCallback((id: string) => {
    const key = shown.current.get(id);
    if (key) queue.close(key);
    else waiting.current = waiting.current.filter((entry) => entry.id !== id);
  }, [queue]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.code === "KeyT" && regionRef.current) {
        event.preventDefault();
        regionRef.current.focus();
        return;
      }
      if (event.key !== "Escape" || !(event.target instanceof Element)) return;
      const toast = event.target.closest('[role="alertdialog"]');
      const key = toast && regionRef.current?.contains(toast) ? toast.getAttribute("data-toast-key") : null;
      if (key) queue.close(key);
    };
    // Timers also wait while the page is hidden.
    const onVisibilityChange = () => (document.hidden ? queue.pauseAll() : queue.resumeAll());
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [queue]);

  const handle = React.useMemo<ToastHandle>(() => ({
    show,
    dismiss,
    success: (message, title) => show({ tone: "success", message, title }),
    error: (message, title) => show({ tone: "error", message, title }),
    info: (message, title) => show({ tone: "info", message, title }),
    warning: (message, title) => show({ tone: "warning", message, title }),
  }), [show, dismiss]);

  return (
    <ToastContext.Provider value={handle}>
      {children}
      {/* The other toasts glide into place as one arrives or leaves. */}
      <Motion.Layout fadeIn={false} items="[data-toast-key]">
      <AriaToastRegion
        ref={regionRef}
        queue={queue}
        aria-label="Notifications"
        className={clsx(styles.group, styles[position])}
        style={themeVars.style}
      >
        {({ toast }) => <ToastItem queue={queue} toast={toast} theme={themeVars} />}
      </AriaToastRegion>
      </Motion.Layout>
    </ToastContext.Provider>
  );
}
