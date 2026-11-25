import type { ColorMode } from "../../../src/theme/theme";
import { EVENTS } from "./constants";

const STORAGE_KEY = "squonk-storybook-mode";

type Listener = (mode: ColorMode) => void;

function readStored(): ColorMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function writeStored(mode: ColorMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* no-op */
  }
}

/**
 * Module-level mode store. Two instances exist at runtime (one in the
 * manager iframe, one in the preview iframe); they stay in sync via the
 * Storybook channel. The no-op guard on `set` is what breaks any echo
 * loop between the two iframes.
 */
function createModeStore() {
  let current: ColorMode = readStored();
  const listeners = new Set<Listener>();

  return {
    get(): ColorMode {
      return current;
    },
    set(next: ColorMode) {
      if (next === current) return;
      current = next;
      writeStored(next);
      listeners.forEach((l) => l(current));
    },
    toggle() {
      this.set(current === "light" ? "dark" : "light");
    },
    subscribe(l: Listener): () => void {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export const modeStore = createModeStore();
export type { ColorMode };

// Same-origin iframes (manager + preview) receive a `storage` event when
// one writes localStorage. This is a built-in browser sync that doesn't
// depend on the Storybook channel — guarantees both iframes converge.
if (typeof window !== "undefined") {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    if (e.newValue === "dark" || e.newValue === "light") {
      modeStore.set(e.newValue);
    }
  };
  window.addEventListener("storage", onStorage);
  if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener("storage", onStorage));
}

interface ChannelLike {
  on: (event: string, cb: (mode: ColorMode) => void) => void;
  off: (event: string, cb: (mode: ColorMode) => void) => void;
  emit: (event: string, payload: ColorMode) => void;
}

/**
 * Bind a Storybook channel to the store. Call from both manager and
 * preview after they've imported their respective channel.
 *  - local change → emit MODE_CHANGED
 *  - remote MODE_CHANGED → set() (no-op if value unchanged, breaking loop)
 */
export function bindChannel(channel: ChannelLike) {
  const onRemote = (mode: ColorMode) => modeStore.set(mode);
  channel.on(EVENTS.MODE_CHANGED, onRemote);

  const unsub = modeStore.subscribe((mode) => {
    channel.emit(EVENTS.MODE_CHANGED, mode);
  });

  return () => {
    channel.off(EVENTS.MODE_CHANGED, onRemote);
    unsub();
  };
}
