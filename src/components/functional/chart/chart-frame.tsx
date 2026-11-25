"use client";

import { clsx } from "clsx";
import React from "react";
import { ToggleButton } from "react-aria-components";
import { Motion } from "../../animation/motion/motion";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import { Skeleton } from "../skeleton/skeleton";
import { Table, type TableColumn } from "../table/table";
import { slotColor, type ChartBaseProps, type ChartSlot } from "./chart-shared";
import styles from "./chart.module.css";

export interface ChartLegendItem {
  label: string;
  slot: ChartSlot;
}

export type ChartTableRow = Record<string, React.ReactNode> & { __key: string };

interface ChartFrameProps extends ChartBaseProps {
  /** Legend entries; the legend shows only for two or more. */
  legend: ChartLegendItem[];
  /** The key shape beside each legend entry, matching the marks. */
  legendShape: "line" | "square" | "dot";
  /** The data as a table, for the table view. */
  tableColumns: TableColumn<ChartTableRow>[];
  tableRows: ChartTableRow[];
  /** Whether there is anything to plot. */
  hasData: boolean;
  /** The plot itself. */
  children: React.ReactNode;
  /** Content laid over the centre of the plot (the donut's total). */
  overlay?: React.ReactNode;
}

/**
 * The figure every chart renders in: its title and description, a toggle to
 * read the data as a table, the legend, and the plot at the register's height.
 */
export function ChartFrame({
  title,
  description,
  hideTitle = false,
  loading = false,
  empty,
  className,
  style,
  legend,
  legendShape,
  tableColumns,
  tableRows,
  hasData,
  children,
  overlay,
}: ChartFrameProps) {
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const id = React.useId();
  const [showTable, setShowTable] = React.useState(false);
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const canShowTable = hasData && !loading;

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div className={styles.plot} data-register={register} aria-busy="true">
        <Skeleton shape="rect" height="100%" />
      </div>
    );
  } else if (!hasData) {
    body = (
      <div className={clsx(styles.plot, styles.empty)} data-register={register}>
        {empty ?? "No data to show"}
      </div>
    );
  } else if (showTable) {
    body = <Table caption={title} columns={tableColumns} rows={tableRows} rowKey={(row) => String(row.__key)} />;
  } else {
    body = (
      <div className={styles.plot} data-register={register}>
        {children}
        {overlay ? <div className={styles.overlay}>{overlay}</div> : null}
      </div>
    );
  }

  return (
    <figure
      className={clsx(styles.root, className)}
      style={{ ...themeVars.style, ...style }}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-busy={loading || undefined}
    >
      {themeVars.provide(
        <>
          <div className={styles.header}>
            <div className={clsx(styles.titleBlock, hideTitle && styles.visuallyHidden)}>
              <div id={titleId} className={styles.title}>{title}</div>
              {description ? <div id={descriptionId} className={styles.description}>{description}</div> : null}
            </div>
            {canShowTable ? (
              <Motion.Feedback>
                <ToggleButton className={styles.tableToggle} isSelected={showTable} onChange={setShowTable}>
                  Table view
                </ToggleButton>
              </Motion.Feedback>
            ) : null}
          </div>
          {legend.length >= 2 && hasData && !loading && !showTable ? (
            <ul className={styles.legend} aria-label="Legend">
              {legend.map((item) => (
                <li key={`${item.slot}-${item.label}`} className={styles.legendItem}>
                  <span
                    className={styles.swatch}
                    data-shape={legendShape}
                    style={{ "--chart-swatch": slotColor(item.slot) } as React.CSSProperties}
                    aria-hidden="true"
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          ) : null}
          {body}
        </>,
      )}
    </figure>
  );
}

interface TooltipEntry {
  name?: React.ReactNode;
  value?: unknown;
  color?: string;
  dataKey?: unknown;
}

export interface ChartTooltipProps {
  active?: boolean;
  label?: React.ReactNode;
  payload?: readonly TooltipEntry[];
  formatLabel?: (label: string | number) => string;
  formatValue: (value: number) => string;
  /** Hide the heading row (a donut slice names itself). */
  hideLabel?: boolean;
}

/** The hover and keyboard tooltip: the category, then each series' value beside its colour key. */
export function ChartTooltip({ active, label, payload, formatLabel, formatValue, hideLabel }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const heading = hideLabel || label === undefined || label === null
    ? null
    : formatLabel && (typeof label === "string" || typeof label === "number") ? formatLabel(label) : label;
  return (
    <div className={styles.tooltip}>
      {heading !== null ? <div className={styles.tooltipLabel}>{heading}</div> : null}
      <ul className={styles.tooltipList}>
        {payload.map((entry, i) => (
          <li key={`${String(entry.dataKey)}-${i}`} className={styles.tooltipRow}>
            <span
              className={styles.swatch}
              data-shape="square"
              style={{ "--chart-swatch": entry.color } as React.CSSProperties}
              aria-hidden="true"
            />
            <span className={styles.tooltipName}>{entry.name}</span>
            <span className={styles.tooltipValue}>
              {typeof entry.value === "number" ? formatValue(entry.value) : String(entry.value ?? "")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Props shared by every Recharts root: no entry animation (motion belongs to the Motion components), keyboard access on. */
export const chartRootProps = {
  accessibilityLayer: true,
} as const;

/** Axis tick styling is in the frame's CSS; these keep Recharts from drawing its own chrome. */
export const axisProps = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
} as const;

