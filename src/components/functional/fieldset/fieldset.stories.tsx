import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Fieldset } from "./fieldset";
import { TextField } from "../text-field/text-field";
import { Select } from "../select/select";
import { Switch } from "../switch/switch";
import { RadioGroup } from "../radio/radio";

const meta: Meta<typeof Fieldset> = {
  title: "Components/Inputs/Fieldset",
  // Keeps the URL from before components were grouped by job.
  id: "functional-fieldset",
  component: Fieldset,
  argTypes: {
    legend: { control: "text" },
    helperText: { control: "text" },
    error: { control: "text" },
    disabled: { control: "boolean" },
    hideLegend: { control: "boolean" },
    gap: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] },
  },
  args: {
    legend: "Postal address",
    helperText: "Where we send newsletters and your dues statement.",
  },
  decorators: [(Story) => <div style={{ maxWidth: 440 }}><Story /></div>],
};

export default meta;

type Story = StoryObj<typeof Fieldset>;

const AddressFields = () => (
  <>
    <TextField label="Street address" autoComplete="address-line1" />
    <TextField label="Suburb" autoComplete="address-level3" />
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
      <TextField label="Town or city" autoComplete="address-level2" />
      <TextField label="Postcode" autoComplete="postal-code" inputMode="numeric" />
    </div>
  </>
);

export const Default: Story = {
  render: (args) => <Fieldset {...args}><AddressFields /></Fieldset>,
};

export const Disabled: Story = {
  args: { disabled: true, helperText: "Your adviser manages this address." },
  render: (args) => <Fieldset {...args}><AddressFields /></Fieldset>,
};

/** An error about the group as a whole, not one field. */
export const WithError: Story = {
  args: {
    legend: "How should we contact you?",
    helperText: "Give at least one.",
    error: "Enter an email address or a phone number.",
  },
  render: (args) => (
    <Fieldset {...args}>
      <TextField label="Email" type="email" autoComplete="email" />
      <TextField label="Phone" type="tel" autoComplete="tel" />
    </Fieldset>
  ),
};

/** Sections of a long form, each with its own legend. */
export const FormSections: Story = {
  render: () => (
    <form style={{ display: "grid", gap: 32 }} onSubmit={(event) => event.preventDefault()}>
      <Fieldset legend="Member details">
        <TextField label="Full name" />
        <Select
          label="Membership tier"
          placeholder="Choose a tier"
          options={[
            { value: "tadpole", label: "Tadpole" },
            { value: "wanderer", label: "Wanderer" },
            { value: "keeper", label: "Keeper" },
            { value: "life", label: "Life member" },
          ]}
        />
      </Fieldset>
      <Fieldset legend="Dues" helperText="You can change these later.">
        <RadioGroup
          name="frequency"
          legend="How often will you pay your dues?"
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "two-monthly", label: "Every two months" },
            { value: "six-monthly", label: "Every six months" },
          ]}
        />
        <Switch label="Email me a reminder before each due date" />
      </Fieldset>
    </form>
  ),
};
