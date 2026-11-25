import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CheckboxGroup } from "./checkbox-group";
import { Button } from "../button/button";

const accounts = [
  { value: "dues", label: "Annual dues", helperText: "Payable by every member." },
  { value: "levy", label: "Swamp Fund levy", helperText: "If you volunteer with a chapter." },
  { value: "kit", label: "Night-watch kit hire" },
  { value: "deposit", label: "Field-trip deposit", disabled: true, helperText: "Set up by your chapter." },
];

const meta: Meta<typeof CheckboxGroup> = {
  title: "Components/Inputs/CheckboxGroup",
  // Keeps the URL from before components were grouped by job.
  id: "functional-checkboxgroup",
  component: CheckboxGroup,
  argTypes: {
    legend: { control: "text" },
    helperText: { control: "text" },
    error: { control: "text" },
    disabled: { control: "boolean" },
    max: { control: "number" },
    direction: { control: "inline-radio", options: ["column", "row"] },
  },
  args: {
    legend: "Which accounts do you want to set up?",
    helperText: "Choose all that apply.",
    name: "accounts",
    options: accounts,
  },
};

export default meta;

type Story = StoryObj<typeof CheckboxGroup>;

export const Default: Story = {};

export const Preselected: Story = { args: { defaultValue: ["dues"] } };

export const Row: Story = {
  args: {
    legend: "Notify me by",
    helperText: undefined,
    direction: "row",
    options: [
      { value: "email", label: "Email" },
      { value: "sms", label: "Text message" },
      { value: "post", label: "Post" },
    ],
    defaultValue: ["email"],
  },
};

export const Maximum: Story = {
  args: {
    legend: "Choose up to two reminder days",
    helperText: "Other days are disabled once you have chosen two.",
    max: 2,
    options: [
      { value: "14", label: "14 days before" },
      { value: "7", label: "7 days before" },
      { value: "3", label: "3 days before" },
      { value: "1", label: "The day before" },
    ],
  },
};

export const WithError: Story = {
  args: { error: "Choose at least one account to continue." },
};

export const Disabled: Story = { args: { disabled: true, defaultValue: ["dues", "levy"] } };

/** Validated on submit: the error appears on the group and clears on change. */
export const InAForm: Story = {
  render: function InAForm(args) {
    const [value, setValue] = React.useState<string[]>([]);
    const [error, setError] = React.useState<string>();
    const [saved, setSaved] = React.useState<string>();
    return (
      <form
        style={{ display: "grid", gap: 16, maxWidth: 420 }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!value.length) return setError("Choose at least one account to continue.");
          setSaved(`Registering for ${value.map((v) => v.toUpperCase()).join(", ")}.`);
        }}
      >
        <CheckboxGroup {...args} value={value} error={error} onChange={(next) => { setValue(next); setError(undefined); setSaved(undefined); }} />
        <div><Button type="submit" variant="primary">Continue</Button></div>
        {saved ? <p role="status">{saved}</p> : null}
      </form>
    );
  },
};
