import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { ScrollBox } from "./scroll-box";

test("Default render of the ScrollBox component", async ({ mount }) => {
  const component = await mount(
    <ScrollBox maxHeight="120px">
      <div style={{ height: 400 }}>Brand spanking new component</div>
    </ScrollBox>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
