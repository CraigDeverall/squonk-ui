import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Divider } from "./divider";

test("Default render of the Divider component", async ({ mount }) => {
  const component = await mount(
    
    <Divider />
    
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
