import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Alert } from "./alert";
import Color from "color";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Code } from "../../functional-primitive/code/code";
import { Kbd } from "../../functional-primitive/kbd/kbd";
import { Text } from "../../functional-primitive/text/text";

const added = { violet: { light: "#7c3aed", dark: "#a78bfa" } };
const inlineTone = (node: HTMLElement | SVGElement) => node.style.getPropertyValue("--tone-solid");

test("Default render of the Alert component", async ({ mount }) => {
  const component = await mount(
    <Alert tone="info" title="Heads up">
      A new version is available.
    </Alert>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

for (const tone of ["info", "success", "warning", "error"] as const) {
  test(`Dark ${tone} Alert respects independently painted Code and Kbd`, async ({ mount }) => {
    const component = await mount(<SquonkThemeProvider mode="dark"><Alert tone={tone}><Text>Details</Text><Code>install</Code><Kbd>Enter</Kbd></Alert></SquonkThemeProvider>);
    const background = await component.evaluate(node => getComputedStyle(node).backgroundColor);
    const text = await component.locator("p").evaluate(node => getComputedStyle(node).color);
    expect(Color(text).contrast(Color(background))).toBeGreaterThanOrEqual(4.5);
    for (const selector of ["code", "kbd"]) {
      const colors = await component.locator(selector).evaluate(node => ({ color: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor }));
      expect(Color(colors.color).contrast(Color(colors.background))).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test("Dismissing an Alert does not submit its enclosing form", async ({ mount }) => {
  let submits = 0;
  let dismissed = 0;
  const component = await mount(<form onSubmit={(event) => { event.preventDefault(); submits++; }}><Alert onDismiss={() => dismissed++}>Notice</Alert></form>);
  await component.getByRole("button", { name: "Dismiss" }).click();
  await expect.poll(() => dismissed).toBe(1);
  expect(submits).toBe(0);
});

test("Alert keeps its accent edge by default; tinted has no edge and no border", async ({ mount, page }) => {
  await mount(
    <div>
      <Alert tone="info" data-testid="accent">Notice</Alert>
      <Alert tone="info" variant="tinted" data-testid="tinted">Notice</Alert>
    </div>,
  );
  const accent = page.getByTestId("accent");
  await expect(accent).toHaveCSS("border-left-width", "4px");
  await expect(accent).toHaveCSS("border-top-width", "1px");
  const tinted = page.getByTestId("tinted");
  for (const side of ["top", "right", "bottom", "left"]) await expect(tinted).toHaveCSS(`border-${side}-width`, "0px");
  // Same wash, same text.
  const background = await accent.evaluate((node) => getComputedStyle(node).backgroundColor);
  await expect(tinted).toHaveCSS("background-color", background);
  await expect(tinted).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

for (const mode of ["light", "dark"] as const) {
  test(`A colour the theme added is a custom Alert tone, readable in ${mode} mode`, async ({ mount, page }) => {
    await mount(
      <SquonkThemeProvider mode={mode} addedColorPrimitives={added}>
        <Alert tone="violet" title="Preview" data-testid="custom"><Text>Details</Text></Alert>
        <Alert tone="success" data-testid="built-in">Saved</Alert>
      </SquonkThemeProvider>,
    );
    const custom = page.getByTestId("custom");
    await expect(custom).toHaveAttribute("data-tone", "custom");
    expect(await custom.evaluate(inlineTone)).toBe("var(--squonk-colors-tone-violet-solid)");
    expect(await custom.evaluate((node) => node.style.getPropertyValue("--tone-wash"))).toBe("var(--squonk-colors-tone-violet-wash)");
    // An added colour has no severity: it is announced politely.
    await expect(custom).toHaveAttribute("role", "status");
    const background = await custom.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
    for (const selector of ["strong", "p"]) {
      const text = await custom.locator(selector).evaluate((node) => getComputedStyle(node).color);
      expect(Color(text).contrast(Color(background))).toBeGreaterThanOrEqual(4.5);
    }
    const builtIn = page.getByTestId("built-in");
    await expect(builtIn).toHaveAttribute("data-tone", "success");
    expect(await builtIn.evaluate(inlineTone)).toBe("");
  });
}
