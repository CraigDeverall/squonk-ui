import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Card } from "../../layout/card/card";
import { Meter } from "./meter";

for (const mode of ["light", "dark"] as const) {
  test(`Default render of the Meter component (${mode})`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider mode={mode}>
        <div style={{ width: 320 }}>
          <Card>
            <Meter label="Storage" value={20} maxValue={60} valueLabel="20 of 60 GB" showValue warningAt={48} criticalAt={57} />
            <Meter label="Storage" value={50} maxValue={60} valueLabel="50 of 60 GB" showValue warningAt={48} criticalAt={57} />
            <Meter label="Storage" value={58} maxValue={60} valueLabel="58 of 60 GB" showValue warningAt={48} criticalAt={57} />
          </Card>
        </div>
      </SquonkThemeProvider>,
    );
    await expect(await component.screenshot()).toMatchSnapshot();
  });
}

test("Meter exposes its range and spoken value", async ({ mount, page }) => {
  const component = await mount(<Meter label="Document storage" value={42} maxValue={60} valueLabel="42 of 60 GB" showValue />);
  const meter = page.getByRole("meter", { name: "Document storage" });
  await expect(meter).toHaveAttribute("aria-valuenow", "42");
  await expect(meter).toHaveAttribute("aria-valuemax", "60");
  await expect(meter).toHaveAttribute("aria-valuetext", "42 of 60 GB");
  await expect(component).toContainText("42 of 60 GB");
});

test("Meter fill turns to warning and critical at its thresholds", async ({ mount }) => {
  const component = await mount(
    <div>
      <Meter ariaLabel="Low" value={10} warningAt={70} criticalAt={90} />
      <Meter ariaLabel="High" value={75} warningAt={70} criticalAt={90} />
      <Meter ariaLabel="Full" value={95} warningAt={70} criticalAt={90} />
    </div>,
  );
  for (const [name, level] of [["Low", "normal"], ["High", "warning"], ["Full", "critical"]]) {
    await expect(component.getByRole("meter", { name })).toHaveAttribute("data-level", level);
  }
});

test("Meter fill width matches its share of the range", async ({ mount, page }) => {
  await mount(
    <div style={{ width: 200 }}>
      <Meter ariaLabel="Instalments" value={3} minValue={0} maxValue={12} />
    </div>,
  );
  const meter = page.getByRole("meter");
  await expect(meter).toHaveAttribute("aria-valuetext", "25%");
  const width = await meter.locator("div > div").last().evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeCloseTo(50, 0);
});
