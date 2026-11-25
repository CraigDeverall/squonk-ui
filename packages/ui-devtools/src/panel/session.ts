/*
 * The side panel's link to the page in the active tab.
 *
 * The Storybook theme panel (rendered by app.tsx) emits its edits on a
 * channel. This module listens on that channel, turns the edits into one
 * message and sends it to the tab's content script. Where the page's library
 * has the devtools bridge, the page's root provider rebuilds its theme from
 * the edits; where it hasn't, the edits become a stylesheet of `--squonk-*`
 * variables computed against the library's default theme.
 *
 * Edits are kept per site (origin), in this extension's own localStorage.
 */
import { useSyncExternalStore } from "react";
import {
  ADDED_PRIMITIVES_STORAGE_KEY,
  BINDINGS_STORAGE_KEY,
  EVENTS,
  MOTION_PREVIEW_STORAGE_KEY,
  ROLE_BINDINGS_STORAGE_KEY,
  STORAGE_KEY,
} from "@controller/constants";
import { findFont } from "@controller/data/google-fonts";
import { buildGoogleFontUrl } from "@controller/font-loader";
import { modeStore } from "@controller/mode-store";
import { readMotionPreview, type MotionPreview } from "@controller/motion-preview";
import type { TokenUse } from "@controller/token-usage";
import { exampleTheme } from "@src/design-system/themes/themes";
import { MOTION_LEVEL_VARS, motionLevelCss } from "@theme/motion-level";
import type { RoleBindingsOverride } from "@theme/purpose";
import {
  buildThemeFromPrimitives,
  mergeOverPrimitives,
  mergePrimitives,
  parseThemeDocument,
  type AddedColorPrimitives,
  type ColorBindingsOverride,
  type ColorMode,
  type PrimitivesOverride,
} from "@theme/theme";
import { changedCssVariables, themeCssVariables } from "@theme/theme-css-vars";
import type { ThemeDevtoolsOverride, ThemeDevtoolsState } from "@theme/theme-devtools-protocol";
import { PORT_NAME, type PageMessage, type PanelMessage } from "../protocol";
import { GLOBALS_UPDATED, UPDATE_GLOBALS } from "./shims/core-events";
import { channel } from "./shims/manager-api";

export interface Session {
  /** connecting: asking the tab; unavailable: no content script there; connected: talking to the page. */
  status: "connecting" | "unavailable" | "connected";
  origin?: string;
  /** Whether the page publishes `--squonk-*` variables. */
  detected: boolean;
  /**
   * The page's own theme inputs, from its root provider. `undefined` while
   * waiting to hear from one; `null` when the page's library has no bridge.
   */
  site: ThemeDevtoolsState | null | undefined;
  /** The example theme chosen in the panel. */
  presetId: string | undefined;
  mode: ColorMode;
  /** Why the page would reject the current edits, if it would. */
  error?: string;
}

const ORIGIN_KEY = "squonk-devtools:origin";
const PRESET_KEY = "squonk-devtools:preset";
const USER_MODE_KEY = "squonk-devtools:user-mode";
const siteKey = (origin: string) => `squonk-devtools:site:${origin}`;
/** Everything kept per site: the panel's own storage keys, plus ours. */
const SITE_KEYS = [
  STORAGE_KEY,
  BINDINGS_STORAGE_KEY,
  ADDED_PRIMITIVES_STORAGE_KEY,
  ROLE_BINDINGS_STORAGE_KEY,
  MOTION_PREVIEW_STORAGE_KEY,
  PRESET_KEY,
  USER_MODE_KEY,
];
/** How long to wait for a page's provider to answer before using CSS variables only. */
const BRIDGE_WAIT_MS = 400;

let state: Session = { status: "connecting", detected: false, site: undefined, presetId: undefined, mode: modeStore.get() };
const subscribers = new Set<() => void>();

function set(patch: Partial<Session>) {
  state = { ...state, ...patch };
  subscribers.forEach((notify) => notify());
}

const subscribe = (notify: () => void) => {
  subscribers.add(notify);
  return () => subscribers.delete(notify);
};

export const useSession = (): Session => useSyncExternalStore(subscribe, () => state);

// --- Per-site storage ---

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage is unavailable: edits still apply, they just aren't kept.
  }
};

/** Make the panel's storage hold `origin`'s edits. Returns whether it changed site. */
function switchSite(origin: string): boolean {
  const previous = read(ORIGIN_KEY);
  if (previous === origin) return false;
  if (previous) {
    const snapshot: Record<string, string> = {};
    for (const key of SITE_KEYS) {
      const value = read(key);
      if (value !== null) snapshot[key] = value;
    }
    write(siteKey(previous), JSON.stringify(snapshot));
  }
  let stored: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(read(siteKey(origin)) ?? "{}");
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) stored = parsed as Record<string, unknown>;
  } catch {
    // A corrupt snapshot is the same as none.
  }
  for (const key of SITE_KEYS) {
    const value = stored[key];
    write(key, typeof value === "string" ? value : null);
  }
  write(ORIGIN_KEY, origin);
  return true;
}

// --- What the panel has chosen ---

const panel: {
  overrides: PrimitivesOverride;
  bindings: ColorBindingsOverride;
  added: AddedColorPrimitives;
  roleBindings: RoleBindingsOverride;
  motion: MotionPreview;
} = { overrides: {}, bindings: {}, added: {}, roleBindings: {}, motion: readMotionPreview() };
/** Whether the mounted panel has reported its edits for the current site. */
let panelReady = false;
/** The mode the person picked here, where it differs from the site's own. */
let userMode: ColorMode | null = null;
/** The site's mode as far as CSS can tell, for pages without a bridge. */
let guessedMode: ColorMode = "light";

const readUserMode = (): ColorMode | null => {
  const value = read(USER_MODE_KEY);
  return value === "light" || value === "dark" ? value : null;
};

const siteMode = (): ColorMode => state.site?.mode ?? guessedMode;

/** Choose the colour mode shown on the page. */
export function setMode(mode: ColorMode) {
  userMode = mode === siteMode() ? null : mode;
  write(USER_MODE_KEY, userMode);
  modeStore.set(mode);
}

const nonEmpty = (value: object | undefined) => value !== undefined && Object.keys(value).length > 0;

const rootRule = (declarations: string) => (declarations ? `:root:root{${declarations}}` : "");

/** The message that puts the panel's current choices on the page. */
function buildApply(): { message: PanelMessage; error?: string } {
  const preset = exampleTheme(state.presetId);
  const { overrides } = panel;
  const primitives: PrimitivesOverride = {
    ...preset.primitives,
    ...overrides,
    colors: { ...preset.primitives.colors, ...overrides.colors },
    darkColors: { ...preset.primitives.darkColors, ...overrides.darkColors },
  };
  if (!nonEmpty(primitives.colors)) delete primitives.colors;
  if (!nonEmpty(primitives.darkColors)) delete primitives.darkColors;
  const roleBindings = { ...preset.roleBindings, ...panel.roleBindings };

  const theme: ThemeDevtoolsOverride["theme"] = {};
  if (nonEmpty(primitives)) theme.primitives = primitives;
  if (nonEmpty(panel.bindings)) theme.bindings = panel.bindings;
  if (nonEmpty(panel.added)) theme.addedPrimitives = panel.added;
  if (nonEmpty(roleBindings)) theme.roleBindings = roleBindings;

  // The page validates what it is sent the same way and ignores what fails.
  const checked = parseThemeDocument(JSON.stringify({ version: 1, ...theme }));
  const error = checked.ok ? undefined : checked.error;

  const mode = modeStore.get();
  const base = siteMode();
  const { level, slow } = panel.motion;
  const motion = [motionLevelCss(level), slow > 1 && level !== "none" ? `${MOTION_LEVEL_VARS.time}:${slow}` : ""]
    .filter(Boolean)
    .join(";");

  const fonts: string[] = [];
  for (const key of ["fontFamily", "fontFamilyHeading", "fontFamilyCode"] as const) {
    const stack = primitives[key];
    const font = typeof stack === "string" ? findFont(stack) : undefined;
    if (font) fonts.push(buildGoogleFontUrl(font));
  }

  if (state.site) {
    const unchanged = !nonEmpty(theme) && mode === base;
    const override: ThemeDevtoolsOverride | null = unchanged ? null : { theme, mode: mode === base ? undefined : mode };
    return { message: { type: "apply", override: JSON.stringify(override), css: rootRule(motion), fonts }, error };
  }

  // No bridge: publish the variables that differ from the default theme.
  let variables: string;
  try {
    const defaults = mergePrimitives();
    const before = themeCssVariables(buildThemeFromPrimitives(defaults, base));
    const after = themeCssVariables(
      buildThemeFromPrimitives(
        mergeOverPrimitives(defaults, theme.primitives),
        mode,
        theme.bindings,
        theme.addedPrimitives,
        theme.roleBindings,
      ),
    );
    variables = Object.entries(changedCssVariables(after, before))
      .map(([name, value]) => `${name}:${value}`)
      .join(";");
  } catch (cause) {
    return { message: { type: "apply", override: "null", css: rootRule(motion), fonts }, error: error ?? String(cause) };
  }
  return { message: { type: "apply", override: "null", css: rootRule(variables) + rootRule(motion), fonts }, error };
}

// --- The connection ---

let port: chrome.runtime.Port | null = null;
let tabId: number | undefined;
let bridgeTimer: number | undefined;
let queued = false;

function send() {
  if (!port || state.status !== "connected" || state.site === undefined || !panelReady) return;
  const { message, error } = buildApply();
  try {
    port.postMessage(message);
  } catch {
    return;
  }
  if (error !== state.error) set({ error });
}

/** Send once this tick, however many things changed. */
function schedule() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    send();
  });
}

const darkBackground = () =>
  themeCssVariables(buildThemeFromPrimitives(mergePrimitives(), "dark"))["--squonk-colors-background-default"];

/** A page's report of its theme inputs, or `undefined` if it isn't one. */
function parseSite(json: string): ThemeDevtoolsState | undefined {
  try {
    const value = JSON.parse(json) as Partial<ThemeDevtoolsState> | null;
    const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
    if (!isRecord(value) || !isRecord(value.primitives)) return undefined;
    if (!isRecord(value.primitives.colors) || !isRecord(value.primitives.darkColors)) return undefined;
    return {
      protocol: 1,
      // Over the defaults, so a site on another library version still has every key.
      primitives: mergeOverPrimitives(mergePrimitives(), value.primitives),
      mode: value.mode === "dark" ? "dark" : "light",
      colorBindings: isRecord(value.colorBindings) ? value.colorBindings : {},
      addedColorPrimitives: isRecord(value.addedColorPrimitives) ? value.addedColorPrimitives : {},
      roleBindings: isRecord(value.roleBindings) ? value.roleBindings : {},
    };
  } catch {
    return undefined;
  }
}

function onMessage(message: PageMessage) {
  if (message.type === "hello") {
    if (switchSite(message.origin) || state.origin !== message.origin) {
      // Another site's edits: the panel remounts (keyed by origin) and reports them.
      panel.overrides = {};
      panel.bindings = {};
      panel.added = {};
      panel.roleBindings = {};
      panel.motion = readMotionPreview();
      panelReady = false;
    }
    userMode = readUserMode();
    guessedMode = message.background.toLowerCase() === darkBackground().toLowerCase() ? "dark" : "light";
    set({
      status: "connected",
      origin: message.origin,
      detected: message.detected,
      site: undefined,
      presetId: read(PRESET_KEY) ?? undefined,
      error: undefined,
    });
    window.clearTimeout(bridgeTimer);
    bridgeTimer = window.setTimeout(() => {
      if (state.site !== undefined) return;
      set({ site: null });
      modeStore.set(userMode ?? guessedMode);
      schedule();
    }, BRIDGE_WAIT_MS);
  } else if (message.type === "site") {
    const site = parseSite(message.state);
    if (!site) return;
    // The site changed its own mode: follow it rather than hold ours over it.
    if (state.site && state.site.mode !== site.mode) {
      userMode = null;
      write(USER_MODE_KEY, null);
    }
    window.clearTimeout(bridgeTimer);
    set({ site, detected: true });
    modeStore.set(userMode ?? site.mode);
    schedule();
  } else if (message.type === "tokens") {
    channel.emit(EVENTS.USED_TOKENS, message.uses satisfies TokenUse[]);
  }
}

function connect(id: number) {
  window.clearTimeout(bridgeTimer);
  const previous = port;
  port = null;
  previous?.disconnect();
  tabId = id;
  set({ status: "connecting", site: undefined, error: undefined });
  const next = chrome.tabs.connect(id, { name: PORT_NAME });
  port = next;
  next.onMessage.addListener(onMessage);
  next.onDisconnect.addListener(() => {
    // Reading lastError marks a failed connect (no content script) as handled.
    void chrome.runtime.lastError;
    if (port !== next) return;
    port = null;
    window.clearTimeout(bridgeTimer);
    set({ status: "unavailable", site: undefined });
  });
}

/** Try the current tab again, e.g. after the person reloads it. */
export function reconnect() {
  if (tabId !== undefined) connect(tabId);
}

/** Connect to the active tab and follow tab switches and reloads. Call once. */
export async function startSession() {
  channel.on(EVENTS.OVERRIDE_CHANGED, (next: PrimitivesOverride | undefined) => {
    panel.overrides = next ?? {};
    panelReady = true;
    schedule();
  });
  channel.on(EVENTS.BINDINGS_CHANGED, (next: ColorBindingsOverride | undefined) => {
    panel.bindings = next ?? {};
    schedule();
  });
  channel.on(EVENTS.ADDED_PRIMITIVES_CHANGED, (next: AddedColorPrimitives | undefined) => {
    panel.added = next ?? {};
    schedule();
  });
  channel.on(EVENTS.ROLE_BINDINGS_CHANGED, (next: RoleBindingsOverride | undefined) => {
    panel.roleBindings = next ?? {};
    schedule();
  });
  channel.on(EVENTS.MOTION_PREVIEW_CHANGED, (next: MotionPreview | undefined) => {
    panel.motion = next ?? readMotionPreview();
    schedule();
  });
  channel.on(EVENTS.REQUEST_USED_TOKENS, () => {
    try {
      port?.postMessage({ type: "scan" } satisfies PanelMessage);
    } catch {
      // Not connected: the next connection reports the tokens anyway.
    }
  });
  channel.on(UPDATE_GLOBALS, ({ globals }: { globals: Record<string, string> }) => {
    if (typeof globals?.theme !== "string") return;
    write(PRESET_KEY, globals.theme);
    set({ presetId: globals.theme });
    channel.emit(GLOBALS_UPDATED, { globals });
    schedule();
  });
  modeStore.subscribe((mode) => {
    set({ mode });
    schedule();
  });

  // Opened as an ordinary tab (the end-to-end test does this): follow the
  // other tab in the window. As a side panel there is no current tab.
  const own = await chrome.tabs.getCurrent();
  if (own?.id !== undefined) {
    const tabs = await chrome.tabs.query({ windowId: own.windowId });
    const other = tabs.find((tab) => tab.id !== own.id);
    if (other?.id !== undefined) connect(other.id);
    else set({ status: "unavailable" });
    chrome.tabs.onUpdated.addListener((id, info) => {
      if (id === tabId && info.status === "complete") connect(id);
    });
    return;
  }

  const { id: windowId } = await chrome.windows.getCurrent();
  const follow = async () => {
    const [active] = await chrome.tabs.query({ active: true, windowId });
    if (active?.id !== undefined) connect(active.id);
    else set({ status: "unavailable" });
  };
  chrome.tabs.onActivated.addListener((info) => {
    if (info.windowId === windowId) connect(info.tabId);
  });
  chrome.tabs.onUpdated.addListener((id, info) => {
    if (id === tabId && info.status === "complete") connect(id);
  });
  await follow();
}
