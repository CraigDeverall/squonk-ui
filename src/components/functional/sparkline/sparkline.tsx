"use client";

import { clsx } from "clsx";
import React from "react";
import { useLocale } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import {
  type ChartSlot,
  type ChartValueFormatter,
  numberFormatters,
  slotColor,
} from "../chart/chart-shared";
import styles from "./sparkline.module.css";

export type { ChartSlot, ChartValueFormatter } from "../chart/chart-shared";

export interface SparklineProps {
  /** The values in order, oldest first. Two or more draw a line. */
  data: number[];
  /**
   * What the line shows and over what period ("Tear volume (mL), last 12 months").
   * Screen readers hear it with the first and last values.
   */
  label: string;
  /** Formats the first and last values in the accessible name. Defaults to the locale's number format. */
  formatValue?: ChartValueFormatter;
  /** The palette slot (1–8) to draw in, to match a series elsewhere on the page. Defaults to 1. */
  slot?: ChartSlot;
  /** Add a light wash under the line, for volumes rather than rates. */
  filled?: boolean;
  /** Merged onto the root element. */
  className?: string;
  /** Merged onto the root element. */
  style?: React.CSSProperties;
}

/** The SVG's own coordinate space; the line is stretched to the element's box. */
const VIEW_W = 100;
const VIEW_H = 100;

/**
 * A word-sized trend line with no axes, for beside a figure or in a table
 * cell. It shows shape, not values: put the exact figure next to it, or use
 * a LineChart when people need to read points.
 */
export function Sparkline({
  data,
  label,
  formatValue,
  slot = 1,
  filled = false,
  className,
  style,
}: SparklineProps) {
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const { locale } = useLocale();
  const format = formatValue ?? numberFormatters(locale).value;
  const values = data.filter((v) => Number.isFinite(v));

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) =>
    values.length > 1 ? (i / (values.length - 1)) * VIEW_W : VIEW_W / 2;
  const y = (v: number) =>
    max === min ? VIEW_H / 2 : (1 - (v - min) / span) * VIEW_H;
  const points = values.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`);
  const line = points.length ? `M${points.join("L")}` : "";
  const area = points.length ? `${line}L${VIEW_W},${VIEW_H}L0,${VIEW_H}Z` : "";
  const last = values.at(-1);

  const name =
    values.length >= 2
      ? `${label}: ${format(values[0])} to ${format(values[values.length - 1])}`
      : values.length === 1
        ? `${label}: ${format(values[0])}`
        : `${label}: no data`;

  return (
    <span
      role="img"
      aria-label={name}
      className={clsx(styles.root, className)}
      data-register={register}
      style={
        {
          ...themeVars.style,
          "--sparkline-color": slotColor(slot),
          ...style,
        } as React.CSSProperties
      }
    >
      <span className={styles.plot}>
        {values.length >= 2 ? (
          <svg
            className={styles.svg}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            {filled ? <path className={styles.area} d={area} /> : null}
            <path className={styles.line} d={line} />
          </svg>
        ) : null}
        {last !== undefined ? (
          <span
            className={styles.end}
            aria-hidden="true"
            style={
              {
                left: `${x(values.length - 1)}%`,
                top: `${y(last)}%`,
              } as React.CSSProperties
            }
          />
        ) : null}
      </span>
    </span>
  );
}
