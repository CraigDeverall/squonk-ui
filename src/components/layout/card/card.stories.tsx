import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Card } from "./card";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";
import { Code } from "../../functional-primitive/code/code";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { ThemeModifier } from "../../style/theme-modifier/theme-modifier";

const meta: Meta<typeof Card> = {
  title: "Components/Layout/Surfaces/Card",
  // Keeps the URL from before components were grouped by job.
  id: "layout-card",
  component: Card,
  argTypes: {
    ...commonArgTypes,
    variant: {
      control: "radio",
      options: ["elevated", "outlined", "filled", "featured"],
      description: "Visual style of the card.",
    },
    ref: {
      description: "Ref to the DOM element",
      control: false,
      table: {
        type: { summary: `React.RefObject<HTMLElement>` },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

const sampleContent = "A simple Card. Use the variant control to switch styles.";

export const Outlined: Story = {
  args: {
    variant: "outlined",
    children: sampleContent,
  },
};

export const Elevated: Story = {
  args: {
    variant: "elevated",
    children: sampleContent,
  },
};

export const Filled: Story = {
  args: {
    variant: "filled",
    children: sampleContent,
  },
};


export const Featured: Story = {
  args: {
    variant: "featured",
    children: <><Heading level={3}>Recommended plan</Heading><Text>Readable typography on an inverse surface.</Text><Code>npm install @squonkstack/ui</Code></>,
  },
};

export const FeaturedDark: Story = {
  ...Featured,
  decorators: [(Story) => <SquonkThemeProvider mode="dark"><Story /></SquonkThemeProvider>],
};

/**
 * A theme can give the outlined card a shadow beside its border, through
 * `components.card.outlinedElevation`. It draws nothing by default.
 */
export const OutlinedWithShadow: Story = {
  args: {
    variant: "outlined",
    children: "An outlined card with a border and a soft shadow, set by the theme.",
  },
  decorators: [
    (Story) => (
      <ThemeModifier override={{ roleBindings: { "components.card.outlinedElevation": "roles.elevation.soft" } }}>
        <Story />
      </ThemeModifier>
    ),
  ],
};
