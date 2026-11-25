"use client";

import { clsx } from "clsx";
import React from "react";
import { useLocale } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { TrendDownIcon, TrendUpIcon } from "../../functional-primitive/icon/icon";
import { usePresentation } from "../../style/presentation/presentation";
import type { ChartSlot } from "../chart/chart-shared";
import { Sparkline } from "../sparkline/sparkline";
import styles from "./stat.module.css";

/** Whether a rise in the figure is good news, bad news or neither. */
export type StatIncreaseIs = "good" | "bad" | "neutral";

export interface StatProps {
  /** What the figure measures, in sentence case without a colon ("Sightings logged"). */
  label: React.ReactNode;
  /**
   * The headline figure, already formatted and compact enough to read at a
   * glance ("1,284", "$4.2K", or a `<Currency>`).
   */
  value: React.ReactNode;
  /**
   * The change against an earlier period as a fraction: `0.124` reads
   * "+12.4%", `-0.03` reads "−3%". Omit it when there is nothing to compare.
   */
  change?: number;
  /** The period the change compares against ("vs last month"). Always give one with `change`. */
  changeLabel?: string;
  /**
   * Whether a rise is `good` (default: dues collected, sightings verified), `bad`
   * (overdue dues, errors) or `neutral` (headcount). Sets the change's colour;
   * the arrow and sign carry its direction either way.
   */
  increaseIs?: StatIncreaseIs;
  /** Recent values, oldest first, drawn as a sparkline under the figure. */
  trend?: number[];
  /** What the trend covers ("last 12 months"), for its accessible name. Defaults to "Trend". */
  trendLabel?: string;
  /** The palette slot for the trend, to match the same measure charted elsewhere. Defaults to 1. */
  trendSlot?: ChartSlot;
  /** Merged onto the root element. */
  className?: string;
  /** Merged onto the root element. */
  style?: React.CSSProperties;
}

/**
 * One headline figure with its label, and optionally its change against an
 * earlier period and a sparkline of recent values. Sometimes the right chart
 * is a number. Place it in a Card, or a Grid of Cards for a row of figures.
 */
export function Stat({
  label,
  value,
  change,
  changeLabel,
  increaseIs = "good",
  trend,
  trendLabel = "Trend",
  trendSlot,
  className,
  style,
}: StatProps) {
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const { locale } = useLocale();
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });

  const direction = change === undefined || change === 0 ? "flat" : change > 0 ? "up" : "down";
  const tone =
    direction === "flat" || increaseIs === "neutral"
      ? "neutral"
      : (direction === "up") === (increaseIs === "good")
        ? "good"
        : "bad";
  const spoken = direction === "up" ? "Up" : direction === "down" ? "Down" : "No change";
  const Arrow = direction === "up" ? TrendUpIcon : direction === "down" ? TrendDownIcon : null;

  return (
    <div className={clsx(styles.root, className)} data-register={register} style={{ ...themeVars.style, ...style }}>
      {themeVars.provide(
        <dl className={styles.list}>
          <dt className={styles.label}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
          {change !== undefined ? (
            <dd className={styles.change} data-tone={tone}>
              {Arrow ? <Arrow className={styles.arrow} /> : null}
              <span className={styles.visuallyHidden}>{spoken} </span>
              <span className={styles.changeValue}>{percent.format(change)}</span>
              {changeLabel ? <span className={styles.changeLabel}>{changeLabel}</span> : null}
            </dd>
          ) : null}
          {trend && trend.length > 1 ? (
            <dd className={styles.trend}>
              <Sparkline data={trend} label={trendLabel} slot={trendSlot} className={styles.sparkline} />
            </dd>
          ) : null}
        </dl>,
      )}
    </div>
  );
}
