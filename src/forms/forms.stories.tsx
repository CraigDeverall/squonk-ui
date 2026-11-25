import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Card } from "../components";
import { BankAccountForm } from "./examples/bank-account";
import { ContactDetailsForm } from "./examples/contact-details";
import { HouseholdMembersForm } from "./examples/household-members";
import { WatchLeaderDetailsForm } from "./examples/watch-leader-details";
import { MembershipApplicationSteps } from "./examples/membership-application-steps";
import { PaymentAmountForm } from "./examples/payment-amount";
import { ServerErrorsForm } from "./examples/server-errors";
import { MemberLookupForm } from "./examples/member-lookup";
import { PlannedGiftForm } from "./examples/planned-gift-field";

const meta: Meta = {
  title: "Patterns/Forms/Examples",
  // Keeps the URL from before the sidebar was reorganised.
  id: "forms-examples",
  parameters: { controls: { disable: true }, layout: "padded" },
  decorators: [(Story) => <Card style={{ maxWidth: 560 }}><Story /></Card>],
};

export default meta;

type Story = StoryObj;

/** Press Save with nothing filled in, then fix the errors. */
export const ContactDetails: Story = { render: () => <ContactDetailsForm /> };
/** Type two different account numbers, or an end date before the start. */
export const CrossFieldRules: Story = { render: () => <BankAccountForm /> };
/** Type SQ-104-772, then any other number. */
export const AsyncCheck: Story = { render: () => <MemberLookupForm /> };
/** Submit "aroha", "service-down", or an @example.com address. */
export const ServerErrors: Story = { render: () => <ServerErrorsForm /> };
/** Answer Yes to see, and be asked for, the follow-up questions. */
export const ConditionalQuestions: Story = { render: () => <WatchLeaderDetailsForm /> };
/** Add and remove household members; each one is validated. */
export const RepeatingGroup: Story = { render: () => <HouseholdMembersForm /> };
/** Three steps; Back keeps your answers. */
export const MultiStep: Story = { render: () => <MembershipApplicationSteps /> };
/** A money amount with `field.CurrencyField`: type 12.5, paste "NZ$1,234.56", or press Continue empty. */
export const MoneyAmount: Story = { render: () => <PaymentAmountForm /> };
/** A React Aria NumberField bound to the form. */
export const CustomField: Story = { render: () => <PlannedGiftForm /> };
