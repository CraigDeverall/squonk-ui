import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Card } from "../../layout/card/card";
import { ScatterChart } from "./scatter-chart";

const individuals = [
  { name: "Aroha Ngata", daysLate: 4, penalty: 50 },
  { name: "James Whitfield", daysLate: 12, penalty: 120 },
  { name: "Tama Rāwiri", daysLate: 33, penalty: 310 },
  { name: "Rangi Parata", daysLate: 60, penalty: 540 },
];

const companies = [
  { name: "Tui Street household", daysLate: 6, penalty: 250 },
  { name: "Southern Fern household", daysLate: 30, penalty: 1180 },
  { name: "Rimu Ridge household", daysLate: 55, penalty: 2240 },
];

const series = [
  { label: "Wanderers", data: individuals },
  { label: "Keepers", data: companies },
];

for (const mode of ["light", "dark"] as const) {
  test(`Default render of the ScatterChart component (${mode})`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider mode={mode}>
        <div style={{ width: 640 }}>
          <Card>
            <ScatterChart title="Overdue dues" series={series} xKey="daysLate" yKey="penalty" xLabel="Days late" yLabel="Dues owing" nameKey="name" />
          </Card>
        </div>
      </SquonkThemeProvider>,
    );
    await expect(component.locator(".recharts-scatter-symbol")).toHaveCount(7);
    await expect(await component.screenshot({ animations: "disabled" })).toMatchSnapshot();
  });
}

test("ScatterChart names its axes and each point in the tooltip", async ({ mount, page }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <ScatterChart title="Overdue dues" series={series} xKey="daysLate" yKey="penalty" xLabel="Days late" yLabel="Dues owing" nameKey="name" />
    </div>,
  );
  await expect(component.getByText("Days late", { exact: true })).toBeVisible();
  await expect(component.getByText("Dues owing", { exact: true })).toBeVisible();
  const box = (await component.locator(".recharts-scatter-symbol").last().boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const tooltip = component.locator(".recharts-tooltip-wrapper");
  await expect(tooltip).toContainText("Rimu Ridge household");
  await expect(tooltip).toContainText("2,240");
  await page.mouse.move(0, 0);
});

test("ScatterChart's table view lists each point with its group", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <ScatterChart title="Overdue dues" series={series} xKey="daysLate" yKey="penalty" xLabel="Days late" yLabel="Dues owing" nameKey="name" />
    </div>,
  );
  await component.getByRole("button", { name: "Table view" }).click();
  const table = component.getByRole("table", { name: "Overdue dues" });
  await expect(table.getByRole("columnheader")).toHaveText(["Group", "Name", "Days late", "Dues owing"]);
  await expect(table.getByRole("row")).toHaveCount(8);
  await expect(table).toContainText("Southern Fern household");
});

test("Value-axis labels clear the axis title when the top tick rounds past the data", async ({ mount, page }) => {
  // 0–840 draws ticks up to "1,000", two characters wider than "840" or "900".
  await mount(
    <SquonkThemeProvider>
      <div style={{ width: 640 }}>
        <ScatterChart
          title="Overdue dues"
          series={[{ label: "Wanderers", data: [{ name: "Aroha Ngata", daysLate: 4, penalty: 120 }, { name: "Rangi Parata", daysLate: 60, penalty: 840 }] }]}
          xKey="daysLate"
          yKey="penalty"
          nameKey="name"
          xLabel="Days late"
          yLabel="Dues owing"
        />
      </div>
    </SquonkThemeProvider>,
  );
  await expect(page.locator(".recharts-cartesian-axis-tick-value").filter({ hasText: /^1,000$/ })).toHaveCount(1);
  const clashes = await page.locator("svg.recharts-surface").first().evaluate((svg) => {
    const title = [...svg.querySelectorAll("text")].find((t) => t.textContent === "Dues owing")!.getBoundingClientRect();
    const left = svg.getBoundingClientRect().left;
    return [...svg.querySelectorAll(".recharts-cartesian-axis-tick-value")]
      .map((t) => [t.textContent, t.getBoundingClientRect()] as const)
      .filter(([, b]) => b.left < left - 0.5 || (b.left < title.right && b.right > title.left && b.top < title.bottom && b.bottom > title.top))
      .map(([text]) => text);
  });
  expect(clashes).toEqual([]);
});
