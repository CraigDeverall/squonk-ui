import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ToastProvider, useToast } from "./toast";
import { Button } from "../button/button";
import { HStack } from "../../layout-primitive/hstack/hstack";

const meta: Meta<typeof ToastProvider> = {
  title: "Components/Feedback/Toast",
  // Keeps the URL from before components were grouped by job.
  id: "functional-toast",
  component: ToastProvider,
  argTypes: {
    position: {
      control: "radio",
      options: ["top-right", "top-center", "bottom-right", "bottom-center"],
    },
    duration: { control: "number" },
  },
};

export default meta;

type Story = StoryObj<typeof ToastProvider>;

function Demo() {
  const toast = useToast();
  return (
    <HStack gap="sm">
      <Button variant="secondary" onClick={() => toast.info("Build queued.")}>
        Info
      </Button>
      <Button
        variant="primary"
        onClick={() => toast.success("Invite sent.", "Done")}
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.warning("Certificate expires in 3 days.")}
      >
        Warning
      </Button>
      <Button
        variant="danger"
        onClick={() =>
          toast.error("The server rejected the request.", "Save failed")
        }
      >
        Error
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          toast.show({ message: "I stay until dismissed.", duration: 0 })
        }
      >
        Sticky
      </Button>
    </HStack>
  );
}

export const Default: Story = {
  render: (args) => (
    <ToastProvider {...args}>
      <Demo />
    </ToastProvider>
  ),
};

export const TopCenter: Story = {
  args: { position: "top-center" },
  render: (args) => (
    <ToastProvider {...args}>
      <Demo />
    </ToastProvider>
  ),
};

function ActionDemo() {
  const toast = useToast();
  const [archived, setArchived] = React.useState(false);
  return (
    <HStack gap="sm">
      <Button
        variant="secondary"
        disabled={archived}
        onClick={() => {
          setArchived(true);
          toast.show({
            tone: "success",
            message: "Case archived.",
            duration: 10000,
            action: { label: "Undo", onAction: () => setArchived(false) },
          });
        }}
      >
        Archive case
      </Button>
      {/* The same action stays on the page after the toast has gone. */}
      <Button variant="ghost" disabled={!archived} onClick={() => setArchived(false)}>
        Restore case
      </Button>
    </HStack>
  );
}

/** A toast with one action. The page keeps its own "Restore case", so the toast is never the only way to undo. */
export const WithAction: Story = {
  render: (args) => (
    <ToastProvider {...args}>
      <ActionDemo />
    </ToastProvider>
  ),
};
