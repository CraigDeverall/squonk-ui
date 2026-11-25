"use client";

import { clsx } from "clsx";
import React, { useMemo } from "react";
import { Button as AriaButton, Link as AriaLink } from "react-aria-components";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import { cardBackground, type CardVariant } from "../card/card";
import cardStyles from "../card/card.module.css";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./interactive-card.module.css";
import type { SquonkTheme } from "../../../theme/theme-context";
import { Motion } from "../../animation/motion/motion";

export type InteractiveCardProps<E extends React.ElementType = "section"> =
  PolymorphicComponentProps<
    E,
    {
      /** Same variants as `Card`. */
      variant?: CardVariant;
      /** Card content. Avoid nesting links or buttons when the card itself is a link or button. */
      children?: React.ReactNode;
    }
  >;

/**
 * `InteractiveCard` is `Card` plus a hover-lift state — the visual cue that
 * "this card responds to interaction". Use it for a card that links
 * somewhere (combine with `as="a" href="…"`) or that opens a detail panel
 * on click. For a static information card, use `Card`.
 *
 * Like `Card`, it exposes only the `variant` intent prop — layout is
 * delegated to a `VStack` / `HStack` / `Grid` / `Block` inside, padding adapts to the
 * ambient `Presentation` register.
 */
export function InteractiveCard<E extends React.ElementType = "section">({
  as,
  children,
  variant = "outlined",
  onClick,
  onKeyDown,
  onKeyUp,
  role,
  tabIndex,
  className,
  style,
  ...otherProps
}: InteractiveCardProps<E>) {
  const Component = as || "section";
  const register = usePresentation();
  const nativeAction = Component === "a" || Component === "button";
  const emulateButton = !nativeAction && typeof Component === "string" && Boolean(onClick);
  const nestedControl = (event: React.SyntheticEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return false;
    const control = target.closest('a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [contenteditable="true"], [tabindex]');
    return control !== null && control !== event.currentTarget && event.currentTarget.contains(control);
  };
  const background = useMemo(() => (theme: SquonkTheme) => cardBackground(theme, variant), [variant]);
  const themeVars = useThemeCssVars();
  const shared = {
    className: clsx(cardStyles.root, styles.root, className),
    style: { ...themeVars.style, "--card-padding": `var(--squonk-presentation-card-padding-${register})`, ...style },
    "data-variant": variant,
  };
  const content = themeVars.provide(<SemanticSurface background={background}>{children}</SemanticSurface>);

  // A link or button card is React Aria's Link or Button, for its press,
  // hover and focus-visible handling.
  if (Component === "a" || Component === "button") {
    const AriaComponent: React.ElementType = Component === "a" ? AriaLink : AriaButton;
    return (
      <Motion.Feedback>
        <AriaComponent {...shared} {...otherProps} onClick={onClick} onKeyDown={onKeyDown} onKeyUp={onKeyUp}>
          {content}
        </AriaComponent>
      </Motion.Feedback>
    );
  }

  // Any other element emulates a button by hand, because it may hold its
  // own controls, which a real (or React Aria) button cannot contain.
  return (
    <Motion.Feedback>
      <Component
        className={clsx(cardStyles.root, styles.root, className)}
        style={{ ...themeVars.style, "--card-padding": `var(--squonk-presentation-card-padding-${register})`, ...style }}
        data-variant={variant}
        {...(Component === "button" ? { type: "button" as const } : {})}
        {...otherProps}
        role={role ?? (emulateButton ? "button" : undefined)}
        tabIndex={tabIndex ?? (emulateButton ? 0 : undefined)}
        onClick={(event: React.MouseEvent<HTMLElement>) => {
          if (!nestedControl(event)) onClick?.(event);
        }}
        onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || !emulateButton || event.target !== event.currentTarget) return;
          if (event.key === " ") event.preventDefault();
          if (event.key === "Enter" && !event.repeat) {
            event.preventDefault();
            event.currentTarget.click();
          }
        }}
        onKeyUp={(event: React.KeyboardEvent<HTMLElement>) => {
          onKeyUp?.(event);
          if (!event.defaultPrevented && emulateButton && event.target === event.currentTarget && event.key === " ") {
            event.preventDefault();
            event.currentTarget.click();
          }
        }}
      >
        {content}
      </Component>
    </Motion.Feedback>
  );
}
