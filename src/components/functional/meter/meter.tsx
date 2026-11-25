"use client";

import { clsx } from "clsx";
import React from "react";
import { Label, Meter as AriaMeter } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./meter.module.css";

export interface MeterProps {
  /** The current amount, between `minValue` and `maxValue`. */
  value: number;
  /** The bottom of the range. Defaults to 0. */
  minValue?: number;
  /** The top of the range. Defaults to 100. */
  maxValue?: number;
  /** Visible label above the meter ("Storage used"). */
  label?: React.ReactNode;
  /** Accessible name when there is no visible `label`. */
  ariaLabel?: string;
  /** Show the value beside the label. */
  showValue?: boolean;
  /**
   * The value as people say it ("45 of 60 GB"): shown beside the label and
   * announced by screen readers. Defaults to the percentage of the range.
   */
  valueLabel?: string;
  /** From this value up the fill turns to warning: the amount is getting high. */
  warningAt?: number;
  /** From this value up the fill turns to error: the amount is at or over its limit. */
  criticalAt?: number;
  /** Merged onto the root element. */
  className?: string;
  /** Merged onto the root element; set `--meter-color` here to recolour the normal fill. */
  style?: React.CSSProperties;
}

/**
 * An amount within a known range: storage used, a credit limit drawn, a quota
 * spent. Built on React Aria's Meter (`role="meter"`). For work in progress
 * toward completion, use ProgressBar.
 */
export function Meter({
  value,
  minValue = 0,
  maxValue = 100,
  label,
  ariaLabel,
  showValue = false,
  valueLabel,
  warningAt,
  criticalAt,
  className,
  style,
}: MeterProps) {
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const level =
    criticalAt !== undefined && value >= criticalAt
      ? "critical"
      : warningAt !== undefined && value >= warningAt
        ? "warning"
        : "normal";

  return (
    <AriaMeter
      className={clsx(styles.root, className)}
      style={{ ...themeVars.style, ...style }}
      data-level={level}
      value={value}
      minValue={minValue}
      maxValue={maxValue}
      valueLabel={valueLabel}
      aria-label={ariaLabel}
    >
      {({ percentage, valueText }) => (
        <>
          {label || showValue ? (
            <div className={styles.labelRow}>
              {label ? ariaLabel ? <span>{label}</span> : <Label>{label}</Label> : <span />}
              {showValue ? <span className={styles.valueText}>{valueText}</span> : null}
            </div>
          ) : null}
          <div className={styles.track} data-register={register}>
            <div className={styles.fill} style={{ width: `${percentage}%` }} />
          </div>
        </>
      )}
    </AriaMeter>
  );
}
