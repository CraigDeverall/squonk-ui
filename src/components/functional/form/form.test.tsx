import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { RegistrationForm } from "./form.harness";

test("Renders the error summary and field errors after a failed submit", async ({ mount, page }) => {
  await page.setViewportSize({ width: 560, height: 1100 });
  const component = await mount(<RegistrationForm />);
  await component.getByRole("button", { name: "Join" }).click();
  await expect(page.locator("[aria-labelledby$=error-summary]")).toBeFocused();
  // Finish the button's and fields' feedback fades first, so the capture never
  // lands mid-transition.
  await expect(await component.screenshot({ animations: "disabled" })).toMatchSnapshot();
});

test("A field's error shows after it is left, not while typing", async ({ mount, page }) => {
  await mount(<RegistrationForm />);
  const email = page.getByRole("textbox", { name: "Email" });
  await email.fill("not-an-email");
  await expect(email).not.toHaveAttribute("aria-invalid", "true");
  await email.blur();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAccessibleDescription(/Enter an email address in the right format/);
  await email.fill("aroha@example.co.nz");
  await expect(email).not.toHaveAttribute("aria-invalid", "true");
});

test("Keyboard: the summary takes focus and its links move focus to each field", async ({ mount, page }) => {
  await mount(<RegistrationForm />);
  await page.getByRole("button", { name: "Join" }).click();
  const summary = page.locator("[aria-labelledby$=error-summary]");
  await expect(summary).toBeFocused();
  const links = summary.getByRole("link");
  await expect(links).toHaveText([
    "Enter your full name",
    "Enter an email address in the right format, like name@example.co.nz",
    "Choose at least one account to set up",
    "Choose how often you will pay your dues",
    "Choose your chapter",
    "Confirm the information is correct",
  ]);
  await links.nth(0).click();
  await expect(page.getByRole("textbox", { name: "Full name" })).toBeFocused();
  await links.nth(2).click();
  await expect(page.getByRole("checkbox", { name: "Annual dues" })).toBeFocused();
  await links.nth(4).click();
  await expect(page.getByRole("combobox", { name: "Chapter" })).toBeFocused();
});

test("Fixing everything submits; a server error lands on its field", async ({ mount, page }) => {
  await mount(<RegistrationForm />);
  await page.getByRole("textbox", { name: "Full name" }).fill("Aroha Ngata");
  await page.getByRole("textbox", { name: "Email" }).fill("taken@example.co.nz");
  await page.getByText("Annual dues", { exact: true }).click();
  await page.getByText("Every two months").click();
  await page.getByRole("combobox", { name: "Chapter" }).fill("welli");
  // Enter chooses the highlighted match; wait for the filtered list to highlight it.
  await expect(page.getByRole("option", { name: "Wellington" })).toHaveAttribute("data-focused");
  await page.keyboard.press("Enter");
  await page.getByText("The information I've given is correct").click();
  await page.getByRole("button", { name: "Join" }).click();
  const email = page.getByRole("textbox", { name: "Email" });
  await expect(email).toHaveAccessibleDescription(/already belongs to a member/);
  await expect(page.getByRole("link", { name: /already belongs to a member/ })).toBeVisible();
  await email.fill("aroha@example.org");
  await page.getByRole("button", { name: "Join" }).click();
  await expect(page.getByRole("status")).toHaveText("Welcome to the Society, Aroha Ngata. Accounts: dues.");
  await expect(page.getByRole("heading", { name: "There is a problem" })).toHaveCount(0);
});
