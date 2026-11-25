import type { Meta, StoryObj } from "@storybook/react";
import { MemberDashboard } from "./member-dashboard";

const meta: Meta<typeof MemberDashboard> = {
  title: "Examples/Member Dashboard",
  component: MemberDashboard,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    options: { showPanel: false },
  },
};

export default meta;
type Story = StoryObj<typeof MemberDashboard>;

/** Try the row menus, the "What's included" popover, the Sightings filters and
 *  the Activity tab, which loads more as it scrolls. Make a payment to see
 *  the form's error summary and the confirmation toast. */
export const Overview: Story = {};
