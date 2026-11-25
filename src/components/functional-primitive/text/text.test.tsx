import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import Color from "color";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Block } from "../../layout-primitive/block/block";
import { Text } from "./text";

const added = { violet: { light: "#7c3aed", dark: "#a78bfa" } };
const inlineTone = (node: HTMLElement | SVGElement) => node.style.getPropertyValue("--tone-solid");

test("Default render of the Text component", async ({ mount }) => {
  const component = await mount(<Text>The quick brown fox.</Text>);
  await expect(await component.screenshot()).toMatchSnapshot();
});

for (const mode of ["light", "dark"] as const) {
  test(`A colour the theme added is a custom Text tone, readable in ${mode} mode`, async ({ mount, page }) => {
    await mount(
      <SquonkThemeProvider mode={mode} addedColorPrimitives={added}>
        <Block background="default" data-testid="page">
          <Text tone="violet" data-testid="custom">Violet</Text>
          <Text tone="success" data-testid="built-in">Saved</Text>
          <Text data-testid="default">Body</Text>
        </Block>
      </SquonkThemeProvider>,
    );
    const color = (id: string) => page.getByTestId(id).evaluate((node) => getComputedStyle(node).color);
    const custom = page.getByTestId("custom");
    await expect(custom).toHaveAttribute("data-tone", "custom");
    expect(await custom.evaluate((node) => node.style.getPropertyValue("--tone-outline-text"))).toBe("var(--squonk-colors-tone-violet-outline-text)");
    // It takes the added colour's text part, and reads on the page.
    expect(await color("custom")).not.toBe(await color("default"));
    const background = await page.getByTestId("page").evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(Color(await color("custom")).contrast(Color(background))).toBeGreaterThanOrEqual(4.5);
    const builtIn = page.getByTestId("built-in");
    await expect(builtIn).toHaveAttribute("data-tone", "success");
    expect(await builtIn.evaluate(inlineTone)).toBe("");
    await expect(page.getByTestId("default")).toHaveAttribute("data-tone", "primary");
  });
}

test("Text eyebrow is a small, bold, uppercase, letter-spaced label that keeps its tone", async ({ mount, page }) => {
  await mount(
    <div>
      <Text variant="eyebrow" tone="secondary" data-testid="eyebrow">Case 2041</Text>
      <Text tone="secondary" data-testid="body">Case 2041</Text>
    </div>,
  );
  const eyebrow = page.getByTestId("eyebrow");
  const body = page.getByTestId("body");
  await expect(eyebrow).toHaveAttribute("data-variant", "eyebrow");
  await expect(eyebrow).toHaveCSS("text-transform", "uppercase");
  await expect(eyebrow).toHaveCSS("font-weight", "700");
  await expect(eyebrow).not.toHaveCSS("letter-spacing", "normal");
  const size = (node: HTMLElement | SVGElement) => parseFloat(getComputedStyle(node).fontSize);
  expect(await eyebrow.evaluate(size)).toBeLessThan(await body.evaluate(size));
  await expect(eyebrow).toHaveCSS("color", await body.evaluate((node) => getComputedStyle(node).color));
  // Body text is as it was: no variant attribute, regular weight, no capitals.
  await expect(body).not.toHaveAttribute("data-variant");
  await expect(body).toHaveCSS("text-transform", "none");
  await expect(body).toHaveCSS("font-weight", "400");
});
