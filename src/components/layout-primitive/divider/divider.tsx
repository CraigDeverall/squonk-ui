"use client";

import { clsx } from "clsx";
import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./divider.module.css";

export type DividerOrientation = "horizontal" | "vertical";

export type DividerProps<E extends React.ElementType = "hr"> =
  PolymorphicComponentProps<
    E,
    {
      /** Line direction. Defaults to `horizontal`, rendered as an `<hr>`;
       *  `vertical` renders a `<div role="separator">`. */
      orientation?: DividerOrientation;
    }
  >;

/**
 * `Divider` is a thin themed line that separates content, horizontally or
 * vertically.
 */
export function Divider<E extends React.ElementType = "hr">({
  as,
  orientation = "horizontal",
  className,
  style,
  ...otherProps
}: DividerProps<E>) {
  const themeVars = useThemeCssVars();
  const Component = as || (orientation === "vertical" ? "div" : "hr");

  return (
    <Component
      className={clsx(styles.root, className)}
      style={{ ...themeVars.style, ...style }}
      data-orientation={orientation}
      role={orientation === "vertical" ? "separator" : undefined}
      aria-orientation={orientation === "vertical" ? "vertical" : undefined}
      {...otherProps}
    />
  );
}
