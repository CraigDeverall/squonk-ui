import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { PrintableStatement } from "./printable.showcase";

test("with a Printable, only its area prints; PrintOnly shows only on paper", async ({ mount, page }) => {
  const c = await mount(<PrintableStatement />);
  await expect(c.getByTestId("letterhead")).toBeHidden();
  await expect(c.getByTestId("app-bar")).toBeVisible();

  await page.emulateMedia({ media: "print" });
  await expect(c.getByTestId("statement-heading")).toBeVisible();
  await expect(c.getByTestId("letterhead")).toBeVisible();
  await expect(c.getByTestId("reference")).toBeVisible();
  await expect(c.getByTestId("screen-intro")).toBeHidden();
  await expect(c.getByTestId("app-bar")).toBeHidden();
  await expect(c.getByTestId("screen-help")).toBeHidden();
  // Buttons act; paper can't.
  await expect(c.getByTestId("pay-button")).toBeHidden();
});

test("without a Printable the whole page prints, except NotPrintable areas", async ({ mount, page }) => {
  const c = await mount(<PrintableStatement withPrintable={false} />);
  await page.emulateMedia({ media: "print" });
  await expect(c.getByTestId("screen-intro")).toBeVisible();
  await expect(c.getByTestId("statement-heading")).toBeVisible();
  await expect(c.getByTestId("app-bar")).toBeHidden();
  await expect(c.getByTestId("screen-help")).toBeHidden();
});

test("on paper the theme prints ink on white, with no shadows", async ({ mount, page }) => {
  const c = await mount(
    <SquonkThemeProvider mode="dark">
      <PrintableStatement />
    </SquonkThemeProvider>,
  );
  await page.emulateMedia({ media: "print" });
  const card = c.getByTestId("statement-card");
  await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(c.getByTestId("statement-heading")).toHaveCSS("color", "rgb(17, 17, 17)");
  // Every shadow layer is transparent (the theme's shadows are re-pointed, not removed).
  expect(await card.evaluate((el) => getComputedStyle(el).boxShadow)).toMatch(/^(none|(rgba\(0, 0, 0, 0\)[^,]*(, )?)+)$/);
});

test("printBackgrounds keeps the theme's own colours on paper", async ({ mount, page }) => {
  const c = await mount(
    <SquonkThemeProvider mode="dark" primitives={{ printBackgrounds: true }}>
      <PrintableStatement />
    </SquonkThemeProvider>,
  );
  await page.emulateMedia({ media: "print" });
  await expect(c.getByTestId("statement-card")).not.toHaveCSS("background-color", "rgb(255, 255, 255)");
});

test("printed links show their address, unless printLinkUrls is off", async ({ mount, page }) => {
  const after = (testId: string) =>
    page.getByTestId(testId).evaluate((el) => {
      const style = getComputedStyle(el, "::after");
      return style.display === "none" ? "hidden" : style.content;
    });
  const c = await mount(<PrintableStatement />);
  await page.emulateMedia({ media: "print" });
  // Each engine reports it differently (resolved, as written, or as separate
  // strings), but each shows the address or the attr(href) that prints it.
  expect(await after("pay-link")).toMatch(/https:\/\/example\.org\/pay|attr\(href\)/);
  await c.unmount();

  await mount(
    <SquonkThemeProvider primitives={{ printLinkUrls: false }}>
      <PrintableStatement />
    </SquonkThemeProvider>,
  );
  expect(await after("pay-link")).toBe("hidden");
});

test("the statement on paper", async ({ mount, page }) => {
  const c = await mount(<PrintableStatement />);
  await page.emulateMedia({ media: "print" });
  await expect(c).toHaveScreenshot("printable-statement-print.png");
});
