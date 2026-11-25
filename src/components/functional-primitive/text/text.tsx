"use client";

import { clsx } from "clsx";
import React from "react";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import { toneProps } from "../../../theme/tone";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import {
  usePresentation,
  type Register,
} from "../../style/presentation/presentation";
import styles from "./text.module.css";

export type TextWeight = "light" | "regular" | "bold";
export type TextTone =
  | "primary"
  | "secondary"
  | "muted"
  | "inverse"
  | "success"
  | "warning"
  | "error"
  | "info";
export type TextAlign = "start" | "center" | "end" | "justify";
export type TextVariant = "body" | "eyebrow";

const builtInTones: readonly TextTone[] = ["primary", "secondary", "muted", "inverse", "success", "warning", "error", "info"];

export type TextProps<E extends React.ElementType = "p"> =
  PolymorphicComponentProps<
    E,
    {
      /** `body` (default) is running text. `eyebrow` is a small, bold,
       *  uppercase, letter-spaced label that sits above a heading. */
      variant?: TextVariant;
      /** Font weight. Defaults to `regular`, or `bold` for an eyebrow. */
      weight?: TextWeight;
      /** Color tone: a built-in tone, or the key of a colour the theme added
       *  (`addedColorPrimitives`), such as `"violet"`. Here `primary` is the
       *  body text colour, not the brand colour. */
      tone?: TextTone | (string & {});
      /** Text alignment. */
      align?: TextAlign;
      /** Truncate to a single line with an ellipsis. */
      truncate?: boolean;
      /** Italicise the text. */
      italic?: boolean;
      /** The text content. */
      children?: React.ReactNode;
    }
  >;

// Status colours are tuned for fills, not text; measure against the subtle
// background, the hardest surface for text in either mode.
const sizeByRegister: Record<Register, string> = {
  compact: "sm",
  default: "base",
  large: "lg",
  hero: "xl",
};

/**
 * Body text, a `<p>` by default. Size follows the current `Presentation`
 * register; defaults are `weight="regular"`, `tone="primary"` and
 * `align="start"`.
 */
export function Text<E extends React.ElementType = "p">({
  as,
  children,
  variant = "body",
  weight = variant === "eyebrow" ? "bold" : "regular",
  tone = "primary",
  align = "start",
  truncate = false,
  italic = false,
  className,
  style,
  ...otherProps
}: TextProps<E>) {
  const Component = as || "p";
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const toned = toneProps(tone, builtInTones);

  return (
    <Component
      className={clsx(styles.root, italic && styles.italic, truncate && styles.truncate, className)}
      style={{
        ...themeVars.style,
        ...toned.style,
        // purpose-tokens: scale-api — size and weight props hand the raw type
        // scale to the consumer, who chooses the text's role.
        "--text-size": `var(--squonk-typography-sizes-${sizeByRegister[register]})`,
        "--text-weight": `var(--squonk-typography-weights-${weight})`,
        "--text-align": align,
        ...style,
      }}
      data-tone={toned["data-tone"]}
      data-variant={variant === "eyebrow" ? variant : undefined}
      {...otherProps}
    >
      {themeVars.provide(children)}
    </Component>
  );
}
