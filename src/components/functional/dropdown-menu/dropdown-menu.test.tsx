import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { DropdownMenu } from "./dropdown-menu";
import { settleAnimations } from "../../../../test-setup/animations";

// when updating the snapshot, add .only so that you don"t update the snapshot for all tests, then run npm run test:update
test("Renders the closed DropdownMenu trigger", async ({ mount }) => {
  const component = await mount(
    <DropdownMenu
      trigger={<span>Account ▾</span>}
      items={[
        { key: "settings", label: "Settings" },
        { key: "sign-out", label: "Sign out", tone: "danger" },
      ]}
    />
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

// The open panel overflows the trigger's box, so snapshot the page viewport.
test("Opens the menu and renders items", async ({ mount, page }) => {
  const component = await mount(
    <DropdownMenu
      trigger={<span>Account ▾</span>}
      items={[
        { key: "settings", label: "Settings" },
        { key: "billing", label: "Billing", disabled: true },
        "separator",
        { key: "sign-out", label: "Sign out", tone: "danger" },
      ]}
    />
  );
  await component.getByRole("button", { name: "Account ▾" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await settleAnimations(page);
  await expect(await page.screenshot()).toMatchSnapshot();
});

test("Escape closes the menu and item selection fires onSelect", async ({
  mount,
  page,
}) => {
  let selected = "";
  const component = await mount(
    <DropdownMenu
      trigger={<span>Account ▾</span>}
      items={[
        {
          key: "settings",
          label: "Settings",
          onSelect: () => (selected = "settings"),
        },
        { key: "sign-out", label: "Sign out" },
      ]}
    />
  );
  await component.getByRole("button", { name: "Account ▾" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();

  await component.getByRole("button", { name: "Account ▾" }).click();
  await page.getByRole("menuitem", { name: "Settings" }).click();
  await expect(page.getByRole("menu")).toBeHidden();
  // Callback props relay from browser to test runner asynchronously — poll.
  await expect.poll(() => selected).toBe("settings");
});

test("Arrow keys skip disabled entries and separators", async ({ mount, page }) => {
  await mount(<DropdownMenu trigger="Actions" items={[
    "separator",
    { key: "disabled", label: "Unavailable", disabled: true },
    { key: "first", label: "First action" },
    { key: "last", label: "Last action" },
  ]} />);
  const trigger = page.getByRole("button", { name: "Actions" });
  await trigger.click();
  // Opened by pointer, the menu takes focus; the first arrow press lands on
  // the first enabled item.
  await expect(page.getByRole("menu")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "First action" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await trigger.focus();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("menuitem", { name: "Last action" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("an all-disabled menu dismisses from its trigger", async ({ mount, page }) => {
  await mount(<DropdownMenu trigger="No actions" items={[
    { key: "disabled", label: "Unavailable", disabled: true },
  ]} />);
  const trigger = page.getByRole("button", { name: "No actions" });
  await trigger.click();
  await expect(page.getByRole("menu")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Arrow keys and typeahead move focus; Enter selects and returns focus", async ({ mount, page }) => {
  let selected = "";
  await mount(<DropdownMenu trigger="Actions" items={[
    { key: "copy", label: "Copy", onSelect: () => (selected = "copy") },
    { key: "rename", label: "Rename", onSelect: () => (selected = "rename") },
    { key: "delete", label: "Delete", tone: "danger", onSelect: () => (selected = "delete") },
  ]} />);
  const trigger = page.getByRole("button", { name: "Actions" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(page.getByRole("menuitem", { name: "Copy" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeFocused();
  await page.keyboard.press("d");
  await expect(page.getByRole("menuitem", { name: "Delete" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect.poll(() => selected).toBe("delete");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});
