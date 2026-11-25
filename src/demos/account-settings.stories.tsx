import type { Meta, StoryObj } from "@storybook/react";
import { AccountSettings } from "./account-settings";

const meta: Meta<typeof AccountSettings> = {
  title: "Examples/Account Settings",
  component: AccountSettings,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    options: { showPanel: false },
  },
};

export default meta;
type Story = StoryObj<typeof AccountSettings>;

/** Clear a contact field and save to see the error summary, then fix it for
 *  the toast. Flip the notification switches: each saves at once, and the
 *  Newsletter one fails and moves back. Copy the set-up key, sign out a
 *  device from its menu, page through devices, and try "Stop using the portal"
 *  for the confirmation that can't be dismissed while it works. */
export const Overview: Story = {};
