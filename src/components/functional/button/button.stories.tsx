import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Block } from "../../layout-primitive/block/block";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Components/Actions/Button",
  // Keeps the URL from before components were grouped by job.
  id: "functional-button",
  component: Button,
  args: {
    variant: "secondary",
    shape: "pill",
    fullWidth: false,
    disabled: false,
    lift: false,
  },
  argTypes: {
    ...commonArgTypes,
    variant: {
      control: "radio",
      options: ["primary", "secondary", "solid", "ghost", "danger"],
      description: "Visual style.",
    },
    shape: {
      control: "radio",
      options: ["pill", "rounded"],
      description: "Corner radius.",
    },
    fullWidth: {
      control: "boolean",
      description: "Stretch to fill the parent's width.",
    },
    lift: {
      control: "boolean",
      description: "Lift and cast a shadow on hover.",
    },
    disabled: {
      control: "boolean",
    },
    primary: { table: { disable: true } },
    ref: {
      description: "Ref to the DOM element",
      control: false,
      table: {
        type: { summary: "React.RefObject<HTMLButtonElement>" },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: "primary", children: "Save changes" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Cancel" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Learn more" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Delete account" },
};

export const Solid: Story = {
  args: { variant: "solid", children: "Continue" },
};

/** An explicit pill for a marketing call to action; other buttons follow the theme's control radius. */
export const Pill: Story = {
  args: { variant: "primary", shape: "pill", children: "Start free trial" },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true, children: "Save changes" },
};

export const FullWidth: Story = {
  args: { variant: "primary", fullWidth: true, children: "Continue" },
};

const GRADIENT_THEME = {
  primaryGradient: true,
  colors: { primary: "#6d28d9", primaryGradientStart: "#0f766e" },
  darkColors: { primary: "#a78bfa", primaryGradientStart: "#2dd4bf" },
};

/**
 * The theme's `primaryGradient` switch: the primary button filled with a
 * gradient from `primaryGradientStart` to the primary, in light and dark mode.
 * Point at it and press it to see its hover and pressed gradients. Its label
 * is chosen to read on both ends.
 */
export const PrimaryGradient: Story = {
  args: { variant: "primary", children: "Install" },
  render: (args) => (
    <HStack gap="md" wrap>
      {(["light", "dark"] as const).map((mode) => (
        <SquonkThemeProvider key={mode} mode={mode} primitives={GRADIENT_THEME}>
          <Block background="default" padding="md" radius="md">
            <HStack gap="sm">
              <Button {...args} />
              <Button {...args} variant="secondary">
                Cancel
              </Button>
              <Button {...args} disabled>
                Install
              </Button>
            </HStack>
          </Block>
        </SquonkThemeProvider>
      ))}
    </HStack>
  ),
};

/** A request in flight: still focusable, announced as busy, and presses are ignored. */
export const Pending: Story = {
  args: { variant: "primary", pending: true, children: "Submitting…" },
};
