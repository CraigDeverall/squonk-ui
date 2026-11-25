import type { Meta, StoryObj } from "@storybook/react";
import { RegistrationForm } from "./form.harness";

const meta: Meta<typeof RegistrationForm> = {
  title: "Components/Inputs/Form",
  // Keeps the URL from before components were grouped by job.
  id: "functional-form",
  component: RegistrationForm,
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj<typeof RegistrationForm>;

/** Press Join with nothing filled in, then fix the errors. Use
 *  taken@example.co.nz to see a server-side error land on its field. */
export const Registration: Story = {};
