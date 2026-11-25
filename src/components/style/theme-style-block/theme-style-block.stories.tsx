import type { Meta, StoryObj } from "@storybook/react";
import { ThemeStyleBlock } from "./theme-style-block";
import { Grid } from "../../layout-primitive/grid/grid";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Block } from "../../layout-primitive/block/block";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";
import { Button } from "../../functional/button/button";
import { Cluster } from "../../layout/cluster/cluster";

const meta: Meta<typeof ThemeStyleBlock> = {
  title: "Components/Theme and motion/Theme Style Block",
  // Keeps the URL from before components were grouped by job.
  id: "style-theme-style-block",
  component: ThemeStyleBlock,
  args: {
    invertMode: false,
  },
  argTypes: {
    register: {
      control: "radio",
      options: [undefined, "compact", "normal", "display"],
      description: "Scale the subtree's spacing / font / border-radius.",
    },
    invertMode: {
      control: "boolean",
      description: "Flip the inherited color mode for the subtree only.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof ThemeStyleBlock>;

const demoPanel = (
  <Block padding="md" background="surface" radius="base" bordered>
    <VStack gap="sm">
      <Heading level={4}>Reply composer</Heading>
      <Text>Watch spacing, font size, and radius change with register.</Text>
      <Cluster gap="xs">
        <Button variant="primary">Send</Button>
        <Button variant="ghost">Discard</Button>
      </Cluster>
    </VStack>
  </Block>
);

export const Compact: Story = {
  args: {
    register: "compact",
    children: demoPanel,
  },
};

export const Display: Story = {
  args: {
    register: "display",
    children: demoPanel,
  },
};

export const InvertedMode: Story = {
  args: {
    invertMode: true,
    children: demoPanel,
  },
};

export const AllRegistersSideBySide: Story = {
  render: () => (
    <Grid columns={3} gap="md">
      <ThemeStyleBlock register="compact">{demoPanel}</ThemeStyleBlock>
      <ThemeStyleBlock register="normal">{demoPanel}</ThemeStyleBlock>
      <ThemeStyleBlock register="display">{demoPanel}</ThemeStyleBlock>
    </Grid>
  ),
};

export const RegisterAndInvertComposed: Story = {
  render: () => (
    <ThemeStyleBlock register="compact" invertMode>
      {demoPanel}
    </ThemeStyleBlock>
  ),
};
