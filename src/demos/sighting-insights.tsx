import React from "react";
import {
  AreaChart,
  Badge,
  BarChart,
  Card,
  DonutChart,
  Grid,
  LineChart,
  Meter,
  ProgressBar,
  ScatterChart,
  SectionHeading,
  Select,
  Sparkline,
  Split,
  Motion,
  Stat,
  Table,
  Tabs,
  Text,
  VStack,
} from "../components";
import type { TableColumn } from "../components";
import { SocietyAppShell } from "./demo-shell";
import styles from "./demos.module.css";

// Made-up figures for a Society leadership dashboard. Nothing here is real.

type Period = "ytd" | "last";

const PERIODS: { value: Period; label: string }[] = [
  { value: "ytd", label: "2026–27 year to date" },
  { value: "last", label: "2025–26 full year" },
];

const nzdCompact = new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD", notation: "compact", maximumFractionDigits: 1 });
const thousands = (v: number) => nzdCompact.format(v * 1000);
const percent = (v: number) => `${v.toFixed(1)}%`;
const periodLabel = (period: Period) => PERIODS.find((p) => p.value === period)?.label ?? "";
const whole = new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 0 });
const sightings = (v: number) => whole.format(v);

interface MonthRow { month: string; trails: number; pools: number; heard: number }

/** Sightings logged by month. */
const COLLECTED: Record<Period, MonthRow[]> = {
  ytd: [
    { month: "Apr", trails: 114, pools: 76, heard: 43 },
    { month: "May", trails: 117, pools: 80, heard: 57 },
    { month: "Jun", trails: 119, pools: 78, heard: 45 },
    { month: "Jul", trails: 121, pools: 82, heard: 65 },
    { month: "Aug", trails: 122, pools: 84, heard: 49 },
    { month: "Sep", trails: 123, pools: 83, heard: 51 },
    { month: "Oct", trails: 126, pools: 88, heard: 68 },
  ],
  last: [
    { month: "Apr", trails: 109, pools: 72, heard: 40 },
    { month: "May", trails: 110, pools: 75, heard: 53 },
    { month: "Jun", trails: 111, pools: 74, heard: 43 },
    { month: "Jul", trails: 114, pools: 77, heard: 60 },
    { month: "Aug", trails: 115, pools: 79, heard: 46 },
    { month: "Sep", trails: 116, pools: 78, heard: 48 },
    { month: "Oct", trails: 118, pools: 82, heard: 63 },
    { month: "Nov", trails: 118, pools: 84, heard: 49 },
    { month: "Dec", trails: 122, pools: 92, heard: 47 },
    { month: "Jan", trails: 117, pools: 87, heard: 58 },
    { month: "Feb", trails: 118, pools: 79, heard: 50 },
    { month: "Mar", trails: 120, pools: 82, heard: 70 },
  ],
};

interface Headline {
  sightingsChange: number;
  overdue: number;
  overdueChange: number;
  onTime: number;
  onTimeChange: number;
  wait: number;
  waitChange: number;
}

const HEADLINES: Record<Period, Headline> = {
  ytd: { sightingsChange: 0.064, overdue: 4.2, overdueChange: 0.08, onTime: 91.2, onTimeChange: 0.011, wait: 6.4, waitChange: -0.12 },
  last: { sightingsChange: 0.041, overdue: 3.9, overdueChange: -0.03, onTime: 90.2, onTimeChange: -0.004, wait: 7.3, waitChange: 0.05 },
};

const totalSightings = (rows: MonthRow[]) => rows.reduce((sum, r) => sum + r.trails + r.pools + r.heard, 0);

interface ChapterRow { chapter: string; collected: number; overdue: number; trend: number[]; change: number }

/** Sightings and overdue dues (NZD thousands) by chapter in each period; the trend is the period's last 7 months. */
const CHAPTERS: Record<Period, ChapterRow[]> = {
  ytd: [
    { chapter: "Auckland", collected: 655, overdue: 1.62, trend: [81, 84, 85, 89, 90, 92, 96], change: 0.071 },
    { chapter: "Wellington", collected: 289, overdue: 0.48, trend: [39, 40, 40, 42, 42, 42, 44], change: 0.052 },
    { chapter: "Canterbury", collected: 266, overdue: 0.71, trend: [37, 36, 38, 39, 38, 39, 40], change: 0.038 },
    { chapter: "Waikato", collected: 163, overdue: 0.52, trend: [24, 23, 23, 23, 22, 24, 24], change: 0.006 },
    { chapter: "Bay of Plenty", collected: 126, overdue: 0.39, trend: [19, 18, 18, 18, 17, 18, 17], change: -0.031 },
    { chapter: "Otago", collected: 100, overdue: 0.27, trend: [14, 14, 14, 14, 15, 15, 15], change: 0.044 },
  ],
  last: [
    { chapter: "Auckland", collected: 1054, overdue: 1.49, trend: [84, 86, 94, 87, 86, 90, 92], change: 0.048 },
    { chapter: "Wellington", collected: 476, overdue: 0.51, trend: [39, 40, 42, 40, 39, 40, 42], change: 0.031 },
    { chapter: "Canterbury", collected: 444, overdue: 0.66, trend: [36, 37, 39, 37, 36, 38, 39], change: 0.027 },
    { chapter: "Waikato", collected: 279, overdue: 0.47, trend: [23, 23, 25, 23, 22, 23, 24], change: 0.019 },
    { chapter: "Bay of Plenty", collected: 224, overdue: 0.35, trend: [19, 19, 20, 19, 18, 19, 19], change: 0.012 },
    { chapter: "Otago", collected: 166, overdue: 0.28, trend: [13, 14, 15, 14, 14, 14, 14], change: 0.022 },
  ],
};

const ON_TIME = [
  { quarter: "Q1 25", rate: 86.4, target: 90 },
  { quarter: "Q2 25", rate: 87.9, target: 90 },
  { quarter: "Q3 25", rate: 88.6, target: 90 },
  { quarter: "Q4 25", rate: 90.4, target: 90 },
  { quarter: "Q1 26", rate: 89.7, target: 92 },
  { quarter: "Q2 26", rate: 91.2, target: 92 },
  { quarter: "Q3 26", rate: 92.6, target: 92 },
];

/** Dues payments received in each period, by channel. */
const CHANNELS: Record<Period, { channel: string; payments: number }[]> = {
  ytd: [
    { channel: "Internet banking", payments: 828 },
    { channel: "Direct debit", payments: 498 },
    { channel: "Debit or credit card", payments: 271 },
    { channel: "Member portal", payments: 151 },
    { channel: "Cheque", payments: 45 },
  ],
  last: [
    { channel: "Internet banking", payments: 1364 },
    { channel: "Direct debit", payments: 820 },
    { channel: "Debit or credit card", payments: 417 },
    { channel: "Member portal", payments: 203 },
    { channel: "Cheque", payments: 102 },
  ],
};
const paymentCount = new Intl.NumberFormat("en-NZ", { notation: "compact", maximumFractionDigits: 2 });

interface Officer { name: string; cases: number; days: number }

const DUES_TEAM: Officer[] = [
  { name: "Aroha Ngata", cases: 42, days: 11 },
  { name: "James Whitfield", cases: 58, days: 16 },
  { name: "Mei Lin Chen", cases: 35, days: 9 },
  { name: "Tama Rāwiri", cases: 61, days: 19 },
  { name: "Sophie Grant", cases: 49, days: 13 },
  { name: "Rangi Parata", cases: 67, days: 23 },
];

const VERIFIERS: Officer[] = [
  { name: "Olivia Brooks", cases: 28, days: 6 },
  { name: "Daniel Hayes", cases: 39, days: 8 },
  { name: "Hana Kereama", cases: 33, days: 7 },
  { name: "Liam O'Connor", cases: 51, days: 12 },
  { name: "Priya Shah", cases: 45, days: 9 },
];

function ChapterTable({ period }: { period: Period }) {
  const columns: TableColumn<ChapterRow>[] = [
    { key: "chapter", header: "Chapter", sortable: true },
    { key: "collected", header: "Sightings", align: "right", sortable: true, render: (r) => <span className={styles.figure}>{sightings(r.collected)}</span> },
    { key: "overdue", header: "Overdue dues", align: "right", sortable: true, render: (r) => <span className={styles.figure}>{thousands(r.overdue)}</span> },
    {
      key: "trend",
      header: "Last 7 months of the period",
      width: "140px",
      render: (r) => <Sparkline data={r.trend} label={`${r.chapter}, sightings over the period's last 7 months`} formatValue={sightings} slot={r.change < 0 ? 2 : 1} />,
    },
    {
      key: "change",
      header: "Change",
      align: "right",
      sortable: true,
      render: (r) => <Badge tone={r.change < 0 ? "warning" : r.change > 0.05 ? "success" : "neutral"}>{`${r.change > 0 ? "+" : ""}${(r.change * 100).toFixed(1)}%`}</Badge>,
    },
  ];
  return <Table caption="Sightings by chapter" columns={columns} rows={CHAPTERS[period]} rowKey="chapter" defaultSort={{ key: "collected", direction: "desc" }} />;
}

function Overview({ period }: { period: Period }) {
  const rows = COLLECTED[period];
  const h = HEADLINES[period];
  const total = totalSightings(rows);
  const monthly = rows.map((r) => r.trails + r.pools + r.heard);
  return (
    <VStack gap="lg">
      {/* The headline figures arrive in sequence, then count to their new
          values and highlight whenever the period changes. */}
      <Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md">
        <Motion.Stagger>
          <Motion.Presence show playOnMount>
            <Motion.Highlight watch={period}>
              <Card variant="outlined">
                <Stat label="Sightings logged" value={<Motion.Count value={total} format={sightings} />} change={h.sightingsChange} changeLabel="vs same period last year" trend={monthly} trendLabel="Sightings logged by month" />
              </Card>
            </Motion.Highlight>
          </Motion.Presence>
          <Motion.Presence show playOnMount>
            <Motion.Highlight watch={period}>
              <Card variant="outlined">
                <Stat label="Dues overdue" value={<Motion.Count value={h.overdue} format={thousands} />} change={h.overdueChange} changeLabel="vs last quarter" increaseIs="bad" trend={[3.4, 3.6, 3.5, 3.9, 4.0, h.overdue]} trendLabel="Dues overdue, last 6 quarters" trendSlot={2} />
              </Card>
            </Motion.Highlight>
          </Motion.Presence>
          <Motion.Presence show playOnMount>
            <Motion.Highlight watch={period}>
              <Card variant="outlined">
                <Stat label="Sightings verified on time" value={<Motion.Count value={h.onTime} format={percent} />} change={h.onTimeChange} changeLabel="vs last year" trend={ON_TIME.map((q) => q.rate)} trendLabel="Sightings verified on time, by quarter" trendSlot={3} />
              </Card>
            </Motion.Highlight>
          </Motion.Presence>
          <Motion.Presence show playOnMount>
            <Motion.Highlight watch={period}>
              <Card variant="outlined">
                <Stat label="Average time to verify" value={<Motion.Count value={h.wait} format={(v) => `${v} days`} />} change={h.waitChange} changeLabel="vs last month" increaseIs="bad" />
              </Card>
            </Motion.Highlight>
          </Motion.Presence>
        </Motion.Stagger>
      </Grid>

      <div className={styles.wideAndNarrow}>
        <Card variant="outlined">
          <AreaChart
            title="Sightings per month"
            description={`Sightings logged, ${PERIODS.find((p) => p.value === period)?.label}`}
            data={rows}
            xKey="month"
            xLabel="Month"
            series={[
              { key: "trails", label: "Tear trails" },
              { key: "pools", label: "Tear pools" },
              { key: "heard", label: "Heard weeping" },
            ]}
            formatValue={sightings}
            stacked
            smooth
          />
        </Card>
        <Card variant="outlined">
          <DonutChart
            title="How members pay"
            description={`Dues payments received, ${periodLabel(period)}`}
            data={CHANNELS[period]}
            nameKey="channel"
            valueKey="payments"
            nameLabel="Channel"
            valueLabel="Payments"
            totalLabel="payments"
            formatValue={(value) => paymentCount.format(value)}
          />
        </Card>
      </div>

      <Grid columns={{ mobile: 1, desktop: 2 }} gap="md">
        <Card variant="outlined">
          <BarChart
            title="Sightings by chapter"
            description={`Sightings logged, ${periodLabel(period)}`}
            orientation="horizontal"
            data={CHAPTERS[period]}
            xKey="chapter"
            xLabel="Chapter"
            series={[{ key: "collected", label: "Sightings" }]}
            formatValue={sightings}
          />
        </Card>
        <Card variant="outlined">
          <LineChart
            title="Sightings verified on time"
            description="Every quarter since 2025, against target, whichever period is chosen"
            data={ON_TIME}
            xKey="quarter"
            xLabel="Quarter"
            series={[
              { key: "rate", label: "Verified on time" },
              { key: "target", label: "Target", slot: 5 },
            ]}
            formatValue={percent}
            curve="monotone"
            showPoints
          />
        </Card>
      </Grid>
    </VStack>
  );
}

/** Live operational figures: they describe today, so the period doesn't apply. */
function Operations() {
  return (
    <VStack gap="lg">
      <Text tone="secondary">Live figures for today. The period above applies to Overview and Chapters.</Text>
      <Grid columns={{ mobile: 1, desktop: 2 }} gap="md">
        <Card variant="outlined">
          <VStack gap="md">
            <SectionHeading level={3} eyebrow="Watch season" headline="2026 sighting reports" sub="Verification for the season closes on 30 November." />
            <ProgressBar label="Reports verified" value={78} showValue />
            <ProgressBar label="Credits applied" value={64} tone="success" showValue />
            <ProgressBar label="Reports needing review" value={23} tone="warning" showValue />
          </VStack>
        </Card>
        <Card variant="outlined">
          <VStack gap="md">
            <SectionHeading level={3} eyebrow="Night watches" headline="Capacity this weekend" sub="Updated every 5 minutes." />
            <Meter label="Watch places booked" value={72} warningAt={80} criticalAt={95} showValue />
            <Meter label="Kit hire waiting list" value={86} warningAt={80} criticalAt={95} showValue />
            <Meter label="Field-trip places booked" value={97} warningAt={80} criticalAt={95} showValue />
          </VStack>
        </Card>
      </Grid>
      <Card variant="outlined">
        <ScatterChart
          title="Caseload and time to resolve"
          description="Each dot is one membership officer, last 30 days"
          series={[
            { label: "Dues team", data: DUES_TEAM },
            { label: "Verification team", data: VERIFIERS },
          ]}
          xKey="cases"
          yKey="days"
          nameKey="name"
          nameLabel="Officer"
          xLabel="Open cases"
          yLabel="Days to resolve"
          formatX={(v) => whole.format(v)}
          formatY={(v) => `${whole.format(v)} days`}
        />
      </Card>
    </VStack>
  );
}

/** The Society's leadership dashboard: headline figures, trends and capacity. */
export function SightingInsights() {
  const [period, setPeriod] = React.useState<Period>("ytd");
  return (
    <SocietyAppShell
      brand="Insights"
      nav={["Overview", "Sightings", "Dues", "Verification", "Night watches", "Reports"]}
      navLabel="Insights"
      account={{ person: "Mere Tūhoe", org: "Society leadership", detail: "Society secretary" }}
      active="Overview"
      crumbs={[{ label: "Insights", href: "#insights" }, { label: "Overview" }]}
      title="Sighting insights"
      description="Updated 8 November 2026, 9:00 am"
      actions={
        <Select
          label="Period"
          fullWidth={false}
          value={period}
          onChange={(value) => value && setPeriod(value)}
          options={PERIODS}
        />
      }
    >
      <Card variant="outlined">
        <Split wrap align="center">
          <Text tone="secondary">Figures are provisional until each month closes.</Text>
          <Badge tone="info">Provisional</Badge>
        </Split>
      </Card>
      <div className={styles.sectionGap}>
        <Tabs
          listLabel="Insights"
          items={[
            { value: "overview", label: "Overview", content: <Overview period={period} /> },
            { value: "chapters", label: "Chapters", content: <Card variant="outlined"><ChapterTable period={period} /></Card> },
            { value: "operations", label: "Operations", content: <Operations /> },
          ]}
        />
      </div>
    </SocietyAppShell>
  );
}
