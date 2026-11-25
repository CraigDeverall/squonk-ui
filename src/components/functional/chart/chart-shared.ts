import type React from "react";
import { getNiceTickValues } from "recharts";

/**
 * A slot in the categorical data palette (`--squonk-roles-color-data-series1`…`8`).
 * The order is fixed and validated for colour-vision deficiencies; series take
 * slots in order and never cycle.
 */
export type ChartSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** The most series one chart colours apart. */
export const MAX_SERIES = 8;

/** Fields of `Row` that hold numbers (the values a series plots). */
export type ChartValueKey<Row> = Extract<
  { [Key in keyof Row]-?: Row[Key] extends number | null | undefined ? Key : never }[keyof Row],
  string
>;

/** Fields of `Row` that can label a category or point in time on an axis. */
export type ChartCategoryKey<Row> = Extract<
  { [Key in keyof Row]-?: Row[Key] extends string | number ? Key : never }[keyof Row],
  string
>;

/** One plotted series: a numeric field of each row, and its name. */
export interface ChartSeries<Row> {
  /** The row field holding this series' values. */
  key: ChartValueKey<Row>;
  /** The series' name in the legend, tooltip and table. */
  label: string;
  /**
   * Pin the series to a palette slot (1–8) so it keeps its colour when other
   * series are filtered out. Colour follows the series, never its position.
   * Defaults to the series' position in `series`.
   */
  slot?: ChartSlot;
}

/** Formats a plotted value for the tooltip, table and labels. */
export type ChartValueFormatter = (value: number) => string;
/** Formats a category or x value for the axis, tooltip and table. */
export type ChartCategoryFormatter = (value: string | number) => string;

/** Props every chart shares: what it shows and how it is named. */
export interface ChartBaseProps {
  /**
   * What the chart shows, as a short sentence-case title ("Dues by month").
   * It names the chart for assistive technology and captions the table view,
   * so it is required even when `hideTitle` hides it visually.
   */
  title: string;
  /** One line under the title: the unit, the period or the takeaway. */
  description?: React.ReactNode;
  /**
   * Hide the title visually when the surrounding card or section heading
   * already says it. It still names the chart for screen readers.
   */
  hideTitle?: boolean;
  /** Show a placeholder while the data loads. */
  loading?: boolean;
  /** Shown in place of the plot when there is no data. Defaults to "No data to show". */
  empty?: React.ReactNode;
  /** Merged onto the root `<figure>`. */
  className?: string;
  /** Merged onto the root `<figure>`. */
  style?: React.CSSProperties;
}

/** The CSS colour of a palette slot, as the chart frame defines it. */
export const slotColor = (slot: ChartSlot) => `var(--chart-series-${slot})`;

/** Each series with its slot resolved; series past the eighth are dropped with a warning. */
export function resolveSeries<S extends { slot?: ChartSlot; label: string }>(
  series: S[],
  component: string,
): (S & { slot: ChartSlot })[] {
  if (series.length > MAX_SERIES) {
    console.warn(
      `${component}: ${series.length} series given; only the first ${MAX_SERIES} are drawn. ` +
        "Fold the rest into an \"Other\" series or split the chart into small multiples.",
    );
  }
  return series.slice(0, MAX_SERIES).map((s, i) => ({ ...s, slot: s.slot ?? ((i + 1) as ChartSlot) }));
}

/** A locale-aware number formatter: full values, and compact ticks for an axis reaching 10,000. */
export function numberFormatters(locale: string) {
  const full = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  return {
    value: (value: number) => full.format(value),
    tick: (max: number) => (value: number) => (Math.abs(max) >= 10_000 ? compact.format(value) : full.format(value)),
  };
}

/** The largest absolute value across the given series, for choosing tick style. */
export function maxAbs<Row>(data: Row[], keys: string[], stacked = false): number {
  let max = 0;
  for (const row of data) {
    let sum = 0;
    for (const key of keys) {
      const v = Number((row as Record<string, unknown>)[key]) || 0;
      if (stacked) sum += v;
      else max = Math.max(max, Math.abs(v));
    }
    if (stacked) max = Math.max(max, Math.abs(sum));
  }
  return max;
}

/**
 * Width for an axis whose tick labels are the given strings. Recharts' own
 * "auto" width measures before the web font applies and clips the first
 * characters, so the width is estimated from the longest label instead: about
 * 0.66em per character at the tick size, plus the tick margin.
 */
export function axisWidth(labels: string[], max = 160): number {
  const longest = labels.reduce((n, label) => Math.max(n, label.length), 0);
  return Math.min(max, Math.ceil(longest * 8) + 14);
}

/**
 * The range a value axis spans for these series: Recharts' default number
 * domain, `[0, "auto"]`, which always includes zero. A stack spans the sums of
 * its positive values and of its negative values.
 */
export function valueExtent<Row>(data: Row[], keys: string[], stacked = false): [number, number] {
  let min = 0;
  let max = 0;
  for (const row of data) {
    let up = 0;
    let down = 0;
    for (const key of keys) {
      const v = Number((row as Record<string, unknown>)[key]) || 0;
      if (stacked) {
        if (v > 0) up += v;
        else down += v;
      } else {
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    }
    if (stacked) {
      min = Math.min(min, down);
      max = Math.max(max, up);
    }
  }
  return [min, max];
}

/**
 * The tick labels a value axis will draw for this range. Recharts rounds the
 * domain out to "nice" ticks (0 to 84 draws 0, 25, 50, 75, 100), so the axis is
 * sized from those ticks, worked out the same way, rather than from the data.
 */
export function valueAxisLabels(format: (value: number) => string, [min, max]: [number, number]): string[] {
  return getNiceTickValues([Math.min(0, min), Math.max(0, max)], 5, true).map(format);
}
