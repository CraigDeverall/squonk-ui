import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Header, FixedHeader } from "./header";
import { SquonkThemeProvider } from "../../../theme/theme-provider";

test("Default render of the Header component", async ({ mount }) => {
  const component = await mount(
    
    <Header>Brand spanking new component</Header>
    
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});


for (const [background, expected] of [
  ["#fff", "rgba(255, 255, 255, 0.8)"],
  ["#ffffff", "rgba(255, 255, 255, 0.8)"],
  ["white", "rgba(255, 255, 255, 0.8)"],
  ["rgb(255, 255, 255)", "rgba(255, 255, 255, 0.8)"],
  ["rgba(255, 255, 255, 0.4)", "rgba(255, 255, 255, 0.32)"],
]) {
  test(`Translucent header accepts ${background}`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider primitives={{ colors: { backgroundDefault: background } }}>
        <FixedHeader>Navigation</FixedHeader>
      </SquonkThemeProvider>,
    );
    await expect(component).toHaveCSS("background-color", expected);
  });
}

test("Translucent header resolves a browser CSS variable", async ({ mount }) => {
  const parent = await mount(
    <div style={{ "--header-background": "rgb(255, 255, 255)" } as React.CSSProperties}>
      <SquonkThemeProvider primitives={{ colors: { backgroundDefault: "var(--header-background)" } }}>
        <Header tone="translucent">Navigation</Header>
      </SquonkThemeProvider>
    </div>,
  );
  // CSS color-mix serializes to color(srgb …) in Chromium.
  await expect(parent.locator("header")).toHaveCSS("background-color", "color(srgb 1 1 1 / 0.8)");
});
