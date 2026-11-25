import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../layout/card/card";
import { Block } from "../../layout-primitive/block/block";
import { ThemeStyleBlock } from "../../style/theme-style-block/theme-style-block";
import { AreaChart } from "./area-chart";

const sightings = [
  { week: "W1", online: 1820, agent: 940, paper: 310 },
  { week: "W2", online: 1960, agent: 1010, paper: 290 },
  { week: "W3", online: 2140, agent: 980, paper: 270 },
  { week: "W4", online: 2480, agent: 1120, paper: 260 },
  { week: "W5", online: 2390, agent: 1190, paper: 240 },
  { week: "W6", online: 2710, agent: 1240, paper: 220 },
  { week: "W7", online: 2980, agent: 1310, paper: 205 },
  { week: "W8", online: 3260, agent: 1290, paper: 190 },
];

const meta: Meta<typeof AreaChart<(typeof sightings)[number]>> = {
  title: "Components/Data Visualization/Area Chart",
  id: "functional-area-chart",
  component: AreaChart,
  decorators: [(Story) => <Block width="720px"><Story /></Block>],
  args: {
    title: "Sightings logged by channel",
    description: "Sightings per week, first quarter",
    data: sightings,
    xKey: "week",
    xLabel: "Week",
    series: [
      { key: "online", label: "Online" },
      { key: "agent", label: "Chapter lead" },
      { key: "paper", label: "Paper" },
    ],
  },
  argTypes: {
    stacked: { control: "boolean" },
    smooth: { control: "boolean" },
    hideTitle: { control: "boolean" },
    loading: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Stacked: Story = {
  args: { stacked: true, title: "All sightings logged", description: "Stacked by channel: the top edge is the total" },
};

export const SingleSeries: Story = {
  args: { title: "Sightings logged online", series: [{ key: "online", label: "Online" }], smooth: true },
};

export const Loading: Story = {
  args: { loading: true },
};

export const Empty: Story = {
  args: { data: [] },
};

export const DarkMode: Story = {
  args: { stacked: true },
  render: (args) => (
    <ThemeStyleBlock invertMode>
      <Card>
        <AreaChart {...args} />
      </Card>
    </ThemeStyleBlock>
  ),
};
