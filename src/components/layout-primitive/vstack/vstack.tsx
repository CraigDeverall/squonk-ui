"use client";

import { clsx } from "clsx";
import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./vstack.module.css";

export type StackGap = "none" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type StackJustify =
  | "start"
  | "center"
  | "end"
  | "between"
  | "around"
  | "evenly";

export type VStackProps<E extends React.ElementType = "div"> =
  PolymorphicComponentProps<
    E,
    {
      /** Gap between children, drawn from the spacing scale. */
      gap?: StackGap;
      /** Cross-axis (horizontal) alignment. */
      align?: StackAlign;
      /** Main-axis (vertical) alignment. */
      justify?: StackJustify;
      /** Items to lay out in a column. */
      children?: React.ReactNode;
    }
  >;

export const stackAlignMap: Record<StackAlign, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

export const stackJustifyMap: Record<StackJustify, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};

/**
 * `VStack` lays out its children in a vertical flex column with a themed gap.
 * Defaults to an `md` gap, stretched to full width, packed to the top.
 */
export function VStack<E extends React.ElementType = "div">({
  as,
  children,
  gap = "md",
  align = "stretch",
  justify = "start",
  className,
  style,
  ...otherProps
}: VStackProps<E>) {
  const Component = as || "div";
  const themeVars = useThemeCssVars();

  return (
    <Component
      className={clsx(styles.root, className)}
      style={{
        ...themeVars.style,
        // purpose-tokens: scale-api — the gap prop hands the raw spacing scale to
        // the consumer, whose layout supplies the purpose.
        "--vstack-gap": `var(--squonk-spacing-${gap})`,
        "--vstack-align": stackAlignMap[align],
        "--vstack-justify": stackJustifyMap[justify],
        ...style,
      }}
      {...otherProps}
    >
      {themeVars.provide(children)}
    </Component>
  );
}
