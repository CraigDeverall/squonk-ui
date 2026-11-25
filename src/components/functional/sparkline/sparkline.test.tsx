import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Card } from "../../layout/card/card";
import { Presentation } from "../../style/presentation/presentation";
import { Sparkline } from "./sparkline";

const sightings = [120, 132, 128, 151, 149, 170, 168, 182, 195, 191, 214, 230];

for (const mode of ["light", "dark"] as const) {
  test(`Default render of the Sparkline component (${mode})`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider mode={mode}>
        <Card>
          <Sparkline data={sightings} label="Sightings logged, last 12 weeks" />
          <Sparkline data={[...sightings].reverse()} label="Dues owing" slot={2} filled />
        </Card>
      </SquonkThemeProvider>,
    );
    await expect(await component.screenshot()).toMatchSnapshot();
  });
}

test("Sparkline is an image named with its first and last values", async ({ mount }) => {
  const component = await mount(<Sparkline data={[4200, 3900, 1500]} label="Dues owing, last 3 months" />);
  await expect(component).toHaveAttribute("role", "img");
  await expect(component).toHaveAccessibleName("Dues owing, last 3 months: 4,200 to 1,500");
});

test("Sparkline handles one value, no values and a flat line", async ({ mount }) => {
  const one = await mount(<Sparkline data={[42]} label="Credits" />);
  await expect(one).toHaveAccessibleName("Credits: 42");
  await expect(one.locator("svg")).toHaveCount(0);
  await one.unmount();
  const none = await mount(<Sparkline data={[]} label="Credits" />);
  await expect(none).toHaveAccessibleName("Credits: no data");
  await none.unmount();
  const flat = await mount(<Sparkline data={[5, 5, 5]} label="Members" />);
  await expect(flat.locator("path")).toHaveAttribute("d", "M0.00,50.00L50.00,50.00L100.00,50.00");
});

test("Sparkline height follows the Presentation register", async ({ mount }) => {
  const component = await mount(
    <div>
      <Presentation register="compact"><Sparkline data={sightings} label="Compact" /></Presentation>
      <Presentation register="hero"><Sparkline data={sightings} label="Hero" /></Presentation>
    </div>,
  );
  const compact = await component.getByRole("img", { name: /^Compact/ }).boundingBox();
  const hero = await component.getByRole("img", { name: /^Hero/ }).boundingBox();
  expect(compact!.height).toBe(20);
  expect(hero!.height).toBe(44);
});
