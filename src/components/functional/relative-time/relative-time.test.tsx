import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { RelativeTime } from "./relative-time";
import { BylineHarness, LiveHarness } from "./relative-time.harness";

for (const mode of ["light", "dark"] as const) {
  test(`Renders RelativeTime in a byline (${mode})`, async ({ mount }) => {
    const component = await mount(<BylineHarness mode={mode} />);
    await expect(component.getByText("5 minutes ago")).toBeVisible();
    await expect(await component.screenshot()).toMatchSnapshot();
  });
}

test("RelativeTime keyboard: names the full date, opens it on Enter and Escape returns focus", async ({ mount, page }) => {
  await mount(<BylineHarness />);
  const time = page.getByRole("button", { name: /^2 hours ago, / });
  // The hour follows the browser's time zone, so only the date is checked.
  await expect(time).toHaveAccessibleName(/^2 hours ago, \w+day, 1\d November 2026 at /);
  await expect(time.locator("time")).toHaveAttribute("datetime", "2026-11-13T09:55:00.000Z");
  await time.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toContainText(/November 2026 at /);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(time).toBeFocused();
});

test("RelativeTime shows a value it cannot read as it was given", async ({ mount }) => {
  const component = await mount(<RelativeTime value="not a date" />);
  await expect(component).toHaveText("not a date");
  await expect(component.getByRole("button")).toHaveCount(0);
});

test("RelativeTime timer: the words keep up with the clock", async ({ mount, page }) => {
  await page.clock.install({ time: new Date("2026-11-13T12:00:00Z") });
  const component = await mount(<LiveHarness minutesAgo={30} />);
  await expect(component.getByText("30 minutes ago")).toBeVisible();
  await page.clock.fastForward("05:00");
  await expect(component.getByText("35 minutes ago")).toBeVisible();
  // Past the hour it checks less often, and still moves on.
  await page.clock.fastForward("40:00");
  await expect(component.getByText("1 hour ago")).toBeVisible();
});
