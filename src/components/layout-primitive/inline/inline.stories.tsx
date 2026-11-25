import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Kbd } from "../../functional-primitive/kbd/kbd";
import { Inline } from "./inline";

const spacingOptions = ["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

const meta: Meta<typeof Inline> = {
  title: "Components/Layout/Stacks and grids/Inline",
  // Keeps the URL from before components were grouped by job.
  id: "layout-primitives-inline",
  component: Inline,
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
    ref: {
      description: "Ref to the DOM element",
      control: false,
      table: {
        type: { summary: "React.RefObject<HTMLSpanElement>" },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Inline>;

export const Default: Story = {
  args: {
    gap: "xs",
    align: "baseline",
    children: (
      <>
        <span>Press</span>
        <Kbd>⌘K</Kbd>
        <span>to open the palette.</span>
      </>
    ),
  },
};

export const IconLabel: Story = {
  args: {
    gap: "xxs",
    align: "center",
    children: (
      <>
        <span aria-hidden style={{ fontSize: 16 }}>★</span>
        <span>Featured</span>
      </>
    ),
  },
};
