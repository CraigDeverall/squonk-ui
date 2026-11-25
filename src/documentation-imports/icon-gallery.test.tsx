import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { IconGallery } from "./icon-gallery";

test("Search filters the icons by name, with spaces or without", async ({ mount, page }) => {
  await mount(<IconGallery />);
  const tiles = page.getByRole("listitem");
  const total = await tiles.count();
  expect(total).toBeGreaterThan(50);
  // createIcon is a factory, not an icon.
  await expect(page.getByRole("button", { name: /createIcon/ })).toHaveCount(0);

  await page.getByLabel("Search icons").fill("chevron down");
  await expect(tiles).toHaveCount(1);
  await expect(page.getByRole("button", { name: "ChevronDownIcon", exact: true })).toBeVisible();
  await page.getByLabel("Search icons").fill("chevrondown");
  await expect(tiles).toHaveCount(1);

  await page.getByLabel("Search icons").fill("zzz");
  await expect(page.getByText("No icon matches “zzz”.", { exact: false })).toBeVisible();
});

test("Clicking an icon copies its JSX or import line", async ({ mount, page, browserName }) => {
  test.skip(browserName !== "chromium", "Clipboard permissions are Chromium-only in Playwright");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await mount(<IconGallery />);
  const status = page.getByRole("status");

  await page.getByRole("button", { name: "CloseIcon", exact: true }).click();
  await expect(status).toContainText("Copied <CloseIcon />");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("<CloseIcon />");

  await page.getByText("Import", { exact: true }).click();
  await page.getByRole("button", { name: "AddIcon", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'import { AddIcon } from "@squonkstack/ui/icon";'
  );
});

test("Shows the snippet to copy by hand when the clipboard is unavailable", async ({ mount, page }) => {
  // The component page is already loaded, so an init script would only reach
  // the next load (the retry): replace the clipboard in this page directly.
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
  });
  await mount(<IconGallery />);
  await page.getByRole("button", { name: "SearchIcon", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Select and copy: <SearchIcon />");
});
