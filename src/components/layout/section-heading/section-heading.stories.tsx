import type { Meta, StoryObj } from "@storybook/react";
import { SectionHeading } from "./section-heading";

const meta: Meta<typeof SectionHeading> = {
  title: "Components/Layout/Page structure/Section Heading",
  // Keeps the URL from before components were grouped by job.
  id: "layout-section-heading",
  component: SectionHeading,
  args: {
    align: "center",
    level: 2,
  },
  argTypes: {
    align: {
      control: "inline-radio",
      options: ["start", "center"],
      description: "Alignment of the heading block.",
    },
    level: {
      control: "inline-radio",
      options: [1, 2, 3],
      description: "Heading semantic level.",
    },
    maxWidth: {
      control: "text",
      description: "Max width of the heading block.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof SectionHeading>;

export const Default: Story = {
  args: {
    eyebrow: "Platform",
    headline: "Everything your team needs to ship",
    sub: "One workspace for planning, building, and shipping releases.",
  },
};

export const StartAligned: Story = {
  args: {
    align: "start",
    headline: "Release notes",
    sub: "What shipped this week, in plain language.",
  },
};

export const WithoutEyebrow: Story = {
  args: {
    headline: "Pricing",
    sub: "Simple plans that scale with your team.",
  },
};

export const HeadlineOnly: Story = {
  args: {
    headline: "Frequently asked questions",
  },
};
