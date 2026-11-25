"use client";

import { createContext, useContext } from "react";
import type { ThemeTransform } from "./theme-overrides";
import {
  primitives as basePrimitives,
  type AddedColorPrimitives,
  type ColorBindingsOverride,
  type ColorMode,
  type Primitives,
} from "./theme";
import type { RoleBindingsOverride } from "./purpose";

/**
 * The "meta" view of the active theme — everything required to *rebuild* a
 * new theme from the inherited one. `SquonkThemeContext`
 * publishes the *resolved* theme (resolved getters); this context publishes
 * the *inputs* that built it.
 *
 * Why a sibling context? `ThemeStyleBlock` needs to derive a new theme by
 * applying a primitive-level transform (scale spacing, flip mode, …) to the
 * parent's inputs — not to the resolved theme.
 *
 * `rootPrimitives` records the primitives the closest `SquonkThemeProvider`
 * was configured with. `ThemeStyleBlock`'s `register` axis derives *from
 * these* so nesting (e.g. compact inside display) switches register cleanly
 * instead of compounding multipliers. The `invertMode` axis is orthogonal —
 * it flips mode but passes `rootPrimitives` through untouched.
 */
export interface ThemeMeta {
  primitives: Primitives;
  rootPrimitives: Primitives;
  mode: ColorMode;
  colorBindings: ColorBindingsOverride;
  addedColorPrimitives: AddedColorPrimitives;
  /** Purpose tokens re-pointed for this subtree. */
  roleBindings: RoleBindingsOverride;
  /** Ordered resolved overrides and semantic surfaces reapplied after rebuilding. */
  transforms: readonly ThemeTransform[];
}

export const defaultThemeMeta: ThemeMeta = {
  primitives: basePrimitives,
  rootPrimitives: basePrimitives,
  mode: "light",
  colorBindings: {},
  addedColorPrimitives: {},
  roleBindings: {},
  transforms: [],
};

export const ThemeMetaContext = createContext<ThemeMeta>(defaultThemeMeta);

export const useThemeMeta = (): ThemeMeta => useContext(ThemeMetaContext);
