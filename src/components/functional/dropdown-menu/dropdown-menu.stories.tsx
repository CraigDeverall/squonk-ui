import type { Meta, StoryObj } from "@storybook/react";
import { DropdownMenu, type DropdownMenuEntry } from "./dropdown-menu";
import { Avatar } from "../avatar/avatar";
import { Button } from "../button/button";

const meta: Meta<typeof DropdownMenu> = {
  title: "Components/Actions/Dropdown Menu",
  // Keeps the URL from before components were grouped by job.
  id: "functional-dropdown-menu",
  component: DropdownMenu,
  argTypes: {
    align: { control: "radio", options: ["start", "end"] },
    disabled: { control: "boolean" },
    triggerLabel: { control: "text" },
    trigger: { control: false },
    items: { control: false },
    open: { control: false },
    defaultOpen: { control: "boolean" },
    onOpenChange: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof DropdownMenu>;

const accountItems: DropdownMenuEntry[] = [
  { key: "settings", label: "Settings" },
  { key: "billing", label: "Billing" },
  "separator",
  { key: "sign-out", label: "Sign out", tone: "danger" },
];

export const Default: Story = {
  args: {
    trigger: <Button as="span">Account ▾</Button>,
    items: accountItems,
  },
};

export const Open: Story = {
  args: {
    trigger: <Button as="span">Account ▾</Button>,
    items: accountItems,
    defaultOpen: true,
  },
};

export const AlignEnd: Story = {
  args: {
    trigger: <Button as="span">Account ▾</Button>,
    items: accountItems,
    align: "end",
    defaultOpen: true,
  },
  render: (args) => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <DropdownMenu {...args} />
    </div>
  ),
};

export const AvatarTrigger: Story = {
  args: {
    trigger: <Avatar name="Ada Lovelace" />,
    triggerLabel: "Account menu",
    items: accountItems,
    align: "end",
    defaultOpen: true,
  },
  render: (args) => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <DropdownMenu {...args} />
    </div>
  ),
};

export const WithDisabledItem: Story = {
  args: {
    trigger: <Button as="span">Actions ▾</Button>,
    items: [
      { key: "edit", label: "Edit" },
      { key: "duplicate", label: "Duplicate", disabled: true },
      "separator",
      { key: "delete", label: "Delete", tone: "danger" },
    ],
    defaultOpen: true,
  },
};

export const DisabledTrigger: Story = {
  args: {
    trigger: <Button as="span">Account ▾</Button>,
    items: accountItems,
    disabled: true,
  },
};
