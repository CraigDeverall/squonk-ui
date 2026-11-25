"use client";

import { clsx } from "clsx";
import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./container.module.css";

export type ContainerSize = "mobile" | "tablet" | "desktop" | "wide" | "full";

export type ContainerProps<E extends React.ElementType = "div"> =
  PolymorphicComponentProps<
    E,
    {
      /**
       * Maximum width. Matches a breakpoint token (`tablet`, `desktop`, `wide`) or
       * `full` to let the container stretch to the parent. Ignored when
       * `maxWidth` is provided.
       */
      size?: ContainerSize;
      /** Explicit max-width override — accepts any CSS length. Use for
       *  marketing surfaces where the precise width isn't a breakpoint
       *  (e.g. a 1180px content shell). Wins over `size` when provided. */
      maxWidth?: string;
      /** Apply the page gutter (`roles.space.page-gutter`) as horizontal padding. Defaults to `true`. */
      gutters?: boolean;
      /** Content to constrain. */
      children?: React.ReactNode;
    }
  >;

/**
 * `Container` caps its content at a maximum width and centres it, with
 * optional horizontal gutters. Use it for page-width content shells.
 */
export function Container<E extends React.ElementType = "div">({
  as,
  children,
  size = "desktop",
  maxWidth,
  gutters = true,
  className,
  style,
  ...otherProps
}: ContainerProps<E>) {
  const Component = as || "div";
  const themeVars = useThemeCssVars();
  const resolvedMaxWidth = maxWidth ?? (size === "full" ? "none" : `var(--squonk-breakpoints-${size})`);

  return (
    <Component
      className={clsx(styles.root, gutters && styles.gutters, className)}
      style={{ ...themeVars.style, "--container-max-width": resolvedMaxWidth, ...style }}
      {...otherProps}
    >
      {themeVars.provide(children)}
    </Component>
  );
}
