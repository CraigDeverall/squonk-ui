"use client";

import { clsx } from "clsx";
import React from "react";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./centered.module.css";

export type CenteredProps<E extends React.ElementType = "div"> =
  PolymorphicComponentProps<
    E,
    {
      /** Minimum height — accepts any CSS length. Defaults to `auto`. Pass
       *  `"100vh"` for full-viewport centering (a hero "perfectly
       *  centered" pattern), or a fixed height for a panel. */
      minHeight?: string;
      /** Whether to also fill the parent's width. Defaults to `true`. */
      fullWidth?: boolean;
      /** Content to centre. */
      children?: React.ReactNode;
    }
  >;

/**
 * `Centered` centres its children on both axes inside a flex container.
 * The canonical "perfectly centered child" pattern — reach for it when
 * you'd otherwise write `display: flex; align-items: center;
 * justify-content: center;` by hand.
 */
export function Centered<E extends React.ElementType = "div">({
  as,
  children,
  minHeight,
  fullWidth = true,
  className,
  style,
  ...otherProps
}: CenteredProps<E>) {
  const Component = as || "div";

  return (
    <Component
      className={clsx(
        styles.root,
        minHeight !== undefined && styles.minHeight,
        fullWidth && styles.fullWidth,
        className
      )}
      style={{ "--centered-min-height": minHeight, ...style }}
      {...otherProps}
    >
      {children}
    </Component>
  );
}
