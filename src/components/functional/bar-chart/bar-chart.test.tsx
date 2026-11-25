import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Card } from "../../layout/card/card";
import { BarChart } from "./bar-chart";

const quarters = [
  { quarter: "Q1", assessed: 182, paid: 164 },
  { quarter: "Q2", assessed: 205, paid: 171 },
  { quarter: "Q3", assessed: 194, paid: 188 },
  { quarter: "Q4", assessed: 231, paid: 202 },
];

const chapters = [
  { chapter: "Auckland", sightings: 48210, pending: 3120 },
  { chapter: "Wellington", sightings: 21940, pending: 1260 },
  { chapter: "Bay of Plenty", sightings: 11650, pending: 930 },
];

const series = [
  { key: "assessed" as const, label: "Invoiced" },
  { key: "paid" as const, label: "Collected" },
];

for (const mode of ["light", "dark"] as const) {
  test(`Default render of the BarChart component (${mode})`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider mode={mode}>
        <div style={{ width: 640 }}>
          <Card>
            <BarChart title="Dues invoiced and collected" description="NZD thousands" data={quarters} xKey="quarter" series={series} />
          </Card>
        </div>
      </SquonkThemeProvider>,
    );
    await expect(component.locator(".recharts-bar-rectangle")).toHaveCount(8);
    await expect(await component.screenshot({ animations: "disabled" })).toMatchSnapshot();
  });
}

test("Horizontal and stacked BarChart render", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <BarChart title="Sightings by chapter" data={chapters} xKey="chapter" orientation="horizontal" series={[{ key: "sightings", label: "Sightings" }]} />
      <BarChart
        title="Verified and under-review sightings by chapter"
        data={chapters}
        xKey="chapter"
        stacked
        series={[
          { key: "sightings", label: "Sightings" },
          { key: "pending", label: "Under review" },
        ]}
      />
    </div>,
  );
  await expect(component.getByText("Bay of Plenty").first()).toBeVisible();
  await expect(await component.screenshot({ animations: "disabled" })).toMatchSnapshot();
});

test("Bars never grow thicker than 24px", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 900 }}>
      <BarChart title="Dues collected" data={quarters} xKey="quarter" series={[{ key: "paid", label: "Collected" }]} />
    </div>,
  );
  const widths = await component.locator(".recharts-bar-rectangle path").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
  expect(widths.length).toBe(4);
  for (const w of widths) expect(w).toBeLessThanOrEqual(24.5);
});

test("BarChart reads out each category's values from the keyboard", async ({ mount, page }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <BarChart title="Dues invoiced and collected" data={quarters} xKey="quarter" series={series} />
    </div>,
  );
  await component.getByRole("application", { name: "Dues invoiced and collected" }).focus();
  await expect(component.locator(".recharts-tooltip-wrapper")).toContainText("Q1");
  await page.keyboard.press("ArrowRight");
  const tooltip = component.locator(".recharts-tooltip-wrapper");
  await expect(tooltip).toContainText("Q2");
  await expect(tooltip).toContainText("205");
  await expect(tooltip).toContainText("171");
});

test("More than eight BarChart series draws the first eight and warns", async ({ mount, page }) => {
  const warnings: string[] = [];
  page.on("console", (m) => m.type() === "warning" && warnings.push(m.text()));
  const row = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`s${i}`, i + 1]));
  const component = await mount(
    <div style={{ width: 640 }}>
      <BarChart
        title="Nine series"
        data={[{ name: "A", ...row }]}
        xKey={"name" as never}
        series={Array.from({ length: 9 }, (_, i) => ({ key: `s${i}` as never, label: `Series ${i + 1}` }))}
      />
    </div>,
  );
  await expect(component.getByRole("list", { name: "Legend" }).getByRole("listitem")).toHaveCount(8);
  expect(warnings.some((w) => w.includes("only the first 8 are drawn"))).toBe(true);
});
