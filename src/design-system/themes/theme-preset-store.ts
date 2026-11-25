// Which example theme Storybook shows, from its `theme` global. Stories, docs
// pages and the controls that switch theme (toolbar, the examples' bar, the
// introduction) all read and set it here. Docs pages render outside the story
// decorator, so this follows Storybook's globals events rather than useGlobals.
import React from "react";
import { addons } from "storybook/preview-api";
import { GLOBALS_UPDATED, SET_GLOBALS, UPDATE_GLOBALS } from "storybook/internal/core-events";

type Listener = (id: string) => void;
let current = new URLSearchParams(window.location.search).get("globals")?.match(/(?:^|;)theme:([\w-]+)/)?.[1] ?? "squonk";
const listeners = new Set<Listener>();

const set = (globals?: Record<string, unknown>) => {
  const next = typeof globals?.theme === "string" ? globals.theme : undefined;
  if (!next || next === current) return;
  current = next;
  listeners.forEach((listener) => listener(next));
};

const channel = addons.getChannel();
channel.on(SET_GLOBALS, ({ globals }: { globals: Record<string, unknown> }) => set(globals));
channel.on(GLOBALS_UPDATED, ({ globals }: { globals: Record<string, unknown> }) => set(globals));

export const themePresetStore = {
  get: () => current,
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
};

/** Switch Storybook to an example theme: the toolbar, URL and every page follow. */
export const setThemePreset = (id: string) => channel.emit(UPDATE_GLOBALS, { globals: { theme: id } });

/**
 * Switch Storybook's colour mode, as the toolbar's mode toggle does. The
 * manager's mode store takes the event (see the theme controller's
 * mode-store.ts, whose MODE_CHANGED event this is), saves it and sends it back
 * to every page.
 */
export const setColorMode = (mode: "light" | "dark") => channel.emit("dt/theme-controller/mode-changed", mode);

/** The example theme Storybook is showing. */
export function useThemePreset(): string {
  const [id, setId] = React.useState(themePresetStore.get());
  React.useEffect(() => themePresetStore.subscribe(setId), []);
  return id;
}
