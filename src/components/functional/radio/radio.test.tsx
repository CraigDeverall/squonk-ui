import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { RadioGroup } from "./radio";

test("Default render of the RadioGroup component", async ({ mount }) => {
  const component = await mount(
    <RadioGroup
      name="plan"
      legend="Choose a plan"
      value="pro"
      onChange={() => {}}
      options={[
        { value: "free", label: "Free" },
        { value: "pro", label: "Pro" },
        { value: "team", label: "Team" },
      ]}
    />
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Radio descriptions preserve group and option names", async ({ mount }) => {
  const component = await mount(<><span id="external">External guidance</span><RadioGroup name="plan" legend="Plan" aria-describedby="external" error="Choose a plan" options={[{ value: "pro", label: "Pro", helperText: "For teams" }]} /></>);
  await expect(component.getByRole("radiogroup", { name: "Plan", exact: true })).toHaveAccessibleDescription("Choose a plan External guidance");
  await expect(component.getByRole("radio", { name: "Pro", exact: true })).toHaveAccessibleDescription("For teams Choose a plan");
});

test("Arrow keys move the selection, report it and skip disabled options", async ({ mount }) => {
  const changes: string[] = [];
  const component = await mount(
    <RadioGroup
      name="size"
      legend="Size"
      value="s"
      onChange={(next) => changes.push(next)}
      options={[
        { value: "s", label: "Small" },
        { value: "m", label: "Medium", disabled: true },
        { value: "l", label: "Large" },
      ]}
    />
  );
  await expect(component).toHaveRole("radiogroup");
  await expect(component).toHaveAccessibleName("Size");
  const small = component.getByRole("radio", { name: "Small" });
  await small.focus();
  await small.press("ArrowDown");
  await expect(component.getByRole("radio", { name: "Large" })).toBeFocused();
  expect(changes).toEqual(["l"]);
  await expect(component.getByRole("radio", { name: "Medium" })).toBeDisabled();
});
