import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../layout/card/card";
import { Block } from "../../layout-primitive/block/block";
import { ThemeStyleBlock } from "../../style/theme-style-block/theme-style-block";
import { ScatterChart } from "./scatter-chart";

type Account = { name: string; daysLate: number; penalty: number };

const individuals: Account[] = [
  { name: "Aroha Ngata", daysLate: 4, penalty: 50 },
  { name: "James Whitfield", daysLate: 12, penalty: 120 },
  { name: "Mei Lin Chen", daysLate: 21, penalty: 180 },
  { name: "Tama Rāwiri", daysLate: 33, penalty: 310 },
  { name: "Sophie Grant", daysLate: 45, penalty: 390 },
  { name: "Rangi Parata", daysLate: 60, penalty: 540 },
  { name: "Olivia Brooks", daysLate: 8, penalty: 90 },
  { name: "Daniel Hayes", daysLate: 27, penalty: 260 },
];

const companies: Account[] = [
  { name: "Tui Street household", daysLate: 6, penalty: 250 },
  { name: "Hemlock Hollow household", daysLate: 15, penalty: 640 },
  { name: "Southern Fern household", daysLate: 30, penalty: 1180 },
  { name: "Pōhutukawa Walk household", daysLate: 42, penalty: 1650 },
  { name: "Rimu Ridge household", daysLate: 55, penalty: 2240 },
  { name: "Coastline household", daysLate: 19, penalty: 820 },
];

const nzd = new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 });

const meta: Meta<typeof ScatterChart<Account>> = {
  title: "Components/Data Visualization/Scatter Chart",
  id: "functional-scatter-chart",
  component: ScatterChart,
  decorators: [(Story) => <Block width="720px"><Story /></Block>],
  args: {
    title: "Overdue dues",
    description: "Each dot is one membership",
    series: [
      { label: "Wanderers", data: individuals },
      { label: "Keepers", data: companies },
    ],
    xKey: "daysLate",
    yKey: "penalty",
    nameKey: "name",
    xLabel: "Days late",
    yLabel: "Dues owing",
    formatY: (v: number) => nzd.format(v),
  },
  argTypes: {
    hideTitle: { control: "boolean" },
    loading: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleGroup: Story = {
  args: { title: "Overdue dues for households", series: [{ label: "Keepers", data: companies, slot: 2 }] },
};

export const Loading: Story = {
  args: { loading: true },
};

export const Empty: Story = {
  args: { series: [{ label: "Wanderers", data: [] }] },
};

export const DarkMode: Story = {
  render: (args) => (
    <ThemeStyleBlock invertMode>
      <Card>
        <ScatterChart {...args} />
      </Card>
    </ThemeStyleBlock>
  ),
};
