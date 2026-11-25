import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Tag, TagGroup } from "./tag";

const added = { violet: { light: "#7c3aed", dark: "#a78bfa" } };
const inlineTone = (node: HTMLElement | SVGElement) => node.style.getPropertyValue("--tone-solid");
import { LocationIcon } from "../../functional-primitive/icon/icon";

test("Renders tags in each tone and variant", async ({ mount }) => {
  const tones = ["neutral", "primary", "info"] as const;
  const component = await mount(
    <div style={{ display: "grid", gap: 8, padding: 4, width: "fit-content" }}>
      {(["subtle", "outline"] as const).map((variant) => (
        <div key={variant} style={{ display: "flex", gap: 6 }}>
          {tones.map((tone) => <Tag key={tone} tone={tone} variant={variant}>{tone}</Tag>)}
        </div>
      ))}
      <div style={{ display: "flex", gap: 6 }}>
        <Tag icon={<LocationIcon />}>Wellington</Tag>
        <Tag onRemove={() => {}}>Night watches</Tag>
        <Tag onRemove={() => {}} disabled>Locked</Tag>
      </div>
    </div>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("The remove button is named for the tag and calls onRemove", async ({ mount, page }) => {
  let removed = 0;
  await mount(<Tag onRemove={() => removed++}>Overdue</Tag>);
  const remove = page.getByRole("button", { name: "Remove Overdue" });
  await page.keyboard.press("Tab");
  await expect(remove).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(() => removed).toBe(1);
});

test("removeLabel names the button when the content is not text; disabled blocks removal", async ({ mount, page }) => {
  await mount(
    <div>
      <Tag onRemove={() => {}} removeLabel="Remove Aroha's filter"><strong>Aroha</strong></Tag>
      <Tag onRemove={() => {}} disabled>Locked</Tag>
    </div>
  );
  await expect(page.getByRole("button", { name: "Remove Aroha's filter" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove Locked" })).toBeDisabled();
});

test("Long text truncates inside a narrow parent and keeps the remove button", async ({ mount, page }) => {
  await mount(
    <div style={{ width: 140 }}>
      <Tag onRemove={() => {}}>Te Whanganui-a-Tara regional office</Tag>
    </div>
  );
  const tag = page.locator("[data-tone]");
  const box = await tag.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(140);
  await expect(page.getByRole("button", { name: /Remove/ })).toBeInViewport();
});

test("A TagGroup is one tab stop; arrow keys move between tags and Delete removes the focused one", async ({ mount, page }) => {
  const removed: string[] = [];
  await mount(
    <TagGroup label="Filters">
      {["Night watches", "Tear pools", "Overdue"].map((t) => <Tag key={t} onRemove={() => removed.push(t)}>{t}</Tag>)}
    </TagGroup>
  );
  const grid = page.getByRole("grid", { name: "Filters" });
  await expect(grid.getByRole("row")).toHaveCount(3);
  await page.keyboard.press("Tab");
  await expect(grid.getByRole("row", { name: "Night watches" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(grid.getByRole("row", { name: "Tear pools" })).toBeFocused();
  await page.keyboard.press("Delete");
  await expect.poll(() => removed).toEqual(["Tear pools"]);
  await grid.getByRole("button", { name: "Remove Overdue" }).click();
  await expect.poll(() => removed).toEqual(["Tear pools", "Overdue"]);
});

test("A colour the theme added is a custom tone; a built-in tone is unchanged", async ({ mount, page }) => {
  await mount(
    <SquonkThemeProvider addedColorPrimitives={added}>
      <Tag tone="violet" data-testid="custom">Research</Tag>
      <Tag tone="primary" data-testid="built-in">Night watches</Tag>
      <TagGroup label="Topics"><Tag tone="violet">Grouped</Tag></TagGroup>
    </SquonkThemeProvider>,
  );
  const custom = page.getByTestId("custom");
  await expect(custom).toHaveAttribute("data-tone", "custom");
  expect(await custom.evaluate(inlineTone)).toBe("var(--squonk-colors-tone-violet-solid)");
  expect(await custom.evaluate((node) => node.style.getPropertyValue("--tone-subtle"))).toBe("var(--squonk-colors-tone-violet-subtle)");
  await expect(custom).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const builtIn = page.getByTestId("built-in");
  await expect(builtIn).toHaveAttribute("data-tone", "primary");
  expect(await builtIn.evaluate(inlineTone)).toBe("");
  // A grouped tag (a React Aria Tag) carries the tone too.
  const grouped = page.getByRole("row", { name: "Grouped" });
  await expect(grouped).toHaveAttribute("data-tone", "custom");
  await expect(grouped).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});
