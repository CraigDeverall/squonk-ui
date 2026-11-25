import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "../../functional-primitive/text/text";
import { Card } from "../../layout/card/card";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Presentation } from "../../style/presentation/presentation";
import { ThemeStyleBlock } from "../../style/theme-style-block/theme-style-block";
import { Sparkline } from "./sparkline";

const balance = [4200, 3900, 4100, 3600, 3300, 3450, 2900, 2600, 2750, 2200, 1900, 1500];
const sightings = [120, 132, 128, 151, 149, 170, 168, 182, 195, 191, 214, 230];

const meta: Meta<typeof Sparkline> = {
  title: "Components/Data Visualization/Sparkline",
  id: "functional-sparkline",
  component: Sparkline,
  args: {
    data: sightings,
    label: "Sightings logged, last 12 weeks",
  },
  argTypes: {
    slot: { control: { type: "number", min: 1, max: 8 } },
    filled: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Sparkline>;

export const Default: Story = {};

export const Filled: Story = {
  args: { filled: true },
};

export const BesideAFigure: Story = {
  render: () => (
    <HStack gap="sm" align="center">
      <Text>Dues owing $1,500</Text>
      <Sparkline data={balance} label="Dues owing, last 12 months" slot={2} />
    </HStack>
  ),
};

export const Registers: Story = {
  render: () => (
    <VStack gap="md">
      {(["compact", "default", "large", "hero"] as const).map((register) => (
        <Presentation key={register} register={register}>
          <HStack gap="sm" align="center">
            <Text>{register}</Text>
            <Sparkline data={sightings} label={`Sightings logged (${register})`} />
          </HStack>
        </Presentation>
      ))}
    </VStack>
  ),
};

export const DarkMode: Story = {
  render: (args) => (
    <ThemeStyleBlock invertMode>
      <Card>
        <Sparkline {...args} filled />
      </Card>
    </ThemeStyleBlock>
  ),
};
