import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../layout/card/card";
import { Block } from "../../layout-primitive/block/block";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Presentation } from "../../style/presentation/presentation";
import { ThemeStyleBlock } from "../../style/theme-style-block/theme-style-block";
import { Meter } from "./meter";

const meta: Meta<typeof Meter> = {
  title: "Components/Data Visualization/Meter",
  id: "functional-meter",
  component: Meter,
  decorators: [(Story) => <Block width="320px"><Story /></Block>],
  args: {
    label: "Document storage",
    value: 42,
    maxValue: 60,
    valueLabel: "42 of 60 GB",
    showValue: true,
    warningAt: 48,
    criticalAt: 57,
  },
  argTypes: {
    value: { control: { type: "number", min: 0, max: 60, step: 1 } },
    showValue: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Meter>;

export const Default: Story = {};

export const Levels: Story = {
  render: () => (
    <VStack gap="md">
      <Meter label="Credit limit used" value={2400} maxValue={10000} valueLabel="$2,400 of $10,000" showValue warningAt={7500} criticalAt={9500} />
      <Meter label="Credit limit used" value={8100} maxValue={10000} valueLabel="$8,100 of $10,000" showValue warningAt={7500} criticalAt={9500} />
      <Meter label="Credit limit used" value={9800} maxValue={10000} valueLabel="$9,800 of $10,000" showValue warningAt={7500} criticalAt={9500} />
    </VStack>
  ),
};

export const Percentage: Story = {
  args: { label: "Instalments paid", value: 7, maxValue: 12, valueLabel: undefined, warningAt: undefined, criticalAt: undefined },
};

export const NoVisibleLabel: Story = {
  args: { label: undefined, ariaLabel: "Document storage", showValue: false },
};

export const Registers: Story = {
  render: () => (
    <VStack gap="md">
      {(["compact", "default", "large", "hero"] as const).map((register) => (
        <Presentation key={register} register={register}>
          <Meter label={register} value={42} maxValue={60} />
        </Presentation>
      ))}
    </VStack>
  ),
};

export const DarkMode: Story = {
  render: (args) => (
    <ThemeStyleBlock invertMode>
      <Card>
        <VStack gap="md">
          <Meter {...args} />
          <Meter {...args} value={58} valueLabel="58 of 60 GB" />
        </VStack>
      </Card>
    </ThemeStyleBlock>
  ),
};
