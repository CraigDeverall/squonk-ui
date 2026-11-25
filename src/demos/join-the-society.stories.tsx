import type { Meta, StoryObj } from "@storybook/react";
import { JoinTheSociety } from "./join-the-society";

const meta: Meta<typeof JoinTheSociety> = {
  title: "Examples/Join the Society",
  component: JoinTheSociety,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    options: { showPanel: false },
  },
};

export default meta;
type Story = StoryObj<typeof JoinTheSociety>;

/** Press "Review application" with nothing filled in to see the error
 *  summary. Choosing night watches or kit hire adds the questions they need. */
export const Registration: Story = {};
