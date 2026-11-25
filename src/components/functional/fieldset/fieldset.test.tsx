import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Fieldset } from "./fieldset";
import { TextField } from "../text-field/text-field";
import { Checkbox } from "../checkbox/checkbox";

test("Renders a Fieldset with helper text and an error", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 360, display: "grid", gap: 24, padding: 4 }}>
      <Fieldset legend="Postal address" helperText="Where we send newsletters.">
        <TextField label="Street address" />
        <TextField label="Postcode" />
      </Fieldset>
      <Fieldset legend="How should we contact you?" error="Enter an email address or a phone number.">
        <TextField label="Email" />
      </Fieldset>
    </div>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("The legend names the group and helper and error text describe it", async ({ mount, page }) => {
  await mount(
    <Fieldset legend="Contact" helperText="Give at least one." error="Enter an email or phone.">
      <TextField label="Email" />
    </Fieldset>
  );
  const group = page.getByRole("group", { name: "Contact" });
  await expect(group).toBeVisible();
  await expect(group).toHaveAccessibleDescription("Enter an email or phone. Give at least one.");
});

test("disabled reaches every field inside, and hideLegend keeps the name", async ({ mount, page }) => {
  await mount(
    <Fieldset legend="Managed address" hideLegend disabled>
      <TextField label="Street address" />
      <Checkbox label="Same as business address" />
      <button type="button">Native</button>
    </Fieldset>
  );
  await expect(page.getByRole("group", { name: "Managed address" })).toBeVisible();
  await expect(page.getByText("Managed address")).toHaveCSS("clip-path", "inset(50%)");
  await expect(page.getByRole("textbox", { name: "Street address" })).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: "Same as business address" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Native" })).toBeDisabled();
});
