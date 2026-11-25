import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Kbd } from "./kbd";
import { ThemeModifier } from "../../style/theme-modifier/theme-modifier";

test("Default render of the Kbd component", async ({ mount }) => {
  const component = await mount(<Kbd>⌘ K</Kbd>);
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Kbd derives its bevel from a browser-resolved surface without throwing", async ({ mount }) => {
  const component = await mount(<div style={{ "--subtle": "#ddeeff" } as React.CSSProperties}>
    <ThemeModifier override={{ colors: { background: { subtle: "var(--subtle)" } } }}><Kbd>Ctrl K</Kbd></ThemeModifier>
  </div>);
  const key = component.locator("kbd");
  await expect(key).toHaveText("Ctrl K");
  await expect(key).not.toHaveCSS("box-shadow", "none");
});
