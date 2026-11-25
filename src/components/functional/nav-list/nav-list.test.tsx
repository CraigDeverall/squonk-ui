import { expect, test } from "@playwright/experimental-ct-react";
import { NavListHarness } from "./nav-list.harness";

for (const mode of ["light", "dark"] as const) {
  test(`NavList marks the current page (${mode})`, async ({ mount }) => {
    const component = await mount(<NavListHarness mode={mode} />);
    await expect(component).toHaveScreenshot(`nav-list-${mode}.png`);
  });
}

for (const indicatorStyle of ["fill", "underline", "ring", "quiet"] as const) {
  test(`NavList in the ${indicatorStyle} indicator style, with one item hovered`, async ({ mount, page }) => {
    const component = await mount(<NavListHarness indicatorStyle={indicatorStyle} />);
    await page.getByRole("link", { name: /Sightings/ }).hover();
    await expect(component).toHaveScreenshot(`nav-list-${indicatorStyle}.png`, { animations: "disabled" });
  });
}

test("The navigation is named, and only the current page has aria-current", async ({ mount, page }) => {
  await mount(<NavListHarness />);
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link")).toHaveCount(3);
  await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  await expect(nav.locator("[aria-current]")).toHaveCount(1);
});

test("A ring stands off the fill by its gap, without changing the item's size", async ({ mount, page }) => {
  await mount(<NavListHarness indicatorStyle="ring" />);
  const current = page.getByRole("link", { name: "Overview" });
  const other = page.getByRole("link", { name: "Payments" });
  const [a, b] = await Promise.all([current.boundingBox(), other.boundingBox()]);
  expect(a?.height).toBe(b?.height);
  const shadow = await current.evaluate((el) => getComputedStyle(el).boxShadow);
  // Browsers report the colour first: "rgb(…) 0px 0px 0px 2px inset".
  expect(shadow).toMatch(/0px 0px 0px 2px inset/);
  const margin = await current.locator(":scope > span").evaluate((el) => getComputedStyle(el).marginTop);
  expect(margin).toBe("4px");
});

test("Keyboard: Tab reaches each link, and choosing one reports its id", async ({ mount, page }) => {
  const chosen: string[] = [];
  await mount(<NavListHarness onNavigate={(id) => chosen.push(id)} />);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Overview" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /Sightings/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(() => chosen).toEqual(["sightings"]);
});

for (const mode of ["light", "dark"] as const) {
  test(`The tint indicator style fills the current page with the primary tint and draws no mark (${mode})`, async ({ mount, page }) => {
    const component = await mount(<NavListHarness mode={mode} indicatorStyle="tint" />);
    const current = page.getByRole("link", { name: "Overview" });
    const other = page.getByRole("link", { name: "Payments" });
    const token = (name: string) => component.evaluate((el, n) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${n})`;
      el.appendChild(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    }, name);
    const fill = await current.locator(":scope > span").evaluate((el) => getComputedStyle(el).backgroundColor);
    const text = await current.evaluate((el) => getComputedStyle(el).color);
    expect(fill).toBe(await token("--squonk-colors-tone-primary-subtle"));
    expect(text).toBe(await token("--squonk-colors-tone-primary-on-subtle"));
    // No bar, underline or ring: every inset stroke is zero wide.
    const shadow = await current.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).not.toMatch(/[1-9]\d*px/);
    const [a, b] = await Promise.all([current.boundingBox(), other.boundingBox()]);
    expect(a?.height).toBe(b?.height);
    const radius = await current.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
    expect(radius).toBe(await other.evaluate((el) => getComputedStyle(el).borderTopLeftRadius));
  });
}
