import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Block } from "../../layout-primitive/block/block";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { Heading } from "../heading/heading";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Text } from "./text";

const meta: Meta<typeof Text> = {
  title: "Components/Text and icons/Text",
  // Keeps the URL from before components were grouped by job.
  id: "functional-primitives-text",
  component: Text,
  argTypes: {
    ...commonArgTypes,
    size: { control: "radio", options: ["xs", "sm", "base", "lg", "xl"] },
    variant: { control: "radio", options: ["body", "eyebrow"] },
    weight: { control: "radio", options: ["light", "regular", "bold"] },
    tone: {
      control: "select",
      options: ["primary", "secondary", "inverse", "success", "warning", "error", "info"],
    },
    align: { control: "radio", options: ["start", "center", "end", "justify"] },
    truncate: { control: "boolean" },
    italic: { control: "boolean" },
  },
};

export default meta;

// A theme's own colours (`addedColorPrimitives`), each with a light and a dark value.
const ADDED_COLORS = {
  violet: { light: "#7c3aed", dark: "#a78bfa" },
  teal: { light: "#0f766e", dark: "#2dd4bf" },
};

/** The same content under a theme with added colours, in light and dark mode. */
function WithAddedColors({ children }: { children: React.ReactNode }) {
  return (
    <HStack gap="md" wrap>
      {(["light", "dark"] as const).map((mode) => (
        <SquonkThemeProvider key={mode} mode={mode} addedColorPrimitives={ADDED_COLORS}>
          <Block background="default" padding="md" radius="md">{children}</Block>
        </SquonkThemeProvider>
      ))}
    </HStack>
  );
}

type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: {
    children:
      "SquonkUI is a small, deliberately opinionated component library for React.",
  },
};

export const Secondary: Story = {
  args: {
    tone: "secondary",
    children: "Subdued copy for less critical information.",
  },
};

export const Inline: Story = {
  args: {
    as: "span",
    weight: "bold",
    children: "Inline emphasis",
  },
};

export const Truncated: Story = {
  args: {
    truncate: true,
    children:
      "A very long sentence that would normally wrap, but with truncate=true it becomes a single line that ends with an ellipsis when the parent runs out of horizontal space.",
  },
  decorators: [
    (Story) => (
      <Block maxWidth="320px">
        <Story />
      </Block>
    ),
  ],
};

export const ToneScale: Story = {
  render: () => (
    <VStack gap="xxs">
      <Text tone="primary">Primary — default body copy</Text>
      <Text tone="secondary">Secondary — captions, hints</Text>
      <Text tone="success">Success — operation completed</Text>
      <Text tone="warning">Warning — caution required</Text>
      <Text tone="error">Error — something went wrong</Text>
      <Text tone="info">Info — neutral system message</Text>
    </VStack>
  ),
};

/** `variant="eyebrow"`: a small capitals label above a heading. Its colour follows `tone`. */
export const Eyebrow: Story = {
  render: () => (
    <VStack gap="lg">
      <VStack gap="xs">
        <Text variant="eyebrow" tone="secondary">Case 2041</Text>
        <Heading level={2}>Sightings awaiting verification</Heading>
      </VStack>
      <VStack gap="xs">
        <Text variant="eyebrow" tone="info">New this month</Text>
        <Heading level={2}>Faster snapshot diffs</Heading>
      </VStack>
    </VStack>
  ),
};

/** A colour the theme added (`addedColorPrimitives`) used as a tone: its text-on-the-page colour. */
export const AddedTone: Story = {
  render: () => (
    <WithAddedColors>
      <VStack gap="xs">
        <Text variant="eyebrow" tone="violet">Research</Text>
        <Text tone="violet">Violet text, readable on the page.</Text>
        <Text tone="teal">Teal text, readable on the page.</Text>
      </VStack>
    </WithAddedColors>
  ),
};
