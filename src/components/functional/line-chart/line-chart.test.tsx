import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Card } from "../../layout/card/card";
import { LineChart } from "./line-chart";

const data = [
  { month: "Jan", dues: 41200, levy: 58300 },
  { month: "Feb", dues: 39800, levy: 57100 },
  { month: "Mar", dues: 45600, levy: 60400 },
  { month: "Apr", dues: 43100, levy: 59800 },
  { month: "May", dues: 47900, levy: 61200 },
  { month: "Jun", dues: 52300, levy: 63900 },
];

const series = [
  { key: "levy" as const, label: "Swamp Fund levy" },
  { key: "dues" as const, label: "Annual dues" },
];

for (const mode of ["light", "dark"] as const) {
  test(`Default render of the LineChart component (${mode})`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider mode={mode}>
        <div style={{ width: 640 }}>
          <Card>
            <LineChart title="Dues collected by month" description="NZD, 2026" data={data} xKey="month" xLabel="Month" series={series} />
          </Card>
        </div>
      </SquonkThemeProvider>,
    );
    await expect(component.locator(".recharts-line-curve")).toHaveCount(2);
    await expect(await component.screenshot({ animations: "disabled" })).toMatchSnapshot();
  });
}

test("LineChart is a named figure with a legend for two series", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <LineChart title="Dues collected by month" description="NZD, 2026" data={data} xKey="month" series={series} />
    </div>,
  );
  const figure = component.getByRole("figure", { name: "Dues collected by month" });
  await expect(figure).toBeVisible();
  await expect(figure).toHaveAccessibleDescription("NZD, 2026");
  await expect(component.getByRole("list", { name: "Legend" }).getByRole("listitem")).toHaveText(["Swamp Fund levy", "Annual dues"]);
  await expect(component.getByRole("application", { name: "Dues collected by month" })).toHaveAttribute("tabindex", "0");
});

test("A single LineChart series needs no legend", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <LineChart title="Annual dues by month" data={data} xKey="month" series={[{ key: "dues", label: "Annual dues" }]} />
    </div>,
  );
  await expect(component.getByRole("list", { name: "Legend" })).toHaveCount(0);
});

test("LineChart shows each series' value on hover and from the keyboard", async ({ mount, page }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <LineChart title="Dues collected by month" data={data} xKey="month" series={series} />
    </div>,
  );
  const plot = component.locator(".recharts-wrapper");
  const box = (await plot.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height / 2);
  const tooltip = component.locator(".recharts-tooltip-wrapper");
  await expect(tooltip).toContainText("Swamp Fund levy");
  await expect(tooltip).toContainText("Annual dues");
  await page.mouse.move(0, 0);

  // Focus shows the first point; the arrow keys step from there.
  await component.getByRole("application").focus();
  await expect(tooltip).toContainText("Jan");
  await page.keyboard.press("ArrowRight");
  await expect(tooltip).toContainText("Feb");
  await expect(tooltip).toContainText("57,100");
});

test("LineChart's table view lists every value", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <LineChart title="Dues collected by month" data={data} xKey="month" xLabel="Month" series={series} />
    </div>,
  );
  const toggle = component.getByRole("button", { name: "Table view" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  const table = component.getByRole("table", { name: "Dues collected by month" });
  await expect(table.getByRole("columnheader")).toHaveText(["Month", "Swamp Fund levy", "Annual dues"]);
  await expect(table.getByRole("row").nth(1)).toContainText("Jan");
  await expect(table.getByRole("row").nth(1)).toContainText("58,300");
  await expect(component.locator(".recharts-wrapper")).toHaveCount(0);
  await toggle.press("Space");
  await expect(component.locator(".recharts-wrapper")).toHaveCount(1);
});

test("A pinned LineChart series keeps its palette slot", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <LineChart title="Annual dues" data={data} xKey="month" series={[{ key: "dues", label: "Annual dues", slot: 3 }]} />
    </div>,
  );
  await expect(component.locator(".recharts-line-curve")).toHaveAttribute("stroke", "var(--chart-series-3)");
});

test("LineChart shows loading and empty states without a table toggle", async ({ mount }) => {
  const loading = await mount(
    <div style={{ width: 640 }}>
      <LineChart title="Dues collected" data={data} xKey="month" series={series} loading />
    </div>,
  );
  await expect(loading.getByRole("figure")).toHaveAttribute("aria-busy", "true");
  await expect(loading.getByRole("button", { name: "Table view" })).toHaveCount(0);
  await loading.unmount();

  const empty = await mount(
    <div style={{ width: 640 }}>
      <LineChart title="Dues collected" data={[] as typeof data} xKey="month" series={series} empty="No sightings logged" />
    </div>,
  );
  await expect(empty).toContainText("No sightings logged");
  await expect(empty.getByRole("button", { name: "Table view" })).toHaveCount(0);
});

test("A hidden LineChart title still names the figure", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 640 }}>
      <LineChart title="Dues collected by month" hideTitle data={data} xKey="month" series={series} />
    </div>,
  );
  await expect(component.getByRole("figure", { name: "Dues collected by month" })).toBeVisible();
  const clip = await component.getByText("Dues collected by month").evaluate((el) => getComputedStyle(el.parentElement!).clip);
  expect(clip).toBe("rect(0px, 0px, 0px, 0px)");
});

test("Value-axis labels fit when the top tick rounds past the data", async ({ mount, page }) => {
  // 0–84 draws ticks up to "100", one digit wider than the data's maximum.
  await mount(
    <SquonkThemeProvider>
      <div style={{ width: 640 }}>
        <LineChart
          title="Night-watch turnout by month"
          data={[
            { month: "Jun", auckland: 64, waikato: 38 },
            { month: "Jul", auckland: 71, waikato: 41 },
            { month: "Aug", auckland: 84, waikato: 58 },
          ]}
          xKey="month"
          series={[
            { key: "auckland", label: "Auckland" },
            { key: "waikato", label: "Waikato" },
          ]}
        />
      </div>
    </SquonkThemeProvider>,
  );
  const ticks = page.locator(".recharts-cartesian-axis-tick-value");
  await expect(ticks.filter({ hasText: /^100$/ })).toHaveCount(1);
  const overflow = await page.locator("svg.recharts-surface").first().evaluate((svg) => {
    const left = svg.getBoundingClientRect().left;
    return [...svg.querySelectorAll(".recharts-cartesian-axis-tick-value")]
      .filter((t) => t.getBoundingClientRect().left < left - 0.5)
      .map((t) => t.textContent);
  });
  expect(overflow).toEqual([]);
});
