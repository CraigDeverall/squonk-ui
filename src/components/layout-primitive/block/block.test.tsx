import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { ThemeStyleBlock } from "../../style/theme-style-block/theme-style-block";
import { Text } from "../../functional-primitive/text/text";
import Color from "color";
import { theme } from "../../../theme/theme";
import { Block } from "./block";

test("Default render of the Block component", async ({ mount }) => {
  const component = await mount(
    <Block padding="md" background="surface" radius="md" bordered>
      Brand spanking new component
    </Block>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});


test("Full width includes padding and borders without a reset", async ({ mount }) => {
  const parent = await mount(
    <div style={{ width: 200 }}>
      <Block width="full" padding="md" bordered>Content</Block>
    </div>,
  );
  const block = parent.locator(":scope > div");
  await expect(block).toHaveCSS("box-sizing", "border-box");
  // Mobile device scaling can introduce fractional CSS-pixel rounding.
  expect((await block.boundingBox())?.width).toBeCloseTo(200, 3);
  expect(await parent.evaluate((node) => node.scrollWidth)).toBe(200);
});

test("A default-valued theme inside a re-themed ancestor does not inherit the ancestor's values", async ({ mount }) => {
  const component = await mount(
    <SquonkThemeProvider mode="dark">
      <Block padding="md">
        <ThemeStyleBlock invertMode>
          <Text data-testid="light">Light text</Text>
        </ThemeStyleBlock>
      </Block>
    </SquonkThemeProvider>,
  );
  await expect(component.getByTestId("light")).toHaveCSS("color", Color(theme.colors.text.primary).rgb().string());
});
