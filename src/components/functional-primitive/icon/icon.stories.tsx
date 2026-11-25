import type { Meta, StoryObj } from "@storybook/react";
import * as icons from "./icon";
import { SearchIcon } from "./icon";
import { Button } from "../../functional/button/button";
import { Text } from "../text/text";
import { IconGallery } from "../../../documentation-imports/icon-gallery";
import { Presentation } from "../../style/presentation/presentation";

const meta: Meta<typeof SearchIcon> = {
  title: "Components/Text and icons/Icon",
  // Keeps the URL from before components were grouped by job.
  id: "functional-primitives-icon",
  component: SearchIcon,
  argTypes: {
    size: { control: "inline-radio", options: ["inherit", "sm", "md", "lg", "control"] },
    label: { control: "text" },
  },
};

export default meta;

type Story = StoryObj<typeof SearchIcon>;

export const Default: Story = { args: { size: "lg", label: "Search" } };

/** Every icon in the curated set. Search, then click an icon to copy it. */
export const Gallery: Story = {
  render: () => <IconGallery />,
};

export const InText: Story = {
  render: () => (
    <Text>
      <SearchIcon /> Icons follow the surrounding text size by default.
    </Text>
  ),
};

export const InControls: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {(["compact", "default", "large", "hero"] as const).map((register) => (
        <Presentation key={register} register={register}>
          <Button>
            <icons.AddIcon size="control" /> New invoice
          </Button>
        </Presentation>
      ))}
    </div>
  ),
};
