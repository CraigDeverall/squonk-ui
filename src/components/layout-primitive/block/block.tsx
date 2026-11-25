"use client";

import { clsx } from "clsx";
import React, { useMemo } from "react";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { purposeValue, useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./block.module.css";
import type { SquonkTheme } from "../../../theme/theme-context";

export type BlockSpacing =
  | "none"
  | "xxs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "xxl";

export type BlockBackground =
  | "transparent"
  | "default"
  | "surface"
  | "subtle";

export type BlockRadius =
  | "none"
  | "sm"
  | "base"
  | "md"
  | "lg"
  | "xl"
  | "full";

export type BlockWidth = "fit" | "full" | "auto" | string;

export type BlockProps<E extends React.ElementType = "div"> =
  PolymorphicComponentProps<
    E,
    {
      /** Inset padding from the spacing scale. */
      padding?: BlockSpacing;
      /** Horizontal padding — wins over `padding` for inline axis. */
      paddingInline?: BlockSpacing;
      /** Vertical padding — wins over `padding` for block axis. */
      paddingBlock?: BlockSpacing;
      /** Theme-driven background colour. */
      background?: BlockBackground;
      /** Border radius from the theme scale. */
      radius?: BlockRadius;
      /** Width. `fit` = `fit-content`, `full` = `100%`, `auto` = `auto`,
       *  or pass any CSS length. */
      width?: BlockWidth;
      /** Max-width — any CSS length. */
      maxWidth?: string;
      /** Min-width — any CSS length. */
      minWidth?: string;
      /** Draw a border in the theme's outline colour (`roles.color.outline`). */
      bordered?: boolean;
      /** Content to wrap. */
      children?: React.ReactNode;
    }
  >;

const widthValue = (w: BlockWidth): string => {
  if (w === "fit") return "fit-content";
  if (w === "full") return "100%";
  return w;
};

// purpose-tokens: scale-api — padding and radius props hand the raw spacing
// and radius scales to the consumer, whose layout supplies the purpose.
const spacing = (step: BlockSpacing) => `var(--squonk-spacing-${step})`;

/** The purpose each background paints: a panel, the page colour, or a recessed well. */
const backgroundSurface = {
  transparent: "roles.color.surface",
  default: "roles.color.surface",
  surface: "roles.color.page",
  subtle: "roles.color.well",
} as const satisfies Record<BlockBackground, `roles.${string}`>;

/**
 * `Block` is the universal styling primitive — a polymorphic `<div>` with
 * theme-driven props for padding, background, radius, width, and border.
 * Use it when you need a styled wrapper that doesn't earn its own named
 * `Layout` component — it's the "give me a themed div" escape hatch that
 * keeps consumer code free of one-off styling.
 */
export function Block<E extends React.ElementType = "div">({
  as,
  children,
  padding,
  paddingInline,
  paddingBlock,
  background = "transparent",
  radius = "none",
  width,
  maxWidth,
  minWidth,
  bordered = false,
  className,
  style,
  ...otherProps
}: BlockProps<E>) {
  const Component = as || "div";
  const themeVars = useThemeCssVars();
  const surface = useMemo(() => (theme: SquonkTheme) => purposeValue(theme, backgroundSurface[background]), [background]);

  return (
    <Component
      className={clsx(
        styles.root,
        padding && styles.padding,
        paddingInline && styles.paddingInline,
        paddingBlock && styles.paddingBlock,
        width !== undefined && styles.width,
        maxWidth !== undefined && styles.maxWidth,
        minWidth !== undefined && styles.minWidth,
        bordered && styles.bordered,
        className
      )}
      style={{
        ...themeVars.style,
        "--block-radius": `var(--squonk-borders-radius-${radius})`,
        "--block-padding": padding && spacing(padding),
        "--block-padding-inline": paddingInline && spacing(paddingInline),
        "--block-padding-block": paddingBlock && spacing(paddingBlock),
        "--block-width": width !== undefined ? widthValue(width) : undefined,
        "--block-max-width": maxWidth,
        "--block-min-width": minWidth,
        ...style,
      }}
      data-background={background}
      {...otherProps}
    >
      {themeVars.provide(background === "transparent" ? children : <SemanticSurface background={surface}>{children}</SemanticSurface>)}
    </Component>
  );
}
