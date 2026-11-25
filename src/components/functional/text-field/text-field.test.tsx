import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { TextField } from "./text-field";

// when updating the snapshot, add .only so that you don"t update the snapshot for all tests, then run npm run test:update
test("Renders the TextField", async ({ mount }) => {
  const component = await mount(<TextField placeholder={"placeholder"} />);
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("TextField preserves names and merges validation descriptions", async ({ mount }) => {
  const component = await mount(<><span id="external">External guidance</span><TextField label="Field" helperText="Helpful hint" aria-describedby="external" /></>);
  const field = component.getByRole("textbox", { name: "Field", exact: true });
  await expect(field).toHaveAccessibleDescription("Helpful hint External guidance");
  await component.update(<><span id="external">External guidance</span><TextField label="Field" aria-label="Custom name" helperText="Helpful hint" error="Required" aria-describedby="external" /></>);
  const invalid = component.getByRole("textbox", { name: "Custom name Field", exact: true });
  await expect(invalid).toHaveAttribute("aria-invalid", "true");
  await expect(invalid).toHaveAccessibleDescription("Required External guidance");
});

test("The label focuses the input, and required, disabled and errors reach it", async ({ mount }) => {
  const component = await mount(
    <div>
      <TextField label="Email" required />
      <TextField label="Account" disabled />
      <TextField label="Name" error="Enter your name" />
    </div>
  );
  await component.getByText("Email").click();
  const email = component.getByRole("textbox", { name: "Email" });
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("required", "");
  await expect(component.getByRole("textbox", { name: "Account" })).toBeDisabled();
  await expect(component.getByText("Enter your name")).toHaveAttribute("aria-live", "polite");
});
