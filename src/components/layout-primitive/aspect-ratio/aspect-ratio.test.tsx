import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { AspectRatio } from "./aspect-ratio";

test("Default render of the AspectRatio component", async ({ mount }) => {
  const component = await mount(
    
    <AspectRatio>Brand spanking new component</AspectRatio>
    
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
