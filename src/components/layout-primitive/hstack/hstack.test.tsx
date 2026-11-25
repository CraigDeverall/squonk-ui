import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { HStack } from "./hstack";

test("Default render of the HStack component", async ({ mount }) => {
  const component = await mount(
    <HStack>Brand spanking new component</HStack>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
