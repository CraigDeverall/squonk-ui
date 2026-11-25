import type { Meta, StoryObj } from "@storybook/react";
import { LogASighting } from "./log-a-sighting";

const meta: Meta<typeof LogASighting> = {
  title: "Examples/Log a Sighting",
  component: LogASighting,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    options: { showPanel: false },
  },
};

export default meta;
type Story = StoryObj<typeof LogASighting>;

/** The summary updates as you type. Logging asks for confirmation first. */
export const SightingReport: Story = {};
