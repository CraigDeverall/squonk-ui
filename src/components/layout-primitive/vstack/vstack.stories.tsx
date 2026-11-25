import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Card } from "../../layout/card/card";
import { VStack } from "./vstack";

const spacingOptions = ["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

const meta: Meta<typeof VStack> = {
  title: "Components/Layout/Stacks and grids/VStack",
  // Keeps the URL from before components were grouped by job.
  id: "layout-primitives-vstack",
  component: VStack,
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
      description: "Cross-axis (horizontal) alignment.",
    },
    justify: {
      control: "select",
      options: ["start", "center", "end", "between", "around", "evenly"],
      description: "Main-axis (vertical) alignment.",
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

type Story = StoryObj<typeof VStack>;

const swatches = (count = 3) =>
  Array.from({ length: count }).map((_, i) => (
    <Card key={i} variant="filled">
      Item {i + 1}
    </Card>
  ));

export const Default: Story = {
  args: {
    gap: "md",
    align: "stretch",
    justify: "start",
    children: swatches(3),
  },
};

export const Centered: Story = {
  args: {
    gap: "sm",
    align: "center",
    justify: "center",
    children: swatches(2),
  },
};

export const SpaceBetween: Story = {
  args: {
    gap: "sm",
    align: "stretch",
    justify: "between",
    children: swatches(3),
  },
};
