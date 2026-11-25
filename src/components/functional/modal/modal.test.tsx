import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { ConfirmModal, Modal } from "./modal";
import { NestedModalHarness } from "./modal.harness";
import { Button } from "../button/button";
import { DropdownMenu } from "../dropdown-menu/dropdown-menu";
import { settleAnimations } from "../../../../test-setup/animations";

// The dialog renders in a portal over a fixed backdrop, so snapshot the page
// viewport rather than the mounted component's box.
// when updating the snapshot, add .only so that you don"t update the snapshot for all tests, then run npm run test:update
test("Renders an open Modal", async ({ mount, page }) => {
  await mount(
    <Modal
      open
      title="Invite a user"
      footer={
        <>
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Send invite</Button>
        </>
      }
    >
      Body content
    </Modal>
  );
  await expect(page.getByRole("dialog")).toBeVisible();
  await settleAnimations(page);
  await expect(await page.screenshot()).toMatchSnapshot();
});

test("Renders a danger ConfirmModal", async ({ mount, page }) => {
  await mount(
    <ConfirmModal
      open
      danger
      title="Delete this user?"
      message="This permanently removes the membership."
      confirmLabel="Delete"
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  );
  await expect(page.getByRole("dialog")).toBeVisible();
  await settleAnimations(page);
  await expect(await page.screenshot()).toMatchSnapshot();
});

test("Actions too wide for one row wrap inside the dialog", async ({ mount, page }) => {
  await page.setViewportSize({ width: 480, height: 640 });
  await mount(
    <ConfirmModal
      open
      danger
      title="Close your membership?"
      message="You won't be able to log sightings or use your Society credit."
      confirmLabel="Close membership permanently"
      cancelLabel="Keep my membership"
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  );
  const dialog = await page.getByRole("dialog").boundingBox();
  for (const name of ["Keep my membership", "Close membership permanently"]) {
    const button = await page.getByRole("button", { name }).boundingBox();
    expect(button!.x, name).toBeGreaterThanOrEqual(dialog!.x);
    expect(button!.x + button!.width, name).toBeLessThanOrEqual(dialog!.x + dialog!.width);
  }
});

test("Escape and backdrop request close; confirm fires", async ({
  mount,
  page,
}) => {
  let closed = 0;
  let confirmed = 0;
  await mount(
    <ConfirmModal
      open
      title="Publish?"
      onConfirm={() => confirmed++}
      onCancel={() => closed++}
    />
  );
  // Callback props relay from browser to test runner asynchronously — poll.
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect.poll(() => closed).toBe(1);

  // Backdrop press (outside the dialog box).
  await page.mouse.click(5, 5);
  await expect.poll(() => closed).toBe(2);

  await page.getByRole("button", { name: "Confirm" }).click();
  await expect.poll(() => confirmed).toBe(1);
});

test("Tab ignores hidden and disabled controls and composes caller handlers", async ({ mount, page }) => {
  let keys = 0;
  await mount(<>
    <button>Outside</button>
    <Modal open title="Focus regression" onKeyDown={() => keys++}>
      <button hidden>Hidden first</button>
      <fieldset disabled><button>Disabled group</button></fieldset>
      <button>First</button>
      <button>Last</button>
      <button style={{ display: "none" }}>Hidden last</button>
      <input type="hidden" />
      <button tabIndex={-2}>Programmatic only</button>
    </Modal>
  </>);
  await page.getByRole("button", { name: "Last", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "First", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Last", exact: true })).toBeFocused();
  // Shift+Tab emits a Shift keydown as well as the Tab keydown.
  await expect.poll(() => keys).toBe(3);
});

test("Escape dismisses an inner menu before requesting dialog close", async ({ mount, page }) => {
  let closed = 0;
  await mount(<Modal open title="Nested menu" onClose={() => closed++}>
    <DropdownMenu trigger="Actions" items={[{ key: "edit", label: "Edit" }]} />
  </Modal>);
  await page.getByRole("button", { name: "Actions" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(page.getByRole("button", { name: "Actions" })).toBeFocused();
  expect(closed).toBe(0);
  await page.keyboard.press("Escape");
  await expect.poll(() => closed).toBe(1);
});

test("an empty dialog keeps Tab focus on its root", async ({ mount, page }) => {
  await mount(<Modal open aria-label="Empty dialog" />);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("dialog", { name: "Empty dialog" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("dialog", { name: "Empty dialog" })).toBeFocused();
});

test("Nested dialogs close only the topmost and restore focus in order", async ({ mount, page }) => {
  await mount(<NestedModalHarness />);
  await page.getByRole("button", { name: "Open outer" }).click();
  await page.getByRole("button", { name: "Open inner" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Inner", exact: true })).toBeHidden();
  await expect(page.getByRole("dialog", { name: "Outer", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open inner" })).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open outer" })).toBeFocused();
});

test("Closing the lower dialog preserves scroll lock and final focus restoration", async ({ mount, page }) => {
  await page.evaluate(() => { document.documentElement.style.overflow = "clip"; });
  await mount(<NestedModalHarness />);
  await page.getByRole("button", { name: "Open outer" }).click();
  await page.getByRole("button", { name: "Open inner" }).click();
  await page.getByRole("button", { name: "Close outer first" }).click();
  await expect(page.getByRole("dialog", { name: "Outer", exact: true })).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
  // The open dialog hides the page behind it from assistive tech, and the
  // focus trap pulls focus that escapes back inside the dialog.
  await page.getByRole("button", { name: "Open outer", includeHidden: true }).focus();
  await expect.poll(() => page.evaluate(() =>
    document.querySelector('[role="dialog"]')?.contains(document.activeElement))).toBe(true);
  await page.getByRole("button", { name: "Finish inner" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe("clip");
  await expect(page.getByRole("button", { name: "Open outer" })).toBeFocused();
});

test("Caller naming overrides the visual title and loading confirmation cannot dismiss", async ({ mount, page }) => {
  let cancelled = 0;
  const component = await mount(<Modal open title="Visual heading" aria-label="Accessible task" />);
  await expect(page.getByRole("dialog", { name: "Accessible task" })).toBeVisible();
  await component.unmount();
  await mount(<ConfirmModal open loading title="Saving" onConfirm={() => {}} onCancel={() => cancelled++} />);
  const dialog = page.getByRole("dialog", { name: "Saving" });
  await expect(dialog).toHaveAttribute("aria-busy", "true");
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Confirm" })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Close", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.mouse.click(5, 5);
  await expect(dialog).toBeVisible();
  expect(cancelled).toBe(0);
});

test("A simultaneously mounted child dialog owns focus and Escape", async ({ mount, page }) => {
  let parentClosed = 0;
  let childClosed = 0;
  await mount(<Modal open title="Parent dialog" onClose={() => parentClosed++}>
    <Modal open title="Child dialog" onClose={() => childClosed++}><button>Child action</button></Modal>
  </Modal>);
  await expect(page.getByRole("dialog", { name: "Child dialog", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect.poll(() => childClosed).toBe(1);
  expect(parentClosed).toBe(0);
});
