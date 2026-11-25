import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Footer } from "./footer";

test("Default render of the Footer component", async ({ mount }) => {
  const component = await mount(
    
    <Footer>Brand spanking new component</Footer>
    
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
