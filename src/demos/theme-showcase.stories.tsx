import type { Meta, StoryObj } from "@storybook/react";
import { ThemeShowcase } from "./theme-showcase";

const meta: Meta<typeof ThemeShowcase> = {
  title: "Examples/Theme Showcase",
  component: ThemeShowcase,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    options: { showPanel: false },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeShowcase>;

/** The same buttons, fields and figures in every example theme. Hover, press
 *  and tab through each to feel how differently they respond, switch to dark
 *  mode in the sidebar, and open a theme's purpose decisions to see the few
 *  lines of code behind it. */
export const EveryTheme: Story = { name: "Every theme" };

