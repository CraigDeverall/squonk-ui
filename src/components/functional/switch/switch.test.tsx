import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Switch } from "./switch";

test("Default render of the Switch component", async ({ mount }) => {
  const component = await mount(
    <Switch label="Email notifications" checked={true} onChange={() => {}} />
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Uncontrolled switch appearance follows native value and form reset", async ({ mount }) => {
  const component = await mount(<form><Switch label="Preference" defaultChecked /><button type="reset">Reset</button></form>);
  const input = component.getByRole("switch", { name: "Preference", exact: true });
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

test("Switch keeps label and external/helper descriptions separate", async ({ mount }) => {
  const component = await mount(<><span id="external">Additional context</span><Switch label="Preference" helperText="Can change later" aria-describedby="external" /></>);
  const input = component.getByRole("switch", { name: "Preference", exact: true });
  await expect(input).toHaveAccessibleDescription("Can change later Additional context");
});

test("Keyboard toggles the switch and reports the new state; disabled switches ignore input", async ({ mount }) => {
  const changes: boolean[] = [];
  const component = await mount(
    <div>
      <Switch label="Dark mode" onChange={(checked) => changes.push(checked)} />
      <Switch label="Locked" disabled />
    </div>
  );
  const dark = component.getByRole("switch", { name: "Dark mode" });
  await dark.focus();
  await dark.press("Space");
  await expect(dark).toBeChecked();
  expect(changes).toEqual([true]);
  await expect(component.locator("label").first()).toHaveAttribute("data-focus-visible");
  await expect(component.getByRole("switch", { name: "Locked" })).toBeDisabled();
});
