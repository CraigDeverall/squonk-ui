import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Code } from "./code";

test("Default render of the Code component", async ({ mount }) => {
  const component = await mount(<Code>npm install @squonk/ui</Code>);
  await expect(await component.screenshot()).toMatchSnapshot();
});


test("Block code contains long lines without a global reset", async ({ mount }) => {
  const parent = await mount(
    <div style={{ width: 200 }}>
      <Code block>{"a".repeat(120)}</Code>
    </div>,
  );
  const code = parent.locator("pre");
  await expect(code).toHaveCSS("box-sizing", "border-box");
  await expect(code).toHaveCSS("margin", "0px");
  // Mobile device scaling can introduce fractional CSS-pixel rounding.
  expect((await code.boundingBox())?.width).toBeCloseTo(200, 3);
  const dimensions = await code.evaluate((node) => ({
    client: node.clientWidth,
    scroll: node.scrollWidth,
    parentClient: node.parentElement!.clientWidth,
    parentScroll: node.parentElement!.scrollWidth,
  }));
  expect(dimensions.scroll).toBeGreaterThan(dimensions.client);
  expect(dimensions.parentScroll).toBe(dimensions.parentClient);
});
