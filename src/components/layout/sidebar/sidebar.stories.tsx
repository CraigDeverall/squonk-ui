import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Block } from "../../layout-primitive/block/block";
import { Link } from "../../functional/link/link";
import { Sidebar } from "./sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "Components/Navigation/Sidebar",
  // Keeps the URL from before components were grouped by job.
  id: "layout-sidebar",
  component: Sidebar,
  argTypes: {
    ...commonArgTypes,
    side: {
      control: "radio",
      options: ["left", "right"],
      description: "Which side of the parent the sidebar sits on.",
    },
    width: {
      control: "text",
      description: "Fixed width (any CSS length).",
    },
    ref: {
      description: "Ref to the DOM element",
      control: false,
      table: {
        type: { summary: "React.RefObject<HTMLElement>" },
      },
    },
  },
  decorators: [
    (Story) => (
      <Block bordered radius="base" style={{ display: "flex", minHeight: 280 }}>
        <Story />
        <Block as="main" padding="md" style={{ flex: 1 }}>
          Main content
        </Block>
      </Block>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Sidebar>;

const navContent = (
  <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <Link href="#">Dashboard</Link>
    <Link href="#">Projects</Link>
    <Link href="#">Reports</Link>
    <Link href="#">Settings</Link>
  </nav>
);

export const Left: Story = {
  args: { side: "left", width: "240px", children: navContent },
};

export const Right: Story = {
  args: { side: "right", width: "240px", children: navContent },
  decorators: [
    (Story) => (
      <Block bordered radius="base" style={{ display: "flex", minHeight: 280 }}>
        <Block as="main" padding="md" style={{ flex: 1 }}>
          Main content
        </Block>
        <Story />
      </Block>
    ),
  ],
};

export const Narrow: Story = {
  args: { side: "left", width: "160px", children: navContent },
};
