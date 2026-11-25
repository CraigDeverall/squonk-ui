"use client";

import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisProps, ChartFrame, ChartTooltip, chartRootProps } from "../chart/chart-frame";
import { slotColor, type ChartBaseProps } from "../chart/chart-shared";
import { useCartesianChart, type CartesianChartProps } from "../chart/use-cartesian-chart";

export type { ChartSeries, ChartSlot, ChartValueFormatter, ChartCategoryFormatter } from "../chart/chart-shared";

/** How a line joins its points. */
export type LineChartCurve = "linear" | "monotone" | "step";

export interface LineChartProps<Row> extends ChartBaseProps, CartesianChartProps<Row> {
  /**
   * How the line joins its points. `linear` (default) draws straight segments
   * and never invents values between points; `monotone` smooths without
   * overshooting, for dense series; `step` holds each value until the next,
   * for levels that change at a moment (prices, plan tiers).
   */
  curve?: LineChartCurve;
  /** Mark every point with a dot. Use for sparse series (a dozen points or fewer) where each reading matters. */
  showPoints?: boolean;
}

/**
 * Change over time for one to eight series, built on Recharts. Hover or use the
 * arrow keys on the focused plot to read each point; the table view lists every value.
 */
export function LineChart<Row>({
  title,
  description,
  hideTitle,
  loading,
  empty,
  className,
  style,
  curve = "linear",
  showPoints = false,
  ...cartesian
}: LineChartProps<Row>) {
  const chart = useCartesianChart(cartesian, "LineChart");
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
      legendShape="line"
      tableColumns={chart.tableColumns}
      tableRows={chart.tableRows}
      hasData={chart.hasData}
    >
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
        <RechartsLineChart
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
                payload={props.payload}
                formatLabel={chart.xFormat}
                formatValue={chart.valueFormat}
              />
            )}
          />
          {chart.series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.label}
              type={curve === "step" ? "stepAfter" : curve}
              stroke={slotColor(s.slot)}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={showPoints ? { r: 4, fill: slotColor(s.slot), stroke: "var(--chart-mark-gap)", strokeWidth: 2 } : false}
              activeDot={{ r: 5, fill: slotColor(s.slot), stroke: "var(--chart-mark-gap)", strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls={false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
