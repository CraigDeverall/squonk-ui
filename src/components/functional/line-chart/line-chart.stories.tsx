import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "../../functional-primitive/heading/heading";
import { Card } from "../../layout/card/card";
import { Block } from "../../layout-primitive/block/block";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { ThemeStyleBlock } from "../../style/theme-style-block/theme-style-block";
import { LineChart } from "./line-chart";

const collected = [
  { month: "Jan", dues: 41200, levy: 58300, kit: 22800 },
  { month: "Feb", dues: 39800, levy: 57100, kit: 24100 },
  { month: "Mar", dues: 45600, levy: 60400, kit: 31900 },
  { month: "Apr", dues: 43100, levy: 59800, kit: 29400 },
  { month: "May", dues: 47900, levy: 61200, kit: 27600 },
  { month: "Jun", dues: 52300, levy: 63900, kit: 35200 },
  { month: "Jul", dues: 50100, levy: 62700, kit: 33800 },
  { month: "Aug", dues: 54800, levy: 64100, kit: 38100 },
  { month: "Sep", dues: 56200, levy: 66300, kit: 36700 },
  { month: "Oct", dues: 58900, levy: 65800, kit: 41300 },
  { month: "Nov", dues: 57400, levy: 67900, kit: 43900 },
  { month: "Dec", dues: 61800, levy: 69200, kit: 46200 },
];

const nzd = new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 });

const meta: Meta<typeof LineChart<(typeof collected)[number]>> = {
  decorators: [(Story) => <Block width="720px"><Story /></Block>],
  title: "Components/Data Visualization/Line Chart",
  id: "functional-line-chart",
  component: LineChart,
  args: {
    title: "Dues collected by month",
    description: "NZD, 2026",
    data: collected,
    xKey: "month",
    xLabel: "Month",
    series: [
      { key: "levy", label: "Swamp Fund levy" },
      { key: "dues", label: "Annual dues" },
      { key: "kit", label: "Night-watch kit hire" },
    ],
    formatValue: (v: number) => nzd.format(v),
  },
  argTypes: {
    curve: { control: "radio", options: ["linear", "monotone", "step"] },
    showPoints: { control: "boolean" },
    hideTitle: { control: "boolean" },
    loading: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleSeries: Story = {
  args: {
    title: "Annual dues collected by month",
    series: [{ key: "dues", label: "Annual dues" }],
    showPoints: true,
  },
};

export const Smoothed: Story = {
  args: { curve: "monotone" },
};

export const PinnedColours: Story = {
  args: {
    title: "Night-watch kit hire only",
    description: "Pinned to slot 3, so it keeps the colour it has beside Swamp Fund levy and Annual dues.",
    series: [{ key: "kit", label: "Night-watch kit hire", slot: 3 }],
  },
};

export const InCard: Story = {
  render: (args) => (
    <Card>
      <VStack gap="md">
        <Heading level={3}>Dues collected</Heading>
        <LineChart {...args} hideTitle />
      </VStack>
    </Card>
  ),
};

export const Loading: Story = {
  args: { loading: true },
};

export const Empty: Story = {
  args: { data: [], empty: "No sightings logged in this period" },
};

export const DarkMode: Story = {
  render: (args) => (
    <ThemeStyleBlock invertMode>
      <Card>
        <LineChart {...args} />
      </Card>
    </ThemeStyleBlock>
  ),
};
