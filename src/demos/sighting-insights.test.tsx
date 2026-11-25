import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SightingInsights } from "./sighting-insights";

test("Renders the sighting insights dashboard", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<SightingInsights />);
  await expect(page.getByRole("heading", { level: 1, name: "Sighting insights" })).toBeVisible();
  await expect(page.getByRole("figure", { name: "Sightings per month" })).toBeVisible();
  await expect(await page.screenshot({ fullPage: true, animations: "disabled" })).toMatchSnapshot();
});

test("Changing the period redraws the figures, and a chart reads as a table", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<SightingInsights />);
  const chart = page.getByRole("figure", { name: "Sightings per month" });
  await expect(chart.getByText("Sightings logged, 2026–27 year to date")).toBeVisible();
  await page.getByRole("button", { name: /Period/ }).click();
  await page.getByRole("option", { name: "2025–26 full year" }).click();
  await expect(chart.getByText("Sightings logged, 2025–26 full year")).toBeVisible();
  await chart.getByRole("button", { name: "Table view" }).click();
  const table = chart.getByRole("table", { name: "Sightings per month" });
  await expect(table.getByRole("row")).toHaveCount(13);
});

test("Operations shows capacity meters and verification progress", async ({ mount, page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<SightingInsights />);
  await page.getByRole("tab", { name: "Operations" }).click();
  await expect(page.getByRole("meter", { name: "Kit hire waiting list" })).toHaveAttribute("aria-valuenow", "86");
  await expect(page.getByRole("progressbar", { name: "Reports verified" })).toBeVisible();
});
