"use client";

import { clsx } from "clsx";
import React, { useMemo } from "react";
import { theme as defaultTheme } from "../../../theme/theme";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { purposeValue, useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import {
  usePresentation,
  type Register,
} from "../../style/presentation/presentation";
import styles from "./card.module.css";
import type { SquonkTheme } from "../../../theme/theme-context";
import { Motion } from "../../animation/motion/motion";

export type CardVariant = "elevated" | "outlined" | "filled" | "featured";

export type CardProps<E extends React.ElementType = "section"> =
  PolymorphicComponentProps<
    E,
    {
      /** Visual style.
       *  - `outlined` (default): bordered card on the page background.
       *  - `elevated`: borderless card with a soft drop shadow.
       *  - `filled`: card on the raised surface background, no border.
       *  - `featured`: inverse high-contrast card (ink background, light
       *    text, popping shadow) — for marking the "recommended" option
       *    in a comparison group. */
      variant?: CardVariant;
      /** Card content. Lay it out with a `VStack`, `HStack`, `Grid` or `Block`. */
      children?: React.ReactNode;
    }
  >;

export const cardBackground = (theme: SquonkTheme, variant: CardVariant): string =>
  variant === "featured" ? purposeValue(theme, "roles.color.inverseSurface")
    : variant === "filled" ? purposeValue(theme, "roles.color.page")
      : purposeValue(theme, "roles.color.surface");

export const cardVariantStyles = (
  theme: SquonkTheme,
  variant: CardVariant
): Record<string, string> => {
  const p = (path: Parameters<typeof purposeValue>[1]) => purposeValue(theme, path);
  const map: Record<CardVariant, Record<string, string>> = {
    elevated: {
      backgroundColor: p("roles.color.surface"),
      color: p("roles.color.onSurface"),
      boxShadow: p("roles.elevation.soft"),
    },
    outlined: {
      backgroundColor: p("roles.color.surface"),
      color: p("roles.color.onSurface"),
      border: `${p("roles.border.width")} solid ${p("roles.color.outline")}`,
    },
    filled: {
      backgroundColor: p("roles.color.page"),
      color: p("roles.color.onPage"),
    },
    featured: {
      backgroundColor: p("roles.color.inverseSurface"),
      color: p("roles.color.onInverseSurface"),
      border: `${p("roles.border.width")} solid ${p("roles.color.inverseSurface")}`,
      boxShadow: p("components.card.featuredElevation"),
    },
  };
  return map[variant];
};

/**
 * Padding cascade for cards. The Card adapts its internal padding to the
 * register set by an ancestor `Presentation` (or `Section`) — `compact`
 * cards live in dense UIs, `hero` cards anchor the marketing top-of-page.
 */
/** Default-theme values retained for consumers of this export. */
export const cardPaddingByRegister: Record<Register, string> = defaultTheme.presentation.cardPadding;

/**
 * `Card` is a static visual container — a themed box with a variant-driven
 * border, background, and shadow. It exposes **no layout knobs**: padding,
 * radius, and shadow are theme-driven; the internal padding step adapts to
 * the ambient `Presentation` register. If a subtree needs different chrome,
 * wrap it in a `ThemeModifier`. Use a `VStack`, `HStack`, `Grid`, or `Block` inside to
 * control the arrangement of children.
 *
 * For the hover-lift "this card responds to pointing at it" behaviour, use
 * `InteractiveCard`. For a fully clickable card, wrap an `InteractiveCard`
 * in a `Link` (or use `as="a" href="…"`).
 */
export function Card<E extends React.ElementType = "section">({
  as,
  children,
  variant = "outlined",
  className,
  style,
  ...otherProps
}: CardProps<E>) {
  const Component = as || "section";
  const register = usePresentation();
  const background = useMemo(() => (theme: SquonkTheme) => cardBackground(theme, variant), [variant]);
  const themeVars = useThemeCssVars();

  // Feedback fades a card's colours when its theme or variant changes.
  return (
    <Motion.Feedback>
      <Component
        className={clsx(styles.root, className)}
        style={{ ...themeVars.style, "--card-padding": `var(--squonk-presentation-card-padding-${register})`, ...style }}
        data-variant={variant}
        {...otherProps}
      >
        {themeVars.provide(<SemanticSurface background={background}>{children}</SemanticSurface>)}
      </Component>
    </Motion.Feedback>
  );
}
