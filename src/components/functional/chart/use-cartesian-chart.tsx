"use client";

import { useLocale } from "react-aria-components";
import type { TableColumn } from "../table/table";
import type { ChartTableRow } from "./chart-frame";
import {
  axisWidth,
  maxAbs,
  valueAxisLabels,
  valueExtent,
  numberFormatters,
  resolveSeries,
  type ChartCategoryFormatter,
  type ChartCategoryKey,
  type ChartSeries,
  type ChartValueFormatter,
} from "./chart-shared";

/** Props shared by charts that plot series against categories (line, area, bar). */
export interface CartesianChartProps<Row> {
  /** One row per category or point in time, in the order to plot them. */
  data: Row[];
  /** The row field naming each category or point in time (the x axis). */
  xKey: ChartCategoryKey<Row>;
  /** The series to plot, at most eight. Two or more get a legend. */
  series: ChartSeries<Row>[];
  /** Formats values in the tooltip, table and value axis. Defaults to the locale's number format. */
  formatValue?: ChartValueFormatter;
  /** Formats the categories on the axis, tooltip and table. Defaults to the value as is. */
  formatX?: ChartCategoryFormatter;
  /** What the categories are ("Month", "Region"): the first column header of the table view. Defaults to `xKey`. */
  xLabel?: string;
}

/** Series slots, formatters and the table view for a cartesian chart. */
export function useCartesianChart<Row>(
  { data, xKey, series, formatValue, formatX, xLabel }: CartesianChartProps<Row>,
  component: string,
  stacked = false,
) {
  const { locale } = useLocale();
  const resolved = resolveSeries(series, component);
  const formatters = numberFormatters(locale);
  const valueFormat = formatValue ?? formatters.value;
  const xFormat: ChartCategoryFormatter = formatX ?? ((v) => String(v));
  const max = maxAbs(data, resolved.map((s) => s.key), stacked);
  const tickFormat = formatValue ?? formatters.tick(max);

  const tableColumns: TableColumn<ChartTableRow>[] = [
    { key: "__x", header: xLabel ?? xKey, render: (row) => row.__x },
    ...resolved.map((s, i) => ({
      key: `s${i}`,
      header: s.label,
      align: "right" as const,
      render: (row: ChartTableRow) => row[`s${i}`],
    })),
  ];
  const tableRows: ChartTableRow[] = data.map((row, r) => {
    const record = row as Record<string, unknown>;
    const out: ChartTableRow = { __key: String(r), __x: xFormat(record[xKey] as string | number) };
    resolved.forEach((s, i) => {
      const v = record[s.key];
      out[`s${i}`] = typeof v === "number" ? valueFormat(v) : "—";
    });
    return out;
  });

  const valueLabels = valueAxisLabels(tickFormat, valueExtent(data, resolved.map((s) => s.key), stacked));

  return {
    series: resolved,
    valueAxisWidth: axisWidth(valueLabels),
    categoryAxisWidth: axisWidth(data.map((row) => xFormat((row as Record<string, unknown>)[xKey] as string | number))),
    valueFormat,
    xFormat,
    tickFormat,
    tableColumns,
    tableRows,
    legend: resolved.map(({ label, slot }) => ({ label, slot })),
    hasData: data.length > 0 && resolved.length > 0,
  };
}
