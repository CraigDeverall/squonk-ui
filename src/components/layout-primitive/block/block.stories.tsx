import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Block } from "./block";

const spacingOptions = ["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl"];
const radiusOptions = ["none", "sm", "base", "md", "lg", "xl", "full"];
const backgroundOptions = ["transparent", "default", "surface", "subtle"];

const meta: Meta<typeof Block> = {
  title: "Components/Layout/Surfaces/Block",
  // Keeps the URL from before components were grouped by job.
  id: "layout-primitives-block",
  component: Block,
  argTypes: {
    ...commonArgTypes,
    padding: {
      control: "select",
      options: spacingOptions,
      description: "Inset padding from the spacing scale.",
    },
    paddingInline: {
      control: "select",
      options: [undefined, ...spacingOptions],
      description: "Horizontal padding — wins over `padding`.",
    },
    paddingBlock: {
      control: "select",
      options: [undefined, ...spacingOptions],
      description: "Vertical padding — wins over `padding`.",
    },
    background: {
      control: "select",
      options: backgroundOptions,
      description: "Theme-driven background colour.",
    },
    radius: {
      control: "select",
      options: radiusOptions,
      description: "Border radius from the theme scale.",
    },
    width: {
      control: "text",
      description: "`fit` | `full` | `auto` | any CSS length.",
    },
    bordered: {
      control: "boolean",
      description: "Apply a 1px border using the default border colour.",
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

type Story = StoryObj<typeof Block>;

export const Default: Story = {
  args: {
    padding: "md",
    background: "surface",
    radius: "md",
    bordered: true,
    children: "A themed div with padding, background, radius, and border.",
  },
};

export const Surface: Story = {
  args: {
    padding: "lg",
    background: "subtle",
    radius: "lg",
    children: "Subtle surface — used as a quiet content container.",
  },
};

export const FitContent: Story = {
  args: {
    padding: "sm",
    background: "surface",
    radius: "base",
    bordered: true,
    width: "fit",
    children: "I size to my content.",
  },
};
