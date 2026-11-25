import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import type { Page } from "playwright";
import { DuesInstalmentPlan } from "./dues-instalment-plan";
import { settleAnimations } from "../../test-setup/animations";

const chooseOption = async (page: Page, label: string, option: string) => {
  await page.getByRole("button", { name: new RegExp(label) }).click();
  await page.getByRole("option", { name: option }).click();
};

test("Renders an instalment plan with its schedule", async ({ mount, page }) => {
  // Tall enough that nothing scrolls, so the sticky header stays at the top.
  await page.setViewportSize({ width: 1280, height: 1640 });
  await mount(<DuesInstalmentPlan />);
  await page.getByText("Pay in instalments").click();
  await chooseOption(page, "How often", "Monthly");
  await chooseOption(page, "Number of payments", "6 payments");
  await page.getByLabel("First payment").fill("2026-11-20");
  // Leave the field, so its focus ring and selection can't vary between runs.
  await page.getByLabel("First payment").blur();
  await expect(page.getByRole("table", { name: "Instalment schedule" })).toBeVisible();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await settleAnimations(page);
  // Filling a field can scroll the page; the sticky header follows the scroll.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(await page.screenshot({ fullPage: true })).toMatchSnapshot();
});

test("Instalments need a frequency, count and start within 30 days; then confirm", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<DuesInstalmentPlan />);
  await page.getByText("Pay in instalments").click();
  await page.getByRole("button", { name: "Continue" }).click();
  const summary = page.locator("[aria-labelledby$=error-summary]");
  await expect(summary.getByRole("link")).toHaveText(["Choose how often you'll pay", "Choose how many payments", "Enter the date of your first payment"]);
  await chooseOption(page, "How often", "Fortnightly");
  await chooseOption(page, "Number of payments", "4 payments");
  await page.getByLabel("First payment").fill("2027-01-10");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(summary.getByRole("link")).toHaveText(["Your first payment must be within 30 days, by 3 December 2026"]);
  await page.getByLabel("First payment").fill("2026-11-20");
  await expect(page.getByRole("table", { name: "Instalment schedule" }).getByRole("row")).toHaveCount(5);
  await page.getByRole("button", { name: "Continue" }).click();
  const confirm = page.getByRole("dialog", { name: "Set up this plan?" });
  await expect(confirm).toContainText("4 fortnightly payments, starting 20 Nov 2026");
  await confirm.getByRole("button", { name: "Set up plan" }).click();
  await expect(page.getByText(/Your first payment of \$[\d,.]+ is due on 20 Nov 2026/).first()).toBeVisible();
});
