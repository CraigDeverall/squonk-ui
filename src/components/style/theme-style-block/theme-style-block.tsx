"use client";

import React, { useMemo } from "react";
import {
  type Primitives,
  type PrimitivesOverride,
  buildThemeFromPrimitives,
  mergeOverPrimitives,
} from "../../../theme/theme";
import {
  type ThemeMeta,
  ThemeMetaContext,
  useThemeMeta,
} from "../../../theme/theme-meta-context";
import { applyThemeTransforms } from "../../../theme/theme-overrides";
import { SquonkThemeContext } from "../../../theme/theme-context";

export type ThemeStyleBlockRegister = "normal" | "compact" | "display";

export interface ThemeStyleBlockProps {
  /**
   * Switch the subtree's size register.
   * - `compact` — scale spacing / font / radius DOWN by `compact*Ratio` primitives.
   * - `normal` — reset to the `SquonkThemeProvider` root sizing.
   * - `display` — scale UP by `display*Ratio` primitives.
   * Omit to leave sizing unchanged (useful when only `invertMode` is set).
   */
  register?: ThemeStyleBlockRegister;
  /**
   * Flip the inherited color mode (light ↔ dark) for the subtree. Orthogonal
   * to `register` — combine the two to get e.g. "compact + dark".
   */
  invertMode?: boolean;
  /** The subtree that takes the retuned theme. */
  children?: React.ReactNode;
}

interface SizeRatios {
  spacingPx: number;
  fontPx: number;
  borderRadiusPx: number;
}

const ratiosFrom = (
  p: Primitives,
  register: ThemeStyleBlockRegister
): SizeRatios | null => {
  if (register === "normal") return null;
  if (register === "compact") {
    return {
      spacingPx: p.compactSpacingRatio,
      fontPx: p.compactFontRatio,
      borderRadiusPx: p.compactBorderRadiusRatio,
    };
  }
  return {
    spacingPx: p.displaySpacingRatio,
    fontPx: p.displayFontRatio,
    borderRadiusPx: p.displayBorderRadiusRatio,
  };
};

const scaleSizePrimitives = (
  root: Primitives,
  ratios: SizeRatios
): PrimitivesOverride => ({
  spacingPx: root.spacingPx * ratios.spacingPx,
  fontPx: root.fontPx * ratios.fontPx,
  borderRadiusPx: root.borderRadiusPx * ratios.borderRadiusPx,
  controlRadiusPx: root.controlRadiusPx * ratios.borderRadiusPx,
});

const flipMode = (mode: ThemeMeta["mode"]): ThemeMeta["mode"] =>
  mode === "dark" ? "light" : "dark";

/**
 * `ThemeStyleBlock` wraps a subtree to retune the active theme — switch size
 * register, flip color mode, or both. It is a **style component** (no visual
 * output of its own); descendants automatically pick up the new theme via
 * `SquonkThemeContext` + `ThemeMetaContext`.
 *
 * Both axes are orthogonal:
 * - `register` controls SIZING (spacing / font / border-radius), derived from
 *   the `SquonkThemeProvider` root primitives so nested usages switch register
 *   cleanly instead of compounding multipliers. Use `register="normal"` to
 *   reset back inside a Compact / Display tree.
 * - `invertMode` controls COLOR MODE only — light ↔ dark, leaves sizing alone.
 *
 * Tune the multipliers via the `compact*Ratio` / `display*Ratio` primitives on
 * `SquonkThemeProvider`.
 */
export function ThemeStyleBlock({
  register,
  invertMode = false,
  children,
}: ThemeStyleBlockProps) {
  const parent = useThemeMeta();
  const isNoOp = register === undefined && !invertMode;

  const meta = useMemo<ThemeMeta>(() => {
    if (isNoOp) return parent;

    let nextPrimitives = parent.primitives;
    if (register !== undefined) {
      const ratios = ratiosFrom(parent.rootPrimitives, register);
      nextPrimitives =
        ratios === null
          ? parent.rootPrimitives
          : mergeOverPrimitives(
              parent.rootPrimitives,
              scaleSizePrimitives(parent.rootPrimitives, ratios)
            );
    }

    return {
      ...parent,
      primitives: nextPrimitives,
      mode: invertMode ? flipMode(parent.mode) : parent.mode,
    };
  }, [parent, register, invertMode, isNoOp]);

  const builtTheme = useMemo(
    () =>
      isNoOp
        ? null
        : applyThemeTransforms(
            buildThemeFromPrimitives(
              meta.primitives,
              meta.mode,
              meta.colorBindings,
              meta.addedColorPrimitives,
              meta.roleBindings
            ),
            meta.transforms
          ),
    [meta, isNoOp]
  );

  if (isNoOp || builtTheme === null) return <>{children}</>;
  return (
    <ThemeMetaContext.Provider value={meta}>
      <SquonkThemeContext.Provider value={builtTheme}>
        {children}
      </SquonkThemeContext.Provider>
    </ThemeMetaContext.Provider>
  );
}
