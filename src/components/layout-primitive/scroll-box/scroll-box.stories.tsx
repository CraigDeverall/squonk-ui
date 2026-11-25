import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Card } from "../../layout/card/card";
import { HStack } from "../hstack/hstack";
import { ScrollBox } from "./scroll-box";

const meta: Meta<typeof ScrollBox> = {
  title: "Components/Layout/Stacks and grids/ScrollBox",
  // Keeps the URL from before components were grouped by job.
  id: "layout-primitives-scrollbox",
  component: ScrollBox,
  argTypes: {
    ...commonArgTypes,
    axis: {
      control: "radio",
      options: ["vertical", "horizontal", "both"],
      description: "Which axis is scrollable.",
    },
    maxHeight: {
      control: "text",
      description: "Cap height — required for vertical scrolling.",
    },
    maxWidth: {
      control: "text",
      description: "Cap width — required for horizontal scrolling.",
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

type Story = StoryObj<typeof ScrollBox>;

const tallContent = (
  <ul style={{ margin: 0, paddingLeft: 24 }}>
    {Array.from({ length: 40 }).map((_, i) => (
      <li key={i} style={{ padding: "4px 0" }}>
        Item {i + 1}
      </li>
    ))}
  </ul>
);

const wideContent = (
  <HStack gap="xs">
    {Array.from({ length: 40 }).map((_, i) => (
      <Card key={i} variant="filled" style={{ flex: "0 0 auto" }}>
        Item {i + 1}
      </Card>
    ))}
  </HStack>
);

export const Vertical: Story = {
  args: {
    axis: "vertical",
    maxHeight: "240px",
    children: tallContent,
  },
};

export const Horizontal: Story = {
  args: {
    axis: "horizontal",
    maxWidth: "320px",
    children: wideContent,
  },
};
