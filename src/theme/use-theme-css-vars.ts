"use client";

import React, { createContext, useContext } from "react";
import { theme as defaultTheme } from "./theme";
import { changedCssVariables, themeCssVarName, themeCssVariables, type ThemeCssVars } from "./theme-css-vars";
import { useSquonkTheme, type SquonkTheme } from "./theme-context";

let defaults: ThemeCssVars | undefined;
const getDefaults = () => (defaults ??= themeCssVariables(defaultTheme));

const varsCache = new WeakMap<SquonkTheme, ThemeCssVars>();

/** The `--squonk-*` values a theme publishes (cached per theme object). */
export function cssVariablesFor(theme: SquonkTheme): ThemeCssVars {
  let vars = varsCache.get(theme);
  if (!vars) varsCache.set(theme, (vars = themeCssVariables(theme)));
  return vars;
}
/**
 * A purpose or component token's value for a theme, for code that styles
 * from JavaScript: `purposeValue(theme, "roles.color.surface")`.
 */
export function purposeValue(theme: SquonkTheme, path: `roles.${string}` | `components.${string}`): string {
  const value = cssVariablesFor(theme)[themeCssVarName(path.split("."))];
  if (value === undefined) throw new Error(`Unknown purpose token: ${path}`);
  return value;
}

const styleCache = new WeakMap<ThemeCssVars, WeakMap<ThemeCssVars, React.CSSProperties>>();

/** The `--squonk-*` values on `:root`: the root `SquonkThemeProvider`'s, else the defaults. */
export const RootCssVarsContext = createContext<ThemeCssVars | null>(null);

/** The `--squonk-*` values already in effect at this point of the DOM. `null` = the `:root` values. */
export const AppliedCssVarsContext = createContext<ThemeCssVars | null>(null);

export interface ThemeCssVarsScope {
  /** Spread into the root element's `style`. */
  style: React.CSSProperties;
  /** Wrap the children rendered inside that root element. */
  provide: (children: React.ReactNode) => React.ReactNode;
}

/**
 * Carries the active theme's `--squonk-*` variables onto a CSS-module
 * component's root element.
 *
 * `tokens.css` declares the default theme on `:root`, and the root
 * `SquonkThemeProvider` writes its own theme there when it differs. Each component sets
 * only the variables whose value differs from what its nearest styled
 * ancestor already applied, then tells its children (through `provide`)
 * what is now in effect. An app on the default theme sets nothing; inside a
 * `ThemeModifier`, `ThemeStyleBlock` or `SemanticSurface`, the outermost
 * component carries the changes and nested ones inherit them. No wrapper
 * elements are added. A component that renders its own portal passes
 * `{ portal: true }`; other portal content resets the chain with
 * `ThemeCssVarsPortal`.
 */
export function useThemeCssVars({ portal = false }: { portal?: boolean } = {}): ThemeCssVarsScope {
  const theme = useSquonkTheme();
  const rootVars = useContext(RootCssVarsContext) ?? getDefaults();
  const inherited = useContext(AppliedCssVarsContext);
  // Portal content's DOM parent is <body>, where only the :root values apply.
  const applied = (portal ? null : inherited) ?? rootVars;
  const current = cssVariablesFor(theme);

  let byApplied = styleCache.get(current);
  if (!byApplied) styleCache.set(current, (byApplied = new WeakMap()));
  let style = byApplied.get(applied);
  if (!style) byApplied.set(applied, (style = changedCssVariables(current, applied)));

  return {
    style,
    provide: (children) =>
      current === (inherited ?? rootVars)
        ? children
        : React.createElement(AppliedCssVarsContext.Provider, { value: current }, children),
  };
}

/** Wrap portal content: its DOM parent is `<body>`, where only the `:root` values apply. */
export function ThemeCssVarsPortal({ children }: { children?: React.ReactNode }) {
  return React.createElement(AppliedCssVarsContext.Provider, { value: null }, children);
}
