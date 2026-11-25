import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { JoinTheSociety } from "./join-the-society";

test("Renders the application form", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<JoinTheSociety />);
  await expect(page.getByRole("heading", { level: 1, name: "Join the Society" })).toBeVisible();
  // Finish the arrivals first, so the capture never lands mid-animation.
  await expect(await page.screenshot({ fullPage: true, animations: "disabled" })).toMatchSnapshot();
});

test("Conditional questions, the error summary, review and application", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<JoinTheSociety />);
  const form = page.getByRole("form", { name: "Join the Society" });
  await form.getByRole("button", { name: "Review application" }).click();
  await expect(form.locator("[aria-labelledby$=error-summary]")).toBeFocused();
  await expect(form.locator("[aria-labelledby$=error-summary]").getByRole("link")).toHaveCount(9);

  await form.getByRole("textbox", { name: "Full name" }).fill("Aroha Ngata");
  await form.getByText("Wanderer", { exact: true }).click();
  await form.getByRole("combobox", { name: "Main interest" }).fill("INT-02");
  await expect(page.getByRole("option", { name: /Tear-pool mapping/ })).toHaveAttribute("data-focused");
  await page.keyboard.press("Enter");
  await form.getByLabel("Date you started watching").fill("2026-04-01");
  await form.getByRole("textbox", { name: "Contact name" }).fill("Aroha Ngata");
  await form.getByRole("textbox", { name: "Email" }).fill("aroha@example.org");
  await form.getByRole("textbox", { name: "Phone" }).fill("04 555 0192");
  // Scroll first: React Aria closes an open list when the page scrolls,
  // and fill's own scroll-into-view can land just after the list opens.
  await form.getByRole("combobox", { name: "Chapter" }).scrollIntoViewIfNeeded();
  await form.getByRole("combobox", { name: "Chapter" }).fill("wellin");
  await expect(page.getByRole("option", { name: "Wellington Chapter" })).toHaveAttribute("data-focused");
  await page.keyboard.press("Enter");
  await form.getByText("Night-watch kit hire", { exact: true }).click();
  const kits = form.getByRole("textbox", { name: "How many kits do you need?" });
  await expect(kits).toBeVisible();
  await form.getByRole("button", { name: "Review application" }).click();
  await expect(kits).toHaveAccessibleDescription("Enter how many kits you need, as a number");
  await kits.fill("6");
  await form.getByRole("button", { name: "Review application" }).click();

  const review = page.getByRole("dialog", { name: "Check your application" });
  await expect(review.getByText("Tear-pool mapping")).toBeVisible();
  await review.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText("APP-2026-118204")).toBeVisible();
});
