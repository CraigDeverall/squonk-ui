import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, type TabItem } from "./tabs";
import { Badge } from "../badge/badge";
import { Table } from "../table/table";
import { Text } from "../../functional-primitive/text/text";
import { Heading } from "../../functional-primitive/heading/heading";
import { DocumentIcon, MailIcon, PaymentIcon, UserIcon } from "../../functional-primitive/icon/icon";

const sightings = [
  { period: "Mar 2026", type: "Tear trail", status: "Verified", amount: "420 mL" },
  { period: "Jan 2026", type: "Tear pool", status: "Verified", amount: "388 mL" },
  { period: "Nov 2025", type: "Heard weeping", status: "Verified", amount: "0 mL" },
];

const account: TabItem[] = [
  {
    value: "overview",
    label: "Overview",
    content: (
      <div style={{ display: "grid", gap: 8 }}>
        <Heading level={3}>Dues owing: $0.00</Heading>
        <Text tone="secondary">Your next dues instalment is due on 28 May 2026.</Text>
      </div>
    ),
  },
  {
    value: "sightings",
    label: "Sightings",
    content: (
      <Table
        caption="Sighting reports"
        rowKey="period"
        rows={sightings}
        columns={[
          { key: "period", header: "Period" },
          { key: "type", header: "Type" },
          { key: "status", header: "Status" },
          { key: "amount", header: "Tear volume", align: "right" },
        ]}
      />
    ),
  },
  { value: "payments", label: "Payments", content: <Text>No payments in the last 12 months.</Text> },
  {
    value: "mail",
    label: "Newsletters",
    badge: <Badge tone="info">2</Badge>,
    content: <Text>You have 2 unread newsletters.</Text>,
  },
];

const meta: Meta<typeof Tabs> = {
  title: "Components/Navigation/Tabs",
  // Keeps the URL from before components were grouped by job.
  id: "functional-tabs",
  component: Tabs,
  argTypes: {
    variant: { control: "inline-radio", options: ["line", "enclosed"] },
    fitted: { control: "boolean" },
    activationMode: { control: "inline-radio", options: ["automatic", "manual"] },
    lazy: { control: "boolean" },
    items: { control: false },
  },
  args: { items: account, listLabel: "Account sections" },
  decorators: [(Story) => <div style={{ maxWidth: 640 }}><Story /></div>],
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {};

/** Switching between views of the same data. */
export const Enclosed: Story = {
  args: {
    variant: "enclosed",
    listLabel: "View",
    items: [
      { value: "month", label: "Month", content: <Text>Showing October 2026.</Text> },
      { value: "quarter", label: "Quarter", content: <Text>Showing July to September 2026.</Text> },
      { value: "year", label: "Year", content: <Text>Showing the 2026-27 season.</Text> },
    ],
  },
};

export const Fitted: Story = { args: { fitted: true } };

export const FittedEnclosed: Story = { args: { fitted: true, variant: "enclosed" } };

export const WithIcons: Story = {
  args: {
    items: [
      { value: "profile", label: "Profile", icon: <UserIcon />, content: <Text>Name, address and contact details.</Text> },
      { value: "documents", label: "Documents", icon: <DocumentIcon />, content: <Text>Sighting reports, notices and dues statements.</Text> },
      { value: "payments", label: "Payments", icon: <PaymentIcon />, content: <Text>Direct debits and payment history.</Text> },
      { value: "mail", label: "Mail", icon: <MailIcon />, badge: <Badge tone="info">2</Badge>, content: <Text>2 unread newsletters.</Text> },
    ],
  },
};

export const DisabledTab: Story = {
  args: {
    items: account.map((item) =>
      item.value === "payments" ? { ...item, disabled: true, label: "Payments (setting up)" } : item
    ),
  },
};

/**
 * Long panels: scroll inside the frame and the tab list stays at its top, with
 * the panel passing under it. In an app, `stickyTop` is usually the height of a
 * sticky header.
 */
export const StickyList: Story = {
  args: {
    stickyTop: "0px",
    items: ["Activity", "Newsletters", "Payments"].map((label) => ({
      value: label,
      label,
      content: (
        <div style={{ display: "grid", gap: 12 }}>
          {Array.from({ length: 30 }, (_, i) => (
            <Text key={i}>
              {label} entry {i + 1}
            </Text>
          ))}
        </div>
      ),
    })),
  },
  decorators: [(Story) => <div style={{ maxWidth: 640, height: 320, overflowY: "auto" }}><Story /></div>],
};

/** Too many tabs for the width: the list scrolls sideways instead of wrapping. */
export const Overflow: Story = {
  args: {
    items: ["Night watches", "Tear-pool mapping", "Habitat restoration", "Folklore archive", "Field photography", "Sound recording", "Hemlock walks", "Outreach and education"].map(
      (label) => ({ value: label, label, content: <Text>{label} group.</Text> })
    ),
  },
  decorators: [(Story) => <div style={{ maxWidth: 420 }}><Story /></div>],
};
