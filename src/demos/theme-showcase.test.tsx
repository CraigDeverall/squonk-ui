import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { ThemeShowcase } from "./theme-showcase";

test("Renders the same components in Tidepool and Monolith", async ({
  mount,
  page,
}) => {
  // The example themes' web fonts come from Google, which a test runner may
  // or may not reach. Block them so the snapshot always shows the fallback
  // fonts and is the same on every machine.
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort()
  );
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mount(<ThemeShowcase themes={["tidepool", "monolith"]} />);
  await expect(
    page.getByRole("heading", { level: 2, name: "Tidepool" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Monolith" })
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(await page.screenshot({ fullPage: true })).toMatchSnapshot();
});

test("Every example theme gets a band, named by its heading", async ({
  mount,
  page,
}) => {
  await mount(<ThemeShowcase />);
  for (const name of [
    "Squonk",
    "Kauri",
    "Fieldbook",
    "Tidepool",
    "Meridian",
    "Monolith",
    "Wayfinder",
    "Aurora",
  ]) {
    await expect(page.getByRole("region", { name })).toBeVisible();
  }
});

test("A theme's purpose decisions open to show the bindings behind it", async ({
  mount,
  page,
}) => {
  await mount(<ThemeShowcase themes={["monolith"]} />);
  const monolith = page.getByRole("region", { name: "Monolith" });
  await monolith.getByText(/purpose decisions/).click();
  await expect(
    monolith.getByText("underlinedFields", { exact: true })
  ).toBeVisible();
  await expect(
    monolith.getByText("roles.interaction.fieldFocusUnderline", { exact: true })
  ).toBeVisible();
  await expect(
    monolith.getByText("-3px", { exact: true }).first()
  ).toBeVisible();
});

test("Monolith rules its fields and capitalises its buttons; Tidepool fills its fields", async ({
  mount,
  page,
}) => {
  await mount(<ThemeShowcase themes={["monolith", "tidepool"]} />);
  const region = (theme: string) => page.getByRole("region", { name: theme });
  const field = (theme: string) =>
    region(theme).getByRole("textbox", { name: "Member name" });
  const style = (
    theme: string,
    property: "borderTopWidth" | "backgroundColor"
  ) => field(theme).evaluate((el, p) => getComputedStyle(el)[p], property);
  expect(await style("Monolith", "borderTopWidth")).toBe("0px");
  const secondary = region("Monolith").getByRole("button", {
    name: "Save draft",
  });
  expect(
    await secondary.evaluate((el) => getComputedStyle(el).textTransform)
  ).toBe("uppercase");
  // Filled: the field takes the well colour, not the panel's.
  const panel = await region("Tidepool").evaluate(
    (el) => getComputedStyle(el).backgroundColor
  );
  expect(await style("Tidepool", "backgroundColor")).not.toBe(panel);
});

test("Tidepool raises its buttons with pillow relief; Fieldbook stays flat", async ({
  mount,
  page,
}) => {
  await mount(<ThemeShowcase themes={["tidepool", "fieldbook"]} />);
  const region = (theme: string) => page.getByRole("region", { name: theme });
  const backgroundImage = (theme: string) =>
    region(theme)
      .getByRole("button", { name: "Save draft" })
      .evaluate((el) => getComputedStyle(el).backgroundImage);

  expect(await backgroundImage("Tidepool")).toMatch(/gradient/);
  expect(await backgroundImage("Fieldbook")).toBe("none");
});
