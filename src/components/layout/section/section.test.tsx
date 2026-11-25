import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Section, BleedSection } from "./section";
import { SectionHeading } from "../section-heading/section-heading";
import { Text } from "../../functional-primitive/text/text";
import { VStack } from "../../layout-primitive/vstack/vstack";

test("Default render of the Section component", async ({ mount }) => {
  const component = await mount(
    <Section>
      <VStack align="center">
        <SectionHeading
          eyebrow="Platform"
          headline="Everything your team needs to ship"
          sub="One workspace for planning, building, and shipping releases."
        />
      </VStack>
    </Section>,
  );
  const sectionBox = await component.boundingBox();
  const headingBox = await component.getByRole("heading", { name: "Everything your team needs to ship" }).boundingBox();
  expect(sectionBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(Math.abs((headingBox!.x + headingBox!.width / 2) - (sectionBox!.x + sectionBox!.width / 2))).toBeLessThan(1);
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders the surface tone", async ({ mount }) => {
  const component = await mount(
    <Section tone="surface" register="compact">
      <Text>Section content on a raised surface background.</Text>
    </Section>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders BleedSection edge-to-edge without the inner Container", async ({
  mount,
}) => {
  const component = await mount(
    <BleedSection tone="subtle" register="compact">
      <Text>Full-bleed content with no width constraint.</Text>
    </BleedSection>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
