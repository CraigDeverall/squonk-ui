import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Card } from "../../layout/card/card";
import { AreaChart } from "./area-chart";

const data = [
  { week: "W1", online: 1820, agent: 940, paper: 310 },
  { week: "W2", online: 1960, agent: 1010, paper: 290 },
  { week: "W3", online: 2140, agent: 980, paper: 270 },
  { week: "W4", online: 2480, agent: 1120, paper: 260 },
  { week: "W5", online: 2390, agent: 1190, paper: 240 },
];

const series = [
  { key: "online" as const, label: "Online" },
  { key: "agent" as const, label: "Chapter lead" },
  { key: "paper" as const, label: "Paper" },
];

for (const mode of ["light", "dark"] as const) {
  test(`Default render of the AreaChart component, stacked (${mode})`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider mode={mode}>
        <div style={{ width: 640 }}>
          <Card>
            <AreaChart title="Sightings logged by channel" data={data} xKey="week" series={series} stacked />
          </Card>
        </div>
      </SquonkThemeProvider>,
    );
    await expect(component.locator(".recharts-area-area")).toHaveCount(3);
    await expect(await component.screenshot({ animations: "disabled" })).toMatchSnapshot();
  });
}

test("AreaChart washes each area lightly instead of filling it solid", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <AreaChart title="Sightings logged" data={data} xKey="week" series={series} />
    </div>,
  );
  const opacity = await component.locator(".recharts-area-area").first().evaluate((el) => getComputedStyle(el).fillOpacity);
  expect(Number(opacity)).toBeLessThan(0.2);
});

test("A stacked AreaChart lists the tooltip top-down, matching the stack", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <AreaChart title="Sightings logged" data={data} xKey="week" series={series} stacked />
    </div>,
  );
  await component.getByRole("application", { name: "Sightings logged" }).focus();
  const rows = component.locator(".recharts-tooltip-wrapper li");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText("Paper");
  await expect(rows.nth(2)).toContainText("Online");
});

test("AreaChart's table view lists every value", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <AreaChart title="Sightings logged" data={data} xKey="week" xLabel="Week" series={series} />
    </div>,
  );
  await component.getByRole("button", { name: "Table view" }).click();
  const table = component.getByRole("table", { name: "Sightings logged" });
  await expect(table.getByRole("columnheader")).toHaveText(["Week", "Online", "Chapter lead", "Paper"]);
  await expect(table.getByRole("row")).toHaveCount(data.length + 1);
});
