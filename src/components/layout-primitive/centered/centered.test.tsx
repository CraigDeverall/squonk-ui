import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Centered } from "./centered";

test("Default render of the Centered component", async ({ mount }) => {
  const component = await mount(
    <Centered minHeight="200px">Brand spanking new component</Centered>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
