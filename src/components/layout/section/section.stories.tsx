import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Section, BleedSection } from "./section";
import { SectionHeading } from "../section-heading/section-heading";
import { Text } from "../../functional-primitive/text/text";
import { Grid } from "../../layout-primitive/grid/grid";
import { Card } from "../card/card";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { Heading } from "../../functional-primitive/heading/heading";

const meta: Meta<typeof Section> = {
  title: "Components/Layout/Page structure/Section",
  // Keeps the URL from before components were grouped by job.
  id: "layout-section",
  component: Section,
  args: {
    tone: "transparent",
    register: "default",
  },
  argTypes: {
    ...commonArgTypes,
    tone: {
      control: "radio",
      options: ["transparent", "surface", "subtle"],
      description: "Background tone.",
    },
    register: {
      control: "radio",
      options: ["compact", "default", "large", "hero"],
      description:
        "Visual register applied to the section and its descendants.",
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

type Story = StoryObj<typeof Section>;

export const Default: Story = {
  args: {
    children: (
      <VStack align="center">
        <SectionHeading
          eyebrow="Platform"
          headline="Everything your team needs to ship"
          sub="One workspace for planning, building, and shipping releases."
        />
      </VStack>
    ),
  },
};

export const SurfaceTone: Story = {
  args: {
    tone: "surface",
    register: "compact",
    children: (
      <VStack gap="sm">
        <Heading level={3}>Recent activity</Heading>
        <Text tone="secondary">
          A raised-surface stripe — the classic "alternating section" pattern.
        </Text>
      </VStack>
    ),
  },
};

export const HeroRegister: Story = {
  args: {
    tone: "subtle",
    register: "hero",
    children: (
      <VStack align="center">
        <SectionHeading
          eyebrow="New"
          headline="Ship with confidence"
          sub="Visual regression testing built into every release."
        />
      </VStack>
    ),
  },
};

export const WithCardGrid: Story = {
  args: {
    tone: "surface",
    children: (
      <VStack gap="lg">
        <SectionHeading
          align="start"
          headline="Pricing"
          sub="Simple plans that scale with your team."
        />
        <Grid columns={3} gap="md">
          <Card variant="outlined">
            <VStack gap="xs">
              <Heading level={4}>Starter</Heading>
              <Text tone="secondary">For small teams getting started.</Text>
            </VStack>
          </Card>
          <Card variant="featured">
            <VStack gap="xs">
              <Heading level={4}>Growth</Heading>
              <Text>Most popular — everything a scaling team needs.</Text>
            </VStack>
          </Card>
          <Card variant="outlined">
            <VStack gap="xs">
              <Heading level={4}>Enterprise</Heading>
              <Text tone="secondary">Custom limits and dedicated support.</Text>
            </VStack>
          </Card>
        </Grid>
      </VStack>
    ),
  },
};

export const Bleed: Story = {
  render: () => (
    <BleedSection tone="subtle" register="compact">
      <Text align="center">
        BleedSection drops the inner Container — content runs edge-to-edge.
      </Text>
    </BleedSection>
  ),
};
