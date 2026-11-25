import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Link } from "./link";

test("Default render of the Link component", async ({ mount }) => {
  const component = await mount(<Link href="#">Documentation</Link>);
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Hover underline preserves the subtle Link hover color", async ({ mount }) => {
  const component = await mount(<Link href="#" variant="subtle">Documentation</Link>);
  const color = await component.evaluate(el => getComputedStyle(el).color);
  await component.hover();
  await expect.poll(() => component.evaluate(el => getComputedStyle(el).color)).not.toBe(color);
  await expect(component).toHaveCSS("text-decoration-line", "underline");
});
