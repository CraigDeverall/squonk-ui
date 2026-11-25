"use client";

import { clsx } from "clsx";
import React from "react";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./spacer.module.css";

export type SpacerSize =
  | "auto"
  | "xxs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "xxl";

export type SpacerProps<E extends React.ElementType = "div"> =
  PolymorphicComponentProps<
    E,
    {
      /**
       * `auto` (default) expands to fill remaining space inside a flex parent — the
       * "push sibling to the edge" use case. Any spacing token sets a fixed size
       * instead, useful in non-flex contexts.
       */
      size?: SpacerSize;
    }
  >;

/**
 * `Spacer` is empty space, hidden from assistive technology. By default it
 * fills the remaining room in a flex row or column; a size gives it a fixed
 * size from the spacing scale.
 */
export function Spacer<E extends React.ElementType = "div">({
  as,
  size = "auto",
  className,
  style,
  ...otherProps
}: SpacerProps<E>) {
  const Component = as || "div";

  return (
    <Component
      className={clsx(styles.root, className)}
      // purpose-tokens: scale-api — the size prop hands the raw spacing scale to
      // the consumer, whose layout supplies the purpose.
      style={{ "--spacer-size": size === "auto" ? undefined : `var(--squonk-spacing-${size})`, ...style }}
      data-size={size}
      aria-hidden="true"
      {...otherProps}
    />
  );
}
