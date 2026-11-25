import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { CheckboxGroup } from "./checkbox-group";

const options = [
  { value: "dues", label: "Annual dues", helperText: "Payable by every member." },
  { value: "levy", label: "Swamp Fund levy" },
  { value: "kit", label: "Night-watch kit hire" },
  { value: "deposit", label: "Field-trip deposit", disabled: true },
];

test("Renders the CheckboxGroup with a selection and an error", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 360, display: "grid", gap: 24, padding: 4 }}>
      <CheckboxGroup legend="Accounts" helperText="Choose all that apply." options={options} defaultValue={["dues"]} />
      <CheckboxGroup legend="Accounts" error="Choose at least one." options={options.slice(0, 2)} />
    </div>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Space toggles options and onChange reports the whole selection", async ({ mount, page }) => {
  const changes: string[][] = [];
  await mount(<CheckboxGroup legend="Accounts" options={options} onChange={(value) => changes.push(value)} />);
  await expect(page.getByRole("group", { name: "Accounts" })).toBeVisible();
  const dues = page.getByRole("checkbox", { name: "Annual dues" });
  await dues.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("checkbox", { name: "Swamp Fund levy" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect.poll(() => changes).toEqual([["dues"], ["dues", "levy"]]);
  await expect(dues).toHaveAccessibleDescription("Payable by every member.");
  await expect(page.getByRole("checkbox", { name: "Field-trip deposit" })).toBeDisabled();
});

test("Checked options submit under the shared name", async ({ mount, page }) => {
  await mount(
    <form id="f">
      <CheckboxGroup legend="Accounts" name="accounts" options={options} defaultValue={["levy", "kit"]} />
    </form>
  );
  const submitted = await page.evaluate(() => new FormData(document.getElementById("f") as HTMLFormElement).getAll("accounts"));
  expect(submitted).toEqual(["levy", "kit"]);
});

test("max disables the rest once reached; error invalidates every option", async ({ mount, page }) => {
  await mount(
    <div>
      <CheckboxGroup legend="Days" max={2} options={options.slice(0, 3)} defaultValue={["dues", "levy"]} />
      <CheckboxGroup legend="Required" error="Choose at least one." options={[{ value: "a", label: "Alpha" }]} />
    </div>
  );
  await expect(page.getByRole("checkbox", { name: "Night-watch kit hire" })).toBeDisabled();
  await page.getByText("Swamp Fund levy", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Swamp Fund levy" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Night-watch kit hire" })).toBeEnabled();
  await expect(page.getByRole("group", { name: "Required" })).toHaveAccessibleDescription("Choose at least one.");
  await expect(page.getByRole("checkbox", { name: "Alpha" })).toHaveAttribute("aria-invalid", "true");
});
