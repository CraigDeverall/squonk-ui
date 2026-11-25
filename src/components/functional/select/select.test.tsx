import type {} from "./select.typecheck";
import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Select } from "./select";
import { settleAnimations } from "../../../../test-setup/animations";
import { MultiInForm, MultiServerSearch, SearchableInForm } from "./select.harness";

// when updating the snapshot, add .only so that you don"t update the snapshot for all tests, then run npm run test:update
test("Renders the Select", async ({ mount }) => {
  const component = await mount(
    <Select
      label="Promote from"
      placeholder="Pick an upstream env…"
      options={[
        { value: "staging", label: "staging (← develop)" },
        { value: "production", label: "production (← staging)" },
      ]}
    />
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Select preserves names and merges validation descriptions", async ({ mount }) => {
  const component = await mount(<><span id="external">External guidance</span><Select options={[{ value: "one", label: "One" }]} label="Field" helperText="Helpful hint" aria-describedby="external" /></>);
  // The list trigger is a button named by its value and the label.
  const field = component.getByRole("button", { name: "Field", exact: true });
  await expect(field).toHaveAccessibleDescription("Helpful hint External guidance");
  await component.update(<><span id="external">External guidance</span><Select options={[{ value: "one", label: "One" }]} label="Field" aria-label="Custom name" helperText="Helpful hint" error="Required" aria-describedby="external" /></>);
  const invalid = component.getByRole("button", { name: "Custom name Field", exact: true });
  await expect(invalid).toHaveAccessibleDescription("Required External guidance");
});

const environments = [
  { value: "dev", label: "Development" },
  { value: "staging", label: "Staging", disabled: true },
  { value: "prod", label: "Production" },
];

test("Keyboard opens the listbox, skips disabled options, selects and returns focus", async ({ mount, page }) => {
  const changes: string[] = [];
  const component = await mount(
    <form>
      <Select label="Environment" name="env" placeholder="Pick one" options={environments} onChange={(v) => changes.push(v)} />
    </form>
  );
  const trigger = component.getByRole("button", { name: /Environment/ });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  // Focus moves to the first option a frame after the list opens.
  await expect(page.getByRole("option", { name: "Development" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { name: "Production" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(listbox).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveText("Production");
  expect(changes).toEqual(["prod"]);
  await expect.poll(() => component.evaluate((form: HTMLFormElement) => new FormData(form).get("env"))).toBe("prod");
});

test("The open listbox renders its options", async ({ mount, page }) => {
  const component = await mount(<Select label="Environment" defaultValue="dev" options={environments} />);
  await component.getByRole("button", { name: /Environment/ }).click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { name: "Development" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("option", { name: "Staging" })).toHaveAttribute("aria-disabled", "true");
  await settleAnimations(page);
  await expect(await page.screenshot()).toMatchSnapshot();
});

// Searchable mode (React Aria's ComboBox).
const offices = [
  { value: "akl", label: "Auckland", description: "Takapuna, Manukau" },
  { value: "wlg", label: "Wellington", description: "Head office" },
  { value: "chc", label: "Christchurch", description: "Canterbury" },
  { value: "dud", label: "Dunedin", description: "Otago" },
  { value: "nsn", label: "Nelson", disabled: true },
];

test("Renders a searchable Select with filtered options", async ({ mount, page }) => {
  await page.setViewportSize({ width: 420, height: 300 });
  await mount(
    <div style={{ width: 360, padding: 8 }}>
      <Select searchable label="Nearest office" options={offices} placeholder="Town or region" />
    </div>
  );
  await page.getByRole("combobox", { name: "Nearest office" }).fill("ch");
  await expect(page.getByRole("option")).toHaveCount(1);
  await settleAnimations(page);
  await expect(await page.screenshot()).toMatchSnapshot();
});

test("Searchable: typing filters by label and description; Enter chooses the highlighted option", async ({ mount, page }) => {
  const changes: string[] = [];
  await mount(<Select searchable label="Office" options={offices} onChange={(v) => changes.push(v)} />);
  const input = page.getByRole("combobox", { name: "Office" });
  await input.fill("otago");
  await expect(page.getByRole("option")).toHaveText(["DunedinOtago"]);
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("Dunedin");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect.poll(() => changes).toEqual(["dud"]);
});

test("Searchable: arrow keys move through options, skipping disabled; Escape closes", async ({ mount, page }) => {
  await mount(<Select searchable label="Office" options={offices} />);
  const input = page.getByRole("combobox", { name: "Office" });
  await input.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(input).toHaveAttribute("aria-expanded", "true");
  // ArrowDown opens on the first option; wait for that before moving.
  await expect(page.getByRole("option", { name: "Auckland" })).toHaveAttribute("data-focused");
  for (const office of ["Wellington", "Christchurch", "Dunedin"]) {
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", { name: office })).toHaveAttribute("data-focused");
  }
  // Nelson, the last option, is disabled: the highlight stays on Dunedin.
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { name: "Dunedin" })).toHaveAttribute("data-focused");
  await expect(page.getByRole("option", { name: "Nelson" })).not.toHaveAttribute("data-focused");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(input).toBeFocused();
});

test("Searchable: no matches shows the empty text; clearing resets the value", async ({ mount, page }) => {
  const changes: string[] = [];
  await mount(<Select searchable clearable label="Office" options={offices} defaultValue="wlg" onChange={(v) => changes.push(v)} />);
  const input = page.getByRole("combobox", { name: "Office" });
  await expect(input).toHaveValue("Wellington");
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(input).toHaveValue("");
  await input.fill("zzz");
  await expect(page.getByText("No matches")).toBeVisible();
  await expect.poll(() => changes).toEqual([""]);
});

test("Searchable: name submits the chosen value; helper and error describe the input", async ({ mount, page }) => {
  await mount(
    <form id="f">
      <Select searchable label="Office" name="office" options={offices} defaultValue="chc" helperText="Where we send mail." />
      <Select searchable label="Other" options={offices} error="Choose an office." />
    </form>
  );
  const submitted = await page.evaluate(() => new FormData(document.getElementById("f") as HTMLFormElement).get("office"));
  expect(submitted).toBe("chc");
  await expect(page.getByRole("combobox", { name: "Office" })).toHaveAccessibleDescription("Where we send mail.");
  await expect(page.getByRole("combobox", { name: "Other" })).toHaveAttribute("aria-invalid", "true");
});

test("A clearable list Select clears to the placeholder", async ({ mount, page }) => {
  const changes: string[] = [];
  await mount(
    <Select
      label="Environment"
      placeholder="Choose one"
      clearable
      options={[{ value: "uat", label: "UAT", description: "release/*" }, { value: "prod", label: "Production" }]}
      defaultValue="uat"
      onChange={(v) => changes.push(v)}
    />
  );
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByRole("button", { name: /Environment/ })).toHaveText("Choose one");
  await expect.poll(() => changes).toEqual([""]);
  await expect(page.getByRole("button", { name: "Clear" })).toHaveCount(0);
});

test("Searchable: Enter chooses rather than submitting the form until a choice is made", async ({ mount, page }) => {
  await mount(<SearchableInForm />);
  const input = page.getByRole("combobox", { name: "Region" });
  // Enter straight after typing, before the list has caught up.
  await input.fill("welli");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("submits")).toHaveText("0");
  // Depending on timing that Enter chose the match, or React Aria reverted
  // the unmatched text; either way the form didn't submit.
  if ((await input.inputValue()) !== "Wellington") {
    await input.fill("welli");
    await expect(page.getByRole("option", { name: "Wellington" })).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", { name: "Wellington" })).toHaveAttribute("data-focused");
    await page.keyboard.press("Enter");
  }
  await expect(input).toHaveValue("Wellington");
  await expect(page.getByTestId("submits")).toHaveText("0");
  // With a choice made and the list closed, Enter submits as in any field.
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("submits")).toHaveText("1");
});

test("MultiSelect keyboard: Enter adds the typed match as a tag, Backspace removes the last, and the form sends each value", async ({ mount, page }) => {
  await mount(<MultiInForm />);
  const input = page.getByRole("combobox", { name: "Offices" });
  await input.click();
  await page.keyboard.type("well");
  await expect(page.getByRole("option", { name: "Wellington" })).toHaveAttribute("data-focused");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("chosen")).toHaveText("wlg");
  await expect(input).toHaveValue("");
  await page.keyboard.type("auck");
  await expect(page.getByRole("option", { name: "Auckland" })).toHaveAttribute("data-focused");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("chosen")).toHaveText("wlg,akl");
  // Enter in the field never submits the form.
  await expect(page.getByTestId("sent")).toHaveText("");
  // While the list is open, React Aria hides the rest of the page, tags included, from assistive technology.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row", { name: "Wellington" })).toBeVisible();
  await expect(page.getByRole("row", { name: "Auckland" })).toBeVisible();
  await expect(input).toBeFocused();
  await page.keyboard.press("Backspace");
  await expect(page.getByTestId("chosen")).toHaveText("wlg");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("sent")).toHaveText("wlg");
});

test("MultiSelect removes a choice from its tag", async ({ mount, page }) => {
  await mount(<MultiInForm />);
  const input = page.getByRole("combobox", { name: "Offices" });
  await input.click();
  await page.getByRole("option", { name: "Christchurch" }).click();
  await page.getByRole("option", { name: "Auckland" }).click();
  await expect(page.getByTestId("chosen")).toHaveText("chc,akl");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Remove Christchurch" }).click();
  await expect(page.getByTestId("chosen")).toHaveText("akl");
});

test("MultiSelect keeps the label of a choice that later server results leave out", async ({ mount, page }) => {
  await mount(<MultiServerSearch />);
  const input = page.getByRole("combobox", { name: "Invite" });
  await input.click();
  await page.keyboard.type("aro");
  await expect(page.getByRole("option", { name: "Aroha Ngata" })).toHaveAttribute("data-focused");
  await page.keyboard.press("Enter");
  await page.keyboard.type("ben");
  await expect(page.getByRole("option", { name: "Ben Carter" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Aroha Ngata" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row", { name: "Aroha Ngata" })).toBeVisible();
});

test("MultiSelect disabled and read-only keep their tags without remove buttons", async ({ mount, page }) => {
  const component = await mount(<MultiInForm disabled />);
  await expect(page.getByRole("row", { name: "Wellington" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove Wellington" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Offices" })).toBeDisabled();
  await component.update(<MultiInForm readOnly />);
  await expect(page.getByRole("button", { name: "Remove Wellington" })).toHaveCount(0);
});

test("Renders a MultiSelect with chosen tags", async ({ mount, page }) => {
  const component = await mount(<MultiInForm readOnly />);
  await settleAnimations(page);
  await expect(await component.screenshot()).toMatchSnapshot();
});
