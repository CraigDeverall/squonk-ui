"use client";

import { clsx } from "clsx";
import React from "react";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { purposeValue, useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./page.module.css";
import type { SquonkTheme } from "../../../theme/theme-context";

const surfaceBackground = (theme: SquonkTheme) => purposeValue(theme, "components.page.background");

export type PageProps<E extends React.ElementType = "main"> =
  PolymorphicComponentProps<
    E,
    {
      /** The page content, usually a `Header`, `Section`s and a `Footer`. */
      children: React.ReactNode;
    }
  >;

/**
 * `Page` is the full-viewport root of a screen: a `<main>` that fills the
 * viewport, paints the page background and text colour, and scrolls
 * vertically. Render one per screen, outside any `Section`.
 */
export function Page<E extends React.ElementType = "main">({
  as,
  children,
  className,
  style,
  ...otherProps
}: PageProps<E>) {
  const Component = as || "main";
  const themeVars = useThemeCssVars();

  return (
    <Component className={clsx(styles.root, className)} style={{ ...themeVars.style, ...style }} {...otherProps}>
      {themeVars.provide(<SemanticSurface background={surfaceBackground}>{children}</SemanticSurface>)}
    </Component>
  );
}
