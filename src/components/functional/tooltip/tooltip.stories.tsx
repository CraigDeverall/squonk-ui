import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "./tooltip";
import { Button } from "../button/button";
import { IconButton } from "../icon-button/icon-button";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { CopyIcon, DeleteIcon, EditIcon, HelpIcon } from "../../functional-primitive/icon/icon";
import { Text } from "../../functional-primitive/text/text";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Overlays/Tooltip",
  // Keeps the URL from before components were grouped by job.
  id: "functional-tooltip",
  component: Tooltip,
  argTypes: {
    content: { control: "text" },
    placement: { control: "inline-radio", options: ["top", "bottom", "left", "right"] },
    arrow: { control: "boolean" },
    openDelay: { control: "number" },
    disabled: { control: "boolean" },
  },
  args: { content: "Copies the share link to your clipboard", placement: "top" },
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button>Copy link</Button>
    </Tooltip>
  ),
};

/** Opened from the start, so the hint is visible without hovering. */
export const Open: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <div style={{ paddingTop: 48 }}>
      <Tooltip {...args}>
        <Button>Copy link</Button>
      </Tooltip>
    </div>
  ),
};

export const Placements: Story = {
  render: (args) => (
    <HStack gap="md" style={{ padding: 48 }}>
      {(["top", "right", "bottom", "left"] as const).map((placement) => (
        <Tooltip key={placement} {...args} content={`Placed ${placement}`} placement={placement}>
          <Button variant="secondary">{placement}</Button>
        </Tooltip>
      ))}
    </HStack>
  ),
};

/** Toolbar icons name themselves in a tooltip. */
export const OnIconButtons: Story = {
  render: () => (
    <HStack gap="xs">
      {[
        { label: "Edit", Icon: EditIcon },
        { label: "Duplicate", Icon: CopyIcon },
        { label: "Delete", Icon: DeleteIcon },
      ].map(({ label, Icon }) => (
        <Tooltip key={label} content={label}>
          <Button variant="ghost" shape="rounded" aria-label={label}>
            <Icon size="control" />
          </Button>
        </Tooltip>
      ))}
    </HStack>
  ),
};

/** A help mark beside a term explains it without crowding the label. */
export const ExplainATerm: Story = {
  render: () => (
    <Text>
      Swamp Fund levy{" "}
      <Tooltip content="A small yearly contribution to habitat restoration, collected with your annual dues.">
        <IconButton icon={<HelpIcon />} label="What is the Swamp Fund levy?" tooltip={false} />
      </Tooltip>
    </Text>
  ),
};
