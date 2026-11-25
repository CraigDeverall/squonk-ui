import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Popover } from "./popover";
import { Button } from "../button/button";
import { settleAnimations } from "../../../../test-setup/animations";

test("Renders an open Popover with title, description and actions", async ({ mount, page }) => {
  await page.setViewportSize({ width: 480, height: 320 });
  await mount(
    <div style={{ padding: 16 }}>
      <Popover
        defaultOpen
        trigger={<Button variant="secondary">What's included?</Button>}
        title="Included in your dues"
        description="As at 3 November"
        footer={<Button variant="primary" lift={false}>Pay now</Button>}
      >
        <p style={{ margin: 0 }}>Annual dues, a late fee and the Swamp Fund levy to today.</p>
      </Popover>
    </div>
  );
  await expect(page.getByRole("dialog")).toBeVisible();
  await settleAnimations(page);
  await expect(await page.screenshot()).toMatchSnapshot();
});

test("Opens from its trigger, names itself and returns focus on Escape", async ({ mount, page }) => {
  await mount(
    <Popover trigger={<Button>Details</Button>} title="Dues owing" description="As at today">
      <a href="#more">More</a>
    </Popover>
  );
  const trigger = page.getByRole("button", { name: "Details" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Dues owing" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription("As at today");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => page.evaluate(() => document.activeElement?.closest("[role=dialog]") !== null)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Tab stays within the open panel", async ({ mount, page }) => {
  await mount(
    <div>
      <Popover trigger={<Button>Details</Button>} showCloseButton={false}>
        <a href="#more">More</a>
      </Popover>
      <button type="button">After</button>
    </div>
  );
  await page.getByRole("button", { name: "Details" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("link", { name: "More" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "More" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("link", { name: "More" })).toBeFocused();
  await expect(page.getByRole("button", { name: "After" })).not.toBeFocused();
});

test("The close button and an outside click close it", async ({ mount, page }) => {
  const changes: boolean[] = [];
  await mount(
    <div style={{ padding: 40 }}>
      <Popover trigger={<Button>Details</Button>} title="Dues owing" onOpenChange={(open) => changes.push(open)}>
        Content
      </Popover>
    </div>
  );
  await page.getByRole("button", { name: "Details" }).click();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "Details" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await settleAnimations(page);
  await page.mouse.click(5, 300);
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect.poll(() => changes).toEqual([true, false, true, false]);
});
