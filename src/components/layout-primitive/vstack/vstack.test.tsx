import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { VStack } from "./vstack";

test("Default render of the VStack component", async ({ mount }) => {
  const component = await mount(
    <VStack>Brand spanking new component</VStack>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
