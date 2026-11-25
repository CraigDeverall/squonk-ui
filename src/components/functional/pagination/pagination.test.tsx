import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Pagination } from "./pagination";
import { PaginationLinksHarness } from "./pagination.harness";

test("Renders numbered and compact pagination", async ({ mount, page }) => {
  await page.setViewportSize({ width: 900, height: 300 });
  const component = await mount(
    <div style={{ display: "grid", gap: 16, padding: 4, width: 760 }}>
      <Pagination count={112} defaultPage={6} />
      <Pagination count={112} defaultPage={1} showRange />
      <Pagination count={112} defaultPage={3} compact showRange />
    </div>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("A named nav with the current page marked, ellipses and disabled ends", async ({ mount, page }) => {
  await mount(<Pagination count={112} defaultPage={1} aria-label="Results pages" />);
  const nav = page.getByRole("navigation", { name: "Results pages" });
  await expect(nav.getByRole("button", { name: "Page 1", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("button", { name: "Page 12, last page" })).toBeVisible();
  await expect(nav.getByText("…")).toHaveCount(1);
  await expect(nav.getByRole("button", { name: "Previous page" })).toBeDisabled();
});

test("Next, a page number and keyboard activation change the page", async ({ mount, page }) => {
  const changes: number[] = [];
  await mount(<Pagination count={112} showRange onPageChange={(p) => changes.push(p)} />);
  const nav = page.getByRole("navigation", { name: "Pagination" });
  await nav.getByRole("button", { name: "Next page" }).click();
  await expect(nav.getByText("Showing 11–20 of 112")).toBeVisible();
  await nav.getByRole("button", { name: "Page 3", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(nav.getByRole("button", { name: "Page 3", exact: true })).toHaveAttribute("aria-current", "page");
  await expect.poll(() => changes).toEqual([2, 3]);
});

test("getPageUrl renders links with addresses", async ({ mount, page }) => {
  await mount(<PaginationLinksHarness />);
  const nav = page.getByRole("navigation", { name: "Pagination" });
  await expect(nav.getByRole("link", { name: "Page 3", exact: true })).toHaveAttribute("href", "?page=3");
  await expect(nav.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "?page=3");
});

test("Compact shows the position; an empty list says so", async ({ mount, page }) => {
  await mount(
    <div>
      <Pagination count={112} defaultPage={3} compact />
      <Pagination count={0} showRange aria-label="Empty" />
    </div>
  );
  await expect(page.getByText("Page 3 of 12")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Empty" }).getByText("No results")).toBeVisible();
});
