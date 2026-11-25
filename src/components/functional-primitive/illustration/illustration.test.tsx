import { expect, test } from "@playwright/experimental-ct-react";
import { AccentHarness, GalleryHarness, LabelHarness, SizeHarness } from "./illustration.harness";

for (const mode of ["light", "dark"] as const) {
  test(`Every illustration follows the theme (${mode})`, async ({ mount }) => {
    const component = await mount(<GalleryHarness mode={mode} />);
    await expect(component).toHaveScreenshot(`illustration-gallery-${mode}.png`);
  });
}

test("Decorative by default; a label makes it an image with that name", async ({ mount, page }) => {
  await mount(<LabelHarness />);
  await expect(page.locator("[data-illustration=inbox]")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("img")).toHaveCount(1);
  await expect(page.getByRole("img", { name: "Sighting logged" })).toBeVisible();
});

test("Sizes come from the theme's illustration tokens", async ({ mount, page }) => {
  await mount(<SizeHarness />);
  const width = (size: string) => page.locator(`[data-size=${size}]`).evaluate((el) => el.getBoundingClientRect().width);
  expect(await width("sm")).toBe(48);
  expect(await width("lg")).toBe(100);
});

test("Colours follow a re-pointed accent", async ({ mount, page }) => {
  await mount(<AccentHarness />);
  const sparkleFill = await page.locator("[data-illustration=inbox] path").last().evaluate((el) => getComputedStyle(el).fill);
  expect(sparkleFill).toBe("rgb(255, 0, 0)");
});
