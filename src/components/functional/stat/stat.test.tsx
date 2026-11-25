import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import Color from "color";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Card } from "../../layout/card/card";
import { Stat } from "./stat";

for (const mode of ["light", "dark"] as const) {
  test(`Default render of the Stat component (${mode})`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider mode={mode}>
        <div style={{ width: 280 }}>
          <Card>
            <Stat
              label="Dues collected"
              value="$86.6K"
              change={0.052}
              changeLabel="vs October 2025"
              trend={[71, 74, 73, 78, 80, 79, 83, 86.6]}
              trendLabel="Dues collected, last 8 months"
            />
          </Card>
        </div>
      </SquonkThemeProvider>,
    );
    await expect(await component.screenshot()).toMatchSnapshot();
  });
}

test("Stat pairs its label and figure as a description list", async ({ mount }) => {
  const component = await mount(<Stat label="Sightings logged" value="1,284" />);
  await expect(component.locator("dt")).toHaveText("Sightings logged");
  await expect(component.locator("dd").first()).toHaveText("1,284");
});

test("Stat says the direction of a change in words, not only colour", async ({ mount }) => {
  const up = await mount(<Stat label="Sightings logged" value="1,284" change={0.124} changeLabel="vs last month" />);
  await expect(up.locator("dd").nth(1)).toHaveText("Up +12.4%vs last month");
  await up.unmount();
  const down = await mount(<Stat label="Overdue dues" value="$3.6K" change={-0.061} increaseIs="bad" />);
  await expect(down.locator("dd").nth(1)).toContainText("Down");
  await expect(down.locator("dd").nth(1)).toContainText("6.1%");
  await down.unmount();
  const flat = await mount(<Stat label="Members" value="1,204" change={0} />);
  await expect(flat.locator("dd").nth(1)).toContainText("No change");
});

test("Stat colours a change by whether a rise is good news", async ({ mount }) => {
  const component = await mount(
    <div>
      <Stat label="Dues collected" value="$1K" change={0.1} />
      <Stat label="Overdue dues" value="$1K" change={0.1} increaseIs="bad" />
      <Stat label="Headcount" value="40" change={0.1} increaseIs="neutral" />
    </div>,
  );
  const tones = await component.locator("[data-tone]").evaluateAll((els) => els.map((el) => el.getAttribute("data-tone")));
  expect(tones).toEqual(["good", "bad", "neutral"]);
  const good = await component.locator("[data-tone=good]").getByText("+10%").evaluate((el) => getComputedStyle(el).color);
  const bad = await component.locator("[data-tone=bad]").getByText("+10%").evaluate((el) => getComputedStyle(el).color);
  expect(good).not.toBe(bad);
  const background = "#ffffff";
  for (const color of [good, bad]) expect(Color(color).contrast(Color(background))).toBeGreaterThanOrEqual(4.5);
});

test("Stat's trend is a named sparkline", async ({ mount }) => {
  const component = await mount(<Stat label="Sightings" value="230" trend={[120, 230]} trendLabel="Sightings, last 2 weeks" />);
  await expect(component.getByRole("img")).toHaveAccessibleName("Sightings, last 2 weeks: 120 to 230");
});
