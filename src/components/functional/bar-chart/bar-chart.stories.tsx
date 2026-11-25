import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../layout/card/card";
import { Block } from "../../layout-primitive/block/block";
import { ThemeStyleBlock } from "../../style/theme-style-block/theme-style-block";
import { BarChart } from "./bar-chart";

const quarters = [
  { quarter: "Q1", assessed: 182, paid: 164 },
  { quarter: "Q2", assessed: 205, paid: 171 },
  { quarter: "Q3", assessed: 194, paid: 188 },
  { quarter: "Q4", assessed: 231, paid: 202 },
];

const chapters = [
  { chapter: "Auckland", sightings: 48210, pending: 3120 },
  { chapter: "Wellington", sightings: 21940, pending: 1260 },
  { chapter: "Canterbury", sightings: 19870, pending: 1480 },
  { chapter: "Waikato", sightings: 14320, pending: 1190 },
  { chapter: "Bay of Plenty", sightings: 11650, pending: 930 },
  { chapter: "Otago", sightings: 8940, pending: 610 },
];

const meta: Meta<typeof BarChart<(typeof quarters)[number]>> = {
  title: "Components/Data Visualization/Bar Chart",
  id: "functional-bar-chart",
  component: BarChart,
  decorators: [(Story) => <Block width="720px"><Story /></Block>],
  args: {
    title: "Dues invoiced and collected",
    description: "NZD thousands, 2026",
    data: quarters,
    xKey: "quarter",
    xLabel: "Quarter",
    series: [
      { key: "assessed", label: "Invoiced" },
      { key: "paid", label: "Collected" },
    ],
    formatValue: (v: number) => `$${v}k`,
  },
  argTypes: {
    orientation: { control: "radio", options: ["vertical", "horizontal"] },
    stacked: { control: "boolean" },
    hideTitle: { control: "boolean" },
    loading: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleSeries: Story = {
  args: { title: "Dues collected by quarter", series: [{ key: "paid", label: "Collected", slot: 2 }] },
};

export const Horizontal: Story = {
  render: () => (
    <BarChart
      title="Sightings logged by chapter"
      description="Ranked, 2026-27 season"
      data={chapters}
      xKey="chapter"
      xLabel="Chapter"
      orientation="horizontal"
      series={[{ key: "sightings", label: "Sightings" }]}
    />
  ),
};

export const Stacked: Story = {
  render: () => (
    <BarChart
      title="Verified and under-review sightings by chapter"
      data={chapters.map((r) => ({ ...r, verified: r.sightings - r.pending }))}
      xKey="chapter"
      xLabel="Chapter"
      stacked
      series={[
        { key: "verified", label: "Verified" },
        { key: "pending", label: "Under review" },
      ]}
    />
  ),
};

export const Loading: Story = {
  args: { loading: true },
};

export const Empty: Story = {
  args: { data: [], empty: "No dues invoiced this year" },
};

export const DarkMode: Story = {
  render: (args) => (
    <ThemeStyleBlock invertMode>
      <Card>
        <BarChart {...args} />
      </Card>
    </ThemeStyleBlock>
  ),
};
