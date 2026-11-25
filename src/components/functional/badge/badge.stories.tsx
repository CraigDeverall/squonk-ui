import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Block } from "../../layout-primitive/block/block";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Badge } from "./badge";

const meta: Meta<typeof Badge> = {
  title: "Components/Data display/Badge",
  // Keeps the URL from before components were grouped by job.
  id: "functional-badge",
  component: Badge,
  argTypes: {
    ...commonArgTypes,
    tone: {
      control: "select",
      options: ["neutral", "primary", "success", "warning", "error", "info"],
    },
    variant: { control: "radio", options: ["solid", "subtle", "outline", "dot"] },
    size: { control: "radio", options: ["sm", "md"] },
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

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: "Beta" },
};

export const Success: Story = {
  args: { tone: "success", children: "Active" },
};

export const Solid: Story = {
  args: { tone: "primary", variant: "solid", children: "New" },
};

export const Outline: Story = {
  args: { tone: "warning", variant: "outline", children: "Pending" },
};

export const Matrix: Story = {
  render: () => {
    const tones = ["neutral", "primary", "success", "warning", "error", "info"] as const;
    const variants = ["solid", "subtle", "outline"] as const;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, max-content)", gap: 8 }}>
        {tones.flatMap((t) =>
          variants.map((v) => (
            <Badge key={`${t}-${v}`} tone={t} variant={v}>
              {t} / {v}
            </Badge>
          ))
        )}
      </div>
    );
  },
};

/** A quiet status: a dot in the tone's colour and bold text, with no pill. */
export const Dot: Story = {
  render: () => (
    <VStack gap="xs">
      {(["neutral", "primary", "success", "warning", "error", "info"] as const).map((tone) => (
        <Badge key={tone} tone={tone} variant="dot">{tone}</Badge>
      ))}
      <Badge tone="success" variant="dot" pulsing>Live</Badge>
    </VStack>
  ),
};

/** A colour the theme added (`addedColorPrimitives`) used as a tone, in every variant. */
export const AddedTone: Story = {
  render: () => (
    <WithAddedColors>
      <VStack gap="sm">
        {(["violet", "teal"] as const).map((tone) => (
          <HStack key={tone} gap="sm" align="center">
            {(["solid", "subtle", "outline", "dot"] as const).map((variant) => (
              <Badge key={variant} tone={tone} variant={variant}>{tone}</Badge>
            ))}
          </HStack>
        ))}
      </VStack>
    </WithAddedColors>
  ),
};
