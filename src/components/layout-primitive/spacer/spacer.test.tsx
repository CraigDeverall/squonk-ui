import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Spacer } from "./spacer";

test("Default render of the Spacer component", async ({ mount }) => {
  const component = await mount(<Spacer size="md" />);
  await expect(await component.screenshot()).toMatchSnapshot();
});
