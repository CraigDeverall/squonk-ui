import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Sidebar } from "./sidebar";

test("Default render of the Sidebar component", async ({ mount }) => {
  const component = await mount(
    
    <Sidebar>Brand spanking new component</Sidebar>
    
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});


test("Sidebar width includes padding and its divider", async ({ mount }) => {
  const parent = await mount(
    <div style={{ display: "flex", width: 300 }}>
      <Sidebar>Navigation</Sidebar>
      <div style={{ flex: 1, minWidth: 0 }}>Content</div>
    </div>,
  );
  const sidebar = parent.locator("aside");
  expect((await sidebar.boundingBox())?.width).toBe(240);
  expect(await parent.evaluate((node) => node.scrollWidth)).toBe(300);
});
