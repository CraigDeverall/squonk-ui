import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Tooltip } from "./tooltip";
import { Button } from "../button/button";
import { settleAnimations } from "../../../../test-setup/animations";

// The hint is portalled and overflows the trigger, so snapshot the page.
test("Renders an open tooltip with its arrow", async ({ mount, page }) => {
  await page.setViewportSize({ width: 360, height: 160 });
  await mount(
    <div style={{ padding: "64px 96px" }}>
      <Tooltip content="Copies the share link" defaultOpen>
        <Button>Copy link</Button>
      </Tooltip>
    </div>
  );
  await expect(page.getByRole("tooltip")).toBeVisible();
  await settleAnimations(page);
  await expect(await page.screenshot()).toMatchSnapshot();
});

test("Keyboard focus opens the hint as a description; Escape closes it", async ({ mount, page }) => {
  await mount(
    <Tooltip content="Copies the share link" openDelay={0}>
      <Button>Copy link</Button>
    </Tooltip>
  );
  const trigger = page.getByRole("button", { name: "Copy link" });
  await page.keyboard.press("Tab");
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveText("Copies the share link");
  await expect(trigger).toHaveAccessibleDescription("Copies the share link");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Hover opens after the delay and the pointer can move onto the hint", async ({ mount, page }) => {
  await mount(
    <div style={{ padding: 64 }}>
      <Tooltip content="Copies the share link" openDelay={200} closeDelay={100}>
        <Button>Copy link</Button>
      </Tooltip>
    </div>
  );
  // React Aria opens on hover once the pointer has moved over the page, as a
  // real mouse does on its way to the trigger.
  await page.mouse.move(1, 1);
  await page.getByRole("button", { name: "Copy link" }).hover();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await settleAnimations(page);
  await page.getByRole("tooltip").hover();
  await page.waitForTimeout(300);
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(page.getByRole("tooltip")).toBeHidden();
});

test("A disabled tooltip never opens", async ({ mount, page }) => {
  await mount(
    <Tooltip content="Hidden hint" openDelay={0} disabled>
      <Button>Copy link</Button>
    </Tooltip>
  );
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "Copy link" }).hover();
  await page.waitForTimeout(200);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});
