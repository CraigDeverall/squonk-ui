import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./avatar";
import { Presentation } from "../../style/presentation/presentation";

const meta: Meta<typeof Avatar> = {
  title: "Components/Data display/Avatar",
  // Keeps the URL from before components were grouped by job.
  id: "functional-avatar",
  component: Avatar,
  argTypes: {
    shape: { control: "radio", options: ["circle", "rounded"] },
  },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const Initials: Story = {
  args: { name: "Ada Lovelace" },
};

export const WithImage: Story = {
  args: {
    name: "Grace Hopper",
    src: "https://i.pravatar.cc/120?img=47",
  },
};

export const Rounded: Story = {
  args: { name: "Linus Torvalds", shape: "rounded" },
};

export const Scale: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Presentation register="compact">
        <Avatar name="Ada Lovelace" />
      </Presentation>
      <Presentation register="default">
        <Avatar name="Ada Lovelace" />
      </Presentation>
      <Presentation register="large">
        <Avatar name="Ada Lovelace" />
      </Presentation>
      <Presentation register="hero">
        <Avatar name="Ada Lovelace" />
      </Presentation>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <Avatar name="Ada Lovelace" />
      <Avatar name="Grace Hopper" />
      <Avatar name="Margaret Hamilton" />
      <Avatar name="Katherine Johnson" />
    </div>
  ),
};
