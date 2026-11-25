import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Spinner } from "./spinner";

test("Default render of the Spinner component", async ({ mount }) => {
  const component = await mount(<Spinner />);
  await expect(
    await component.screenshot({ animations: "disabled" })
  ).toMatchSnapshot();
});
