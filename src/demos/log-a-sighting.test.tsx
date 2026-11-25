import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { LogASighting } from "./log-a-sighting";

test("Renders the sighting report", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<LogASighting />);
  await page.getByRole("textbox", { name: "Estimated tear volume (mL)" }).fill("480");
  await page.getByRole("textbox", { name: "Measured with a sampler (mL)" }).fill("350");
  // Leave the field, so its focus ring can't vary between runs.
  await page.getByRole("textbox", { name: "Measured with a sampler (mL)" }).blur();
  await expect(page.getByText("Volume to record")).toBeVisible();
  // Finish the fields' feedback fades first, so the capture never lands mid-transition.
  await expect(await page.screenshot({ fullPage: true, animations: "disabled" })).toMatchSnapshot();
});

test("The summary follows the volumes; logging confirms first", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<LogASighting />);
  const calc = page.getByRole("complementary", { name: "Calculation" });
  await page.getByRole("textbox", { name: "Place" }).fill("Pureora hemlock stand");
  await page.getByLabel("Date of the sighting").fill("2026-11-02");
  await page.getByText("Tear trail", { exact: true }).click();
  await page.getByText("30 to 60 cm", { exact: true }).click();
  await page.getByRole("textbox", { name: "Estimated tear volume (mL)" }).fill("480");
  await page.getByRole("textbox", { name: "Remove from earlier reports (mL)" }).fill("120");
  await page.getByRole("textbox", { name: "Remove from earlier reports (mL)" }).blur();
  await expect(calc.getByText("360 mL")).toBeVisible();
  await page.getByRole("textbox", { name: "Measured with a sampler (mL)" }).fill("600");
  await page.getByRole("button", { name: "Log sighting" }).click();
  await expect(page.getByRole("link", { name: "Measured volume can't be more than your estimated tear volume" })).toBeVisible();
  await page.getByRole("textbox", { name: "Measured with a sampler (mL)" }).fill("");
  await page.getByText("No squonk was chased, cornered or captured", { exact: false }).click();
  await page.getByRole("button", { name: "Log sighting" }).click();
  const confirm = page.getByRole("dialog", { name: "Log this sighting?" });
  await expect(confirm).toContainText("We'll record 360 mL of tear volume.");
  await confirm.getByRole("button", { name: "Log sighting" }).click();
  await expect(page.getByText("SQ-2026-10-58213")).toBeVisible();
});

test("Keyboard: term help shows in a tooltip on focus", async ({ mount, page }) => {
  await mount(<LogASighting />);
  await page.getByRole("button", { name: "About corrections" }).focus();
  await expect(page.getByRole("tooltip")).toContainText("Changes to reports you've already logged");
});
