import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./textarea";
import { Button } from "../button/button";
import { Presentation } from "../../style/presentation/presentation";

const meta: Meta<typeof Textarea> = {
  title: "Components/Inputs/Textarea",
  // Keeps the URL from before components were grouped by job.
  id: "functional-textarea",
  component: Textarea,
  argTypes: {
    label: { control: "text" },
    helperText: { control: "text" },
    error: { control: "text" },
    placeholder: { control: "text" },
    rows: { control: "number" },
    maxLength: { control: "number" },
    autoResize: { control: "boolean" },
    showCount: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    label: "Reason for the correction",
    helperText: "Explain what changed since you logged it. A membership officer reads this.",
  },
  decorators: [(Story) => <div style={{ maxWidth: 480 }}><Story /></div>],
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithCount: Story = {
  args: { maxLength: 280, showCount: true, defaultValue: "I received a late invoice for March that should have been in the period." },
};

export const AutoResize: Story = {
  args: {
    label: "Notes",
    helperText: "Grows as you type.",
    autoResize: true,
    rows: 2,
  },
};

export const WithError: Story = {
  args: { error: "Tell us why you are amending this return." , required: true },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "This sighting report has been verified and can no longer be edited." },
};

export const Registers: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 16 }}>
      {(["compact", "default", "large"] as const).map((register) => (
        <Presentation key={register} register={register}>
          <Textarea {...args} label={`${register} register`} helperText={undefined} rows={2} />
        </Presentation>
      ))}
    </div>
  ),
};

/** A message to a membership officer, with a limit and a send action. */
export const MessageForm: Story = {
  render: function MessageForm() {
    const [message, setMessage] = React.useState("");
    const [sent, setSent] = React.useState(false);
    const [error, setError] = React.useState<string>();
    return (
      <form
        style={{ display: "grid", gap: 12 }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!message.trim()) return setError("Write a message before sending.");
          setError(undefined);
          setSent(true);
        }}
      >
        <Textarea
          label="Message to your membership officer"
          helperText="Don't include card or bank details."
          error={error}
          value={message}
          onChange={(event) => { setMessage(event.target.value); setSent(false); }}
          maxLength={500}
          showCount
          autoResize
        />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Button type="submit" variant="primary">Send message</Button>
          {sent ? <span role="status">Sent. We'll reply within 5 working days.</span> : null}
        </div>
      </form>
    );
  },
};
