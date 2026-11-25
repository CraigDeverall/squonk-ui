"use client";

import { clsx } from "clsx";
import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./heading.module.css";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingWeight = "regular" | "bold" | "heavy";
export type HeadingTone = "primary" | "secondary";

export type HeadingProps<E extends React.ElementType = "h2"> =
  PolymorphicComponentProps<
    E,
    {
      /** Semantic level (h1–h6). Drives the rendered tag and the visual
       *  hierarchy *within* a register. The headline's typographic size is
       *  determined by the current `Presentation` register × this level. */
      level?: HeadingLevel;
      /** Color tone. */
      tone?: HeadingTone;
      /** Font weight. With none, the heading takes its level's weight from
       *  the theme (`components.heading.weight.level1` … `level6`), which is
       *  bold unless the theme re-points it. `heavy` is for display/marketing
       *  headlines (900). */
      weight?: HeadingWeight;
      /** The heading text. */
      children?: React.ReactNode;
    }
  >;

/** A heading sized by the current `Presentation` register and `level` (default 2). */
export function Heading<E extends React.ElementType = "h2">({
  as,
  children,
  level = 2,
  tone = "primary",
  weight,
  className,
  style,
  ...otherProps
}: HeadingProps<E>) {
  const Component = as || (`h${level}` as React.ElementType);
  const register = usePresentation();
  const themeVars = useThemeCssVars();

  return (
    <Component
      className={clsx(styles.root, className)}
      style={{
        ...themeVars.style,
        "--heading-size": `var(--squonk-presentation-heading-sizes-${register}-${level})`,
        // No weight prop: the level's default weight from the theme.
        ...(weight === undefined && { "--heading-weight": `var(--squonk-components-heading-weight-level${level})` }),
        ...style,
      }}
      data-register={register}
      data-weight={weight ?? "bold"}
      data-tone={tone}
      {...otherProps}
    >
      {themeVars.provide(children)}
    </Component>
  );
}
