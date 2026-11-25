import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { InteractiveCard } from "./interactive-card";
import Color from "color";
import { Text } from "../../functional-primitive/text/text";
import { SquonkThemeProvider } from "../../../theme/theme-provider";

test("Default render of the InteractiveCard component", async ({ mount }) => {
  const component = await mount(
    <InteractiveCard>Hoverable surface</InteractiveCard>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

for (const mode of ["light", "dark"] as const) {
  test(`Featured interactive card content contrasts in ${mode}`, async ({ mount }) => {
    const component = await mount(<SquonkThemeProvider mode={mode}><InteractiveCard as="a" href="#details" variant="featured"><Text>Open details</Text></InteractiveCard></SquonkThemeProvider>);
    const background = await component.evaluate(node => getComputedStyle(node).backgroundColor);
    const foreground = await component.locator("p").evaluate(node => getComputedStyle(node).color);
    expect(Color(foreground).contrast(Color(background))).toBeGreaterThanOrEqual(4.5);
  });
}

// Regression: when rendered `as="a"` the default anchor underline used to
// leak through to text inside the card. The fix sets `text-decoration: none`
// on the styled root. Pin a snapshot of the anchor variant so a stray
// override doesn't reintroduce the underline.
test("InteractiveCard as anchor suppresses underline", async ({ mount }) => {
  const component = await mount(
    <InteractiveCard as="a" href="#example">
      Card-shaped link
    </InteractiveCard>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Action cards support keyboard activation without activating from nested controls", async ({ mount, page }) => {
  let activated = 0;
  let secondary = 0;
  await mount(<InteractiveCard aria-label="Open project" onClick={() => activated++}>
    <span>Project summary</span>
    <button onClick={() => secondary++}>Secondary action</button>
    <input aria-label="Project note" />
  </InteractiveCard>);
  const card = page.getByRole("button", { name: "Open project", exact: true });
  await card.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect.poll(() => activated).toBe(2);
  await page.getByRole("button", { name: "Secondary action" }).click();
  await page.keyboard.press("Enter");
  await expect.poll(() => secondary).toBe(2);
  await page.getByRole("textbox", { name: "Project note" }).fill("has spaces");
  expect(activated).toBe(2);
});

test("Native button cards activate once and default to a non-submitting button", async ({ mount, page }) => {
  let activated = 0;
  let submitted = 0;
  await mount(<form onSubmit={event => { event.preventDefault(); submitted++; }}>
    <InteractiveCard as="button" onClick={() => activated++}>Open details</InteractiveCard>
  </form>);
  const card = page.getByRole("button", { name: "Open details" });
  await expect(card).toHaveAttribute("type", "button");
  await card.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect.poll(() => activated).toBe(2);
  expect(submitted).toBe(0);
});
