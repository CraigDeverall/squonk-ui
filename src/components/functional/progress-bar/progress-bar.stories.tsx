import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Block } from "../../layout-primitive/block/block";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { ProgressBar } from "./progress-bar";

const meta: Meta<typeof ProgressBar> = {
  title: "Components/Feedback/Progress Bar",
  // Keeps the URL from before components were grouped by job.
  id: "functional-progress-bar",
  component: ProgressBar,
  argTypes: {
    value: { control: { type: "number", min: 0, max: 100, step: 5 } },
    tone: { control: "radio", options: ["primary", "success", "warning", "error"] },
    label: { control: "text" },
    showValue: { control: "boolean" },
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

type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  args: { value: 40, label: "Uploading…", showValue: true },
};

export const Indeterminate: Story = {
  args: { label: "Connecting…", ariaLabel: "Connecting" },
};

export const Success: Story = {
  args: { value: 100, tone: "success", label: "Complete", showValue: true },
};

export const Tones: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 320 }}>
      <ProgressBar value={25} tone="primary" label="Primary" showValue />
      <ProgressBar value={60} tone="success" label="Success" showValue />
      <ProgressBar value={75} tone="warning" label="Warning" showValue />
      <ProgressBar value={90} tone="error" label="Error" showValue />
    </div>
  ),
};

/** A colour the theme added (`addedColorPrimitives`) used as a tone. */
export const AddedTone: Story = {
  render: () => (
    <WithAddedColors>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 280 }}>
        <ProgressBar value={45} tone="violet" label="Research" showValue />
        <ProgressBar value={70} tone="teal" label="Field work" showValue />
      </div>
    </WithAddedColors>
  ),
};
