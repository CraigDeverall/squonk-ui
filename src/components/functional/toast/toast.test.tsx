import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { ToastProvider } from "./toast";
import { ToastTestHarness, ToastQueueHarness, ToastActionHarness } from "./toast.harness";

// Toasts render in a portal over the viewport, so snapshot the page.
// when updating the snapshot, add .only so that you don"t update the snapshot for all tests, then run npm run test:update
test("Shows stacked toasts", async ({ mount, page }) => {
  await mount(
    <ToastProvider duration={0}>
      <ToastTestHarness />
    </ToastProvider>
  );
  await page.getByRole("button", { name: "fire success" }).click();
  await page.getByRole("button", { name: "fire error" }).click();
  await expect(page.getByText("Invite sent.")).toBeVisible();
  await expect(page.getByText("Save failed.")).toBeVisible();
  await expect(
    await page.screenshot({ animations: "disabled" })
  ).toMatchSnapshot();
});

test("Dismiss button removes a toast", async ({ mount, page }) => {
  await mount(
    <ToastProvider duration={0}>
      <ToastTestHarness />
    </ToastProvider>
  );
  await page.getByRole("button", { name: "fire success" }).click();
  await expect(page.getByText("Invite sent.")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByText("Invite sent.")).toBeHidden();
});

test("Toasts auto-dismiss after their duration", async ({ mount, page }) => {
  await mount(
    <ToastProvider duration={500}>
      <ToastTestHarness />
    </ToastProvider>
  );
  await page.getByRole("button", { name: "fire success" }).click();
  await expect(page.getByText("Invite sent.")).toBeVisible();
  await expect(page.getByText("Invite sent.")).toBeHidden({ timeout: 3000 });
});

test("Toast timers pause while the notification region is hovered or focused", async ({ mount, page }) => {
  // Paused, so time moves only through runFor; a running clock lets a slow
  // browser expire the toast before the test acts on it.
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await mount(<ToastProvider duration={300}><ToastTestHarness /></ToastProvider>);
  await page.getByRole("button", { name: "fire success" }).click();
  const region = page.getByRole("region", { name: "Notifications" });
  // Let the toast move into place (animation frames run on the paused clock).
  await page.clock.runFor(50);
  // The region has no box of its own; hovering a toast hovers the region.
  await page.getByText("Invite sent.").hover();
  await page.clock.runFor(1000);
  await expect(page.getByText("Invite sent.")).toBeVisible();
  await region.getByRole("button", { name: "Dismiss" }).focus();
  await page.mouse.move(0, 0);
  await page.clock.runFor(1000);
  await expect(page.getByText("Invite sent.")).toBeVisible();
  await page.getByRole("button", { name: "fire success" }).focus();
  // 300ms duration, then a 200ms exit before the toast is removed.
  await page.clock.runFor(600);
  await expect(page.getByText("Invite sent.")).toBeHidden();
});

test("Toast capacity queues FIFO and starts each duration when visible", async ({ mount, page }) => {
  // Paused, so time moves only through runFor; a running clock lets a slow
  // browser expire the toast before the test acts on it.
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  let overflow = 0;
  const component = await mount(<ToastProvider duration={300} maxVisible={1} maxQueued={1} onOverflow={() => overflow++}><ToastQueueHarness /></ToastProvider>);
  await page.getByRole("button", { name: "Queue burst" }).click();
  await expect(page.getByText("First queued toast")).toBeVisible();
  await expect(page.getByText("Second queued toast")).toBeHidden();
  await expect.poll(() => overflow).toBe(1);
  // 300ms duration, then a 200ms exit before the slot frees.
  await page.clock.runFor(600);
  await expect(page.getByText("First queued toast")).toBeHidden();
  await expect(page.getByText("Second queued toast")).toBeVisible();
  // Its 300ms only started when it was shown, so it is still up.
  await page.clock.runFor(100);
  await expect(page.getByText("Second queued toast")).toBeVisible();
  await component.unmount();
  await page.clock.runFor(1000);
  await expect(page.getByRole("region", { name: "Notifications" })).toBeHidden();
});

test("Escape dismisses a focused toast and Alt+T moves focus to the notifications", async ({ mount, page }) => {
  await mount(<ToastProvider duration={0}><ToastTestHarness /></ToastProvider>);
  await page.getByRole("button", { name: "fire error" }).click();
  await expect(page.getByText("Save failed.")).toBeVisible();
  // One live region per toast: the Alert announces; the region does not.
  await expect(page.getByRole("alert")).toContainText("Save failed.");
  await expect(page.getByRole("region", { name: "Notifications" })).not.toHaveAttribute("aria-live", /polite|assertive/);
  await page.keyboard.press("Alt+KeyT");
  await expect.poll(() => page.evaluate(() =>
    document.querySelector('[role="region"]')?.contains(document.activeElement))).toBe(true);
  await page.getByRole("alertdialog", { name: "Save failed." }).focus();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Save failed.")).toBeHidden();
});

test("A toast's action calls onAction and dismisses the toast", async ({ mount, page }) => {
  await mount(<ToastProvider duration={0}><ToastActionHarness /></ToastProvider>);
  await page.getByRole("button", { name: "fire action" }).click();
  await expect(page.getByText("Case archived.")).toBeVisible();
  await expect(page.getByText("undone 0")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("undone 1")).toBeVisible();
  await expect(page.getByText("Case archived.")).toBeHidden();
});

test("A toast's action is a named button reached and activated by keyboard, announced with its message", async ({ mount, page }) => {
  await mount(<ToastProvider duration={0}><ToastActionHarness /></ToastProvider>);
  await page.getByRole("button", { name: "fire action" }).click();
  const toast = page.getByRole("alertdialog");
  await expect(toast).toBeVisible();
  // Still one live region per toast; the action sits inside it, after the message.
  const live = toast.getByRole("status");
  await expect(live).toHaveCount(1);
  await expect(live).toContainText("Case archived.");
  await expect(live.getByRole("button", { name: "Undo" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Notifications" })).not.toHaveAttribute("aria-live", /polite|assertive/);
  // Tab from the toast reaches the action first, then Dismiss.
  await toast.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Undo" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Dismiss" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByText("undone 1")).toBeVisible();
  await expect(page.getByText("Case archived.")).toBeHidden();
});

test("Dismissing a toast with an action does not run the action", async ({ mount, page }) => {
  await mount(<ToastProvider duration={0}><ToastActionHarness /></ToastProvider>);
  await page.getByRole("button", { name: "fire action" }).click();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByText("Case archived.")).toBeHidden();
  await expect(page.getByText("undone 0")).toBeVisible();
});
