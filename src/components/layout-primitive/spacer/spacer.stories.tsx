import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Card } from "../../layout/card/card";
import { Block } from "../block/block";
import { HStack } from "../hstack/hstack";
import { Spacer } from "./spacer";

const meta: Meta<typeof Spacer> = {
  title: "Components/Layout/Stacks and grids/Spacer",
  // Keeps the URL from before components were grouped by job.
  id: "layout-primitives-spacer",
  component: Spacer,
  argTypes: {
    ...commonArgTypes,
    size: {
      control: "select",
      options: ["auto", "xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "`auto` fills available flex space; tokens set a fixed dimension.",
    },
    ref: {
      description: "Ref to the DOM element",
      control: false,
      table: {
        type: { summary: "React.RefObject<HTMLDivElement>" },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Spacer>;

const chip = (label: string) => <Card variant="filled">{label}</Card>;

export const PushApart: Story = {
  args: { size: "auto" },
  render: (args) => (
    <Block bordered padding="xs" radius="base">
      <HStack align="center" gap="none">
        {chip("Logo")}
        <Spacer {...args} />
        {chip("User")}
      </HStack>
    </Block>
  ),
};

export const FixedGap: Story = {
  args: { size: "lg" },
  render: (args) => (
    <Block bordered padding="xs" radius="base" width="fit">
      <HStack align="center" gap="none">
        {chip("A")}
        <Spacer {...args} />
        {chip("B")}
      </HStack>
    </Block>
  ),
};
