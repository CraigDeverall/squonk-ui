"use client";

import { clsx } from "clsx";
import React from "react";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./aspect-ratio.module.css";

export type AspectRatioProps<E extends React.ElementType = "div"> =
  PolymorphicComponentProps<
    E,
    {
      /**
       * Width / height ratio. Pass a number (e.g. `16 / 9`) or a CSS aspect-ratio
       * string (`"16 / 9"`, `"4 / 3"`). Defaults to `1`.
       */
      ratio?: number | string;
      /** Content to fit inside the box, such as an image or video. */
      children?: React.ReactNode;
    }
  >;

/**
 * `AspectRatio` is a box that keeps a fixed width-to-height ratio as its
 * width changes. Use it for images, video and embeds.
 */
export function AspectRatio<E extends React.ElementType = "div">({
  as,
  children,
  ratio = 1,
  className,
  style,
  ...otherProps
}: AspectRatioProps<E>) {
  const Component = as || "div";

  return (
    <Component
      className={clsx(styles.root, className)}
      style={{ "--aspect-ratio": String(ratio), ...style }}
      {...otherProps}
    >
      {children}
    </Component>
  );
}
