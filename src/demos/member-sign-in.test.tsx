import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { MemberSignIn } from "./member-sign-in";

test("Renders the sign-in page", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1024, height: 960 });
  await mount(<MemberSignIn />);
  await expect(page.getByRole("heading", { level: 1, name: "Squonk Society" })).toBeVisible();
  // Finish the arrivals first, so the capture never lands mid-animation.
  await expect(await page.screenshot({ fullPage: true, animations: "disabled" })).toMatchSnapshot();
});

test("Validates the membership number, reports a wrong password on its field, then signs in", async ({ mount, page }) => {
  await mount(<MemberSignIn />);
  await page.getByRole("tab", { name: "Household" }).click();
  const panel = page.getByRole("tabpanel", { name: "Household" });
  const id = panel.getByRole("textbox", { name: "Household membership number" });
  const password = panel.getByLabel("Password");
  await id.fill("12345");
  await panel.getByRole("button", { name: "Sign in" }).click();
  await expect(panel.getByRole("link", { name: /membership number like SQ-104-772/ })).toBeVisible();
  await id.fill("SQ-104-772");
  await password.fill("wrong");
  await panel.getByRole("button", { name: "Sign in" }).click();
  await expect(password).toHaveAccessibleDescription(/doesn't match/);
  await password.fill("correct horse");
  await panel.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Welcome back, SQ-104-772.", { exact: false })).toBeVisible();
});

test("Keyboard: the ID help opens in a popover", async ({ mount, page }) => {
  await mount(<MemberSignIn />);
  await page.getByRole("button", { name: "Where to find your membership number" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Where to find your membership number" })).toBeVisible();
});
