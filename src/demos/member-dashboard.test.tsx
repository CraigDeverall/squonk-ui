import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { MemberDashboard } from "./member-dashboard";

test("Renders the member dashboard", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<MemberDashboard />);
  await expect(page.getByRole("heading", { level: 1, name: "Kia ora, Aroha" })).toBeVisible();
  await expect(await page.screenshot({ fullPage: true, animations: "disabled" })).toMatchSnapshot();
});

test("Paying from a row's menu validates, submits and confirms with a toast", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<MemberDashboard />);
  await page.getByRole("button", { name: "Actions for Annual dues" }).click();
  await page.getByRole("menuitem", { name: "Make a payment" }).click();
  const dialog = page.getByRole("dialog", { name: "Make a payment" });
  await dialog.getByRole("button", { name: "Continue to payment" }).click();
  await expect(dialog.getByRole("link", { name: "Enter how much you are paying" })).toBeVisible();
  await dialog.getByRole("textbox", { name: "Amount" }).fill("50");
  await dialog.getByText("Internet banking").click();
  await dialog.getByRole("button", { name: "Continue to payment" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("$50.00 towards Annual dues will show within 2 working days.")).toBeVisible();
});

test("Sightings filter by tag and status; activity loads as it scrolls", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<MemberDashboard />);
  await page.getByRole("tab", { name: /Sightings/ }).click();
  await page.getByRole("button", { name: "Remove Tear pool" }).click();
  await expect(page.getByRole("table", { name: "Logged sightings" }).getByRole("cell", { name: "Tear pool", exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Activity" }).click();
  const feed = page.getByRole("feed", { name: "Account activity" });
  await expect(feed.getByRole("article")).toHaveCount(10);
  await feed.getByRole("article").last().scrollIntoViewIfNeeded();
  await expect(feed.getByRole("article")).toHaveCount(20);
});

test("On a phone the navigation moves into a drawer", async ({ mount, page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await mount(<MemberDashboard />);
  await expect(page.getByRole("navigation", { name: "Account" })).toBeHidden();
  await page.getByRole("button", { name: "Open menu" }).click();
  const drawer = page.getByRole("dialog", { name: "Waikato Chapter" });
  await expect(drawer.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
});
