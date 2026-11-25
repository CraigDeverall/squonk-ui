import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../layout/card/card";
import { Block } from "../../layout-primitive/block/block";
import { ThemeStyleBlock } from "../../style/theme-style-block/theme-style-block";
import { DonutChart } from "./donut-chart";

const dueTypes = [
  { type: "Annual dues", amount: 38_400_000 },
  { type: "Swamp Fund levy", amount: 26_100_000 },
  { type: "Night-watch kit hire", amount: 17_900_000 },
  { type: "Field-trip deposit", amount: 4_200_000 },
];

const compact = new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD", notation: "compact", maximumFractionDigits: 1 });

const meta: Meta<typeof DonutChart<(typeof dueTypes)[number]>> = {
  title: "Components/Data Visualization/Donut Chart",
  id: "functional-donut-chart",
  component: DonutChart,
  decorators: [(Story) => <Block width="480px"><Story /></Block>],
  args: {
    title: "Dues collected by type",
    description: "October 2026",
    data: dueTypes,
    nameKey: "type",
    valueKey: "amount",
    nameLabel: "Dues type",
    valueLabel: "Collected",
    formatValue: (v: number) => compact.format(v),
  },
  argTypes: {
    hideTotal: { control: "boolean" },
    hideTitle: { control: "boolean" },
    loading: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoParts: Story = {
  render: () => (
    <DonutChart
      title="Sightings verified"
      data={[
        { status: "Verified", count: 9120 },
        { status: "Under review", count: 880 },
      ]}
      nameKey="status"
      valueKey="count"
      totalLabel="Sightings"
    />
  ),
};

export const FoldsIntoOther: Story = {
  render: () => (
    <DonutChart
      title="Sightings by chapter"
      description="Parts past the seventh fold into Other"
      data={[
        { chapter: "Auckland", sightings: 3420 },
        { chapter: "Wellington", sightings: 2810 },
        { chapter: "Canterbury", sightings: 2290 },
        { chapter: "Waikato", sightings: 2140 },
        { chapter: "Bay of Plenty", sightings: 1380 },
        { chapter: "Otago", sightings: 420 },
        { chapter: "Taranaki", sightings: 260 },
        { chapter: "Northland", sightings: 140 },
        { chapter: "Southland", sightings: 90 },
      ]}
      nameKey="chapter"
      valueKey="sightings"
      totalLabel="Sightings"
    />
  ),
};

export const NoTotal: Story = {
  args: { hideTotal: true },
};

export const Loading: Story = {
  args: { loading: true },
};

export const Empty: Story = {
  args: { data: [] },
};

export const DarkMode: Story = {
  render: (args) => (
    <ThemeStyleBlock invertMode>
      <Card>
        <DonutChart {...args} />
      </Card>
    </ThemeStyleBlock>
  ),
};
