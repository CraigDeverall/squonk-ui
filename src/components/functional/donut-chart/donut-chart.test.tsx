import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Card } from "../../layout/card/card";
import { DonutChart } from "./donut-chart";

const dueTypes = [
  { type: "Annual dues", amount: 384 },
  { type: "Swamp Fund levy", amount: 261 },
  { type: "Night-watch kit hire", amount: 179 },
  { type: "Field-trip deposit", amount: 42 },
];

const chapters = [
  { chapter: "Auckland", sightings: 3420 },
  { chapter: "Wellington", sightings: 2810 },
  { chapter: "Canterbury", sightings: 2290 },
  { chapter: "Waikato", sightings: 2140 },
  { chapter: "Bay of Plenty", sightings: 1380 },
  { chapter: "Otago", sightings: 420 },
  { chapter: "Taranaki", sightings: 260 },
  { chapter: "Northland", sightings: 140 },
  { chapter: "Southland", sightings: 90 },
];

for (const mode of ["light", "dark"] as const) {
  test(`Default render of the DonutChart component (${mode})`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider mode={mode}>
        <div style={{ width: 420 }}>
          <Card>
            <DonutChart title="Dues collected by type" data={dueTypes} nameKey="type" valueKey="amount" />
          </Card>
        </div>
      </SquonkThemeProvider>,
    );
    await expect(component.locator(".recharts-pie-sector")).toHaveCount(4);
    await expect(await component.screenshot({ animations: "disabled" })).toMatchSnapshot();
  });
}

test("DonutChart shows the total in the centre", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 420 }}>
      <DonutChart title="Dues collected" data={dueTypes} nameKey="type" valueKey="amount" totalLabel="Collected" />
    </div>,
  );
  await expect(component).toContainText("866");
  await expect(component).toContainText("Collected");
});

test("DonutChart folds parts past the seventh into Other, and the table keeps them all", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 420 }}>
      <DonutChart title="Sightings by chapter" data={chapters} nameKey="chapter" valueKey="sightings" nameLabel="Chapter" />
    </div>,
  );
  await expect(component.locator(".recharts-pie-sector")).toHaveCount(8);
  const legend = component.getByRole("list", { name: "Legend" }).getByRole("listitem");
  await expect(legend).toHaveCount(8);
  await expect(legend.last()).toHaveText("Other");

  await component.getByRole("button", { name: "Table view" }).click();
  const table = component.getByRole("table", { name: "Sightings by chapter" });
  await expect(table.getByRole("columnheader")).toHaveText(["Chapter", "Value", "Share"]);
  await expect(table.getByRole("row")).toHaveCount(chapters.length + 1);
  await expect(table).toContainText("Southland");
});

test("DonutChart's tooltip names a slice with its value and share", async ({ mount, page }) => {
  const component = await mount(
    <div style={{ width: 420 }}>
      <DonutChart title="Dues collected" data={dueTypes} nameKey="type" valueKey="amount" />
    </div>,
  );
  // The focusable plot surface sits over the sectors, so point at the slice's middle.
  const box = (await component.locator(".recharts-pie-sector").first().boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.25);
  const tooltip = component.locator(".recharts-tooltip-wrapper");
  await expect(tooltip).toContainText("Annual dues");
  await expect(tooltip).toContainText("44.3%");
  await page.mouse.move(0, 0);
});

test("DonutChart can leave its centre empty", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 420 }}>
      <DonutChart title="Dues collected" data={dueTypes} nameKey="type" valueKey="amount" hideTotal />
    </div>,
  );
  await expect(component).not.toContainText("Total");
});
