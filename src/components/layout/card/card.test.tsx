import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Card } from "./card";
import Color from "color";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { ThemeStyleBlock } from "../../style/theme-style-block/theme-style-block";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";
import { Code } from "../../functional-primitive/code/code";
import { Kbd } from "../../functional-primitive/kbd/kbd";
import { Link } from "../../functional/link/link";
import { Button } from "../../functional/button/button";
import { Block } from "../../layout-primitive/block/block";
import { Header } from "../header/header";
import { Footer } from "../footer/footer";
import { Sidebar } from "../sidebar/sidebar";
import { Page } from "../page/page";
import { Section } from "../section/section";

test("Default render of the Card component", async ({ mount }) => {
  const component = await mount(
    
    <Card>Brand spanking new component</Card>
    
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

for (const mode of ["light", "dark"] as const) {
  test(`Featured ${mode} card scopes readable text and independent surfaces`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider mode={mode}>
        <Card variant="featured">
          <Heading>Featured plan</Heading><Text>Supporting text</Text><Text tone="muted">Details</Text>
          <Link href="#details">Read details</Link><Code>install</Code><Kbd>Enter</Kbd>
          <Button>Secondary action</Button><Button variant="solid">Solid action</Button><Button variant="ghost">Ghost action</Button>
          <ThemeStyleBlock invertMode register="compact"><Text data-testid="nested">Nested mode</Text></ThemeStyleBlock>
        </Card>
      </SquonkThemeProvider>,
    );
    const background = await component.evaluate(node => getComputedStyle(node).backgroundColor);
    for (const locator of [component.locator("h2"), component.locator("p").first(), component.locator("p").nth(1), component.locator("a"), component.getByTestId("nested")]) {
      const foreground = await locator.evaluate(node => getComputedStyle(node).color);
      expect(Color(foreground).contrast(Color(background))).toBeGreaterThanOrEqual(4.5);
    }
    for (const locator of [component.locator("code"), component.locator("kbd"), component.getByRole("button", { name: "Secondary action" }), component.getByRole("button", { name: "Solid action" })]) {
      const colors = await locator.evaluate(node => ({ color: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor }));
      expect(Color(colors.color).contrast(Color(colors.background))).toBeGreaterThanOrEqual(4.5);
    }
    const ghost = component.getByRole("button", { name: "Ghost action" });
    await ghost.hover();
    await expect.poll(async () => {
      const colors = await ghost.evaluate(node => ({ color: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor }));
      return Color(colors.color).contrast(Color(colors.background));
    }).toBeGreaterThanOrEqual(4.5);
  });

  test(`Nested painted layouts establish their own ${mode} content surface`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider mode={mode}>
        <Card variant="featured">
          <Block data-testid="block" background="surface"><Text>Block</Text></Block>
          <Header data-testid="header"><Text>Header</Text></Header>
          <Footer data-testid="footer"><Text>Footer</Text></Footer>
          <Sidebar data-testid="sidebar"><Text>Sidebar</Text></Sidebar>
          <Page data-testid="page" style={{ width: "100%", height: "auto" }}><Text>Page</Text></Page>
          <Section data-testid="section" tone="surface"><Text>Section</Text></Section>
          <Card data-testid="card"><Text>Nested card</Text></Card>
        </Card>
      </SquonkThemeProvider>,
    );
    for (const id of ["block", "header", "footer", "sidebar", "page", "section", "card"]) {
      const surface = component.getByTestId(id);
      const background = await surface.evaluate(node => getComputedStyle(node).backgroundColor);
      const foreground = await surface.locator("p").evaluate(node => getComputedStyle(node).color);
      expect(Color(foreground).contrast(Color(background))).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test("An outlined card has no shadow of its own by default, beyond the theme's relief", async ({ mount, page }) => {
  // With relief off, nothing but the outlined elevation could draw a shadow.
  await mount(<SquonkThemeProvider primitives={{ reliefDepth: 0, reliefSheen: 0 }}><Card>Outlined</Card></SquonkThemeProvider>);
  const shadow = await page.locator("section").evaluate((node) => getComputedStyle(node).boxShadow);
  // Only transparent, zero-size shadows: nothing is drawn.
  expect(shadow.replaceAll("rgba(0, 0, 0, 0) 0px 0px 0px 0px", "").replaceAll(", ", "").replace("none", "")).toBe("");
});

for (const mode of ["light", "dark"] as const) {
  test(`A theme gives the outlined card a shadow beside its border and relief edge (${mode})`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider
        mode={mode}
        primitives={{ reliefDepth: 0.6 }}
        roleBindings={{ "components.card.outlinedElevation": "0px 6px 20px rgba(0, 0, 0, 0.4)" }}
      >
        <Card data-testid="outlined">Outlined</Card>
        <Card variant="elevated" data-testid="elevated">Elevated</Card>
      </SquonkThemeProvider>,
    );
    const outlined = component.getByTestId("outlined");
    const styles = await outlined.evaluate((node) => {
      const s = getComputedStyle(node);
      return { shadow: s.boxShadow, border: s.borderTopWidth, borderStyle: s.borderTopStyle };
    });
    expect(styles.border).toBe("1px");
    expect(styles.borderStyle).toBe("solid");
    // The relief edge (inset) and the elevation, in one list.
    expect(styles.shadow).toContain("inset");
    expect(styles.shadow).toContain("rgba(0, 0, 0, 0.4) 0px 6px 20px 0px");
    // Other variants don't take it.
    const elevated = await component.getByTestId("elevated").evaluate((node) => getComputedStyle(node).boxShadow);
    expect(elevated).not.toContain("0px 6px 20px");
  });
}
