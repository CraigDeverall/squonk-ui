import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup } from "./radio";

const meta: Meta<typeof RadioGroup> = {
  title: "Components/Inputs/Radio Group",
  // Keeps the URL from before components were grouped by job.
  id: "functional-radio-group",
  component: RadioGroup,
  argTypes: {
    direction: { control: "radio", options: ["column", "row"] },
    legend: { control: "text" },
    helperText: { control: "text" },
    error: { control: "text" },
  },
};

export default meta;

type Story = StoryObj<typeof RadioGroup>;

const options = [
  { value: "free", label: "Free", helperText: "$0 / month" },
  { value: "pro", label: "Pro", helperText: "$12 / month" },
  { value: "team", label: "Team", helperText: "$30 / month" },
];

const Controlled: Story["render"] = (args) => {
  const [value, setValue] = React.useState<string>("pro");
  return <RadioGroup {...args} value={value} onChange={setValue} />;
};

export const Default: Story = {
  args: { name: "plan", legend: "Choose a plan", options },
  render: Controlled,
};

export const Horizontal: Story = {
  args: {
    name: "size",
    legend: "T-shirt size",
    direction: "row",
    options: [
      { value: "s", label: "Small" },
      { value: "m", label: "Medium" },
      { value: "l", label: "Large" },
    ],
  },
  render: Controlled,
};

export const WithError: Story = {
  args: {
    name: "consent",
    legend: "Marketing emails",
    error: "Please choose an option.",
    options: [
      { value: "yes", label: "Yes, please" },
      { value: "no", label: "No thanks" },
    ],
  },
  render: Controlled,
};
