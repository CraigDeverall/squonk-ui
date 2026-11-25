import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Checkbox } from "./checkbox";

test("Default render of the Checkbox component", async ({ mount }) => {
  const component = await mount(
    <Checkbox label="Send me product updates" checked={true} onChange={() => {}} />
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Uncontrolled checkbox appearance follows native value and form reset", async ({ mount }) => {
  const component = await mount(<form><Checkbox label="Preference" defaultChecked /><button type="reset">Reset</button></form>);
  const input = component.getByRole("checkbox", { name: "Preference", exact: true });
  const control = component.locator("label > [aria-hidden=true]");
  const appearance = () => control.evaluate(el => getComputedStyle(el).backgroundColor);
  await expect(input).toBeChecked();
  const onColor = await appearance();
  await input.focus();
  await input.press("Space");
  await expect(input).not.toBeChecked();
  await expect.poll(appearance).not.toBe(onColor);
  await component.getByRole("button", { name: "Reset" }).click();
  await expect(input).toBeChecked();
  await expect.poll(appearance).toBe(onColor);
});

test("Checkbox keeps label and external/helper descriptions separate", async ({ mount }) => {
  const component = await mount(<><span id="external">Additional context</span><Checkbox label="Preference" helperText="Can change later" aria-describedby="external" /></>);
  const input = component.getByRole("checkbox", { name: "Preference", exact: true });
  await expect(input).toHaveAccessibleDescription("Can change later Additional context");
});

test("Controlled and indeterminate Checkbox states follow native semantics", async ({ mount }) => {
  const component = await mount(<Checkbox label="All" checked={false} indeterminate onChange={() => {}} />);
  const input = component.getByRole("checkbox", { name: "All" });
  await expect(input).toHaveJSProperty("indeterminate", true);
  await expect(component.locator("[data-check-dash]")).toHaveCSS("display", "inline");
  await expect(component.locator("[data-check-tick]")).toHaveCSS("display", "none");
  await component.update(<Checkbox label="All" checked indeterminate={false} onChange={() => {}} />);
  await expect(input).toBeChecked();
  await expect(component.locator("[data-check-tick]")).toHaveCSS("display", "inline");
  await expect(component.locator("[data-check-dash]")).toHaveCSS("display", "none");
});

test("Keyboard toggles the checkbox, reports the new state and respects disabled and error states", async ({ mount }) => {
  const changes: boolean[] = [];
  const component = await mount(
    <div>
      <Checkbox label="Updates" onChange={(checked) => changes.push(checked)} />
      <Checkbox label="Locked" disabled />
      <Checkbox label="Terms" error="Accept the terms to continue" />
    </div>
  );
  const updates = component.getByRole("checkbox", { name: "Updates" });
  await updates.focus();
  await updates.press("Space");
  await expect(updates).toBeChecked();
  expect(changes).toEqual([true]);
  await expect(component.locator("label").first()).toHaveAttribute("data-focus-visible");

  const locked = component.getByRole("checkbox", { name: "Locked" });
  await expect(locked).toBeDisabled();
  await component.getByText("Locked").click({ force: true });
  await expect(locked).not.toBeChecked();

  const terms = component.getByRole("checkbox", { name: "Terms" });
  await expect(terms).toHaveAttribute("aria-invalid", "true");
  await expect(terms).toHaveAccessibleDescription("Accept the terms to continue");
});

test("An aria-label wins over the visible label, and an unlabeled checkbox takes it as its name", async ({ mount }) => {
  const component = await mount(
    <div>
      <Checkbox label="Visible" aria-label="Override" />
      <Checkbox aria-label="Select row" />
    </div>
  );
  await expect(component.getByRole("checkbox", { name: "Override", exact: true })).toHaveCount(1);
  await expect(component.getByRole("checkbox", { name: "Select row", exact: true })).toHaveCount(1);
});

test("Ticking responds instantly, and unticking fades", async ({ mount, page }) => {
  const component = await mount(<Checkbox label="Updates" defaultChecked={false} />);
  const control = component.locator("label > [aria-hidden=true]");
  const duration = () => control.evaluate((el) => getComputedStyle(el).transitionDuration.split(",")[0].trim());
  expect(await duration()).toBe("0.165s");
  await component.getByText("Updates").click();
  await page.mouse.move(0, 0);
  // Ticked: the selected state keeps the instant timing even off hover.
  await expect.poll(duration).toBe("0s");
  await component.getByText("Updates").click();
  await page.mouse.move(0, 0);
  await expect.poll(duration).toBe("0.165s");
});
