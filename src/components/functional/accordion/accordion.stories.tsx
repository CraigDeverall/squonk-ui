import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Accordion, type AccordionItem } from "./accordion";
import { Badge } from "../badge/badge";
import { Link } from "../link/link";
import { Text } from "../../functional-primitive/text/text";

const faqs: AccordionItem[] = [
  {
    value: "due",
    title: "When are my annual dues due?",
    content: (
      <Text>
        Annual dues are payable on the 28th of the month after your season starts. If you pay by
        instalments, the instalment for the period ending 31 March is due on 28 April.
      </Text>
    ),
  },
  {
    value: "late",
    title: "What happens if I pay late?",
    content: (
      <Text>
        A small late fee may apply. If you can't pay on time, contact us before the due date. We can
        often agree an extension.
      </Text>
    ),
  },
  {
    value: "change",
    title: "Can I change how often I pay?",
    content: (
      <Text>
        Yes. You can change your payment frequency from your account settings. <Link href="#settings">Go to settings</Link>
      </Text>
    ),
  },
];

const meta: Meta<typeof Accordion> = {
  title: "Components/Data display/Accordion",
  // Keeps the URL from before components were grouped by job.
  id: "functional-accordion",
  component: Accordion,
  argTypes: {
    variant: { control: "inline-radio", options: ["divided", "contained"] },
    multiple: { control: "boolean" },
    collapsible: { control: "boolean" },
    headingLevel: { control: "inline-radio", options: [2, 3, 4, 5, 6] },
    items: { control: false },
  },
  args: { items: faqs },
  decorators: [(Story) => <div style={{ maxWidth: 640 }}><Story /></div>],
};

export default meta;

type Story = StoryObj<typeof Accordion>;

export const Default: Story = {};

export const Contained: Story = { args: { variant: "contained" } };

/** Each header row shades while pointed at, with no underline: sections that read as rows of a list. */
export const FillHover: Story = { args: { hover: "fill", multiple: true } };

/** Rows with no chevron: the shading on hover says they open. */
export const FillHoverWithoutIndicator: Story = { args: { hover: "fill", indicator: false, multiple: true } };

export const Multiple: Story = { args: { multiple: true, defaultValue: ["due", "late"] } };

/** Sections with a summary line, for a review page where each section can be checked. */
export const WithDescriptions: Story = {
  args: {
    variant: "contained",
    multiple: true,
    items: [
      {
        value: "member",
        title: "Member details",
        description: "Aroha Ngata · Waikato Chapter",
        content: <Text>Name, chapter and membership number.</Text>,
      },
      {
        value: "accounts",
        title: "Membership account",
        description: <span style={{ display: "inline-flex", gap: 6 }}><Badge tone="success">Annual dues</Badge><Badge tone="success">Swamp Fund levy</Badge></span>,
        content: <Text>Paying annual dues (two-monthly) and the Swamp Fund levy.</Text>,
      },
      {
        value: "bank",
        title: "Bank account",
        description: "Not provided",
        content: <Text>Add a bank account to receive credits.</Text>,
      },
      {
        value: "agent",
        title: "Chapter treasurer",
        description: "Available after joining",
        disabled: true,
        content: <Text>Link a chapter treasurer.</Text>,
      },
    ],
  },
};

/** One section that hides detail most people don't need. */
export const SingleDisclosure: Story = {
  args: {
    items: [
      {
        value: "how",
        title: "How we calculated this",
        content: <Text>Annual dues of $48.20 plus the Swamp Fund levy of $12.00, less a credit of $2.98, gives $57.22 to pay.</Text>,
      },
    ],
  },
};
