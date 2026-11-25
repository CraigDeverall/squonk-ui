"use client";

/*
 * The page side of the Squonk UI theme devtools (packages/ui-devtools, a
 * Chrome extension). A theme lives in the root provider's props, which a
 * browser tool cannot reach, so the root provider reports those inputs when
 * a tool asks and lays the tool's overrides over them.
 *
 * The two sides talk through DOM events on `window`, with JSON strings as
 * the detail: that crosses the boundary between a page and an extension's
 * content script, and works whichever side loads first. Nothing is sent
 * until a tool asks, and an app that no tool is attached to pays for two
 * idle event listeners.
 */
import { useEffect, useSyncExternalStore } from "react";
import { mergeOverPrimitives, parseThemeDocument } from "./theme";
import { THEME_DEVTOOLS_EVENTS, type ThemeDevtoolsOverride, type ThemeDevtoolsState } from "./theme-devtools-protocol";

export { THEME_DEVTOOLS_EVENTS, type ThemeDevtoolsOverride, type ThemeDevtoolsState };

/**
 * Read a `set` message. `null` clears the override; `undefined` means the
 * message was malformed and is ignored, so a bad message never unthemes a page.
 */
export function parseThemeDevtoolsOverride(json: string): ThemeDevtoolsOverride | null | undefined {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return undefined;
  }
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) return undefined;
  const { theme, mode } = value as { theme?: unknown; mode?: unknown };
  if (mode !== undefined && mode !== "light" && mode !== "dark") return undefined;
  if (theme !== undefined && (theme === null || typeof theme !== "object" || Array.isArray(theme))) return undefined;
  // The same validation an imported theme file gets.
  const parsed = parseThemeDocument(JSON.stringify({ ...(theme as object | undefined), version: 1 }));
  if (!parsed.ok) return undefined;
  const { primitives, bindings, addedPrimitives, roleBindings } = parsed.doc;
  return { theme: { primitives, bindings, addedPrimitives, roleBindings }, mode };
}

let override: ThemeDevtoolsOverride | null = null;
let requested = false;
const listeners = new Set<() => void>();
const reporters = new Set<() => void>();

const detailOf = (event: Event) => (event as CustomEvent<unknown>).detail;

function onSet(event: Event) {
  const detail = detailOf(event);
  if (typeof detail !== "string") return;
  const next = parseThemeDevtoolsOverride(detail);
  if (next === undefined) return;
  override = next;
  listeners.forEach((listener) => listener());
}

function onRequest() {
  requested = true;
  reporters.forEach((report) => report());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener(THEME_DEVTOOLS_EVENTS.set, onSet);
    window.addEventListener(THEME_DEVTOOLS_EVENTS.request, onRequest);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener(THEME_DEVTOOLS_EVENTS.set, onSet);
      window.removeEventListener(THEME_DEVTOOLS_EVENTS.request, onRequest);
    }
  };
}

const getOverride = () => override;
const getServerOverride = () => null;

/** The override a theme tool has set for this page, or `null`. */
export function useThemeDevtoolsOverride(): ThemeDevtoolsOverride | null {
  return useSyncExternalStore(subscribe, getOverride, getServerOverride);
}

/**
 * Report the root provider's own inputs to a theme tool: when it asks, and
 * again whenever they change after it has asked. Pass `null` from a nested
 * provider, which reports nothing.
 */
export function useThemeDevtoolsReport(state: ThemeDevtoolsState | null): void {
  useEffect(() => {
    if (!state) return;
    const report = () =>
      window.dispatchEvent(new CustomEvent(THEME_DEVTOOLS_EVENTS.state, { detail: JSON.stringify(state) }));
    reporters.add(report);
    if (requested) report();
    else window.dispatchEvent(new CustomEvent(THEME_DEVTOOLS_EVENTS.ready));
    return () => {
      reporters.delete(report);
    };
  }, [state]);
}

/** Lay a tool's override over the root provider's own inputs. */
export function applyThemeDevtoolsOverride(
  own: Omit<ThemeDevtoolsState, "protocol">,
  tool: ThemeDevtoolsOverride | null,
): Omit<ThemeDevtoolsState, "protocol"> {
  if (!tool) return own;
  const { primitives, bindings, addedPrimitives, roleBindings } = tool.theme;
  return {
    primitives: mergeOverPrimitives(own.primitives, primitives),
    mode: tool.mode ?? own.mode,
    colorBindings: bindings ? { ...own.colorBindings, ...bindings } : own.colorBindings,
    addedColorPrimitives: addedPrimitives ? { ...own.addedColorPrimitives, ...addedPrimitives } : own.addedColorPrimitives,
    roleBindings: roleBindings ? { ...own.roleBindings, ...roleBindings } : own.roleBindings,
  };
}

/** Test seam: forget the override and that a tool has asked. */
export function resetThemeDevtools(): void {
  override = null;
  requested = false;
}
