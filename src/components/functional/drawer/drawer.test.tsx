import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Drawer } from "./drawer";
import { Button } from "../button/button";
import { settleAnimations } from "../../../../test-setup/animations";

test("Renders an open Drawer at the end with a pinned footer", async ({ mount, page }) => {
  await page.setViewportSize({ width: 800, height: 420 });
  await mount(
    <Drawer open onClose={() => {}} title="Case 2026-0418" footer={<Button variant="primary" lift={false}>Contact member</Button>}>
      <p style={{ margin: 0 }}>Aroha Ngata has not paid the annual dues for September.</p>
    </Drawer>
  );
  await expect(page.getByRole("dialog", { name: "Case 2026-0418" })).toBeVisible();
  await settleAnimations(page);
  await expect(await page.screenshot()).toMatchSnapshot();
});

test("Sits against the chosen edge", async ({ mount, page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  const component = await mount(<Drawer open title="Menu" placement="start" size="sm">Links</Drawer>);
  await settleAnimations(page);
  let box = (await page.getByRole("dialog").boundingBox())!;
  expect(box.x).toBe(0);
  expect(box.width).toBe(320);
  expect(box.height).toBe(600);
  await component.update(<Drawer open title="Menu" placement="end" size="sm">Links</Drawer>);
  await settleAnimations(page);
  box = (await page.getByRole("dialog").boundingBox())!;
  expect(box.x + box.width).toBe(800);
  await component.update(<Drawer open title="Sort" placement="bottom">Options</Drawer>);
  await settleAnimations(page);
  box = (await page.getByRole("dialog").boundingBox())!;
  expect(box.y + box.height).toBe(600);
  expect(box.width).toBe(800);
});

test("Traps focus and Escape requests close", async ({ mount, page }) => {
  let closes = 0;
  await mount(
    <Drawer open onClose={() => closes++} title="Edit" footer={<button type="button">Save</button>}>
      <input aria-label="Email" />
    </Drawer>
  );
  const dialog = page.getByRole("dialog", { name: "Edit" });
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Email" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Save" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect.poll(() => closes).toBe(1);
});
