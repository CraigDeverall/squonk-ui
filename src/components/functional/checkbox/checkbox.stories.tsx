import React from "react";
import { useArgs } from "storybook/preview-api";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Inputs/Checkbox",
  // Keeps the URL from before components were grouped by job.
  id: "functional-checkbox",
  component: Checkbox,
  argTypes: {
    label: { control: "text" },
    helperText: { control: "text" },
    error: { control: "text" },
    disabled: { control: "boolean" },
    indeterminate: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

const Controlled: Story["render"] = (args) => {
  const [, updateArgs] = useArgs();
  return <Checkbox {...args} checked={args.checked ?? false} onChange={(checked) => { updateArgs({ checked }); args.onChange?.(checked); }} />;
};

export const Default: Story = {
  args: { label: "Send me product updates" },
  render: Controlled,
};

export const Checked: Story = {
  args: { label: "I agree to the terms", checked: true },
  render: Controlled,
};

export const Indeterminate: Story = {
  args: { label: "Select all", indeterminate: true },
  render: Controlled,
};

export const WithHelper: Story = {
  args: {
    label: "Enable two-factor authentication",
    helperText: "We'll text you a 6-digit code at login.",
  },
  render: Controlled,
};

export const WithError: Story = {
  args: {
    label: "I accept the terms",
    error: "You must accept the terms to continue.",
  },
  render: Controlled,
};

export const Disabled: Story = {
  args: { label: "Locked option", disabled: true, checked: true },
  render: Controlled,
};
