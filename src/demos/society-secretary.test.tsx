import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SocietySecretary } from "./society-secretary";
import { settleAnimations } from "../../test-setup/animations";

test("Renders the work queue", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1400 });
  await mount(<SocietySecretary />);
  await expect(page.getByRole("grid", { name: "My cases" })).toBeVisible();
  // Finish the arrivals first, so the capture never lands mid-animation.
  await expect(await page.screenshot({ fullPage: true, animations: "disabled" })).toMatchSnapshot();
});

test("Search, filters as tags, the empty state and clearing", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<SocietySecretary />);
  await page.getByRole("tab", { name: /Team/ }).click();
  const panel = page.getByRole("tabpanel", { name: /Team/ });
  await panel.getByRole("button", { name: /Filters/ }).click();
  const filters = page.getByRole("dialog", { name: "Filter cases" });
  await filters.getByText("Escalated").click();
  await page.keyboard.press("Escape");
  await expect(panel.getByRole("button", { name: "Remove Escalated" })).toBeVisible();
  await panel.getByRole("searchbox", { name: "Search cases" }).fill("zzz");
  await expect(panel.getByText("No cases match")).toBeVisible();
  await panel.getByRole("button", { name: "Clear search and filters" }).click();
  await expect(panel.getByRole("grid", { name: "Team cases" })).toBeVisible();
});

test("Bulk-select cases and close them; open a case and record a decision", async ({ mount, page }) => {
  // A long flow through three overlays: more than the default 10s under load.
  test.slow();
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<SocietySecretary />);
  const table = page.getByRole("grid", { name: "My cases" });
  await table.getByRole("checkbox").nth(1).check({ force: true });
  await expect(page.getByRole("region", { name: "Selected cases" })).toContainText("1 selected");
  await page.getByRole("button", { name: "Close cases" }).click();
  await page.getByRole("dialog", { name: "Close 1 cases?" }).getByRole("button", { name: "Close cases" }).click();
  await expect(page.getByText("1 cases closed.")).toBeVisible();

  const first = table.locator("tbody tr").first().getByRole("button");
  const customer = (await first.textContent())!;
  await first.click();
  const drawer = page.getByRole("dialog", { name: customer });
  await settleAnimations(page);
  await drawer.getByRole("button", { name: /Decision/ }).click();
  await page.getByRole("option", { name: /Offer a dues instalment plan/ }).click();
  await drawer.getByRole("button", { name: "Record decision" }).click();
  await page.getByRole("dialog", { name: "Record this decision?" }).getByRole("button", { name: "Record decision" }).click();
  await expect(page.getByText(`Decision recorded for ${customer}.`)).toBeVisible();
});
