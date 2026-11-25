import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { SectionHeading } from "./section-heading";

test("Default render of the SectionHeading component", async ({ mount }) => {
  const component = await mount(
    <SectionHeading
      eyebrow="Platform"
      headline="Everything your team needs to ship"
      sub="One workspace for planning, building, and shipping releases."
    />,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders start-aligned without an eyebrow", async ({ mount }) => {
  const component = await mount(
    <SectionHeading
      align="start"
      headline="Release notes"
      sub="What shipped this week, in plain language."
    />,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders headline only", async ({ mount }) => {
  const component = await mount(<SectionHeading headline="Pricing" />);
  await expect(await component.screenshot()).toMatchSnapshot();
});


test("SectionHeading leaves outer spacing and placement to its parent", async ({ mount }) => {
  const component = await mount(<SectionHeading headline="Pricing" />);
  await expect(component).toHaveCSS("margin-top", "0px");
  await expect(component).toHaveCSS("margin-right", "0px");
  await expect(component).toHaveCSS("margin-bottom", "0px");
  await expect(component).toHaveCSS("margin-left", "0px");
});
