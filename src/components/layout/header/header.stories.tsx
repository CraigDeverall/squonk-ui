import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { Link } from "../../functional/link/link";
import { Header } from "./header";

const meta: Meta<typeof Header> = {
  title: "Components/Navigation/Header",
  // Keeps the URL from before components were grouped by job.
  id: "layout-header",
  component: Header,
  argTypes: {
    ...commonArgTypes,
    tone: {
      control: "inline-radio",
      options: ["default", "translucent"],
    },
    register: {
      control: "inline-radio",
      options: ["compact", "default", "large", "hero"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Header>;

const sampleContent = (
  <>
    <strong style={{ fontSize: 18 }}>Squonk</strong>
    <nav style={{ display: "flex", gap: 16, marginLeft: 16 }}>
      <Link href="#">Dashboard</Link>
      <Link href="#">Projects</Link>
      <Link href="#">Reports</Link>
    </nav>
    <div style={{ marginLeft: "auto" }}>Ada Lovelace</div>
  </>
);

export const Default: Story = {
  args: { children: sampleContent },
};

export const Translucent: Story = {
  args: { tone: "translucent", children: sampleContent },
};

export const Spacious: Story = {
  args: { register: "default", children: sampleContent },
};
