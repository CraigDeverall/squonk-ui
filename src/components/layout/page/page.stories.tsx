import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Page } from "./page";
import { ThemeModifier } from "../../style/theme-modifier/theme-modifier";

const meta: Meta<typeof Page> = {
  title: "Components/Layout/Page structure/Page",
  // Keeps the URL from before components were grouped by job.
  id: "layout-page",
  component: Page,
  argTypes: {
    ...commonArgTypes,
    ref: {
      description: "Ref to the DOM element",
      control: false,
      table: {
        type: { summary: "React.RefObject<HTMLMainElement>" },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Page>;

export const Primary: Story = {
  args: { children: "Empty Page" },
};

const backgroundImage = {
  "components.page.backgroundImage": {
    light: "linear-gradient(180deg, #ffffff, #dbeafe)",
    dark: "radial-gradient(circle at top, #1e1b4b, #020617)",
  },
};

/**
 * A theme paints an image over the page colour with
 * `components.page.backgroundImage`: here a gradient for each colour mode.
 * It is held to the screen while the page scrolls.
 */
export const BackgroundImage: Story = {
  args: { children: "A Page with a gradient from the theme" },
  decorators: [
    (Story) => (
      <ThemeModifier override={{ roleBindings: backgroundImage }}>
        <Story />
      </ThemeModifier>
    ),
  ],
};
