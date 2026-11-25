import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumb } from "./breadcrumb";
import { Heading } from "../../functional-primitive/heading/heading";

const trail = [
  { label: "My account", href: "#account" },
  { label: "Waikato Chapter", href: "#chapter" },
  { label: "Sightings", href: "#sightings" },
  { label: "Sighting of 14 March 2026" },
];

const meta: Meta<typeof Breadcrumb> = {
  title: "Components/Navigation/Breadcrumb",
  // Keeps the URL from before components were grouped by job.
  id: "functional-breadcrumb",
  component: Breadcrumb,
  argTypes: {
    maxItems: { control: "number" },
    homeIcon: { control: "boolean" },
    items: { control: "object" },
  },
  args: { items: trail },
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {};

export const HomeIcon: Story = { args: { homeIcon: true } };

export const Collapsed: Story = {
  args: {
    maxItems: 3,
    items: [
      { label: "My account", href: "#account" },
      { label: "Business", href: "#business" },
      { label: "Aroha Ngata", href: "#aroha" },
      { label: "Waikato Chapter", href: "#chapter" },
      { label: "Sightings", href: "#sightings" },
      { label: "Sighting of 14 March 2026" },
    ],
  },
};

export const LongNames: Story = {
  args: {
    items: [
      { label: "My account", href: "#account" },
      { label: "Te Whanganui-a-Tara Community Trust Board", href: "#trust" },
      { label: "Correspondence", href: "#mail" },
      { label: "Notice of proposed adjustment for the 2025 income year" },
    ],
  },
  decorators: [(Story) => <div style={{ maxWidth: 420 }}><Story /></div>],
};

/** Above the page heading, which repeats the current page's name. */
export const PageHeader: Story = {
  render: (args) => (
    <header style={{ display: "grid", gap: 8 }}>
      <Breadcrumb {...args} homeIcon />
      <Heading level={1}>Sighting of 14 March 2026</Heading>
    </header>
  ),
};
