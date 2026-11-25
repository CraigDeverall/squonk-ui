import type { Meta, StoryObj } from "@storybook/react";
import { TextField } from "./text-field";
import { Presentation } from "../../style/presentation/presentation";

const meta: Meta<typeof TextField> = {
  title: "Components/Inputs/Text Field",
  // Keeps the URL from before components were grouped by job.
  id: "functional-text-field",
  component: TextField,
  argTypes: {
    label: { control: "text" },
    helperText: { control: "text" },
    error: { control: "text" },
    placeholder: { control: "text" },
    fullWidth: { control: "boolean" },
    disabled: { control: "boolean" },
    ref: {
      description: "Ref to the DOM element",
      control: false,
      table: { type: { summary: "React.RefObject<HTMLInputElement>" } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TextField>;

export const Default: Story = {
  args: { placeholder: "you@example.com" },
};

export const WithLabel: Story = {
  args: { label: "Email address", placeholder: "you@example.com" },
};

export const WithHelperText: Story = {
  args: {
    label: "Password",
    type: "password",
    placeholder: "••••••••",
    helperText: "At least 8 characters, one number.",
  },
};

export const WithError: Story = {
  args: {
    label: "Email address",
    defaultValue: "not-an-email",
    error: "Enter a valid email address.",
  },
};

export const Compact: Story = {
  args: { label: "Search", placeholder: "Search…" },
  render: (args) => (
    <Presentation register="compact">
      <TextField {...args} />
    </Presentation>
  ),
};

export const Large: Story = {
  args: { label: "Search", placeholder: "Search…" },
  render: (args) => (
    <Presentation register="large">
      <TextField {...args} />
    </Presentation>
  ),
};

export const Disabled: Story = {
  args: { label: "Email", defaultValue: "ada@example.com", disabled: true },
};
