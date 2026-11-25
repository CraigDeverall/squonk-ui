import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Heading } from "./heading";
import { SquonkThemeProvider } from "../../../theme/theme-provider";

test("Default render of the Heading component", async ({ mount }) => {
  const component = await mount(<Heading>Section heading</Heading>);
  await expect(await component.screenshot()).toMatchSnapshot();
});

const weightOf = (locator: { evaluate: <R>(fn: (el: HTMLElement) => R) => Promise<R> }) =>
  locator.evaluate((el) => getComputedStyle(el).fontWeight);

test("Every level is bold by default, and an explicit weight wins", async ({ mount }) => {
  const component = await mount(
    <div>
      {([1, 2, 3, 4, 5, 6] as const).map((level) => <Heading key={level} level={level}>Level {level}</Heading>)}
      <Heading level={3} weight="regular" data-testid="regular">Regular</Heading>
      <Heading level={3} weight="bold" data-testid="bold">Bold</Heading>
      <Heading level={3} weight="heavy" data-testid="heavy">Heavy</Heading>
    </div>,
  );
  for (const level of [1, 2, 3, 4, 5, 6]) expect(await weightOf(component.locator(`h${level}`).first())).toBe("700");
  expect(await weightOf(component.getByTestId("regular"))).toBe("400");
  expect(await weightOf(component.getByTestId("bold"))).toBe("700");
  expect(await weightOf(component.getByTestId("heavy"))).toBe("900");
});

for (const mode of ["light", "dark"] as const) {
  test(`A theme sets the default weight per level, and a weight prop still wins (${mode})`, async ({ mount }) => {
    const component = await mount(
      <SquonkThemeProvider
        mode={mode}
        roleBindings={{ "components.heading.weight.level1": "900", "components.heading.weight.level2": "800" }}
      >
        <Heading level={1}>Level 1</Heading>
        <Heading level={2}>Level 2</Heading>
        <Heading level={3}>Level 3</Heading>
        <Heading level={1} weight="regular" data-testid="regular">Regular level 1</Heading>
        <Heading level={1} weight="bold" data-testid="bold">Bold level 1</Heading>
        <Heading as="h4" level={1} data-testid="detached">Visual level 1</Heading>
        <Heading level={2} data-testid="outer">Outer <Heading as="span" level={3} data-testid="inner">inner</Heading></Heading>
      </SquonkThemeProvider>,
    );
    expect(await weightOf(component.locator("h1").first())).toBe("900");
    expect(await weightOf(component.locator("h2").first())).toBe("800");
    expect(await weightOf(component.locator("h3").first())).toBe("700");
    expect(await weightOf(component.getByTestId("regular"))).toBe("400");
    expect(await weightOf(component.getByTestId("bold"))).toBe("700");
    // The level, not the tag, picks the weight; a nested heading takes its own.
    expect(await weightOf(component.getByTestId("detached"))).toBe("900");
    expect(await weightOf(component.getByTestId("inner"))).toBe("700");
  });
}
