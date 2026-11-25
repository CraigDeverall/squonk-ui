"use client";

import { clsx } from "clsx";
import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./inline.module.css";
import {
  stackAlignMap,
  type StackAlign,
  type StackGap,
} from "../vstack/vstack";

export type InlineProps<E extends React.ElementType = "span"> =
  PolymorphicComponentProps<
    E,
    {
      /** Gap between children, drawn from the spacing scale. */
      gap?: StackGap;
      /** Cross-axis (vertical) alignment. Defaults to `baseline` so the
       *  Inline group sits on the same text baseline as its surrounding
       *  prose — the whole point of an inline group. */
      align?: StackAlign;
      /** Items to group inline, such as an icon and a label. */
      children?: React.ReactNode;
    }
  >;

/**
 * `Inline` is an `inline-flex` group — sits in text flow without breaking
 * the line. Use for label-with-icon, chip-with-badge, text-with-trailing-
 * action, kbd combinations, and anywhere a small horizontal group needs
 * to participate in surrounding prose layout.
 *
 * Defaults to `align="baseline"` so the group aligns with the text
 * baseline of its container. For purely visual centering (no surrounding
 * text), pass `align="center"`.
 *
 * For a block-level horizontal group (own row, not flowing with text),
 * use `HStack`.
 */
export function Inline<E extends React.ElementType = "span">({
  as,
  children,
  gap = "xs",
  align = "baseline",
  className,
  style,
  ...otherProps
}: InlineProps<E>) {
  const Component = as || "span";
  const themeVars = useThemeCssVars();

  return (
    <Component
      className={clsx(styles.root, className)}
      style={{
        ...themeVars.style,
        // purpose-tokens: scale-api — the gap prop hands the raw spacing scale to
        // the consumer, whose layout supplies the purpose.
        "--inline-gap": `var(--squonk-spacing-${gap})`,
        "--inline-align": stackAlignMap[align],
        ...style,
      }}
      {...otherProps}
    >
      {themeVars.provide(children)}
    </Component>
  );
}
