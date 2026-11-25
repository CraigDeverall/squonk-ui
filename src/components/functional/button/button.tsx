"use client";

import { clsx } from "clsx";
import React from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./button.module.css";
import { Motion } from "../../animation/motion/motion";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "solid"
  | "ghost"
  | "danger";
export type ButtonShape = "pill" | "rounded";

export type ButtonProps<E extends React.ElementType = "button"> =
  PolymorphicComponentProps<
    E,
    {
      /** Visual style. `secondary` is the safe default; `primary` is the
       *  call-to-action; `solid` uses `text.primary` (ink) as the background
       *  for a high-contrast neutral button; `ghost` is a low-emphasis text
       *  button; `danger` for destructive actions. */
      variant?: ButtonVariant;
      /** Leave unset: the theme's `roles.radius.control` shapes every
       *  control alike. `pill` makes this button fully rounded, for a
       *  marketing call to action. `rounded` is the same as unset. */
      shape?: ButtonShape;
      /** Stretch to fill the parent's width. Defaults to `false` (fit-content). */
      fullWidth?: boolean;
      /** Whether the button lifts and casts a shadow on hover. On by default
       *  for `primary` (where the brand-pop shadow is the affordance); off
       *  for everything else. Set explicitly to opt in/out per-instance. */
      lift?: boolean;
      /** A pending action, such as a submit in flight. The button keeps its
       *  place in the tab order and announces it is busy, but ignores
       *  presses until the action settles. `aria-busy` does the same. */
      pending?: boolean;
      /** @deprecated Use `variant="primary"` instead. */
      primary?: boolean;
      /** The button's label. Give an icon-only button an `aria-label`, or
       *  use `IconButton`. */
      children?: React.ReactNode;
    }
  >;

/**
 * A button for actions, built on React Aria's Button. Pass `as` (such as
 * `"a"`) to give another element the button styling; that element then
 * supplies its own behaviour.
 */
export function Button<E extends React.ElementType = "button">({
  as,
  children,
  variant,
  shape,
  fullWidth = false,
  lift,
  primary = false,
  pending,
  className,
  style,
  ...otherProps
}: ButtonProps<E>) {
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const resolvedVariant: ButtonVariant =
    variant ?? (primary ? "primary" : "secondary");
  const resolvedLift = lift ?? resolvedVariant === "primary";

  const shared = {
    className: clsx(
      styles.root,
      fullWidth && styles.fullWidth,
      resolvedLift && styles.lift,
      className
    ),
    style: { ...themeVars.style, ...style },
    "data-variant": resolvedVariant,
    "data-shape": shape === "pill" ? "pill" : undefined,
    "data-register": register,
  };

  // Another element (an anchor, or a span inside a trigger) keeps the
  // styling only; behaviour belongs to that element.
  if (as && as !== "button") {
    const Component: React.ElementType = as;
    return (
      <Motion.Feedback>
        <Component {...shared} {...otherProps}>
          {themeVars.provide(children)}
        </Component>
      </Motion.Feedback>
    );
  }

  const { disabled, "aria-busy": ariaBusy, ...buttonProps } =
    otherProps as React.ButtonHTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> };
  const isPending = pending ?? (ariaBusy === true || ariaBusy === "true");

  // Press, hover and focus-visible state come from React Aria's Button,
  // which also smooths over touch and keyboard differences between browsers.
  return (
    <Motion.Feedback>
      <AriaButton
        {...shared}
        {...(buttonProps as Omit<AriaButtonProps, "className" | "style">)}
        isDisabled={disabled}
        isPending={isPending || undefined}
      >
        {themeVars.provide(children)}
      </AriaButton>
    </Motion.Feedback>
  );
}
