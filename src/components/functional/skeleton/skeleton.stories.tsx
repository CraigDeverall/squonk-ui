import type { Meta, StoryObj } from "@storybook/react";
import { Card as UICard } from "../../layout/card/card";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Skeleton } from "./skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Feedback/Skeleton",
  // Keeps the URL from before components were grouped by job.
  id: "functional-skeleton",
  component: Skeleton,
  argTypes: {
    shape: { control: "radio", options: ["rect", "text", "circle"] },
    width: { control: "text" },
    height: { control: "text" },
    lines: { control: { type: "number", min: 1, max: 8 } },
    noAnimation: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: { width: 320, height: 16 },
};

export const TextLines: Story = {
  // Lines default to 100% wide, and the story canvas sizes to its content,
  // so the story sets a width.
  args: { shape: "text", lines: 4, width: 320 },
};

export const Card: Story = {
  render: () => (
    <UICard variant="outlined" style={{ width: 360, maxWidth: "100%" }}>
      <HStack gap="sm" align="center">
        <Skeleton shape="circle" width={48} />
        <VStack gap="xs" style={{ flex: 1 }}>
          <Skeleton width="60%" height={12} />
          <Skeleton width="90%" height={10} />
          <Skeleton width="40%" height={10} />
        </VStack>
      </HStack>
    </UICard>
  ),
};
