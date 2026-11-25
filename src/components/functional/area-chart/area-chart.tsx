"use client";

import React from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
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

export interface AreaChartProps<Row> extends ChartBaseProps, CartesianChartProps<Row> {
  /**
   * Stack the series so the top edge is their total: use it when the series
   * are parts of one whole (sightings by type adding up to all sightings logged). Leave
   * it off to compare series that overlap, each from zero.
   */
  stacked?: boolean;
  /** Smooth the line without overshooting. Defaults to straight segments that never invent values. */
  smooth?: boolean;
}

/**
 * Volume over time: a line with a light wash beneath it, built on Recharts.
 * Stacked, the top edge reads as a total and each band as its part.
 */
export function AreaChart<Row>({
  title,
  description,
  hideTitle,
  loading,
  empty,
  className,
  style,
  stacked = false,
  smooth = false,
  ...cartesian
}: AreaChartProps<Row>) {
  const chart = useCartesianChart(cartesian, "AreaChart", stacked);
  // In a stack the first series sits at the bottom; list the tooltip top-down to match.
  const tooltipOrder = stacked ? [...chart.series].reverse() : chart.series;
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
        <RechartsAreaChart
          {...chartRootProps}
          data={cartesian.data as Record<string, unknown>[]}
          margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
          aria-label={title}
        >
          <CartesianGrid vertical={false} />
          <XAxis dataKey={cartesian.xKey} tickFormatter={chart.xFormat} {...axisProps} minTickGap={16} padding={{ left: 8, right: 8 }} />
          <YAxis tickFormatter={chart.tickFormat} {...axisProps} width={chart.valueAxisWidth} />
          <Tooltip
            cursor={{ stroke: "var(--chart-axis-line)", strokeWidth: 1 }}
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
          {chart.series.map((s) => (
            <Area
              key={s.key}
              dataKey={s.key}
              name={s.label}
              type={smooth ? "monotone" : "linear"}
              stackId={stacked ? "stack" : undefined}
              stroke={slotColor(s.slot)}
              strokeWidth={2}
              strokeLinejoin="round"
              fill={slotColor(s.slot)}
              dot={false}
              activeDot={{ r: 5, fill: slotColor(s.slot), stroke: "var(--chart-mark-gap)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
