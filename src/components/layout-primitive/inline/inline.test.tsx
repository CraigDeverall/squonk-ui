import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Inline } from "./inline";

test("Default render of the Inline component", async ({ mount }) => {
  const component = await mount(
    <Inline>Brand spanking new component</Inline>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
