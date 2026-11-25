import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "./icon-button";
import { Button } from "../button/button";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { Presentation } from "../../style/presentation/presentation";
import {
  CloseIcon, CopyIcon, DeleteIcon, DownloadIcon, EditIcon, MoreIcon, PrintIcon, RefreshIcon, SettingsIcon, ShareIcon,
} from "../../functional-primitive/icon/icon";

const meta: Meta<typeof IconButton> = {
  title: "Components/Actions/IconButton",
  // Keeps the URL from before components were grouped by job.
  id: "functional-iconbutton",
  component: IconButton,
  argTypes: {
    label: { control: "text" },
    variant: { control: "inline-radio", options: ["ghost", "secondary", "primary", "solid", "danger"] },
    shape: { control: "inline-radio", options: ["rounded", "pill"] },
    tooltip: { control: "boolean" },
    disabled: { control: "boolean" },
    icon: { control: false },
  },
  args: { icon: <SettingsIcon />, label: "Settings" },
};

export default meta;

type Story = StoryObj<typeof IconButton>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <HStack gap="sm">
      {(["ghost", "secondary", "primary", "solid", "danger"] as const).map((variant) => (
        <IconButton key={variant} {...args} variant={variant} label={`${variant} settings`} />
      ))}
    </HStack>
  ),
};

export const Shapes: Story = {
  render: (args) => (
    <HStack gap="sm">
      <IconButton {...args} variant="secondary" shape="rounded" label="Rounded" />
      <IconButton {...args} variant="secondary" shape="pill" label="Circle" />
    </HStack>
  ),
};

/** Each register's IconButton is as tall as its Button, so they sit in a row. */
export const Registers: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {(["compact", "default", "large", "hero"] as const).map((register) => (
        <Presentation key={register} register={register}>
          <HStack gap="xs">
            <Button variant="secondary" shape="rounded">Export</Button>
            <IconButton variant="secondary" icon={<DownloadIcon />} label="Download" />
            <IconButton variant="secondary" icon={<PrintIcon />} label="Print" />
          </HStack>
        </Presentation>
      ))}
    </div>
  ),
};

/** A document toolbar: related actions grouped, with the destructive one apart. */
export const Toolbar: Story = {
  render: () => (
    <HStack gap="xxs" role="toolbar" aria-label="Sighting actions">
      <IconButton icon={<EditIcon />} label="Edit sighting" />
      <IconButton icon={<CopyIcon />} label="Duplicate sighting" />
      <IconButton icon={<ShareIcon />} label="Share with your adviser" />
      <IconButton icon={<RefreshIcon />} label="Recalculate" />
      <span style={{ width: 12 }} />
      <IconButton icon={<DeleteIcon />} label="Delete draft" variant="danger" />
      <IconButton icon={<MoreIcon />} label="More actions" />
    </HStack>
  ),
};

export const Disabled: Story = {
  args: { icon: <CloseIcon />, label: "Close", disabled: true, variant: "secondary" },
};
