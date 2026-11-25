import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Badge } from "./badge";

const added = { violet: { light: "#7c3aed", dark: "#a78bfa" } };
const inlineTone = (node: HTMLElement | SVGElement) => node.style.getPropertyValue("--tone-solid");

test("Default render of the Badge component", async ({ mount }) => {
  const component = await mount(<Badge tone="primary">Beta</Badge>);
  await expect(await component.screenshot()).toMatchSnapshot();
});

// Regression: neutral + subtle previously used `lighten(text.secondary, 0.45)`
// which produced a near-ink pill in light mode. The fix keys neutral-subtle
// off `background.subtle` + `text.secondary` so the chip recedes. Pinning a
// snapshot here so the receding behaviour isn't silently regressed.
test("Badge neutral subtle recedes against the page", async ({ mount }) => {
  const component = await mount(
    <Badge tone="neutral" variant="subtle">
      Draft
    </Badge>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

// Regression: info-tone subtle previously rendered as a mid-saturation
// teal-on-pale-teal pill that dipped below WCAG AA. The fix widened the
// spread (0.5 / 0.4) to match the `Alert` component's subtle styling.
test("Badge info subtle meets AA contrast", async ({ mount }) => {
  const component = await mount(
    <Badge tone="info" variant="subtle">
      Sync
    </Badge>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Pulsing Badge becomes static with reduced motion", async ({ mount, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const component = await mount(<Badge pulsing>Online</Badge>);
  // Decorative loops pause where they rest, rather than losing their animation.
  await expect(component.locator("[aria-hidden=true]")).toHaveCSS("animation-play-state", "paused");
});

test("A colour the theme added is a custom tone; a built-in tone is unchanged", async ({ mount, page }) => {
  await mount(
    <SquonkThemeProvider addedColorPrimitives={added}>
      <Badge tone="violet" data-testid="custom">Beta</Badge>
      <Badge tone="success" data-testid="built-in">Active</Badge>
    </SquonkThemeProvider>,
  );
  const custom = page.getByTestId("custom");
  await expect(custom).toHaveAttribute("data-tone", "custom");
  expect(await custom.evaluate(inlineTone)).toBe("var(--squonk-colors-tone-violet-solid)");
  expect(await custom.evaluate((node) => node.style.getPropertyValue("--tone-on-subtle"))).toBe("var(--squonk-colors-tone-violet-on-subtle)");
  // The palette resolves: the subtle pill has a fill.
  await expect(custom).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const builtIn = page.getByTestId("built-in");
  await expect(builtIn).toHaveAttribute("data-tone", "success");
  expect(await builtIn.evaluate(inlineTone)).toBe("");
});

test("Badge dot is a filled dot and text with no pill, for built-in and added tones", async ({ mount, page }) => {
  await mount(
    <SquonkThemeProvider addedColorPrimitives={added}>
      <Badge tone="success" variant="dot" data-testid="built-in">Active</Badge>
      <Badge tone="violet" variant="dot" data-testid="custom">Beta</Badge>
    </SquonkThemeProvider>,
  );
  for (const id of ["built-in", "custom"]) {
    const badge = page.getByTestId(id);
    await expect(badge).toHaveCSS("padding", "0px");
    await expect(badge).toHaveCSS("border-top-width", "0px");
    await expect(badge).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const dot = badge.locator("[aria-hidden=true]");
    await expect(dot).toHaveCount(1);
    await expect(dot).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    // The dot is the tone's fill; the text is the tone's readable text colour.
    const colors = await badge.evaluate((node) => ({
      text: getComputedStyle(node).color,
      dot: getComputedStyle(node.querySelector("[aria-hidden=true]")!).backgroundColor,
    }));
    expect(colors.text).not.toBe("rgb(0, 0, 0)");
    expect(colors.dot).not.toBe(colors.text);
  }
});

test("A pulsing dot Badge has one dot, which rests with reduced motion", async ({ mount, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const component = await mount(<Badge variant="dot" tone="success" pulsing>Live</Badge>);
  await expect(component.locator("[aria-hidden=true]")).toHaveCount(1);
  await expect(component.locator("[aria-hidden=true]")).toHaveCSS("animation-play-state", "paused");
});
