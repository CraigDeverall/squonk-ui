import React, { useEffect, useState } from "react";
import { useSquonkTheme } from "../../../src/theme/theme-context";
import { parseStoredThemePart } from "../../../src/theme/theme-storage";
import { addons } from "storybook/preview-api";
import type { Decorator } from "@storybook/react";
import {
  type AddedColorPrimitives,
  type ColorBindingsOverride,
  type PrimitivesOverride,
} from "../../../src/theme/theme";
import { SquonkThemeProvider } from "../../../src/theme/theme-provider";
import type { RoleBindingsOverride } from "../../../src/theme/purpose";
import {
  ADDED_PRIMITIVES_STORAGE_KEY,
  BINDINGS_STORAGE_KEY,
  EVENTS,
  MOTION_PREVIEW_STORAGE_KEY,
  ROLE_BINDINGS_STORAGE_KEY,
  STORAGE_KEY,
} from "./constants";
import { rescanTokenUse, watchTokenUse, type TokenUse } from "./token-usage";
import { useThemePreset } from "../../../src/design-system/themes/theme-preset-store";
import { exampleTheme } from "../../../src/design-system/themes/themes";
import { findFont } from "./data/google-fonts";
import { loadGoogleFontInto } from "./font-loader";
import { modeStore, bindChannel, type ColorMode } from "./mode-store";
import { DEFAULT_MOTION_PREVIEW, readMotionPreview, type MotionPreview } from "./motion-preview";

/*
 * Theme-controller state is persisted to localStorage by the side panel
 * (see panel.tsx). The preview-api channel reaches Storybook's own
 * preview iframe, but a *custom-embedded* iframe (e.g. the
 * `<iframe src="iframe.html?id=...">` inside a demo MDX page) doesn't
 * sit on that channel — same-origin `storage` events are how it stays
 * in sync. Each hook below reads localStorage on mount AND subscribes
 * to storage events so any iframe in the tab follows panel edits live.
 */
function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const fields = {
      [STORAGE_KEY]: "primitives",
      [BINDINGS_STORAGE_KEY]: "bindings",
      [ADDED_PRIMITIVES_STORAGE_KEY]: "addedPrimitives",
      [ROLE_BINDINGS_STORAGE_KEY]: "roleBindings",
    } as const;
    const field = fields[key as keyof typeof fields];
    if (!field) return fallback;
    return (parseStoredThemePart(localStorage.getItem(key), field) as T | undefined) ?? fallback;
  } catch {
    return fallback;
  }
}

// Connect the preview-side mode store to the channel once (module-level).
const unbindModeChannel = bindChannel(addons.getChannel());
if (import.meta.hot) import.meta.hot.dispose(unbindModeChannel);

// Report the tokens the page uses to the panel: once per preview document,
// so a docs page with many stories reports them all together.
{
  const channel = addons.getChannel();
  const report = (uses: TokenUse[]) => channel.emit(EVENTS.USED_TOKENS, uses);
  const stopWatching = watchTokenUse(report);
  const onRequest = () => rescanTokenUse(report);
  channel.on(EVENTS.REQUEST_USED_TOKENS, onRequest);
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      stopWatching();
      channel.off(EVENTS.REQUEST_USED_TOKENS, onRequest);
    });
  }
}

// Mirror the current mode onto both <html> and <body> so CSS rules
// keyed on data-mode flip with it. <html> matters specifically because
// the iframe-level scrollbar's pseudo-elements only see variables
// defined on or above the html element.
function applyBodyMode(mode: ColorMode) {
  document.documentElement.dataset.mode = mode;
  document.body.dataset.mode = mode;
}
applyBodyMode(modeStore.get());
modeStore.subscribe(applyBodyMode);

/**
 * Subscribe to live override changes from the side panel. Returned
 * value is the PrimitivesOverride bag — feed it to `buildTheme()`
 * alongside the current mode to produce a fully-resolved theme.
 */
export function useThemeOverrides(): PrimitivesOverride {
  const [overrides, setOverrides] = useState<PrimitivesOverride>(() =>
    readJsonStorage<PrimitivesOverride>(STORAGE_KEY, {})
  );

  useEffect(() => {
    const channel = addons.getChannel();
    const onOverrides = (next: PrimitivesOverride) =>
      setOverrides(next ?? {});
    channel.on(EVENTS.OVERRIDE_CHANGED, onOverrides);
    // Ask the panel to push its current state (handles iframe reloads)
    channel.emit(EVENTS.REQUEST_STATE);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setOverrides(readJsonStorage<PrimitivesOverride>(STORAGE_KEY, {}));
    };
    window.addEventListener("storage", onStorage);

    return () => {
      channel.off(EVENTS.OVERRIDE_CHANGED, onOverrides);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return overrides;
}

/**
 * Subscribe to live color-binding overrides from the side panel.
 * Returned value maps getter paths (e.g. `colors.primary`) to the
 * primitive color key they should resolve from.
 */
export function useColorBindings(): ColorBindingsOverride {
  const [bindings, setBindings] = useState<ColorBindingsOverride>(() =>
    readJsonStorage<ColorBindingsOverride>(BINDINGS_STORAGE_KEY, {})
  );

  useEffect(() => {
    const channel = addons.getChannel();
    const onBindings = (next: ColorBindingsOverride) =>
      setBindings(next ?? {});
    channel.on(EVENTS.BINDINGS_CHANGED, onBindings);
    // REQUEST_STATE already fired by useThemeOverrides — the panel
    // re-pushes both primitives and bindings on REQUEST_STATE.

    const onStorage = (e: StorageEvent) => {
      if (e.key !== BINDINGS_STORAGE_KEY) return;
      setBindings(
        readJsonStorage<ColorBindingsOverride>(BINDINGS_STORAGE_KEY, {})
      );
    };
    window.addEventListener("storage", onStorage);

    return () => {
      channel.off(EVENTS.BINDINGS_CHANGED, onBindings);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return bindings;
}

/**
 * Subscribe to custom (added) color primitives from the side panel.
 * Returned value maps user-chosen primitive keys to their light/dark
 * pair, e.g. `{ tertiary: { light: "#ff00ff", dark: "#aa00aa" } }`.
 */
export function useAddedColorPrimitives(): AddedColorPrimitives {
  const [added, setAdded] = useState<AddedColorPrimitives>(() =>
    readJsonStorage<AddedColorPrimitives>(ADDED_PRIMITIVES_STORAGE_KEY, {})
  );

  useEffect(() => {
    const channel = addons.getChannel();
    const onAdded = (next: AddedColorPrimitives) => setAdded(next ?? {});
    channel.on(EVENTS.ADDED_PRIMITIVES_CHANGED, onAdded);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== ADDED_PRIMITIVES_STORAGE_KEY) return;
      setAdded(
        readJsonStorage<AddedColorPrimitives>(ADDED_PRIMITIVES_STORAGE_KEY, {})
      );
    };
    window.addEventListener("storage", onStorage);

    return () => {
      channel.off(EVENTS.ADDED_PRIMITIVES_CHANGED, onAdded);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return added;
}

/**
 * Subscribe to purpose-token bindings from the side panel: purpose paths
 * re-pointed at a raw token or a literal value.
 */
export function useRoleBindings(): RoleBindingsOverride {
  const [roleBindings, setRoleBindings] = useState<RoleBindingsOverride>(() =>
    readJsonStorage<RoleBindingsOverride>(ROLE_BINDINGS_STORAGE_KEY, {})
  );

  useEffect(() => {
    const channel = addons.getChannel();
    const onChange = (next: RoleBindingsOverride) => setRoleBindings(next ?? {});
    channel.on(EVENTS.ROLE_BINDINGS_CHANGED, onChange);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== ROLE_BINDINGS_STORAGE_KEY) return;
      setRoleBindings(readJsonStorage<RoleBindingsOverride>(ROLE_BINDINGS_STORAGE_KEY, {}));
    };
    window.addEventListener("storage", onStorage);

    return () => {
      channel.off(EVENTS.ROLE_BINDINGS_CHANGED, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return roleBindings;
}

/** Subscribe to the global mode store (light vs dark). */
export function useColorMode(): ColorMode {
  const [mode, setMode] = useState<ColorMode>(modeStore.get());
  useEffect(() => modeStore.subscribe(setMode), []);
  return mode;
}

/**
 * Ensure any Google Font referenced by the overridden `fontFamily` /
 * `fontFamilyHeading` / `fontFamilyCode` primitives is loaded into the
 * preview iframe head. The picker stores the value as a quoted CSS stack
 * (e.g. `"Roboto", system-ui, sans-serif`), so we peel the first family
 * off and look it up in the bundled GOOGLE_FONTS index.
 *
 * Without this the canvas would resolve the chosen `font-family` to the
 * system fallback because the @font-face declarations live in the manager
 * iframe — distinct document, distinct head.
 */
function useGoogleFontsInPreview(overrides: PrimitivesOverride): void {
  useEffect(() => {
    for (const key of [
      "fontFamily",
      "fontFamilyHeading",
      "fontFamilyCode",
    ] as const) {
      const stack = overrides[key];
      if (typeof stack !== "string") continue;
      const font = findFont(stack);
      if (font) loadGoogleFontInto(document, font);
    }
    // Idempotent + cheap (loadGoogleFontInto dedups by id), so keying on the
    // whole bag is fine and keeps exhaustive-deps honest.
  }, [overrides]);
}

/** The motion level and slow-motion factor chosen in the panel's Motion section. */
function useMotionPreview(): MotionPreview {
  const [preview, setPreview] = useState<MotionPreview>(() => readMotionPreview());
  useEffect(() => {
    const channel = addons.getChannel();
    const onChange = (next: MotionPreview) => setPreview(next ?? DEFAULT_MOTION_PREVIEW);
    channel.on(EVENTS.MOTION_PREVIEW_CHANGED, onChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key === MOTION_PREVIEW_STORAGE_KEY) setPreview(readMotionPreview());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      channel.off(EVENTS.MOTION_PREVIEW_CHANGED, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return preview;
}

/**
 * The theme as the side panel has it: primitives, colour bindings, custom
 * colours, re-pointed purposes and the mode. Stories and docs pages both
 * render inside it, so a change in the panel reaches everything on the page.
 */
export const PanelThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const panel = useThemeOverrides();
  const bindings = useColorBindings();
  const added = useAddedColorPrimitives();
  const panelRoleBindings = useRoleBindings();
  const mode = useColorMode();
  const preset = exampleTheme(useThemePreset());
  // The panel's edits sit on top of the theme chosen in the toolbar.
  const overrides = React.useMemo<PrimitivesOverride>(
    () => ({
      ...preset.primitives,
      ...panel,
      colors: { ...preset.primitives.colors, ...panel.colors },
      darkColors: { ...preset.primitives.darkColors, ...panel.darkColors },
    }),
    [preset, panel],
  );
  const roleBindings = React.useMemo(() => ({ ...preset.roleBindings, ...panelRoleBindings }), [preset, panelRoleBindings]);
  useGoogleFontsInPreview(overrides);
  const motion = useMotionPreview();

  return (
    <SquonkThemeProvider
      motion={motion.level}
      primitives={overrides}
      mode={mode}
      colorBindings={bindings}
      addedColorPrimitives={added}
      roleBindings={roleBindings}
      // As in an app: the body takes the theme's font, so text a component
      // does not style itself (a Card's copy, a story's own markup) is not
      // drawn in the browser's default serif.
      withGlobalStyles
    >
      {children}
      {motion.slow > 1 && motion.level !== "none" ? (
        <style data-squonk-slow-motion="">{`:root{--squonk-motion-level-time:${motion.slow}}`}</style>
      ) : null}
    </SquonkThemeProvider>
  );
};

const ThemeControllerWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <PanelThemeProvider>
    <ModeBackground>{children}</ModeBackground>
  </PanelThemeProvider>
);

const ModeBackground: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const theme = useSquonkTheme();
  return (
    <div
      style={{
        background: theme.colors.background.default,
        color: theme.colors.text.primary,
        transition: "background 160ms ease, color 160ms ease",
        minHeight: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
};

export const themeControllerDecorator: Decorator = (Story) => (
  <ThemeControllerWrapper>
    <Story />
  </ThemeControllerWrapper>
);
