import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Grid } from "./grid";

test("Default render of the Grid component", async ({ mount }) => {
  const component = await mount(
    
    <Grid>Brand spanking new component</Grid>
    
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});


test("Auto-fit columns shrink below their preferred minimum", async ({ mount }) => {
  const parent = await mount(
    <div style={{ width: 160 }}>
      <Grid minColumnWidth="240px"><div>One</div><div>Two</div></Grid>
    </div>,
  );
  const grid = parent.locator(":scope > div");
  await expect(grid).toHaveCSS("grid-template-columns", "160px");
  expect(await parent.evaluate((node) => node.scrollWidth)).toBe(160);
});
