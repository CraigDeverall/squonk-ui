import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Block } from "../../layout-primitive/block/block";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { Tag, TagGroup } from "./tag";
import { Button } from "../button/button";
import { Cluster } from "../../layout/cluster/cluster";
import { Text } from "../../functional-primitive/text/text";
import { LocationIcon, UserIcon } from "../../functional-primitive/icon/icon";

const meta: Meta<typeof Tag> = {
  title: "Components/Data display/Tag",
  // Keeps the URL from before components were grouped by job.
  id: "functional-tag",
  component: Tag,
  argTypes: {
    children: { control: "text" },
    tone: { control: "inline-radio", options: ["neutral", "primary", "info"] },
    variant: { control: "inline-radio", options: ["subtle", "outline"] },
    disabled: { control: "boolean" },
  },
  args: { children: "Night watches" },
};

export default meta;

// A theme's own colours (`addedColorPrimitives`), each with a light and a dark value.
const ADDED_COLORS = {
  violet: { light: "#7c3aed", dark: "#a78bfa" },
  teal: { light: "#0f766e", dark: "#2dd4bf" },
};

/** The same content under a theme with added colours, in light and dark mode. */
function WithAddedColors({ children }: { children: React.ReactNode }) {
  return (
    <HStack gap="md" wrap>
      {(["light", "dark"] as const).map((mode) => (
        <SquonkThemeProvider key={mode} mode={mode} addedColorPrimitives={ADDED_COLORS}>
          <Block background="default" padding="md" radius="md">{children}</Block>
        </SquonkThemeProvider>
      ))}
    </HStack>
  );
}

type Story = StoryObj<typeof Tag>;

export const Default: Story = {};

const tones = ["neutral", "primary", "info"] as const;

export const Tones: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8 }}>
      {(["subtle", "outline"] as const).map((variant) => (
        <Cluster key={variant} gap="xs">
          {tones.map((tone) => (
            <Tag key={tone} tone={tone} variant={variant}>{tone}</Tag>
          ))}
        </Cluster>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Cluster gap="xs">
      <Tag icon={<LocationIcon />}>Wellington office</Tag>
      <Tag icon={<UserIcon />} tone="info">Assigned to you</Tag>
    </Cluster>
  ),
};

/** Active filters above a results list: each removable, with a way to clear all. */
export const ActiveFilters: Story = {
  render: function ActiveFilters() {
    const all = ["Night watches", "Overdue", "Waikato", "Over 500 mL"];
    const [filters, setFilters] = React.useState(all);
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Cluster gap="xs" align="center">
          <Text as="span" tone="secondary">Filtered by</Text>
          {filters.map((filter) => (
            <Tag key={filter} tone="primary" onRemove={() => setFilters((f) => f.filter((x) => x !== filter))}>
              {filter}
            </Tag>
          ))}
          {filters.length ? (
            <Button variant="ghost" shape="rounded" onClick={() => setFilters([])}>Clear all</Button>
          ) : (
            <Button variant="ghost" shape="rounded" onClick={() => setFilters(all)}>Reset filters</Button>
          )}
        </Cluster>
        <Text tone="secondary">{filters.length ? `${filters.length} filters applied` : "Showing all cases"}</Text>
      </div>
    );
  },
};

export const Truncated: Story = {
  render: () => (
    <div style={{ width: 180 }}>
      <Tag onRemove={() => {}}>Te Whanganui-a-Tara regional office</Tag>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, onRemove: () => {} },
};

/** A TagGroup is one tab stop: arrow keys move between tags, and Delete or Backspace removes the focused one. */
export const Group: Story = {
  render: function Group() {
    const all = ["Night watches", "Overdue", "Waikato", "Over 500 mL"];
    const [filters, setFilters] = React.useState(all);
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <TagGroup label="Filtered by">
          {filters.map((filter) => (
            <Tag key={filter} tone="primary" onRemove={() => setFilters((f) => f.filter((x) => x !== filter))}>
              {filter}
            </Tag>
          ))}
        </TagGroup>
        <Button variant="ghost" onClick={() => setFilters(all)}>Reset filters</Button>
      </div>
    );
  },
};

/** A colour the theme added (`addedColorPrimitives`) used as a tone, to group values by colour. */
export const AddedTone: Story = {
  render: () => (
    <WithAddedColors>
      <div style={{ display: "grid", gap: 8 }}>
        {(["subtle", "outline"] as const).map((variant) => (
          <Cluster key={variant} gap="xs">
            <Tag tone="violet" variant={variant}>Research</Tag>
            <Tag tone="teal" variant={variant} onRemove={() => {}}>Field work</Tag>
          </Cluster>
        ))}
      </div>
    </WithAddedColors>
  ),
};
