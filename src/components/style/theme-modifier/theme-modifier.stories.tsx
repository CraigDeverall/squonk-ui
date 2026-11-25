import type { Meta, StoryObj } from "@storybook/react";
import { ThemeModifier } from "./theme-modifier";
import { Grid } from "../../layout-primitive/grid/grid";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Card } from "../../layout/card/card";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";
import { Button } from "../../functional/button/button";

const meta: Meta<typeof ThemeModifier> = {
  title: "Components/Theme and motion/Theme Modifier",
  // Keeps the URL from before components were grouped by job.
  id: "style-theme-modifier",
  component: ThemeModifier,
  argTypes: {
    override: {
      control: false,
      description:
        "Partial theme override, deep-merged onto the inherited theme.",
      table: { type: { summary: "DeepPartial<SquonkTheme>" } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ThemeModifier>;

const demoCard = (
  <Card variant="outlined">
    <VStack gap="sm">
      <Heading level={4}>Co-branded panel</Heading>
      <Text tone="secondary">Buttons and links pick up the new primary color.</Text>
      <Button variant="primary">Continue</Button>
    </VStack>
  </Card>
);

export const Default: Story = {
  args: {
    override: { colors: { primary: "#e11d48" } },
    children: demoCard,
  },
};

export const SideBySide: Story = {
  render: () => (
    <Grid columns={2} gap="md">
      <VStack gap="xs">
        <Text tone="muted">Inherited theme</Text>
        {demoCard}
      </VStack>
      <VStack gap="xs">
        <Text tone="muted">override={"{ colors: { primary: \"#e11d48\" } }"}</Text>
        <ThemeModifier override={{ colors: { primary: "#e11d48" } }}>
          {demoCard}
        </ThemeModifier>
      </VStack>
    </Grid>
  ),
};

export const MultipleTokens: Story = {
  render: () => (
    <ThemeModifier
      override={{
        colors: {
          primary: "#0f766e",
          background: { subtle: "#f0fdfa" },
          border: { default: "#99f6e4" },
        },
      }}
    >
      <Card variant="filled">
        <VStack gap="sm">
          <Heading level={4}>Teal brand override</Heading>
          <Text tone="secondary">
            Primary, subtle background, and default border all re-pointed
            together for a single co-branded subtree.
          </Text>
          <Button variant="primary">Get started</Button>
        </VStack>
      </Card>
    </ThemeModifier>
  ),
};
