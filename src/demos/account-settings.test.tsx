import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { AccountSettings } from "./account-settings";

test("Renders the account settings", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<AccountSettings />);
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  // Wait for the devices to finish loading, so the snapshot is stable.
  await expect(page.getByRole("list", { name: "Signed-in devices" })).toBeVisible();
  // Finish the arrivals first, so the capture never lands mid-animation.
  await expect(await page.screenshot({ fullPage: true, animations: "disabled" })).toMatchSnapshot();
});

test("Contact details validate, then save with a toast", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<AccountSettings />);
  const form = page.getByRole("form", { name: "Contact details" });
  await form.getByRole("textbox", { name: "Postcode" }).fill("50");
  await form.getByRole("button", { name: "Save contact details" }).click();
  await expect(form.getByRole("textbox", { name: "Postcode" })).toHaveAccessibleDescription(/Enter a 4-digit postcode/);
  await form.getByRole("textbox", { name: "Postcode" }).fill("5032");
  await form.getByRole("button", { name: "Save contact details" }).click();
  await expect(page.getByText("We'll use these details from now on.")).toBeVisible();
});

test("A switch saves as it changes, and moves back when saving fails", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<AccountSettings />);
  const sms = page.getByRole("switch", { name: "Text message reminders" });
  await sms.focus();
  await sms.press("Space");
  await expect(sms).toBeChecked();
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  const newsletter = page.getByRole("switch", { name: "Newsletter" });
  await newsletter.focus();
  await newsletter.press("Space");
  await expect(page.getByText("Couldn't save. Nothing changed; try again later.")).toBeVisible();
  await expect(newsletter).not.toBeChecked();
});

test("Signing out a device and leaving the online portal", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<AccountSettings />);
  await page.getByRole("button", { name: "Actions for Safari on iPhone" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByText("Safari on iPhone has been signed out.")).toBeVisible();
  await page.getByRole("button", { name: "Stop using the portal" }).click();
  const dialog = page.getByRole("dialog", { name: /Stop using the portal for/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Keep using the portal" }).click();
  await expect(dialog).toBeHidden();
});

test("Signing out every device on the last page moves back to the page before", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<AccountSettings />);
  const devices = page.getByRole("list", { name: "Signed-in devices" });
  await expect(devices).toBeVisible();
  await page.getByRole("button", { name: "Page 2, last page" }).click();
  for (const device of ["Edge on Windows", "Safari on iPad"]) {
    await page.getByRole("button", { name: `Actions for ${device}` }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
  }
  await expect(devices.getByText("Chrome on Windows")).toBeVisible();
  await expect(devices.getByRole("listitem")).toHaveCount(4);
});
