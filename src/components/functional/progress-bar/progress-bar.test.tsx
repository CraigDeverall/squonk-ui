import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { ProgressBar } from "./progress-bar";

const added = { violet: { light: "#7c3aed", dark: "#a78bfa" } };
const inlineTone = (node: HTMLElement | SVGElement) => node.style.getPropertyValue("--tone-solid");

test("Default render of the ProgressBar component", async ({ mount }) => {
  const component = await mount(
    <ProgressBar value={40} label="Uploading…" showValue />
  );
  await expect(
    await component.screenshot({ animations: "disabled" })
  ).toMatchSnapshot();
});

test("Visible and explicit ProgressBar labels name the progress correctly", async ({ mount }) => {
  const component = await mount(<><ProgressBar label={<strong>Upload</strong>} value={140} /><ProgressBar label="Visible" ariaLabel="Background sync" /></>);
  await expect(component.getByRole("progressbar", { name: "Upload", exact: true })).toHaveAttribute("aria-valuenow", "100");
  await expect(component.getByRole("progressbar", { name: "Background sync", exact: true })).not.toHaveAttribute("aria-valuenow");
});

test("A colour the theme added is a custom tone; a built-in tone is unchanged", async ({ mount, page }) => {
  await mount(
    <SquonkThemeProvider addedColorPrimitives={added}>
      <ProgressBar value={40} tone="violet" label="Custom" />
      <ProgressBar value={40} tone="success" label="Built in" />
      <ProgressBar value={40} label="Default" />
    </SquonkThemeProvider>,
  );
  const fill = (name: string) => page.getByRole("progressbar", { name }).evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--progress-color").trim());
  const custom = page.getByRole("progressbar", { name: "Custom" });
  await expect(custom).toHaveAttribute("data-tone", "custom");
  expect(await custom.evaluate(inlineTone)).toBe("var(--squonk-colors-tone-violet-solid)");
  // The bar takes the added colour, not the default accent.
  expect(await fill("Custom")).not.toBe("");
  expect(await fill("Custom")).not.toBe(await fill("Default"));
  const builtIn = page.getByRole("progressbar", { name: "Built in" });
  await expect(builtIn).toHaveAttribute("data-tone", "success");
  expect(await builtIn.evaluate(inlineTone)).toBe("");
});
