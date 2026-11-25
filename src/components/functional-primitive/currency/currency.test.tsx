import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "@src/theme/theme-provider";
import { Card } from "../../layout/card/card";
import { Currency } from "./currency";

for (const mode of ["light", "dark"] as const) {
  test(`Currency default render (${mode} mode)`, async ({ mount, page }) => {
    await mount(
      // Currency inherits its font and colour: show it on a painted surface, as an app would.
      <SquonkThemeProvider mode={mode}>
        <Card>
          <div style={{ display: "grid", gap: 8, padding: 16, justifyItems: "end", width: 240, fontFamily: "var(--squonk-roles-type-font)" }}>
            <Currency value={1234.5} locale="en-NZ" />
            <Currency value={4820.55} locale="en-NZ" />
            <Currency value={-192.82} locale="en-NZ" accounting negativeTone="error" />
            <Currency value={312.4} locale="en-NZ" tone="success" signDisplay="always" />
            <Currency value={null} locale="en-NZ" />
          </div>
        </Card>
      </SquonkThemeProvider>
    );
    await expect(page).toHaveScreenshot(`currency-${mode}.png`);
  });
}

test("Formats each currency for its locale, as a <data> element with the plain decimal", async ({ mount }) => {
  const component = await mount(
    <div>
      <Currency data-testid="nzd" value={1234.5} currency="NZD" locale="en-NZ" />
      <Currency data-testid="gbp" value={1234.5} currency="GBP" locale="en-GB" />
      <Currency data-testid="eur" value={1234.5} currency="EUR" locale="de-DE" />
      <Currency data-testid="jpy" value={1234.5} currency="JPY" locale="ja-JP" />
      <Currency data-testid="kwd" value={1234.5} currency="KWD" locale="en-NZ" />
    </div>
  );
  const text = async (id: string) => (await component.getByTestId(id).textContent())?.replace(/[\u00a0\u202f]/g, " ");
  expect(await text("nzd")).toBe("$1,234.50");
  expect(await text("gbp")).toBe("£1,234.50");
  expect(await text("eur")).toBe("1.234,50 €");
  expect(await text("jpy")).toMatch(/^[¥￥]1,235$/);
  expect(await text("kwd")).toBe("KWD 1,234.500");
  const nzd = component.getByTestId("nzd");
  await expect(nzd).toHaveJSProperty("tagName", "DATA");
  await expect(nzd).toHaveAttribute("value", "1234.50");
  await expect(component.getByTestId("kwd")).toHaveAttribute("value", "1234.500");
});

test("Never shows float noise", async ({ mount }) => {
  const component = await mount(<Currency value={0.1 + 0.2} locale="en-NZ" />);
  await expect(component).toHaveText("$0.30");
  await expect(component).toHaveAttribute("value", "0.30");
});

test("Minor units format exactly, including beyond a number's precision", async ({ mount }) => {
  const component = await mount(
    <div>
      <Currency data-testid="cents" value={1999} minorUnits locale="en-NZ" />
      <Currency data-testid="yen" value={1500} minorUnits currency="JPY" locale="ja-JP" />
      <Currency data-testid="big" value={BigInt("900719925474099312")} minorUnits locale="en-NZ" />
      <Currency data-testid="string" value="9007199254740993.12" locale="en-NZ" />
    </div>
  );
  await expect(component.getByTestId("cents")).toHaveText("$19.99");
  await expect(component.getByTestId("cents")).toHaveAttribute("value", "19.99");
  await expect(component.getByTestId("yen")).toHaveText(/^[¥￥]1,500$/);
  await expect(component.getByTestId("big")).toHaveText("$9,007,199,254,740,993.12");
  await expect(component.getByTestId("string")).toHaveText("$9,007,199,254,740,993.12");
});

test("Accounting brackets and compact amounts are read in full", async ({ mount }) => {
  const component = await mount(
    <div>
      <Currency data-testid="owed" value={-192.82} accounting locale="en-NZ" />
      <Currency data-testid="total" value={1234567} compact locale="en-NZ" />
    </div>
  );
  const owed = component.getByTestId("owed");
  await expect(owed.locator('[aria-hidden="true"]')).toHaveText("($192.82)");
  await expect(owed).toContainText("-$192.82");
  const total = component.getByTestId("total");
  await expect(total.locator('[aria-hidden="true"]')).toHaveText("$1.2M");
  await expect(total).toContainText("$1,234,567.00");
});

test("Negative tone colours only negative amounts", async ({ mount }) => {
  const component = await mount(
    <div>
      <Currency data-testid="owed" value={-5} negativeTone="error" locale="en-NZ" />
      <Currency data-testid="credit" value={5} negativeTone="error" locale="en-NZ" />
      <Currency data-testid="rounded" value={-0.001} negativeTone="error" locale="en-NZ" />
    </div>
  );
  await expect(component.getByTestId("owed")).toHaveAttribute("data-tone", "error");
  await expect(component.getByTestId("credit")).not.toHaveAttribute("data-tone", "error");
  await expect(component.getByTestId("rounded")).toHaveText("$0.00");
  await expect(component.getByTestId("rounded")).not.toHaveAttribute("data-tone", "error");
});

test("Shows the fallback when there is no amount", async ({ mount }) => {
  const component = await mount(
    <div>
      <Currency data-testid="dash" value={null} />
      <Currency data-testid="custom" value={NaN} fallback="Not set" />
    </div>
  );
  await expect(component.getByTestId("dash")).toHaveText("—");
  await expect(component.getByTestId("custom")).toHaveText("Not set");
});

test("Uses tabular figures and inherits the surrounding text size", async ({ mount }) => {
  const component = await mount(
    <p style={{ fontSize: "24px" }}>
      Total <Currency data-testid="total" value={10} locale="en-NZ" />
    </p>
  );
  const total = component.getByTestId("total");
  await expect(total).toHaveCSS("font-variant-numeric", "tabular-nums");
  await expect(total).toHaveCSS("font-size", "24px");
});

test("The spoken full amount stays inside a scrolling ancestor", async ({ mount, page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await mount(
    <div style={{ width: 200, overflowX: "auto" }}>
      <div style={{ width: 1200, textAlign: "right" }}>
        <Currency value={1_800_000} compact locale="en-NZ" />
      </div>
    </div>
  );
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(size.scroll).toBeLessThanOrEqual(size.client);
});
