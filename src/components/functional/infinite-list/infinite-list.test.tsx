import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { NoticeFeed, NoticeFeedInPanel } from "./infinite-list.harness";

test("Scrolling near the end loads the next page with no button", async ({ mount, page }) => {
  await page.setViewportSize({ width: 600, height: 400 });
  // 10 × 120px puts the end 1200px down: beyond the screen plus the 600px threshold.
  await mount(<NoticeFeed pages={3} pageSize={10} itemHeight={120} />);
  const feed = page.getByRole("feed", { name: "Notices" });
  await expect(feed.getByRole("article")).toHaveCount(10);
  await expect(page.getByRole("button")).toHaveCount(0);
  await page.getByRole("heading", { name: "Notice 10", exact: true }).scrollIntoViewIfNeeded();
  await expect(feed.getByRole("article")).toHaveCount(20);
  await expect(page.getByRole("status")).toHaveText("Loaded 10 more");
  await page.getByRole("heading", { name: "Notice 20", exact: true }).scrollIntoViewIfNeeded();
  await expect(feed.getByRole("article")).toHaveCount(30);
  await page.getByRole("heading", { name: "Notice 30", exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByText("You've reached the end", { exact: true })).toBeVisible();
  await expect(feed.getByRole("article")).toHaveCount(30);
});

test("Articles carry their position; the feed is busy while loading", async ({ mount, page }) => {
  await page.setViewportSize({ width: 600, height: 400 });
  await mount(<NoticeFeed pages={2} pageSize={5} delay={600} itemHeight={30} />);
  const feed = page.getByRole("feed", { name: "Notices" });
  // Five short items leave the end on screen, so the next page loads at once.
  await expect(feed).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("status")).toHaveText("Loading more…");
  await expect(feed).toHaveAttribute("aria-busy", "false");
  const first = feed.getByRole("article").first();
  await expect(first).toHaveAttribute("aria-posinset", "1");
  await expect(first).toHaveAttribute("aria-setsize", "10");
});

test("Keyboard: Page Down and Page Up move between articles; Ctrl+End leaves the feed", async ({ mount, page }) => {
  await page.setViewportSize({ width: 600, height: 400 });
  await mount(<NoticeFeed pages={1} pageSize={5} />);
  await page.getByRole("link", { name: "Open Notice 1", exact: true }).focus();
  await page.keyboard.press("PageDown");
  await expect(page.getByRole("article").nth(1)).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect(page.getByRole("article").nth(2)).toBeFocused();
  await page.keyboard.press("PageUp");
  await expect(page.getByRole("article").nth(1)).toBeFocused();
  await page.keyboard.press("Control+End");
  await expect(page.getByText("End of Notices")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Help" })).toBeFocused();
});

test("A failed load stops, says why and offers Try again", async ({ mount, page }) => {
  await page.setViewportSize({ width: 600, height: 400 });
  await mount(<NoticeFeed pages={3} pageSize={10} itemHeight={120} failOnPage={1} />);
  await page.getByRole("heading", { name: "Notice 10", exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("alert")).toHaveText("Couldn't load more notices.");
  await expect(page.getByRole("article")).toHaveCount(10);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("article")).toHaveCount(20);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("Inside a scrolling panel, scrolling the panel loads more", async ({ mount, page }) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await mount(<NoticeFeedInPanel />);
  const feed = page.getByRole("feed", { name: "Notices" });
  await expect(feed.getByRole("article")).toHaveCount(10);
  await page.getByTestId("panel").evaluate((panel) => panel.scrollTo(0, 700));
  await expect(feed.getByRole("article")).toHaveCount(20);
});

test("Renders the loaded list and its end", async ({ mount, page }) => {
  await page.setViewportSize({ width: 480, height: 520 });
  const component = await mount(<NoticeFeed pages={2} pageSize={3} itemHeight={60} delay={100} />);
  // Short items leave the end in view, so both pages load and the list ends.
  await expect(page.getByText("You've reached the end", { exact: true })).toBeVisible();
  await expect(await component.screenshot()).toMatchSnapshot();
});
