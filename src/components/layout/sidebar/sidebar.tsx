"use client";

import { clsx } from "clsx";
import React from "react";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { purposeValue, useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import styles from "./sidebar.module.css";
import type { SquonkTheme } from "../../../theme/theme-context";

const surfaceBackground = (theme: SquonkTheme) => purposeValue(theme, "roles.color.page");

export type SidebarSide = "left" | "right";

/** Default fixed width — part of the public API default, not a theme token. */
const SIDEBAR_DEFAULT_WIDTH = "240px";

export type SidebarProps<E extends React.ElementType = "aside"> =
  PolymorphicComponentProps<
    E,
    {
      /** Which side of the parent the sidebar belongs to — controls the divider edge. */
      side?: SidebarSide;
      /** Fixed width (any CSS length). Defaults to `240px`. */
      width?: string;
      /** Sidebar content, usually navigation. It scrolls vertically when it overflows. */
      children?: React.ReactNode;
    }
  >;

/**
 * `Sidebar` is a fixed-width `<aside>` panel on the page background, with a
 * divider on the edge facing the main content. Place it in a flex row beside
 * the main content; it does not shrink or grow.
 */
export function Sidebar<E extends React.ElementType = "aside">({
  as,
  children,
  side = "left",
  width = SIDEBAR_DEFAULT_WIDTH,
  className,
  style,
  ...otherProps
}: SidebarProps<E>) {
  const Component = as || "aside";
  const themeVars = useThemeCssVars();

  return (
    <Component
      className={clsx(styles.root, className)}
      style={{ ...themeVars.style, "--sidebar-width": width, ...style }}
      data-side={side}
      {...otherProps}
    >
      {themeVars.provide(<SemanticSurface background={surfaceBackground}>{children}</SemanticSurface>)}
    </Component>
  );
}
