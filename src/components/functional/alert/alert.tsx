"use client";

import { clsx } from "clsx";
import React, { useMemo } from "react";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { derivedColorTokens } from "../../../theme/theme-css-vars";
import { toneProps } from "../../../theme/tone";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { PolymorphicComponentProps } from "../../../types/polymorphic-types";
import { themeHelpers } from "../../../theme/theme";
import { CloseIcon } from "../../functional-primitive/icon/icon";
import styles from "./alert.module.css";
import type { SquonkTheme } from "../../../theme/theme-context";

export type AlertTone = "info" | "success" | "warning" | "error";
export type AlertVariant = "accent" | "tinted";

const builtInTones: readonly string[] = ["info", "success", "warning", "error"] satisfies AlertTone[];

export type AlertProps<E extends React.ElementType = "div"> =
  PolymorphicComponentProps<
    E,
    {
      /** Semantic color: a built-in tone, or the key of a colour the theme
       *  added (`addedColorPrimitives`), such as `"violet"`. An added colour
       *  carries no severity, so it is announced politely (`role="status"`). */
      tone?: AlertTone | (string & {});
      /** `accent` (default) has a thick edge in the tone's colour and a
       *  border; `tinted` is a plain block of the tone's wash with neither. */
      variant?: AlertVariant;
      /** Optional heading. */
      title?: string;
      /** Optional dismiss handler. When provided, renders a close button. */
      onDismiss?: () => void;
      /** The message body, shown under the title. */
      children?: React.ReactNode;
    }
  >;

// The SemanticSurface background must match the wash in alert.module.css.
const surfaceColor = (theme: SquonkTheme, tone: string): string => {
  const builtIn = builtInTones.includes(tone);
  if (!builtIn) {
    // A colour the theme added: the wash the theme derived for it.
    const palettes: Record<string, { wash: string } | undefined> = derivedColorTokens(theme).tone;
    const wash = palettes[tone]?.wash;
    if (wash) return wash;
  }
  const accent = theme.colors[builtIn ? (tone as AlertTone) : "info"];
  return theme.mode === "dark" ? themeHelpers.darken(accent, 0.65) : themeHelpers.lighten(accent, 0.5);
};

const roleFor = (tone: string) =>
  tone === "error" || tone === "warning" ? "alert" : "status";

/**
 * A message box for a page-level notice. `error` and `warning` render with
 * `role="alert"`; `info` and `success` with `role="status"`.
 */
export function Alert<E extends React.ElementType = "div">({
  as,
  children,
  tone = "info",
  variant = "accent",
  title,
  onDismiss,
  className,
  style,
  ...otherProps
}: AlertProps<E>) {
  const Component = as || "div";
  const background = useMemo(() => (theme: SquonkTheme) => surfaceColor(theme, tone), [tone]);
  const themeVars = useThemeCssVars();
  const toned = toneProps(tone, builtInTones);

  return (
    <Component
      className={clsx(styles.root, className)}
      style={{ ...themeVars.style, ...toned.style, ...style }}
      data-tone={toned["data-tone"]}
      data-variant={variant}
      role={roleFor(tone)}
      {...otherProps}
    >
      {themeVars.provide(
        <SemanticSurface background={background}>
        <div className={styles.body}>
          {title ? <strong className={styles.title}>{title}</strong> : null}
          <div>{children}</div>
        </div>
        {onDismiss ? (
          <button className={styles.dismiss} type="button" aria-label="Dismiss" onClick={onDismiss}>
            <CloseIcon />
          </button>
        ) : null}
        </SemanticSurface>
      )}
    </Component>
  );
}
