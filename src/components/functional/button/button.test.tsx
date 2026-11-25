import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Presentation } from "../../style/presentation/presentation";
import { TextField } from "../text-field/text-field";
import { Select } from "../select/select";
import { Button } from "./button";
import { ThemeModifier } from "../../style/theme-modifier/theme-modifier";
import { Card } from "../../layout/card/card";
import { Text } from "../../functional-primitive/text/text";

test("Renders the button", async ({ mount }) => {
  const component = await mount(
    <Button primary={true}>
      Hello World
    </Button>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Secondary lift preserves hover colors with browser-resolved brand overrides", async ({ mount }) => {
  const component = await mount(<div style={{ "--brand": "#2255aa" } as React.CSSProperties}>
    <ThemeModifier override={{ colors: { primary: "var(--brand)", error: "var(--brand)", background: { surface: "#dddddd", default: "#ffffff" }, border: { strong: "#334455" } } }}>
      <Button variant="secondary" lift>Hover action</Button>
    </ThemeModifier>
  </div>);
  const button = component.getByRole("button", { name: "Hover action" });
  await expect(button).toHaveCSS("background-color", "rgb(221, 221, 221)");
  await button.hover();
  await expect(button).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(button).toHaveCSS("border-top-color", "rgb(51, 68, 85)");
  await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -2)");
});

for (const background of ["transparent", "rgba(0, 0, 0, 0.05)"]) {
  test(`Painted ${background} surfaces preserve the supplied text role`, async ({ mount }) => {
    const component = await mount(<div style={{ background: "white" }}>
      <ThemeModifier override={{ colors: { background: { default: background }, text: { primary: "#212529" } } }}>
        <Card><Text>Readable on the page</Text></Card>
      </ThemeModifier>
    </div>);
    await expect(component.getByText("Readable on the page")).toHaveCSS("color", "rgb(33, 37, 41)");
  });
}

for (const [register, height] of [["compact", 28], ["default", 40], ["large", 48], ["hero", 56]] as const) {
  test(`Button, TextField and Select share one ${register} control height`, async ({ mount }) => {
    const component = await mount(
      <Presentation register={register}>
        <div>
          <Button>Save</Button>
          <TextField aria-label="Name" />
          <Select aria-label="Plan" options={[{ value: "pro", label: "Pro" }]} />
        </div>
      </Presentation>
    );
    for (const control of [
      component.getByRole("button", { name: "Save" }),
      component.getByRole("textbox", { name: "Name" }),
      component.getByRole("button", { name: /Plan/ }),
    ]) {
      await expect.poll(() => control.evaluate((el) => el.getBoundingClientRect().height)).toBe(height);
    }
  });
}

test("A pending button stays focusable but ignores presses", async ({ mount, page }) => {
  let presses = 0;
  await mount(<Button variant="primary" pending onClick={() => presses++}>Submitting…</Button>);
  const button = page.getByRole("button", { name: "Submitting…" });
  // A disabled button can't take focus; a pending one can. (WebKit doesn't
  // reliably take a first Tab into a fresh page, so focus it directly.)
  await button.focus();
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute("data-pending");
  await page.keyboard.press("Enter");
  // Pending sets aria-disabled, so Playwright would wait; force the click.
  await button.click({ force: true });
  await page.waitForTimeout(100);
  expect(presses).toBe(0);
});

test("aria-busy marks the button pending for compatibility, and a span keeps only the styling", async ({ mount, page }) => {
  await mount(<div><Button aria-busy>Saving</Button><Button as="span">Menu</Button></div>);
  await expect(page.getByRole("button", { name: "Saving" })).toHaveAttribute("data-pending");
  await expect(page.getByText("Menu")).not.toHaveAttribute("role");
});

test("Hover and press respond instantly, and the return to rest fades", async ({ mount, page }) => {
  await mount(<Button variant="primary">Save</Button>);
  const button = page.getByRole("button", { name: "Save" });
  const duration = () => button.evaluate((el) => getComputedStyle(el).transitionDuration.split(",")[0].trim());
  expect(await duration()).toBe("0.165s");
  await button.hover();
  await expect.poll(duration).toBe("0s");
  await page.mouse.move(0, 0);
  await expect.poll(duration).toBe("0.165s");
});
