"use client";

import { clsx } from "clsx";
import React, { useMemo } from "react";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { purposeValue, useThemeCssVars } from "../../../theme/use-theme-css-vars";
import styles from "./footer.module.css";
import type { SquonkTheme } from "../../../theme/theme-context";

export type FooterTone = "subtle" | "page";

export type FooterProps = {
  /** Background treatment. `subtle` (default) uses `background.surface`
   *  (raised paper); `page` sits flush with the page background — for
   *  sites whose page bg is itself a brand tone, avoiding a stripe. */
  tone?: FooterTone;
  /** Element to render instead of `<footer>`. */
  as?: React.ElementType;
  /** Passed to the root element. */
  id?: string;
  /** Extra class on the root element. */
  className?: string;
  /** Footer content. Arrange it with a `VStack`, `HStack` or `Grid`. */
  children?: React.ReactNode;
};

const footerBackground = (theme: SquonkTheme, tone: FooterTone) =>
  purposeValue(theme, tone === "page" ? "roles.color.surface" : "roles.color.page");

/**
 * `Footer` is a semantic `<footer>` chrome — background, top border,
 * spacing, and typography. **It exposes no layout knobs.** Children are
 * laid out by composing a `VStack` / `HStack` (or `Grid`) inside the Footer — this is
 * how you control "copyright left, links right" or "stacked on mobile".
 *
 * The only intent prop is `tone` (does the footer sit on the page bg or on
 * a raised surface?).
 */
export function Footer({
  as,
  children,
  tone = "subtle",
  className,
  ...otherProps
}: FooterProps) {
  const Component = as || "footer";
  const background = useMemo(() => (theme: SquonkTheme) => footerBackground(theme, tone), [tone]);
  const themeVars = useThemeCssVars();

  return (
    <Component className={clsx(styles.root, className)} style={themeVars.style} data-tone={tone} {...otherProps}>
      {themeVars.provide(<SemanticSurface background={background}>{children}</SemanticSurface>)}
    </Component>
  );
}
