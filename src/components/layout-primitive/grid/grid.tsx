"use client";

import { clsx } from "clsx";
import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./grid.module.css";

export type GridGap = "none" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

export type ResponsiveColumns = {
  /** Columns below the `tablet` breakpoint. */
  mobile?: number;
  /** Columns from the `tablet` breakpoint up. */
  tablet?: number;
  /** Columns from the `desktop` breakpoint up. */
  desktop?: number;
  /** Columns from the `wide` breakpoint up. */
  wide?: number;
};

export type GridColumns = number | string | ResponsiveColumns;

export type GridProps<E extends React.ElementType = "div"> =
  PolymorphicComponentProps<
    E,
    {
      /** Column configuration. Accepts:
       *  - a fixed number (`3`),
       *  - a CSS `grid-template-columns` value (`"1fr 2fr"`),
       *  - or a responsive map (`{ mobile: 1, tablet: 2, desktop: 3 }`)
       *    which uses mobile-first `min-width` media queries against the
       *    theme breakpoints. Omitted breakpoints inherit the previous step's
       *    value, so `{ mobile: 1, desktop: 3 }` is column-count 1 below
       *    desktop and 3 above.
       */
      columns?: GridColumns;
      /**
       * Minimum column width before wrapping; when set, columns auto-fit using
       * `repeat(auto-fit, minmax(min(100%, <minColumnWidth>), 1fr))`.
       * Clamps to the parent width on narrow screens. Overrides `columns`.
       */
      minColumnWidth?: string;
      /** Gap between cells, drawn from the spacing scale. */
      gap?: GridGap;
      /** The grid cells. */
      children?: React.ReactNode;
    }
  >;

const isResponsive = (c: GridColumns): c is ResponsiveColumns =>
  typeof c === "object" && c !== null;

const columnsTemplate = (n: number | string): string =>
  typeof n === "number" ? `repeat(${n}, minmax(0, 1fr))` : n;

const responsiveSteps = ["tablet", "desktop", "wide"] as const;

/**
 * `Grid` is a CSS grid with themed gaps. Set a column count, a responsive
 * column map, or a minimum column width to auto-fit. Defaults to 2 columns
 * with an `md` gap.
 */
export function Grid<E extends React.ElementType = "div">({
  as,
  children,
  columns = 2,
  minColumnWidth,
  gap = "md",
  className,
  style,
  ...otherProps
}: GridProps<E>) {
  const Component = as || "div";
  const themeVars = useThemeCssVars();
  // purpose-tokens: scale-api — the gap prop hands the raw spacing scale to
  // the consumer, whose layout supplies the purpose.
  const vars: React.CSSProperties = { "--grid-gap": `var(--squonk-spacing-${gap})` };
  const stepClasses: string[] = [];

  if (minColumnWidth) {
    vars["--grid-columns"] = `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}), 1fr))`;
  } else if (isResponsive(columns)) {
    // Mobile-first: start with the smallest defined value as the default,
    // then layer min-width queries upward.
    vars["--grid-columns"] = columnsTemplate(
      columns.mobile ?? columns.tablet ?? columns.desktop ?? columns.wide ?? 1
    );
    for (const step of responsiveSteps) {
      const count = columns[step];
      if (count === undefined) continue;
      vars[`--grid-columns-${step}`] = columnsTemplate(count);
      stepClasses.push(styles[step]);
    }
  } else {
    vars["--grid-columns"] = columnsTemplate(columns);
  }

  return (
    <Component
      className={clsx(styles.root, stepClasses, className)}
      style={{ ...themeVars.style, ...vars, ...style }}
      {...otherProps}
    >
      {themeVars.provide(children)}
    </Component>
  );
}
