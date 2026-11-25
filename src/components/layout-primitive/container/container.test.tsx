import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Container } from "./container";

test("Default render of the Container component", async ({ mount }) => {
  const component = await mount(
    
    <Container>Brand spanking new component</Container>
    
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
