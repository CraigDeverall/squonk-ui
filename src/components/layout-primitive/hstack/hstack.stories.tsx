import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Card } from "../../layout/card/card";
import { HStack } from "./hstack";

const spacingOptions = ["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

const meta: Meta<typeof HStack> = {
  title: "Components/Layout/Stacks and grids/HStack",
  // Keeps the URL from before components were grouped by job.
  id: "layout-primitives-hstack",
  component: HStack,
  argTypes: {
    ...commonArgTypes,
    gap: {
      control: "select",
      options: spacingOptions,
      description: "Gap between children (spacing scale token).",
    },
    align: {
      control: "select",
      options: ["start", "center", "end", "stretch", "baseline"],
      description: "Cross-axis (vertical) alignment.",
    },
    justify: {
      control: "select",
      options: ["start", "center", "end", "between", "around", "evenly"],
      description: "Main-axis (horizontal) alignment.",
    },
    wrap: {
      control: "boolean",
      description: "Allow children to wrap to a new line.",
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

type Story = StoryObj<typeof HStack>;

const swatches = (count = 3) =>
  Array.from({ length: count }).map((_, i) => (
    <Card key={i} variant="filled">
      Item {i + 1}
    </Card>
  ));

export const Default: Story = {
  args: {
    gap: "md",
    align: "center",
    justify: "start",
    children: swatches(3),
  },
};

export const SpaceBetween: Story = {
  args: {
    gap: "sm",
    align: "center",
    justify: "between",
    children: swatches(3),
  },
};

export const Wrapping: Story = {
  args: {
    gap: "sm",
    align: "center",
    justify: "start",
    wrap: true,
    children: swatches(10),
  },
};
