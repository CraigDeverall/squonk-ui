import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Accordion } from "./accordion";
import { settleAnimations } from "../../../../test-setup/animations";

const items = [
  { value: "due", title: "When are my dues due?", content: <p>On the 28th.</p> },
  { value: "late", title: "What if I pay late?", description: "Late fees", content: <p>A penalty may apply.</p> },
  { value: "agent", title: "Chapter treasurer", content: <p>Link a treasurer.</p>, disabled: true },
  { value: "change", title: "Can I change frequency?", content: <p>Yes, in settings.</p> },
];

test("Renders divided and contained Accordions", async ({ mount, page }) => {
  const component = await mount(
    <div style={{ display: "grid", gap: 24, padding: 4, width: 480 }}>
      <Accordion items={items} defaultValue={["due"]} />
      <Accordion items={items} variant="contained" defaultValue={["late"]} />
    </div>
  );
  await settleAnimations(page);
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Titles are buttons in headings that expand their region", async ({ mount, page }) => {
  await mount(<Accordion items={items} headingLevel={2} />);
  const trigger = page.getByRole("button", { name: "When are my dues due?" });
  await expect(page.getByRole("heading", { level: 2, name: "When are my dues due?" })).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText("On the 28th.")).toBeHidden();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("region", { name: "When are my dues due?" })).toHaveText("On the 28th.");
});

test("Only one section opens at a time unless multiple; collapsible closes it", async ({ mount, page }) => {
  const changes: string[][] = [];
  await mount(<Accordion items={items} onValueChange={(v) => changes.push(v)} />);
  await page.getByRole("button", { name: "When are my dues due?" }).click();
  await page.getByRole("button", { name: /What if I pay late/ }).click();
  await expect(page.getByRole("button", { name: "When are my dues due?" })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: /What if I pay late/ }).click();
  await expect.poll(() => changes).toEqual([["due"], ["late"], []]);
});

test("Arrow keys move between titles, skipping disabled ones; Enter toggles", async ({ mount, page }) => {
  await mount(<Accordion items={items} multiple />);
  const first = page.getByRole("button", { name: "When are my dues due?" });
  await first.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: /What if I pay late/ })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Can I change frequency?" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Can I change frequency?" })).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
  await expect(page.getByRole("button", { name: "Chapter treasurer" })).toBeDisabled();
});

for (const mode of ["light", "dark"] as const) {
  test(`Renders Accordion rows with hover="fill" and no indicator (${mode})`, async ({ mount, page }) => {
    const component = await mount(
      <SquonkThemeProvider mode={mode}>
        <div style={{ display: "grid", gap: 24, padding: 16, width: 480 }}>
          <Accordion items={items} hover="fill" indicator={false} defaultValue={["due"]} />
          <Accordion items={items} variant="contained" hover="fill" indicator={false} />
        </div>
      </SquonkThemeProvider>,
    );
    await page.getByRole("button", { name: "Can I change frequency?" }).first().hover();
    await settleAnimations(page);
    await expect(await component.screenshot()).toMatchSnapshot();
  });
}

test('Accordion hover="fill" shades the header and leaves the title plain; hover="underline" underlines it', async ({ mount, page }) => {
  const component = await mount(<Accordion items={items} hover="fill" />);
  const trigger = page.getByRole("button", { name: "When are my dues due?" });
  const title = trigger.getByText("When are my dues due?");
  const shade = () => trigger.evaluate((element) => getComputedStyle(element).backgroundColor);
  const resting = await shade();
  await trigger.hover();
  await expect.poll(shade).not.toBe(resting);
  await expect(title).toHaveCSS("text-decoration-line", "none");
  await component.update(<Accordion items={items} hover="underline" />);
  await page.mouse.move(0, 0);
  await trigger.hover();
  await expect.poll(() => title.evaluate((element) => getComputedStyle(element).textDecorationLine)).toBe("underline");
});

test("Accordion keyboard: without the indicator, headers still expand and report it", async ({ mount, page }) => {
  await mount(<Accordion items={items} indicator={false} />);
  const trigger = page.getByRole("button", { name: "When are my dues due?" });
  await expect(trigger.locator('[data-icon="chevronDown"]')).toHaveCount(0);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("On the 28th.")).toBeVisible();
});
