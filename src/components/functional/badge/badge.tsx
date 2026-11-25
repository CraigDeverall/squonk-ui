"use client";

import { clsx } from "clsx";
import React from "react";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import { toneProps } from "../../../theme/tone";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./badge.module.css";
import { Motion } from "../../animation/motion/motion";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info";
export type BadgeVariant = "solid" | "subtle" | "outline" | "dot";

const builtInTones: readonly BadgeTone[] = ["neutral", "primary", "success", "warning", "error", "info"];

export type BadgeProps<E extends React.ElementType = "span"> =
  PolymorphicComponentProps<
    E,
    {
      /** Semantic color: a built-in tone, or the key of a colour the theme
       *  added (`addedColorPrimitives`), such as `"violet"`. */
      tone?: BadgeTone | (string & {});
      /** Filled vs subtle vs outlined visual. `dot` is a filled dot and bold
       *  text with no pill: a quiet status in a dense list or card. */
      variant?: BadgeVariant;
      /** Small-caps treatment: uppercases the text, widens the tracking,
       *  and bumps the weight. Use for "eyebrow" labels above a headline. */
      caps?: boolean;
      /** Pulsing leading dot — for status indicators like "live", "in
       *  preview", "online". The dot uses the badge's current text color;
       *  with `variant="dot"` it pulses that variant's own dot. */
      pulsing?: boolean;
      /** The badge's text. Keep it to a word or two. */
      children?: React.ReactNode;
    }
  >;

/** A small inline label for a status, count or category. Not interactive. */
export function Badge<E extends React.ElementType = "span">({
  as,
  children,
  tone = "neutral",
  variant = "subtle",
  caps = false,
  pulsing = false,
  className,
  style,
  ...otherProps
}: BadgeProps<E>) {
  const Component = as || "span";
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const toned = toneProps(tone, builtInTones);
  // The dot variant always has its dot; `pulsing` makes it breathe.
  const dot = <span className={styles.pulse} aria-hidden="true" />;

  return (
    <Component
      className={clsx(styles.root, caps && styles.caps, className)}
      style={{ ...themeVars.style, ...toned.style, ...style }}
      data-tone={toned["data-tone"]}
      data-variant={variant}
      data-register={register}
      {...otherProps}
    >
      {pulsing ? <Motion.Pulse>{dot}</Motion.Pulse> : variant === "dot" ? dot : null}
      {themeVars.provide(children)}
    </Component>
  );
}
