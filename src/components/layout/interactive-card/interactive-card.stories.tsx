import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { InteractiveCard } from "./interactive-card";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";

const meta: Meta<typeof InteractiveCard> = {
  title: "Components/Layout/Surfaces/Interactive Card",
  // Keeps the URL from before components were grouped by job.
  id: "layout-interactive-card",
  component: InteractiveCard,
  args: {
    variant: "outlined",
  },
  argTypes: {
    ...commonArgTypes,
    variant: {
      control: "radio",
      options: ["elevated", "outlined", "filled", "featured"],
      description: "Visual style of the card (shared with Card).",
    },
    ref: {
      description: "Ref to the DOM element",
      control: false,
      table: {
        type: { summary: "React.RefObject<HTMLElement>" },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof InteractiveCard>;

export const Outlined: Story = {
  args: {
    variant: "outlined",
    children: (
      <VStack gap="xs">
        <Heading level={4}>checkout-flow</Heading>
        <Text tone="secondary">Hover or focus to see the lift.</Text>
      </VStack>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: "elevated",
    children: (
      <VStack gap="xs">
        <Heading level={4}>Elevated</Heading>
        <Text tone="secondary">Borderless card with a soft drop shadow.</Text>
      </VStack>
    ),
  },
};

export const Filled: Story = {
  args: {
    variant: "filled",
    children: (
      <VStack gap="xs">
        <Heading level={4}>Filled</Heading>
        <Text tone="secondary">Sits on the raised surface background.</Text>
      </VStack>
    ),
  },
};

export const AsLink: Story = {
  args: {
    as: "a",
    href: "#example",
    variant: "outlined",
    children: (
      <VStack gap="xs">
        <Heading level={4}>Shipping faster with snapshot tests</Heading>
        <Text tone="secondary">A short note on visual regression in practice.</Text>
      </VStack>
    ),
  },
};
