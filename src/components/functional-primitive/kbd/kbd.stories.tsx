import type { Meta, StoryObj } from "@storybook/react";
import { Kbd } from "./kbd";

const meta: Meta<typeof Kbd> = {
  title: "Components/Text and icons/Kbd",
  // Keeps the URL from before components were grouped by job.
  id: "functional-primitives-kbd",
  component: Kbd,
};

export default meta;

type Story = StoryObj<typeof Kbd>;

export const Default: Story = { args: { children: "K" } };

export const Combo: Story = {
  render: () => (
    <span>
      Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to open the command palette.
    </span>
  ),
};
