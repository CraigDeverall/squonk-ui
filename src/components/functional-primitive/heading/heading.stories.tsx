import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Heading } from "./heading";
import { ThemeModifier } from "../../style/theme-modifier/theme-modifier";

const meta: Meta<typeof Heading> = {
  title: "Components/Text and icons/Heading",
  // Keeps the URL from before components were grouped by job.
  id: "functional-primitives-heading",
  component: Heading,
  argTypes: {
    ...commonArgTypes,
    level: { control: { type: "number", min: 1, max: 6, step: 1 } },
    tone: { control: "radio", options: ["primary", "secondary"] },
    weight: { control: "radio", options: [undefined, "regular", "bold", "heavy"] },
  },
};

export default meta;

type Story = StoryObj<typeof Heading>;

export const Default: Story = {
  args: { level: 2, children: "Section heading" },
};

export const Display: Story = {
  args: { level: 1, children: "Welcome to Squonk" },
};

export const Subhead: Story = {
  args: { level: 4, weight: "regular", tone: "secondary", children: "A small library of polished primitives" },
};

export const Scale: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Heading level={1}>Heading level 1</Heading>
      <Heading level={2}>Heading level 2</Heading>
      <Heading level={3}>Heading level 3</Heading>
      <Heading level={4}>Heading level 4</Heading>
      <Heading level={5}>Heading level 5</Heading>
      <Heading level={6}>Heading level 6</Heading>
    </div>
  ),
};

const levelWeights = { "components.heading.weight.level1": "900", "components.heading.weight.level2": "800" };

/**
 * A theme sets the default weight of each level. Here levels 1 and 2 are
 * heavier and the rest keep the bold default; a `weight` prop still wins.
 */
export const LevelWeights: Story = {
  render: () => (
    <ThemeModifier override={{ roleBindings: levelWeights }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Heading level={1}>Level 1, heavier in this theme</Heading>
        <Heading level={2}>Level 2, a little heavier</Heading>
        <Heading level={3}>Level 3, the bold default</Heading>
        <Heading level={1} weight="regular">Level 1 with weight="regular"</Heading>
      </div>
    </ThemeModifier>
  ),
};
