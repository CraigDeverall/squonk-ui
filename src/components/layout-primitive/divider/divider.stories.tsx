import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Divider } from "./divider";

const meta: Meta<typeof Divider> = {
  title: "Components/Layout/Stacks and grids/Divider",
  // Keeps the URL from before components were grouped by job.
  id: "layout-primitives-divider",
  component: Divider,
  argTypes: {
    ...commonArgTypes,
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "Line direction.",
    },
    ref: {
      description: "Ref to the DOM element",
      control: false,
      table: {
        type: { summary: "React.RefObject<HTMLHRElement>" },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
  args: { orientation: "horizontal" },
  render: (args) => (
    <div style={{ width: 320 }}>
      <p style={{ margin: 0 }}>Above</p>
      <div style={{ padding: "12px 0" }}>
        <Divider {...args} />
      </div>
      <p style={{ margin: 0 }}>Below</p>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 32,
      }}
    >
      <span>Left</span>
      <Divider {...args} />
      <span>Middle</span>
      <Divider {...args} />
      <span>Right</span>
    </div>
  ),
};
