import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Link } from "./link";

const meta: Meta<typeof Link> = {
  title: "Components/Actions/Link",
  // Keeps the URL from before components were grouped by job.
  id: "functional-link",
  component: Link,
  argTypes: {
    ...commonArgTypes,
    variant: { control: "radio", options: ["default", "subtle", "danger"] },
    underline: { control: "radio", options: ["always", "hover", "never"] },
    external: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: { href: "#", children: "Read the documentation" },
};

export const External: Story = {
  args: { href: "https://squonkstack.io", external: true, children: "squonkstack.io" },
};

export const Subtle: Story = {
  args: { href: "#", variant: "subtle", children: "Privacy policy" },
};

export const Danger: Story = {
  args: { href: "#", variant: "danger", children: "Delete this workspace" },
};
