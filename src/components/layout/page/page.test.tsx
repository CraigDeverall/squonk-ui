import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Page } from "./page";
import { SquonkThemeProvider } from "../../../theme/theme-provider";

test("Renders the Page", async ({ mount }) => {
  const component = await mount(<Page>Hello World</Page>);
  await expect(await component.screenshot()).toMatchSnapshot();
});


test("Page can use an explicitly constrained parent viewport", async ({ mount }) => {
  const parent = await mount(
    <div style={{ width: 220, height: 160 }}>
      <Page style={{ width: "100%", height: "100%" }}>
        <div style={{ height: 400 }}>Scrollable content</div>
      </Page>
    </div>,
  );
  const page = parent.locator("main");
  expect((await page.boundingBox())?.width).toBe(220);
  expect((await page.boundingBox())?.height).toBe(160);
  expect(await page.evaluate((node) => node.scrollHeight)).toBe(400);
});

test("Page paints no background image by default", async ({ mount, page }) => {
  await mount(<Page>Hello World</Page>);
  expect(await page.locator("main").evaluate((node) => getComputedStyle(node).backgroundImage)).toBe("none");
});

for (const mode of ["light", "dark"] as const) {
  test(`Page paints the theme's background image for ${mode} mode, fixed to the screen`, async ({ mount, page }) => {
    await mount(
      <SquonkThemeProvider
        mode={mode}
        roleBindings={{
          "components.page.backgroundImage": {
            light: "linear-gradient(rgb(255, 255, 255), rgb(219, 234, 254))",
            dark: "linear-gradient(rgb(30, 27, 75), rgb(2, 6, 23))",
          },
        }}
      >
        <Page>Hello World</Page>
      </SquonkThemeProvider>,
    );
    const styles = await page.locator("main").evaluate((node) => {
      const s = getComputedStyle(node);
      return { image: s.backgroundImage, attachment: s.backgroundAttachment, repeat: s.backgroundRepeat, color: s.backgroundColor };
    });
    expect(styles.image).toBe(
      mode === "dark" ? "linear-gradient(rgb(30, 27, 75), rgb(2, 6, 23))" : "linear-gradient(rgb(255, 255, 255), rgb(219, 234, 254))",
    );
    expect(styles.attachment).toBe("fixed");
    expect(styles.repeat).toBe("no-repeat");
    // The page colour stays underneath.
    expect(styles.color).not.toBe("rgba(0, 0, 0, 0)");
  });
}
