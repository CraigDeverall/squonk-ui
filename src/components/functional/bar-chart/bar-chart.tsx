"use client";

import React from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisProps, ChartFrame, ChartTooltip, chartRootProps } from "../chart/chart-frame";
import { slotColor, type ChartBaseProps } from "../chart/chart-shared";
import { useCartesianChart, type CartesianChartProps } from "../chart/use-cartesian-chart";

export type { ChartSeries, ChartSlot, ChartValueFormatter, ChartCategoryFormatter } from "../chart/chart-shared";

/** Which way the bars run. */
export type BarChartOrientation = "vertical" | "horizontal";

export interface BarChartProps<Row> extends ChartBaseProps, CartesianChartProps<Row> {
  /**
   * `vertical` (default) draws columns rising from the baseline, for a few
   * categories or periods in order. `horizontal` draws bars across, for
   * ranked lists and long category names that would collide under columns.
   */
  orientation?: BarChartOrientation;
  /**
   * Stack the series into one bar per category, when they are parts of a
   * whole. Leave it off to compare series side by side.
   */
  stacked?: boolean;
}

/** Bar thickness cap, gap between grouped bars and the rounded data end: fixed mark geometry. */
const MAX_BAR_PX = 24;
const GROUP_GAP_PX = 2;
const END_RADIUS_PX = 4;

/**
 * Compares magnitudes across categories, built on Recharts. Bars grow from
 * one baseline at zero; hover or arrow through them to read each value.
 */
export function BarChart<Row>({
  title,
  description,
  hideTitle,
  loading,
  empty,
  className,
  style,
  orientation = "vertical",
  stacked = false,
  ...cartesian
}: BarChartProps<Row>) {
  const chart = useCartesianChart(cartesian, "BarChart", stacked);
  const horizontal = orientation === "horizontal";
  const endRadius: [number, number, number, number] = horizontal
    ? [0, END_RADIUS_PX, END_RADIUS_PX, 0]
    : [END_RADIUS_PX, END_RADIUS_PX, 0, 0];
  const lastIndex = chart.series.length - 1;
  const tooltipOrder = stacked && !horizontal ? [...chart.series].reverse() : chart.series;

  const categoryAxis = { dataKey: cartesian.xKey, tickFormatter: chart.xFormat, ...axisProps };
  const valueAxis = { tickFormatter: chart.tickFormat, ...axisProps };

  return (
    <ChartFrame
      title={title}
      description={description}
      hideTitle={hideTitle}
      loading={loading}
      empty={empty}
      className={className}
      style={style}
      legend={chart.legend}
      legendShape="square"
      tableColumns={chart.tableColumns}
      tableRows={chart.tableRows}
      hasData={chart.hasData}
    >
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
        <RechartsBarChart
          {...chartRootProps}
          // Recharts' keyboard layer only steps along a horizontal category
          // axis; for ranked bars it would trap focus on the first bar, so the
          // table view is the keyboard route instead.
          accessibilityLayer={!horizontal}
          data={cartesian.data as Record<string, unknown>[]}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
          barGap={GROUP_GAP_PX}
          barCategoryGap="24%"
          maxBarSize={MAX_BAR_PX}
          aria-label={title}
        >
          <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" {...valueAxis} />
              <YAxis type="category" {...categoryAxis} width={chart.categoryAxisWidth} interval={0} />
            </>
          ) : (
            <>
              <XAxis type="category" {...categoryAxis} minTickGap={8} />
              <YAxis type="number" {...valueAxis} width={chart.valueAxisWidth} />
            </>
          )}
          <Tooltip
            cursor={{ fill: "var(--chart-cursor)" }}
            isAnimationActive={false}
            content={(props) => (
              <ChartTooltip
                active={props.active}
                label={props.label}
                payload={stacked ? tooltipOrder.map((s) => props.payload?.find((p) => p.dataKey === s.key)).filter((p) => p !== undefined) : props.payload}
                formatLabel={chart.xFormat}
                formatValue={chart.valueFormat}
              />
            )}
          />
          {chart.series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={slotColor(s.slot)}
              stackId={stacked ? "stack" : undefined}
              radius={!stacked || i === lastIndex ? endRadius : 0}
              // Stacked segments are parted by a surface-coloured gap, not an outline.
              stroke={stacked ? "var(--chart-mark-gap)" : undefined}
              strokeWidth={stacked ? 2 : 0}
              activeBar={false}
              isAnimationActive={false}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
