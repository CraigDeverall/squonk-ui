import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../layout/card/card";
import { Block } from "../../layout-primitive/block/block";
import { Grid } from "../../layout-primitive/grid/grid";
import { ThemeStyleBlock } from "../../style/theme-style-block/theme-style-block";
import { Stat } from "./stat";

const meta: Meta<typeof Stat> = {
  title: "Components/Data Visualization/Stat",
  id: "functional-stat",
  component: Stat,
  render: (args) => (
    <Block width="280px">
      <Card>
        <Stat {...args} />
      </Card>
    </Block>
  ),
  args: {
    label: "Sightings logged",
    value: "1,284",
    change: 0.124,
    changeLabel: "vs last month",
  },
  argTypes: {
    increaseIs: { control: "radio", options: ["good", "bad", "neutral"] },
    change: { control: { type: "number", step: 0.01 } },
  },
};

export default meta;

type Story = StoryObj<typeof Stat>;

export const Default: Story = {};

export const WithTrend: Story = {
  args: {
    trend: [980, 1012, 1045, 1021, 1098, 1130, 1142, 1201, 1188, 1284],
    trendLabel: "Sightings logged, last 10 months",
  },
};

export const IncreaseIsBad: Story = {
  args: { label: "Overdue dues", value: "$4.2K", change: 0.08, changeLabel: "vs last quarter", increaseIs: "bad" },
};

export const Decrease: Story = {
  args: { label: "Overdue dues", value: "$3.6K", change: -0.061, changeLabel: "vs last quarter", increaseIs: "bad" },
};

export const NoChange: Story = {
  args: { label: "Active members", value: "1,204", change: 0, changeLabel: "vs last month", increaseIs: "neutral" },
};

export const FigureOnly: Story = {
  args: { label: "Credits issued", value: "3,481", change: undefined, changeLabel: undefined },
};

export const Row: Story = {
  render: () => (
    <Block width="880px">
    <Grid columns={{ mobile: 1, tablet: 3 }} gap="md">
      <Card>
        <Stat label="Dues collected" value="$86.6K" change={0.052} changeLabel="vs October 2025" trend={[71, 74, 73, 78, 80, 79, 83, 86.6]} trendLabel="Dues collected, last 8 months" />
      </Card>
      <Card>
        <Stat label="Overdue dues" value="$4.2K" change={0.08} changeLabel="vs last quarter" increaseIs="bad" trend={[3.4, 3.6, 3.5, 3.9, 4.0, 4.2]} trendLabel="Overdue dues, last 6 quarters" trendSlot={2} />
      </Card>
      <Card>
        <Stat label="Sightings verified" value="91.2%" change={-0.004} changeLabel="vs last year" trend={[89, 90, 90.5, 91.6, 91.2]} trendLabel="Sightings verified, last 5 years" trendSlot={3} />
      </Card>
    </Grid>
    </Block>
  ),
};

export const DarkMode: Story = {
  args: { trend: [980, 1012, 1045, 1021, 1098, 1130, 1142, 1201, 1188, 1284] },
  render: (args) => (
    <ThemeStyleBlock invertMode>
      <Block width="280px">
        <Card>
          <Stat {...args} />
        </Card>
      </Block>
    </ThemeStyleBlock>
  ),
};
