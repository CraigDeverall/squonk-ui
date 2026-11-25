import { expect, test } from "@playwright/experimental-ct-react";
import type { Page } from "playwright";
import { AppearancesHarness, CollapsibleHarness, NestedHarness, SidebarHarness } from "./resizable-panels.harness";

const widthOf = async (page: Page, id: string) => Math.round((await page.locator(`#${id}`).boundingBox())!.width);
const heightOf = async (page: Page, id: string) => Math.round((await page.locator(`#${id}`).boundingBox())!.height);

/** Press on the middle of a handle and drag it by (dx, dy). */
async function drag(page: Page, name: string, dx: number, dy: number) {
  const box = (await page.getByRole("separator", { name }).boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 6 });
  await page.mouse.up();
}

test("A handle is an accessible window splitter for the panel before it", async ({ mount, page }) => {
  await mount(<SidebarHarness />);
  const handle = page.getByRole("separator", { name: "Resize sidebar" });
  await expect(handle).toHaveAttribute("aria-orientation", "vertical");
  await expect(handle).toHaveAttribute("aria-controls", "sidebar");
  await expect(handle).toHaveAttribute("tabindex", "0");
  await expect(handle).toHaveAttribute("aria-valuenow", "25");
  // 200px of the 799px the panels share is the larger lower bound.
  await expect(handle).toHaveAttribute("aria-valuemin", "25");
  await expect(handle).toHaveAttribute("aria-valuemax", "40");
  await expect(page.getByLabel("Layout")).toHaveText(/^25\.\d,7[45]\.\d$/);
});

test("Arrow keys resize by a step, Shift by a larger one, within the limits (keyboard)", async ({ mount, page }) => {
  await mount(<SidebarHarness />);
  const handle = page.getByRole("separator", { name: "Resize sidebar" });
  await page.keyboard.press("Tab");
  await expect(handle).toBeFocused();
  await expect(handle).toHaveAttribute("data-focus-visible", "true");
  await page.keyboard.press("ArrowRight");
  await expect(handle).toHaveAttribute("aria-valuenow", "26");
  await page.keyboard.press("Shift+ArrowRight");
  await expect(handle).toHaveAttribute("aria-valuenow", "36");
  await page.keyboard.press("Shift+ArrowRight");
  await expect(handle).toHaveAttribute("aria-valuenow", "40");
  // Up and Down belong to horizontal handles; this one ignores them.
  await page.keyboard.press("ArrowDown");
  await expect(handle).toHaveAttribute("aria-valuenow", "40");
  await page.keyboard.press("Shift+ArrowLeft");
  await page.keyboard.press("Shift+ArrowLeft");
  await expect(handle).toHaveAttribute("aria-valuenow", "25");
  expect(await widthOf(page, "sidebar")).toBe(200);
});

test("Home and End jump to the smallest and largest size (keyboard)", async ({ mount, page }) => {
  await mount(<SidebarHarness />);
  const handle = page.getByRole("separator", { name: "Resize sidebar" });
  await handle.focus();
  await page.keyboard.press("End");
  await expect(handle).toHaveAttribute("aria-valuenow", "40");
  expect(await widthOf(page, "sidebar")).toBe(320);
  await page.keyboard.press("Home");
  expect(await widthOf(page, "sidebar")).toBe(200);
});

test("Dragging a handle resizes the panels and holds a pixel minimum", async ({ mount, page }) => {
  await mount(<SidebarHarness />);
  const handle = page.getByRole("separator", { name: "Resize sidebar" });
  await drag(page, "Resize sidebar", 40, 0);
  expect(await widthOf(page, "sidebar")).toBe(240);
  await expect(handle).toHaveAttribute("aria-valuenow", "30");
  await expect(handle).toBeFocused();
  await drag(page, "Resize sidebar", -300, 0);
  expect(await widthOf(page, "sidebar")).toBe(200);
  await drag(page, "Resize sidebar", 500, 0);
  expect(await widthOf(page, "sidebar")).toBe(320);
  await expect(page.getByLabel("Layout")).toHaveText(/^40\.0,60\.0$/);
});

test("Double-clicking a handle resets the panels beside it", async ({ mount, page }) => {
  await mount(<SidebarHarness />);
  const handle = page.getByRole("separator", { name: "Resize sidebar" });
  await drag(page, "Resize sidebar", 80, 0);
  await expect(handle).toHaveAttribute("aria-valuenow", "35");
  await handle.dblclick();
  await expect(handle).toHaveAttribute("aria-valuenow", "25");
});

test("A pixel minimum still holds when the group gets narrower", async ({ mount, page }) => {
  await mount(<SidebarHarness width={400} />);
  expect(await widthOf(page, "sidebar")).toBe(200);
  await expect(page.getByRole("separator", { name: "Resize sidebar" })).toHaveAttribute("aria-valuenow", "50");
});

test("The handle shows hover and dragging states", async ({ mount, page }) => {
  await mount(<SidebarHarness />);
  const handle = page.getByRole("separator", { name: "Resize sidebar" });
  await handle.hover();
  await expect(handle).toHaveAttribute("data-hovered", "true");
  const box = (await handle.boundingBox())!;
  await page.mouse.down();
  await page.mouse.move(box.x + 20, box.y + box.height / 2, { steps: 3 });
  await expect(handle).toHaveAttribute("data-dragging", "true");
  await page.mouse.up();
  await expect(handle).not.toHaveAttribute("data-dragging");
});

test("Enter collapses and expands a collapsible panel (keyboard)", async ({ mount, page }) => {
  await mount(<CollapsibleHarness />);
  const handle = page.getByRole("separator", { name: "Resize navigation" });
  await handle.focus();
  await page.keyboard.press("Enter");
  expect(await widthOf(page, "nav")).toBe(48);
  await expect(page.locator("#nav")).toHaveAttribute("data-collapsed", "true");
  await expect(page.getByLabel("Collapsed")).toHaveText("true");
  await page.keyboard.press("Enter");
  expect(await widthOf(page, "nav")).toBe(200);
  await expect(page.getByLabel("Collapsed")).toHaveText("false");
});

test("Dragging well below a collapsible panel's minimum snaps it shut", async ({ mount, page }) => {
  await mount(<CollapsibleHarness />);
  await drag(page, "Resize navigation", -60, 0);
  expect(await widthOf(page, "nav")).toBe(160);
  await drag(page, "Resize navigation", -100, 0);
  expect(await widthOf(page, "nav")).toBe(48);
  // From collapsed, the first arrow step opens it to its minimum.
  await page.getByRole("separator", { name: "Resize navigation" }).focus();
  await page.keyboard.press("ArrowRight");
  expect(await widthOf(page, "nav")).toBe(160);
});

test("A vertical group nests inside a horizontal panel (keyboard)", async ({ mount, page }) => {
  await mount(<NestedHarness />);
  const inner = page.getByRole("separator", { name: "Resize terminal" });
  await expect(inner).toHaveAttribute("aria-orientation", "horizontal");
  await expect(inner).toHaveAttribute("aria-controls", "editor");
  await inner.focus();
  await page.keyboard.press("Shift+ArrowUp");
  await expect(inner).toHaveAttribute("aria-valuenow", "60");
  await page.keyboard.press("ArrowLeft");
  await expect(inner).toHaveAttribute("aria-valuenow", "60");
  await drag(page, "Resize terminal", 0, 30);
  await expect(inner).toHaveAttribute("aria-valuenow", "70");
  // The outer handle moves the columns without touching the rows.
  await drag(page, "Resize files", 80, 0);
  await expect(page.getByRole("separator", { name: "Resize files" })).toHaveAttribute("aria-valuenow", "35");
  await expect(inner).toHaveAttribute("aria-valuenow", "70");
  expect(await heightOf(page, "terminal")).toBeGreaterThanOrEqual(60);
});

test("A disabled handle can't be focused or moved", async ({ mount, page }) => {
  await mount(<AppearancesHarness />);
  const fixed = page.getByRole("separator", { name: "Fixed" });
  await expect(fixed).not.toHaveAttribute("tabindex");
  await expect(fixed).not.toHaveAttribute("aria-valuenow");
  const before = await widthOf(page, "panel-fixed");
  await drag(page, "Fixed", -60, 0);
  expect(await widthOf(page, "panel-fixed")).toBe(before);
});

for (const mode of ["light", "dark"] as const) {
  test(`Handle appearances (${mode} mode)`, async ({ mount, page }) => {
    await mount(<AppearancesHarness mode={mode} />);
    await expect(page.getByTestId("frame")).toHaveScreenshot(`resizable-panels-appearances-${mode}.png`);
  });

  test(`Sidebar with a hovered handle (${mode} mode)`, async ({ mount, page }) => {
    await mount(<SidebarHarness mode={mode} />);
    await page.getByRole("separator", { name: "Resize sidebar" }).hover();
    await expect(page.getByTestId("frame")).toHaveScreenshot(`resizable-panels-hover-${mode}.png`);
  });
}

test("Keyboard focus ring on a handle", async ({ mount, page }) => {
  await mount(<SidebarHarness />);
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("frame")).toHaveScreenshot("resizable-panels-focus.png");
});
