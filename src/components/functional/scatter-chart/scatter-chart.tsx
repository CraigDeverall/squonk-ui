"use client";

import React from "react";
import { useLocale } from "react-aria-components";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart as RechartsScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { TableColumn } from "../table/table";
import { axisProps, ChartFrame, ChartTooltip, chartRootProps, type ChartTableRow } from "../chart/chart-frame";
import {
  axisWidth,
  maxAbs,
  valueAxisLabels,
  valueExtent,
  numberFormatters,
  resolveSeries,
  slotColor,
  type ChartBaseProps,
  type ChartCategoryKey,
  type ChartSlot,
  type ChartValueFormatter,
  type ChartValueKey,
} from "../chart/chart-shared";

export type { ChartSlot, ChartValueFormatter } from "../chart/chart-shared";

/** One group of points, drawn in one colour. */
export interface ScatterChartSeries<Row> {
  /** The group's name in the legend, tooltip and table. */
  label: string;
  /** The group's points, one row each. */
  data: Row[];
  /** Pin the group to a palette slot (1–8) so it keeps its colour when others are filtered out. */
  slot?: ChartSlot;
}

export interface ScatterChartProps<Row> extends ChartBaseProps {
  /**
   * The groups of points. Keep to three: past that, colours of non-adjacent
   * groups get hard to tell apart where their points mingle.
   */
  series: ScatterChartSeries<Row>[];
  /** The row field plotted across. */
  xKey: ChartValueKey<Row>;
  /** The row field plotted up. */
  yKey: ChartValueKey<Row>;
  /** What the horizontal axis measures ("Days to file"). Shown on the axis, tooltip and table. */
  xLabel: string;
  /** What the vertical axis measures ("Dues owing, NZD"). Shown on the axis, tooltip and table. */
  yLabel: string;
  /** The row field naming each point ("Member"), shown as the tooltip heading and in the table. */
  nameKey?: ChartCategoryKey<Row>;
  /** What the named items are ("Member"): the name column header of the table view. Defaults to "Name". */
  nameLabel?: string;
  /** Formats horizontal values. Defaults to the locale's number format. */
  formatX?: ChartValueFormatter;
  /** Formats vertical values. Defaults to the locale's number format. */
  formatY?: ChartValueFormatter;
}

interface Point {
  x: number;
  y: number;
  name?: string;
  series: string;
  color: string;
}

/**
 * The relationship between two measures, one dot per item, built on Recharts.
 * Use it to spot correlation, clusters and outliers.
 */
export function ScatterChart<Row>({
  title,
  description,
  hideTitle,
  loading,
  empty,
  className,
  style,
  series,
  xKey,
  yKey,
  xLabel,
  yLabel,
  nameKey,
  nameLabel = "Name",
  formatX,
  formatY,
}: ScatterChartProps<Row>) {
  const { locale } = useLocale();
  const formatters = numberFormatters(locale);
  const resolved = resolveSeries(series, "ScatterChart");
  const all = resolved.flatMap((s) => s.data);
  const fx = formatX ?? formatters.value;
  const fy = formatY ?? formatters.value;
  const tickX = formatX ?? formatters.tick(maxAbs(all, [xKey]));
  const maxY = maxAbs(all, [yKey]);
  const tickY = formatY ?? formatters.tick(maxY);
  // Room for the tick labels plus the rotated axis title beside them.
  const yAxisWidth = axisWidth(valueAxisLabels(tickY, valueExtent(all, [yKey]))) + 20;

  const groups = resolved.map((s) => ({
    ...s,
    points: s.data.map((row): Point => {
      const record = row as Record<string, unknown>;
      return {
        x: Number(record[xKey]),
        y: Number(record[yKey]),
        name: nameKey ? String(record[nameKey]) : undefined,
        series: s.label,
        color: slotColor(s.slot),
      };
    }),
  }));

  const tableColumns: TableColumn<ChartTableRow>[] = [
    ...(resolved.length > 1 ? [{ key: "series", header: "Group", render: (row: ChartTableRow) => row.series }] : []),
    ...(nameKey ? [{ key: "name", header: nameLabel, render: (row: ChartTableRow) => row.name }] : []),
    { key: "x", header: xLabel, align: "right", render: (row) => row.x },
    { key: "y", header: yLabel, align: "right", render: (row) => row.y },
  ];
  const tableRows: ChartTableRow[] = groups.flatMap((g, gi) =>
    g.points.map((p, pi) => ({ __key: `${gi}-${pi}`, series: g.label, name: p.name ?? "", x: fx(p.x), y: fy(p.y) })),
  );

  return (
    <ChartFrame
      title={title}
      description={description}
      hideTitle={hideTitle}
      loading={loading}
      empty={empty}
      className={className}
      style={style}
      legend={resolved.map(({ label, slot }) => ({ label, slot }))}
      legendShape="dot"
      tableColumns={tableColumns}
      tableRows={tableRows}
      hasData={all.length > 0}
    >
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
        <RechartsScatterChart {...chartRootProps} margin={{ top: 8, right: 16, bottom: 16, left: 8 }} aria-label={title}>
          <CartesianGrid />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            tickFormatter={tickX}
            {...axisProps}
            label={{ value: xLabel, position: "insideBottom", offset: -12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            tickFormatter={tickY}
            {...axisProps}
            width={yAxisWidth}
            label={{ value: yLabel, angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
          />
          <ZAxis range={[72, 72]} />
          <Tooltip
            cursor={false}
            isAnimationActive={false}
            content={(props) => {
              const point = props.payload?.[0]?.payload as Point | undefined;
              if (!props.active || !point) return null;
              return (
                <ChartTooltip
                  active
                  label={point.name ?? point.series}
                  payload={[
                    { name: xLabel, value: fx(point.x), color: point.color, dataKey: "x" },
                    { name: yLabel, value: fy(point.y), color: point.color, dataKey: "y" },
                  ]}
                  formatValue={fx}
                />
              );
            }}
          />
          {groups.map((g) => (
            <Scatter
              key={`${g.slot}-${g.label}`}
              name={g.label}
              data={g.points}
              fill={slotColor(g.slot)}
              stroke="var(--chart-mark-gap)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </RechartsScatterChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
