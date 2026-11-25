import React from "react";
import { useArgs } from "storybook/preview-api";
import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./switch";
import { Presentation } from "../../style/presentation/presentation";

const meta: Meta<typeof Switch> = {
  title: "Components/Inputs/Switch",
  // Keeps the URL from before components were grouped by job.
  id: "functional-switch",
  component: Switch,
  argTypes: {
    label: { control: "text" },
    helperText: { control: "text" },
    disabled: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Switch>;

const Controlled: Story["render"] = (args) => {
  const [, updateArgs] = useArgs();
  return <Switch {...args} checked={args.checked ?? false} onChange={(checked) => { updateArgs({ checked }); args.onChange?.(checked); }} />;
};

export const Default: Story = {
  args: { label: "Email notifications" },
  render: Controlled,
};

export const On: Story = {
  args: { label: "Auto-save drafts", checked: true },
  render: Controlled,
};

export const WithHelper: Story = {
  args: {
    label: "Public profile",
    helperText: "Anyone with the link can view your profile page.",
  },
  render: Controlled,
};

export const Compact: Story = {
  args: { label: "Compact mode" },
  render: function CompactRender(args) {
    const [, updateArgs] = useArgs();
    return <Presentation register="compact">
      <Switch {...args} checked={args.checked ?? false} onChange={(checked) => { updateArgs({ checked }); args.onChange?.(checked); }} />
    </Presentation>;
  },
};

export const Disabled: Story = {
  args: { label: "Locked setting", disabled: true, checked: true },
  render: Controlled,
};
