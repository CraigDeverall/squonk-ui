import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Card } from "../../layout/card/card";
import { Centered } from "./centered";

const meta: Meta<typeof Centered> = {
  title: "Components/Layout/Stacks and grids/Centered",
  // Keeps the URL from before components were grouped by job.
  id: "layout-primitives-centered",
  component: Centered,
  argTypes: {
    ...commonArgTypes,
    minHeight: {
      control: "text",
      description: "Minimum height — any CSS length.",
    },
    fullWidth: {
      control: "boolean",
      description: "Fill the parent's width.",
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

type Story = StoryObj<typeof Centered>;

const child = <Card variant="filled">I am centered.</Card>;

export const Default: Story = {
  args: {
    minHeight: "240px",
    fullWidth: true,
    children: child,
  },
};

export const HeroHeight: Story = {
  args: {
    minHeight: "60vh",
    fullWidth: true,
    children: child,
  },
};
