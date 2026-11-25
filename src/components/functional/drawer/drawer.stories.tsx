import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Drawer, type DrawerProps } from "./drawer";
import { Button } from "../button/button";
import { TextField } from "../text-field/text-field";
import { Textarea } from "../textarea/textarea";
import { Select } from "../select/select";
import { CheckboxGroup } from "../checkbox-group/checkbox-group";
import { ConfirmModal } from "../modal/modal";
import { Badge } from "../badge/badge";
import { Text } from "../../functional-primitive/text/text";

const meta: Meta<typeof Drawer> = {
  title: "Components/Overlays/Drawer",
  // Keeps the URL from before components were grouped by job.
  id: "functional-drawer",
  component: Drawer,
  argTypes: {
    title: { control: "text" },
    placement: { control: "inline-radio", options: ["end", "start", "bottom"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    closeOnBackdrop: { control: "boolean" },
    showCloseButton: { control: "boolean" },
    open: { control: false },
  },
  args: { title: "Case 2026-0418", placement: "end", size: "md" },
};

export default meta;

type Story = StoryObj<typeof Drawer>;

function WithTrigger({ label, ...args }: Omit<DrawerProps, "open"> & { label: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="secondary" shape="rounded" onClick={() => setOpen(true)}>{label}</Button>
      <Drawer {...args} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const caseDetails = (
  <>
    <div style={{ display: "flex", gap: 8 }}><Badge tone="warning">Overdue</Badge><Badge>Annual dues</Badge></div>
    <Text>Aroha Ngata has not paid the annual dues for the season ending 30 September 2026.</Text>
    <Text tone="secondary">Assigned to Hemi Parata · opened 14 October</Text>
  </>
);

export const Default: Story = {
  render: (args) => (
    <WithTrigger {...args} label="Open case" footer={<Button variant="primary" lift={false}>Contact member</Button>}>
      {caseDetails}
    </WithTrigger>
  ),
};

export const Start: Story = {
  args: { placement: "start", title: "Menu", size: "sm" },
  render: (args) => (
    <WithTrigger {...args} label="Open menu">
      <nav aria-label="Account" style={{ display: "grid", gap: 8 }}>
        <a href="#overview">Overview</a>
        <a href="#sightings">Sightings</a>
        <a href="#payments">Payments</a>
        <a href="#mail">Newsletters</a>
      </nav>
    </WithTrigger>
  ),
};

export const Bottom: Story = {
  args: { placement: "bottom", title: "Sort by" },
  render: (args) => (
    <WithTrigger {...args} label="Sort">
      <Select label="Sort by" options={[{ value: "due", label: "Due date" }, { value: "amount", label: "Amount" }, { value: "name", label: "Customer" }]} defaultValue="due" />
    </WithTrigger>
  ),
};

/** A side task with a form. The footer stays put while the form scrolls,
 *  and closing with unsaved changes asks first, in a Modal over the Drawer. */
export const EditInPlace: Story = {
  render: function EditInPlace() {
    const [open, setOpen] = React.useState(false);
    const [dirty, setDirty] = React.useState(false);
    const [confirming, setConfirming] = React.useState(false);
    const close = () => (dirty ? setConfirming(true) : setOpen(false));
    return (
      <>
        <Button variant="secondary" shape="rounded" onClick={() => { setDirty(false); setOpen(true); }}>Edit contact details</Button>
        <Drawer
          open={open}
          onClose={close}
          title="Contact details"
          footer={
            <>
              <Button variant="ghost" shape="rounded" onClick={close}>Cancel</Button>
              <Button variant="primary" shape="rounded" lift={false} onClick={() => setOpen(false)}>Save</Button>
            </>
          }
        >
          <form style={{ display: "grid", gap: 16 }} onChange={() => setDirty(true)} onSubmit={(e) => e.preventDefault()}>
            <TextField label="Email" type="email" defaultValue="aroha@example.org" />
            <TextField label="Phone" type="tel" defaultValue="04 555 0192" />
            <CheckboxGroup
              legend="Send me"
              defaultValue={["reminders"]}
              options={[
                { value: "reminders", label: "Due date reminders" },
                { value: "statements", label: "Monthly statements" },
                { value: "news", label: "Changes that affect my business" },
              ]}
            />
            <Textarea label="Notes for your membership officer" rows={4} />
          </form>
        </Drawer>
        <ConfirmModal
          open={confirming}
          title="Discard your changes?"
          message="Your changes to contact details haven't been saved."
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          danger
          onConfirm={() => { setConfirming(false); setOpen(false); }}
          onCancel={() => setConfirming(false)}
        />
      </>
    );
  },
};
