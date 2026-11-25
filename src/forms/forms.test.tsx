import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { BankAccountForm } from "./examples/bank-account";
import { ContactDetailsForm } from "./examples/contact-details";
import { HouseholdMembersForm } from "./examples/household-members";
import { WatchLeaderDetailsForm } from "./examples/watch-leader-details";
import { MembershipApplicationSteps } from "./examples/membership-application-steps";
import { PaymentAmountForm } from "./examples/payment-amount";
import { ServerErrorsForm } from "./examples/server-errors";
import { MemberLookupForm } from "./examples/member-lookup";
import { PlannedGiftForm } from "./examples/planned-gift-field";

test("The basic form summarises errors on submit and saves once fixed", async ({ mount }) => {
  const component = await mount(<ContactDetailsForm />);
  await component.getByRole("button", { name: "Save contact details" }).click();
  const summary = component.getByRole("heading", { name: "There is a problem" });
  await expect(summary).toBeVisible();
  await expect(component.getByRole("link", { name: "Enter your full name" })).toBeVisible();
  await component.getByRole("textbox", { name: "Full name" }).fill("Aroha Ngata");
  await component.getByRole("textbox", { name: "Email" }).fill("aroha@example.org");
  await component.getByRole("radiogroup", { name: "How should we contact you?" }).getByText("Email", { exact: true }).click();
  await component.getByRole("button", { name: "Save contact details" }).click();
  await expect(component.getByRole("status")).toContainText("We'll contact Aroha Ngata by email");
});

test("Cross-field rules show alongside field errors", async ({ mount }) => {
  const component = await mount(<BankAccountForm />);
  await component.getByRole("textbox", { name: "Account number", exact: true }).fill("12-3456-7890123-00");
  await component.getByRole("textbox", { name: "Confirm account number" }).fill("12-3456-7890123-01");
  await component.getByRole("button", { name: "Save bank account" }).click();
  await expect(component.getByRole("link", { name: "Enter the name on the account" })).toBeVisible();
  await expect(component.getByRole("link", { name: "The account numbers don't match" })).toBeVisible();
  await expect(component.getByRole("textbox", { name: "Confirm account number" })).toHaveAttribute("aria-invalid", "true");
});

test("The async check says it is checking, then reports an unknown membership number", async ({ mount }) => {
  const component = await mount(<MemberLookupForm />);
  const id = component.getByRole("textbox", { name: "Member's membership number" });
  await id.fill("SQ-999-999");
  await expect(component.getByText("Checking…")).toBeVisible();
  await id.blur();
  await expect(id).toHaveAccessibleDescription("We can't find a member with that number");
  await id.fill("SQ-104-772");
  await expect(component.getByText("Aroha Ngata")).toBeVisible();
  await component.getByRole("button", { name: "Link member" }).click();
  await expect(component.getByRole("status")).toContainText("Aroha Ngata is now linked");
});

test("Server errors land on their field and in the summary", async ({ mount }) => {
  const component = await mount(<ServerErrorsForm />);
  await component.getByRole("textbox", { name: "Username" }).fill("aroha");
  await component.getByRole("textbox", { name: "Work email" }).fill("aroha@example.com");
  await component.getByRole("button", { name: "Create login" }).click();
  await expect(component.getByRole("link", { name: "That username is taken. Try another one." })).toBeVisible();
  await expect(component.getByRole("textbox", { name: "Work email" })).toHaveAccessibleDescription("Use a work email address, not a personal one");
  await component.getByRole("textbox", { name: "Username" }).fill("service-down");
  await component.getByRole("textbox", { name: "Work email" }).fill("aroha@example.org");
  await component.getByRole("button", { name: "Create login" }).click();
  await expect(component.getByText("We couldn't create your login just now.", { exact: false })).toBeVisible();
});

test("Follow-up questions appear, and are required, only when they apply", async ({ mount }) => {
  const component = await mount(<WatchLeaderDetailsForm />);
  await expect(component.getByRole("textbox", { name: "How many people join your watches?" })).toHaveCount(0);
  await component.getByText("Yes", { exact: true }).click();
  await component.getByRole("button", { name: "Continue" }).click();
  await expect(component.getByRole("link", { name: "Enter how many people join your watches, as a number" })).toBeVisible();
  await component.getByText("No", { exact: true }).click();
  await component.getByRole("button", { name: "Continue" }).click();
  await expect(component.getByRole("status")).toHaveText("No watch-leader registration needed.");
});

test("Household members can be added and removed, and each is validated", async ({ mount }) => {
  const component = await mount(<HouseholdMembersForm />);
  await component.getByRole("button", { name: "Add another household member" }).click();
  await expect(component.getByRole("group", { name: "Household member 2" })).toBeVisible();
  await component.getByRole("button", { name: "Save household members" }).click();
  await expect(component.getByRole("link", { name: "Enter the household member's full name" })).toHaveCount(2);
  await component.getByRole("button", { name: "Remove household member 2" }).click();
  await expect(component.getByRole("group", { name: "Household member 2" })).toHaveCount(0);
  const first = component.getByRole("group", { name: "Household member 1" });
  await first.getByRole("textbox", { name: "Full name" }).fill("Aroha Ngata");
  await first.getByRole("textbox", { name: "Email" }).fill("aroha@example.org");
  await component.getByRole("button", { name: "Save household members" }).click();
  await expect(component.getByRole("status")).toHaveText("Saved 1 household member.");
});

test("Multi-step: each step validates, Back keeps answers and focus moves to the new step", async ({ mount }) => {
  // Three steps of typing and validation outlast the 10s default in a busy run.
  test.slow();
  const component = await mount(<MembershipApplicationSteps />);
  await component.getByRole("button", { name: "Continue" }).click();
  await expect(component.getByRole("link", { name: "Enter your full name" })).toBeVisible();
  await component.getByRole("textbox", { name: "Full name" }).fill("Aroha Ngata");
  await component.getByRole("textbox", { name: "Postcode" }).fill("5032");
  // Let the step re-validate both answers before continuing (WebKit could
  // click first, and the step stayed put).
  await expect(component.getByRole("link", { name: "Enter your full name" })).toHaveCount(0);
  await expect(component.getByRole("link", { name: "Enter your postcode, which is 4 digits" })).toHaveCount(0);
  await component.getByRole("button", { name: "Continue" }).click();
  await expect(component.getByRole("heading", { name: "Membership details" })).toBeFocused();
  await component.getByRole("button", { name: "Back" }).click();
  await expect(component.getByRole("textbox", { name: "Full name" })).toHaveValue("Aroha Ngata");
});

test("A custom React Aria field binds to the form", async ({ mount }) => {
  const component = await mount(<PlannedGiftForm />);
  await component.getByRole("button", { name: "Check" }).click();
  await expect(component.getByRole("link", { name: "Enter your planned gift" })).toBeVisible();
  const amount = component.getByRole("textbox", { name: "Planned Swamp Fund gift in the next 12 months" });
  await amount.fill("1500");
  await amount.blur();
  await expect(amount).toHaveValue(/1,500/);
  await component.getByRole("button", { name: "Check" }).click();
  await expect(component.getByRole("status")).toHaveText("You'll be listed as a Swamp Fund patron.");
});

test("A bound CurrencyField validates the number and submits it in cents", async ({ mount }) => {
  const component = await mount(<PaymentAmountForm />);
  await component.getByRole("button", { name: "Continue" }).click();
  await expect(component.getByRole("link", { name: "Enter how much you are paying" })).toBeVisible();
  const amount = component.getByRole("textbox", { name: "Amount" });
  await amount.fill("9000");
  await amount.blur();
  await expect(amount).toHaveValue("$9,000.00");
  await expect(amount).toHaveAttribute("aria-invalid", "true");
  await expect(amount).toHaveAccessibleDescription("Enter an amount up to $148.20, what you owe");
  await amount.fill("12.5");
  await amount.blur();
  await expect(amount).toHaveValue("$12.50");
  await expect(amount).not.toHaveAttribute("aria-invalid", "true");
  await component.getByRole("button", { name: "Continue" }).click();
  await expect(component.getByRole("status")).toContainText("Paying $12.50 (1250 cents sent to the server).");
});
