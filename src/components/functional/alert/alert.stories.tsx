import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Block } from "../../layout-primitive/block/block";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Alert } from "./alert";
import { Text } from "../../functional-primitive/text/text";
import { Code } from "../../functional-primitive/code/code";

const meta: Meta<typeof Alert> = {
  title: "Components/Feedback/Alert",
  // Keeps the URL from before components were grouped by job.
  id: "functional-alert",
  component: Alert,
  argTypes: {
    ...commonArgTypes,
    tone: { control: "radio", options: ["info", "success", "warning", "error"] },
    variant: { control: "radio", options: ["accent", "tinted"] },
    title: { control: "text" },
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

type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    tone: "info",
    title: "Heads up",
    children: "A new version of SquonkUI is available.",
  },
};

export const Success: Story = {
  args: {
    tone: "success",
    title: "Saved",
    children: "Your changes have been published.",
  },
};

export const Warning: Story = {
  args: {
    tone: "warning",
    title: "Heads up",
    children: "This workspace will be archived after 30 days of inactivity.",
  },
};

export const ErrorAlert: Story = {
  name: "Error",
  args: {
    tone: "error",
    title: "Couldn't save",
    children: "We lost the connection to the server. Try again in a moment.",
  },
};

export const Dismissable: Story = {
  args: {
    tone: "info",
    title: "Tip",
    children: "You can drag-and-drop to reorder items in the list.",
    onDismiss: () => {},
  },
};

export const WithoutTitle: Story = {
  args: {
    tone: "success",
    children: "Profile updated.",
  },
};

// Demonstrates the tone-bound foreground cascade: nested Text and
// Code inside Alert inherit the Alert's darkened tone color rather
// than reverting to theme.colors.text.primary (which would clash with
// the light tone-bound background in dark mode).
export const NestedTextAndCode: Story = {
  args: {
    tone: "info",
    title: "Add a DNS record",
    children: (
      <Text>
        Add this TXT record at your DNS provider:{" "}
        <Code>_squonk-verify.example.com</Code>
      </Text>
    ),
  },
};

/** `variant="tinted"`: a plain block of the tone's wash, with no accent edge and no border. */
export const Tinted: Story = {
  render: () => (
    <VStack gap="sm">
      {(["info", "success", "warning", "error"] as const).map((tone) => (
        <Alert key={tone} tone={tone} variant="tinted" title={tone}>
          A tinted alert sits quietly inside a card or panel.
        </Alert>
      ))}
    </VStack>
  ),
};

/** A colour the theme added (`addedColorPrimitives`) used as a tone, in both variants. */
export const AddedTone: Story = {
  render: () => (
    <WithAddedColors>
      <VStack gap="sm">
        <Alert tone="violet" title="Research preview">This feature is being trialled with a few teams.</Alert>
        <Alert tone="teal" variant="tinted" title="Field work">Three visits are booked this week.</Alert>
      </VStack>
    </WithAddedColors>
  ),
};
