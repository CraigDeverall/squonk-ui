"use client";

import React from "react";
import { Label, ProgressBar as AriaProgressBar } from "react-aria-components";
import { toneProps } from "../../../theme/tone";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./progress-bar.module.css";
import { Motion } from "../../animation/motion/motion";

export type ProgressBarTone = "primary" | "success" | "warning" | "error";

const builtInTones: readonly ProgressBarTone[] = ["primary", "success", "warning", "error"];

export interface ProgressBarProps {
  /** Current value (0–100). When `undefined`, the bar renders an indeterminate animation. */
  value?: number;
  /** Semantic color: a built-in tone, or the key of a colour the theme added
   *  (`addedColorPrimitives`), such as `"violet"`. */
  tone?: ProgressBarTone | (string & {});
  /** Visible label rendered above the bar. */
  label?: React.ReactNode;
  /** Show the numeric value beside the label. */
  showValue?: boolean;
  /** Accessible label when no visible `label` is provided. */
  ariaLabel?: string;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Built on React Aria's ProgressBar (`role="progressbar"` with its value range). */
export function ProgressBar({
  value,
  tone = "primary",
  label,
  showValue = false,
  ariaLabel,
}: ProgressBarProps) {
  const isIndeterminate = value === undefined;
  const clamped = isIndeterminate ? 0 : clamp(value);
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const toned = toneProps(tone, builtInTones);

  return (
    <AriaProgressBar
      className={styles.root}
      style={toned.style ? { ...themeVars.style, ...toned.style } : themeVars.style}
      data-tone={toned["data-tone"]}
      value={clamped}
      isIndeterminate={isIndeterminate}
      aria-label={ariaLabel}
    >
      {(label || showValue) ? (
        <div className={styles.labelRow}>
          {/* An explicit ariaLabel replaces the visible label as the name. */}
          {label ? (ariaLabel ? <span>{label}</span> : <Label>{label}</Label>) : <span />}
          {showValue && !isIndeterminate ? (
            <span className={styles.valueText}>{Math.round(clamped)}%</span>
          ) : null}
        </div>
      ) : null}
      <div className={styles.track} data-register={register}>
        <Motion.Shift>
          {isIndeterminate ? (
            <Motion.Sweep>
              <div className={styles.range} data-indeterminate />
            </Motion.Sweep>
          ) : (
            <div className={styles.range} style={{ width: `${clamped}%` }} />
          )}
        </Motion.Shift>
      </div>
    </AriaProgressBar>
  );
}
