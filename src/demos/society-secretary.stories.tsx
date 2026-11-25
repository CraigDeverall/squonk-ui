import type { Meta, StoryObj } from "@storybook/react";
import { SocietySecretary } from "./society-secretary";

const meta: Meta<typeof SocietySecretary> = {
  title: "Examples/Society Secretary",
  component: SocietySecretary,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    options: { showPanel: false },
  },
};

export default meta;
type Story = StoryObj<typeof SocietySecretary>;

/** Search and filter the queue, select cases for bulk actions, and open a
 *  member's name to work the case in a drawer. */
export const WorkQueue: Story = {};
