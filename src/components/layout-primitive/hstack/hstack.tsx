"use client";

import { clsx } from "clsx";
import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./hstack.module.css";
import {
  stackAlignMap,
  stackJustifyMap,
  type StackAlign,
  type StackGap,
  type StackJustify,
} from "../vstack/vstack";

export type HStackProps<E extends React.ElementType = "div"> =
  PolymorphicComponentProps<
    E,
    {
      /** Gap between children, drawn from the spacing scale. */
      gap?: StackGap;
      /** Cross-axis (vertical) alignment. */
      align?: StackAlign;
      /** Main-axis (horizontal) alignment. */
      justify?: StackJustify;
      /** Allow children to wrap onto the next line. */
      wrap?: boolean;
      /** Items to lay out in a row. */
      children?: React.ReactNode;
    }
  >;

/**
 * `HStack` lays out its children in a horizontal flex row with a themed gap.
 * Defaults to an `md` gap, centred vertically, packed to the start, no wrap.
 */
export function HStack<E extends React.ElementType = "div">({
  as,
  children,
  gap = "md",
  align = "center",
  justify = "start",
  wrap = false,
  className,
  style,
  ...otherProps
}: HStackProps<E>) {
  const Component = as || "div";
  const themeVars = useThemeCssVars();

  return (
    <Component
      className={clsx(styles.root, wrap && styles.wrap, className)}
      style={{
        ...themeVars.style,
        // purpose-tokens: scale-api — the gap prop hands the raw spacing scale to
        // the consumer, whose layout supplies the purpose.
        "--hstack-gap": `var(--squonk-spacing-${gap})`,
        "--hstack-align": stackAlignMap[align],
        "--hstack-justify": stackJustifyMap[justify],
        ...style,
      }}
      {...otherProps}
    >
      {themeVars.provide(children)}
    </Component>
  );
}
