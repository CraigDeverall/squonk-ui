import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmModal, Modal } from "./modal";
import { Button } from "../button/button";
import { TextField } from "../text-field/text-field";
import { VStack } from "../../layout-primitive/vstack/vstack";

const meta: Meta<typeof Modal> = {
  title: "Components/Overlays/Modal",
  // Keeps the URL from before components were grouped by job.
  id: "functional-modal",
  component: Modal,
  argTypes: {
    size: { control: "radio", options: ["sm", "md", "lg"] },
    title: { control: "text" },
    closeOnBackdrop: { control: "boolean" },
    showCloseButton: { control: "boolean" },
    open: { control: false },
    onClose: { control: false },
    footer: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof Modal>;

/** Storybook wrapper that owns the `open` state so stories are interactive. */
function ModalDemo(args: React.ComponentProps<typeof Modal>) {
  const [open, setOpen] = React.useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal {...args} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export const Default: Story = {
  args: {
    title: "Invite a user",
    children: (
      <VStack gap="md">
        <TextField label="Email" placeholder="you@example.com" />
      </VStack>
    ),
  },
  render: (args) => (
    <ModalDemo
      {...args}
      footer={
        <>
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Send invite</Button>
        </>
      }
    />
  ),
};

export const Small: Story = {
  args: {
    title: "Heads up",
    size: "sm",
    children: "Something small but important.",
  },
  render: (args) => <ModalDemo {...args} />,
};

export const Large: Story = {
  args: {
    title: "Release notes",
    size: "lg",
    children:
      "Room for long-form content — release notes, terms, a wide form. The dialog scrolls internally past 85vh.",
  },
  render: (args) => <ModalDemo {...args} />,
};

function ConfirmDemo({ danger }: { danger?: boolean }) {
  const [open, setOpen] = React.useState(true);
  return (
    <>
      <Button variant={danger ? "danger" : "primary"} onClick={() => setOpen(true)}>
        {danger ? "Delete user" : "Publish"}
      </Button>
      <ConfirmModal
        open={open}
        danger={danger}
        title={danger ? "Delete this user?" : "Publish this version?"}
        message={
          danger
            ? "This permanently removes the membership and cannot be undone."
            : "The new version goes live for everyone immediately."
        }
        confirmLabel={danger ? "Delete" : "Publish"}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

export const Confirm: Story = {
  render: () => <ConfirmDemo />,
};

export const ConfirmDanger: Story = {
  render: () => <ConfirmDemo danger />,
};
