"use client";

import React from "react";
import { useLocale } from "react-aria-components";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TableColumn } from "../table/table";
import { ChartFrame, ChartTooltip, chartRootProps, type ChartTableRow } from "../chart/chart-frame";
import chartStyles from "../chart/chart.module.css";
import {
  MAX_SERIES,
  numberFormatters,
  slotColor,
  type ChartBaseProps,
  type ChartCategoryKey,
  type ChartSlot,
  type ChartValueFormatter,
  type ChartValueKey,
} from "../chart/chart-shared";

export type { ChartValueFormatter } from "../chart/chart-shared";

export interface DonutChartProps<Row> extends ChartBaseProps {
  /**
   * One row per part of the whole, in the order to draw them clockwise from
   * the top. Sort largest first unless the parts have a natural order.
   * Parts past the seventh fold into one "Other" slice.
   */
  data: Row[];
  /** The row field naming each part. */
  nameKey: ChartCategoryKey<Row>;
  /** The row field holding each part's size. Negative values are not drawn. */
  valueKey: ChartValueKey<Row>;
  /** Formats values in the centre, tooltip and table. Defaults to the locale's number format. */
  formatValue?: ChartValueFormatter;
  /** The words under the total in the centre. Defaults to "Total". */
  totalLabel?: string;
  /** Leave the centre empty, for when the total is shown elsewhere or means nothing. */
  hideTotal?: boolean;
  /** The name of the slice that collects parts past the seventh. Defaults to "Other". */
  otherLabel?: string;
  /** What the parts are ("Dues type"): the first column header of the table view. Defaults to `nameKey`. */
  nameLabel?: string;
  /** What the values are ("Amount"): the value column header of the table view. Defaults to "Value". */
  valueLabel?: string;
}

interface Slice {
  name: string;
  value: number;
  slot: ChartSlot;
  fill: string;
}

/** Fixed ring geometry: the hole leaves room for the total, the ring stays a thin mark. */
const INNER_RADIUS = "64%";
const OUTER_RADIUS = "92%";

/**
 * Parts of one whole, as a ring with the total in the middle, built on
 * Recharts. Best for two to five parts; compare more with a BarChart.
 */
export function DonutChart<Row>({
  title,
  description,
  hideTitle,
  loading,
  empty,
  className,
  style,
  data,
  nameKey,
  valueKey,
  formatValue,
  totalLabel = "Total",
  hideTotal = false,
  otherLabel = "Other",
  nameLabel,
  valueLabel = "Value",
}: DonutChartProps<Row>) {
  const { locale } = useLocale();
  const format = formatValue ?? numberFormatters(locale).value;
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

  const parts = data
    .map((row) => {
      const record = row as Record<string, unknown>;
      return { name: String(record[nameKey]), value: Number(record[valueKey]) || 0 };
    })
    .filter((p) => p.value > 0);
  const kept = parts.length > MAX_SERIES ? parts.slice(0, MAX_SERIES - 1) : parts;
  const folded = parts.length > MAX_SERIES ? parts.slice(MAX_SERIES - 1) : [];
  const slices: Slice[] = [
    ...kept,
    ...(folded.length ? [{ name: otherLabel, value: folded.reduce((sum, p) => sum + p.value, 0) }] : []),
  ].map((p, i) => ({ ...p, slot: (i + 1) as ChartSlot, fill: slotColor((i + 1) as ChartSlot) }));
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  const tableColumns: TableColumn<ChartTableRow>[] = [
    { key: "name", header: nameLabel ?? nameKey, render: (row) => row.name },
    { key: "value", header: valueLabel, align: "right", render: (row) => row.value },
    { key: "share", header: "Share", align: "right", render: (row) => row.share },
  ];
  const tableRows: ChartTableRow[] = parts.map((p, i) => ({
    __key: String(i),
    name: p.name,
    value: format(p.value),
    share: percent.format(p.value / total),
  }));

  return (
    <ChartFrame
      title={title}
      description={description}
      hideTitle={hideTitle}
      loading={loading}
      empty={empty}
      className={className}
      style={style}
      legend={slices.map(({ name, slot }) => ({ label: name, slot }))}
      legendShape="dot"
      tableColumns={tableColumns}
      tableRows={tableRows}
      hasData={slices.length > 0}
      overlay={
        hideTotal ? undefined : (
          <>
            <span className={chartStyles.totalValue}>{format(total)}</span>
            <span className={chartStyles.totalLabel}>{totalLabel}</span>
          </>
        )
      }
    >
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
        <PieChart {...chartRootProps} aria-label={title}>
          <Tooltip
            isAnimationActive={false}
            content={(props) => (
              <ChartTooltip
                active={props.active}
                payload={props.payload?.map((p) => ({
                  ...p,
                  color: (p.payload as Slice | undefined)?.fill,
                  value:
                    typeof p.value === "number" && total > 0
                      ? `${format(p.value)} (${percent.format(p.value / total)})`
                      : p.value,
                }))}
                formatValue={format}
                hideLabel
              />
            )}
          />
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius={INNER_RADIUS}
            outerRadius={OUTER_RADIUS}
            startAngle={90}
            endAngle={-270}
            stroke="var(--chart-mark-gap)"
            strokeWidth={2}
            cornerRadius={2}
            isAnimationActive={false}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
