import type { Meta, StoryObj } from "@storybook/react";
import { MediaObject } from "./media-object";
import { Avatar } from "../../functional/avatar/avatar";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";

const meta: Meta<typeof MediaObject> = {
  title: "Components/Layout/Surfaces/Media Object",
  // Keeps the URL from before components were grouped by job.
  id: "layout-media-object",
  component: MediaObject,
  argTypes: {
    align: { control: "inline-radio", options: ["start", "center"] },
    gap: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof MediaObject>;

export const ProfileRow: Story = {
  render: () => (
    <MediaObject media={<Avatar name="Ada Lovelace" />}>
      <Heading level={4}>Ada Lovelace</Heading>
      <Text tone="secondary">First programmer</Text>
    </MediaObject>
  ),
};

export const ListItem: Story = {
  render: () => (
    <MediaObject media={<Avatar name="Grace Hopper" />} align="center">
      <Text>
        <strong>Grace Hopper</strong> shipped COBOL.
      </Text>
    </MediaObject>
  ),
};

export const Comment: Story = {
  render: () => (
    <MediaObject media={<Avatar name="Linus Torvalds" />}>
      <Heading level={5}>Linus Torvalds</Heading>
      <Text>
        I really appreciate this PR. Let&rsquo;s merge it and ship.
      </Text>
      <Text tone="muted">2 hours ago</Text>
    </MediaObject>
  ),
};
