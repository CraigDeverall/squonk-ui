import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Card } from "../../layout/card/card";
import { Text } from "../../functional-primitive/text/text";
import { Container } from "./container";

const meta: Meta<typeof Container> = {
  title: "Components/Layout/Page structure/Container",
  // Keeps the URL from before components were grouped by job.
  id: "layout-primitives-container",
  component: Container,
  argTypes: {
    ...commonArgTypes,
    size: {
      control: "select",
      options: ["mobile", "tablet", "desktop", "wide", "full"],
      description: "Maximum width, drawn from breakpoint tokens. `full` removes the cap.",
    },
    gutters: {
      control: "boolean",
      description: "Apply horizontal padding from `theme.spacing.containerPadding`.",
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

type Story = StoryObj<typeof Container>;

const placeholder = (
  <Card variant="filled">
    <Text align="center">Content (centered, width-capped)</Text>
  </Card>
);

export const Desktop: Story = {
  args: { size: "desktop", gutters: true, children: placeholder },
};

export const Tablet: Story = {
  args: { size: "tablet", gutters: true, children: placeholder },
};

export const Wide: Story = {
  args: { size: "wide", gutters: true, children: placeholder },
};

export const NoGutters: Story = {
  args: { size: "desktop", gutters: false, children: placeholder },
};
