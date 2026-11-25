import type { Meta, StoryObj } from "@storybook/react";
import { Presentation } from "./presentation";
import { Card } from "../../layout/card/card";
import { Grid } from "../../layout-primitive/grid/grid";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";
import { Button } from "../../functional/button/button";

const meta: Meta<typeof Presentation> = {
  title: "Components/Theme and motion/Presentation",
  // Keeps the URL from before components were grouped by job.
  id: "style-presentation",
  component: Presentation,
  args: {
    register: "default",
  },
  argTypes: {
    register: {
      control: "radio",
      options: ["compact", "default", "large", "hero"],
      description:
        "The register applied to every register-aware descendant — sizes Heading, Text, Button, Card padding, and more, all at once.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Presentation>;

const demoCard = (
  <Card variant="outlined">
    <VStack gap="sm">
      <Heading level={4}>checkout-flow</Heading>
      <Text tone="secondary">
        This card, its heading, and its button all read the same
        Presentation register — switch the control to see them resize
        together.
      </Text>
      <Button variant="primary">View dashboard</Button>
    </VStack>
  </Card>
);

export const Default: Story = {
  args: {
    children: demoCard,
  },
};

export const AllRegisters: Story = {
  render: () => (
    <Grid columns={2} gap="md">
      <Presentation register="compact">{demoCard}</Presentation>
      <Presentation register="default">{demoCard}</Presentation>
      <Presentation register="large">{demoCard}</Presentation>
      <Presentation register="hero">{demoCard}</Presentation>
    </Grid>
  ),
};
