"use client";

import { clsx } from "clsx";
import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./code.module.css";

export type CodeProps<E extends React.ElementType = "code"> =
  PolymorphicComponentProps<
    E,
    {
      /** Render as a multi-line block (`<pre>`) instead of inline. */
      block?: boolean;
      /** The code to show. Whitespace is kept in a block. */
      children?: React.ReactNode;
    }
  >;

/** Monospaced code: inline by default, or a `<pre>` block with `block`. */
export function Code<E extends React.ElementType = "code">({
  as,
  children,
  block = false,
  className,
  style,
  ...otherProps
}: CodeProps<E>) {
  const Component = as || (block ? "pre" : "code");
  const themeVars = useThemeCssVars();

  return (
    <Component
      className={clsx(styles.root, block && styles.block, className)}
      style={{ ...themeVars.style, ...style }}
      {...otherProps}
    >
      {themeVars.provide(block ? <code>{children}</code> : children)}
    </Component>
  );
}
