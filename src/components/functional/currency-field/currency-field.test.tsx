import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "@src/theme/theme-provider";
import { Card } from "../../layout/card/card";
import { CurrencyFieldHarness } from "./currency-field.harness";
import { CurrencyField } from "./currency-field";

for (const mode of ["light", "dark"] as const) {
  test(`Renders the CurrencyField (${mode} mode)`, async ({ mount, page }) => {
    await mount(
      <SquonkThemeProvider mode={mode}>
        <Card>
          <div style={{ display: "grid", gap: 16, padding: 16, width: 320 }}>
            <CurrencyField label="Amount to pay" locale="en-NZ" defaultValue={1240.5} helperText="You can pay part now." />
            <CurrencyField label="Invoice amount" locale="en-NZ" currency="USD" defaultValue={980} showCurrencyCode />
            <CurrencyField label="Amount" locale="en-NZ" defaultValue={0} error="Enter an amount more than $0" />
            <CurrencyField label="Credit" locale="en-NZ" defaultValue={312.4} disabled />
          </div>
        </Card>
      </SquonkThemeProvider>
    );
    await expect(page).toHaveScreenshot(`currency-field-${mode}.png`);
  });
}

test("Typing 12.5 shows $12.50 on blur and reports the rounded number", async ({ mount }) => {
  const component = await mount(<CurrencyFieldHarness locale="en-NZ" />);
  const input = component.getByRole("textbox", { name: "Amount" });
  await input.fill("12.5");
  await input.blur();
  await expect(input).toHaveValue("$12.50");
  await expect(component.getByTestId("value")).toHaveText("12.5");
  await input.fill("0.125");
  await input.blur();
  await expect(input).toHaveValue("$0.13");
  await expect(component.getByTestId("value")).toHaveText("0.13");
});

test("Emptying the field reports null", async ({ mount }) => {
  const component = await mount(<CurrencyFieldHarness locale="en-NZ" defaultValue={5} />);
  const input = component.getByRole("textbox", { name: "Amount" });
  await expect(input).toHaveValue("$5.00");
  await input.fill("");
  await input.blur();
  await expect(input).toHaveValue("");
  await expect(component.getByTestId("value")).toHaveText("null");
});

test("A controlled float never shows float noise", async ({ mount }) => {
  const component = await mount(<CurrencyField label="Total" locale="en-NZ" value={0.1 + 0.2} />);
  await expect(component.getByRole("textbox", { name: "Total" })).toHaveValue("$0.30");
});

for (const pasted of ["1,234.56", "$1,234.56", "NZ$1,234.56", "NZD 1234.56"]) {
  test(`Pasting "${pasted}" reads the amount`, async ({ mount, page }) => {
    const component = await mount(<CurrencyFieldHarness locale="en-NZ" />);
    const input = component.getByRole("textbox", { name: "Amount" });
    await input.focus();
    await page.evaluate((text) => {
      const target = document.activeElement as HTMLInputElement;
      const data = new DataTransfer();
      data.setData("text/plain", text);
      target.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    }, pasted);
    await expect(input).toHaveValue("$1,234.56");
    await expect(component.getByTestId("value")).toHaveText("1234.56");
  });
}

test("Keyboard: arrow keys step by a dollar, staying within min and max", async ({ mount }) => {
  const component = await mount(<CurrencyFieldHarness locale="en-NZ" defaultValue={9.5} maxValue={11} />);
  const input = component.getByRole("textbox", { name: "Amount" });
  await input.focus();
  await input.press("ArrowUp");
  await expect(input).toHaveValue("$10.00");
  await input.press("ArrowUp");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("$11.00");
  await expect(component.getByTestId("value")).toHaveText("11");
});

test("Keyboard: a custom step snaps typed amounts to it", async ({ mount }) => {
  const component = await mount(<CurrencyFieldHarness locale="en-NZ" step={0.05} />);
  const input = component.getByRole("textbox", { name: "Amount" });
  await input.fill("12.53");
  await input.press("Enter");
  await expect(input).toHaveValue("$12.55");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("$12.50");
});

test("Min and max clamp a typed amount on commit", async ({ mount }) => {
  const component = await mount(<CurrencyFieldHarness locale="en-NZ" minValue={20} maxValue={5000} />);
  const input = component.getByRole("textbox", { name: "Amount" });
  await input.fill("10");
  await input.blur();
  await expect(input).toHaveValue("$20.00");
  await input.fill("9000");
  await input.blur();
  await expect(input).toHaveValue("$5,000.00");
});

test("Negative amounts are refused unless allowNegative is set", async ({ mount }) => {
  const component = await mount(
    <div>
      <CurrencyField label="Amount" locale="en-NZ" />
      <CurrencyField label="Adjustment" locale="en-NZ" allowNegative />
    </div>
  );
  const amount = component.getByRole("textbox", { name: "Amount" });
  await amount.pressSequentially("-5");
  await amount.blur();
  await expect(amount).toHaveValue("$5.00");
  const adjustment = component.getByRole("textbox", { name: "Adjustment" });
  await adjustment.pressSequentially("-5");
  await adjustment.blur();
  await expect(adjustment).toHaveValue("-$5.00");
});

test("An error marks the input invalid and is its description", async ({ mount }) => {
  const component = await mount(
    <>
      <CurrencyField label="Amount" locale="en-NZ" helperText="Including levy" />
      <CurrencyField label="Total" locale="en-NZ" helperText="Including levy" error="Enter an amount more than $0" />
    </>
  );
  const amount = component.getByRole("textbox", { name: "Amount" });
  await expect(amount).not.toHaveAttribute("aria-invalid", "true");
  await expect(amount).toHaveAccessibleDescription("Including levy");
  const total = component.getByRole("textbox", { name: "Total" });
  await expect(total).toHaveAttribute("aria-invalid", "true");
  await expect(total).toHaveAccessibleDescription("Enter an amount more than $0");
  await expect(component.getByText("Enter an amount more than $0")).toHaveAttribute("aria-live", "polite");
});

test("The label focuses the input, and required, disabled and read-only reach it", async ({ mount }) => {
  const component = await mount(
    <div>
      <CurrencyField label="Amount" locale="en-NZ" required />
      <CurrencyField label="Credit" locale="en-NZ" disabled defaultValue={5} />
      <CurrencyField label="Balance" locale="en-NZ" readOnly defaultValue={5} />
    </div>
  );
  await component.getByText("Amount").click();
  const amount = component.getByRole("textbox", { name: "Amount" });
  await expect(amount).toBeFocused();
  await expect(amount).toHaveAttribute("aria-required", "true");
  await expect(component.getByRole("textbox", { name: "Credit" })).toBeDisabled();
  const balance = component.getByRole("textbox", { name: "Balance" });
  await expect(balance).toHaveAttribute("readonly", "");
  await balance.focus();
  await balance.press("ArrowUp");
  await expect(balance).toHaveValue("$5.00");
});

test("Each currency and locale formats its own way", async ({ mount }) => {
  const component = await mount(
    <div>
      <CurrencyField label="NZD" currency="NZD" locale="en-NZ" defaultValue={1234.5} />
      <CurrencyField label="GBP" currency="GBP" locale="en-GB" defaultValue={1234.5} />
      <CurrencyField label="EUR" currency="EUR" locale="de-DE" defaultValue={1234.5} />
      <CurrencyField label="JPY" currency="JPY" locale="ja-JP" defaultValue={1234} />
      <CurrencyField label="KWD" currency="KWD" locale="en-NZ" defaultValue={1234.5} />
    </div>
  );
  const value = async (name: string) => (await component.getByRole("textbox", { name }).inputValue()).replace(/[\u00a0\u202f]/g, " ");
  expect(await value("NZD")).toBe("$1,234.50");
  expect(await value("GBP")).toBe("£1,234.50");
  expect(await value("EUR")).toBe("1.234,50 €");
  expect(await value("JPY")).toMatch(/^[¥￥]1,234$/);
  expect(await value("KWD")).toBe("KWD 1,234.500");
});

test("Typing in a de-DE field uses the comma as the decimal point", async ({ mount }) => {
  const component = await mount(<CurrencyFieldHarness locale="de-DE" currency="EUR" />);
  const input = component.getByRole("textbox", { name: "Amount" });
  await input.fill("12,5");
  await input.blur();
  await expect(input).toHaveValue(/^12,50\s€$/);
  await expect(component.getByTestId("value")).toHaveText("12.5");
});

test("Yen has no decimal places, so a decimal point can't be typed", async ({ mount }) => {
  const component = await mount(<CurrencyFieldHarness locale="ja-JP" currency="JPY" />);
  const input = component.getByRole("textbox", { name: "Amount" });
  await input.pressSequentially("1500.75");
  await input.blur();
  await expect(input).toHaveValue(/^[¥￥]150,075$/);
});

test("A form submits the plain decimal with the currency's places", async ({ mount }) => {
  const component = await mount(
    <form>
      <CurrencyField label="Amount" name="amount" locale="en-NZ" defaultValue={1234.5} />
      <CurrencyField label="Fee" name="fee" locale="en-NZ" currency="KWD" defaultValue={2} />
      <CurrencyField label="Tip" name="tip" locale="en-NZ" />
    </form>
  );
  await expect(component.locator('input[name="amount"]')).toHaveValue("1234.50");
  await expect(component.locator('input[name="fee"]')).toHaveValue("2.000");
  await expect(component.locator('input[name="tip"]')).toHaveValue("");
});

test("The currency code is shown and describes the input", async ({ mount }) => {
  const component = await mount(<CurrencyField label="Invoice amount" locale="en-NZ" currency="USD" defaultValue={980} showCurrencyCode helperText="Before levy" />);
  const input = component.getByRole("textbox", { name: "Invoice amount" });
  await expect(input).toHaveValue("US$980.00");
  await expect(component.getByText("USD", { exact: true })).toBeVisible();
  await expect(input).toHaveAccessibleDescription("Before levy USD");
});

test("Wheel scrolling over a focused field never changes the amount", async ({ mount, page }) => {
  const component = await mount(<CurrencyFieldHarness locale="en-NZ" defaultValue={50} />);
  const input = component.getByRole("textbox", { name: "Amount" });
  await input.focus();
  await input.hover();
  await page.mouse.wheel(0, -200);
  await expect(input).toHaveValue("$50.00");
});
