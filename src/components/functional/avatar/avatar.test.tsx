import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Avatar } from "./avatar";

test("Default render of the Avatar component", async ({ mount }) => {
  const component = await mount(<Avatar name="Ada Lovelace" />);
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Avatar recovers from a failed source when a new image is supplied", async ({ mount }) => {
  const component = await mount(<Avatar name="Ada" src="data:image/png;base64,invalid" />);
  // A failed image stays in the DOM, hidden, and the initials show instead.
  await expect(component.locator("img")).toBeHidden();
  await expect(component.getByText("AD")).toBeVisible();
  await component.update(<Avatar name="Ada" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3C/svg%3E" />);
  await expect(component.locator("img")).toBeVisible();
  await expect(component.locator("img")).toHaveJSProperty("complete", true);
  await expect(component.getByText("AD")).toBeHidden();
  await expect(component).toHaveAccessibleName("Ada");
});
