"use client";

import { clsx } from "clsx";
import React from "react";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./scroll-box.module.css";

export type ScrollAxis = "vertical" | "horizontal" | "both";

export type ScrollBoxProps<E extends React.ElementType = "div"> =
  PolymorphicComponentProps<
    E,
    {
      /** Which axis is scrollable. Defaults to `vertical`. */
      axis?: ScrollAxis;
      /** Max height — any CSS length. Required for vertical scrolling unless
       *  the parent already constrains the height. */
      maxHeight?: string;
      /** Max width — any CSS length. Required for horizontal scrolling unless
       *  the parent already constrains the width. */
      maxWidth?: string;
      /** Content that may overflow and scroll. */
      children?: React.ReactNode;
    }
  >;

/**
 * `ScrollBox` is a scrollable wrapper — sets `overflow` along the chosen
 * axis and caps the box at `maxHeight` / `maxWidth`. Use it for long
 * lists in a fixed panel, code blocks, table viewports, or any container
 * whose content can exceed its visible bounds.
 *
 * For vertical scrolling, the parent (or a `maxHeight` here) must
 * constrain the height — otherwise the box grows to fit its content and
 * never scrolls.
 */
export function ScrollBox<E extends React.ElementType = "div">({
  as,
  children,
  axis = "vertical",
  maxHeight,
  maxWidth,
  className,
  style,
  ...otherProps
}: ScrollBoxProps<E>) {
  const Component = as || "div";

  return (
    <Component
      className={clsx(
        styles.root,
        maxHeight !== undefined && styles.maxHeight,
        maxWidth !== undefined && styles.maxWidth,
        className
      )}
      style={{ "--scroll-box-max-height": maxHeight, "--scroll-box-max-width": maxWidth, ...style }}
      data-axis={axis}
      {...otherProps}
    >
      {children}
    </Component>
  );
}
