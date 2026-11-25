import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Skeleton } from "./skeleton";

test("Default render of the Skeleton component", async ({ mount }) => {
  const component = await mount(<Skeleton width={320} height={16} noAnimation />);
  await expect(
    await component.screenshot({ animations: "disabled" })
  ).toMatchSnapshot();
});

test("Multiline Skeleton honors its requested group width", async ({ mount }) => {
  const component = await mount(<Skeleton shape="text" lines={3} width={180} noAnimation />);
  await expect(component).toHaveCSS("width", "180px");
  await expect(component.locator(":scope > span").first()).toHaveCSS("width", "180px");
});
