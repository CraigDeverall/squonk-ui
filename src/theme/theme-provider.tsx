"use client";

import { useContext, useMemo } from "react";
import {
  buildThemeFromPrimitives,
  mergePrimitives,
  theme as defaultTheme,
  type AddedColorPrimitives,
  type ColorBindingsOverride,
  type ColorMode,
  type PrimitivesOverride,
} from "./theme";
import { SquonkThemeContext } from "./theme-context";
import type { RoleBindingsOverride } from "./purpose";
import { changedCssVariables, themeCssVariables } from "./theme-css-vars";
import { motionLevelCss, type MotionLevel } from "./motion-level";
import { ThemeMetaContext, defaultThemeMeta, type ThemeMeta } from "./theme-meta-context";
import { applyThemeDevtoolsOverride, useThemeDevtoolsOverride, useThemeDevtoolsReport } from "./theme-devtools";
import { AppliedCssVarsContext, RootCssVarsContext, cssVariablesFor } from "./use-theme-css-vars";

interface SquonkThemeProviderProps {
  children?: React.ReactNode;
  /** Optional primitive-level overrides applied over the library defaults. */
  primitives?: PrimitivesOverride;
  /** Initial color mode for the subtree (use `<ThemeStyleBlock invertMode>` to flip later). */
  mode?: ColorMode;
  /** Redirect specific color getters to a different primitive key. */
  colorBindings?: ColorBindingsOverride;
  /** Custom primitive color keys added at runtime (light + dark pair each). */
  addedColorPrimitives?: AddedColorPrimitives;
  /**
   * Re-point purpose tokens: the theme's design decisions, such as
   * `{ "roles.space.questionGap": "spacing.xl" }`. Values are a raw token
   * path or a literal CSS value, or `{ light, dark }` with one for each
   * colour mode. See the Theme docs for every purpose.
   */
  roleBindings?: RoleBindingsOverride;
  /**
   * Also style the document itself: zero body margin, body background from
   * `colors.background.default`, text from `colors.text.primary`, and the
   * page's base font family — so the page chrome follows the color mode
   * without every app hand-rolling a global stylesheet. Opt-in to avoid
   * surprising consumers that already own their body styles.
   */
  withGlobalStyles?: boolean;
  /**
   * How much motion the app allows. `system` (default) follows the
   * device's reduced-motion setting; `reduced` always reduces motion, for an
   * in-app "Reduce motion" setting; `none` turns motion off entirely, for
   * screenshots and tests. It applies to the whole page, even from a nested
   * provider. The theme's motion primitives set how motion feels; this sets
   * how much of it there is.
   */
  motion?: MotionLevel;
}

const BODY_RULE =
  "body{margin:0;background-color:var(--squonk-colors-background-default);" +
  "color:var(--squonk-colors-text-primary);font-family:var(--squonk-typography-fonts-base)}" +
  "::selection{background-color:var(--squonk-roles-color-text-selection);color:var(--squonk-roles-color-on-text-selection)}";

// Written only when the theme binds `components.page.backgroundImage`, so a
// body image an app sets itself is left alone otherwise.
const BODY_IMAGE_RULE =
  "body{background-image:var(--squonk-components-page-background-image);" +
  "background-attachment:fixed;background-repeat:no-repeat}";

let defaultVars: ReturnType<typeof themeCssVariables> | undefined;

/**
 * Root theme provider for `@squonkstack/ui`. Publishes:
 *  - `SquonkThemeContext` (the resolved theme) and, as the outermost provider,
 *    the theme's `--squonk-*` variables on `:root`, written by a `<style>`
 *    rendered after the children only when they differ from the defaults
 *  - the `ThemeMetaContext` (the inputs — primitives, mode, bindings, added
 *    primitives — used by the `Theme*` containers to rebuild from this point).
 *
 * Mount one at the app root. A provider nested inside another acts as a
 * theme scope and leaves `:root` alone.
 *
 * Without this at the tree root, `ThemeStyleBlock` will derive from the
 * library defaults instead of any customisation the app intended.
 */
export const SquonkThemeProvider = ({
  children,
  primitives,
  mode = "light",
  colorBindings = defaultThemeMeta.colorBindings,
  addedColorPrimitives = defaultThemeMeta.addedColorPrimitives,
  roleBindings = defaultThemeMeta.roleBindings,
  withGlobalStyles = false,
  motion = "system",
}: SquonkThemeProviderProps) => {
  const isRoot = useContext(RootCssVarsContext) === null;
  const ownPrimitives = useMemo(
    () => mergePrimitives(primitives),
    [primitives]
  );
  // The app's own inputs, and what a theme tool (the Squonk UI devtools
  // browser extension) lays over them. Only the root provider follows it.
  const own = useMemo(
    () => ({ primitives: ownPrimitives, mode, colorBindings, addedColorPrimitives, roleBindings }),
    [ownPrimitives, mode, colorBindings, addedColorPrimitives, roleBindings]
  );
  const toolOverride = useThemeDevtoolsOverride();
  const inputs = useMemo(
    () => applyThemeDevtoolsOverride(own, isRoot ? toolOverride : null),
    [own, isRoot, toolOverride]
  );
  useThemeDevtoolsReport(useMemo(() => (isRoot ? { protocol: 1 as const, ...own } : null), [isRoot, own]));

  const builtTheme = useMemo(
    () =>
      buildThemeFromPrimitives(
        inputs.primitives,
        inputs.mode,
        inputs.colorBindings,
        inputs.addedColorPrimitives,
        inputs.roleBindings
      ),
    [inputs]
  );
  const meta = useMemo<ThemeMeta>(
    () => ({
      primitives: inputs.primitives,
      rootPrimitives: inputs.primitives,
      transforms: defaultThemeMeta.transforms,
      mode: inputs.mode,
      colorBindings: inputs.colorBindings,
      addedColorPrimitives: inputs.addedColorPrimitives,
      roleBindings: inputs.roleBindings,
    }),
    [inputs]
  );

  const vars = cssVariablesFor(builtTheme);
  const rootCss = useMemo(() => {
    if (!isRoot) return "";
    defaultVars ??= themeCssVariables(defaultTheme);
    const changed = Object.entries(changedCssVariables(vars, defaultVars));
    return changed.length ? `:root{${changed.map(([name, value]) => `${name}:${value}`).join(";")}}` : "";
  }, [isRoot, vars]);
  // The motion level is the page's, so any provider that sets one sets it
  // for the whole page.
  const level = motionLevelCss(motion);
  const pageImage = vars["--squonk-components-page-background-image"];
  const bodyCss = withGlobalStyles ? BODY_RULE + (pageImage && pageImage !== "none" ? BODY_IMAGE_RULE : "") : "";
  const css = rootCss + (level ? `:root{${level}}` : "") + bodyCss;

  const content = (
    <SquonkThemeContext.Provider value={builtTheme}>
      {children}
      {css ? <style data-squonk-theme="">{css}</style> : null}
    </SquonkThemeContext.Provider>
  );

  return (
    <ThemeMetaContext.Provider value={meta}>
      {isRoot ? (
        <RootCssVarsContext.Provider value={vars}>
          <AppliedCssVarsContext.Provider value={null}>{content}</AppliedCssVarsContext.Provider>
        </RootCssVarsContext.Provider>
      ) : (
        content
      )}
    </ThemeMetaContext.Provider>
  );
};
