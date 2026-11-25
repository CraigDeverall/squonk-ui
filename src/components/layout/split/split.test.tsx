import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Split } from "./split";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";
import { Button } from "../../functional/button/button";
import { Badge } from "../../functional/badge/badge";

test("Default render of the Split component", async ({ mount }) => {
  const component = await mount(
    <Split>
      <Heading level={3}>Active sessions</Heading>
      <Button variant="primary">New session</Button>
    </Split>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders a title with a status badge", async ({ mount }) => {
  const component = await mount(
    <Split>
      <Heading level={4}>checkout-flow</Heading>
      <Badge tone="success" variant="subtle" caps>
        Live
      </Badge>
    </Split>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders a row of plain text pushed to opposite ends", async ({
  mount,
}) => {
  const component = await mount(
    <Split>
      <Text>You signed in 4 minutes ago.</Text>
      <Text tone="muted">12:34 PM</Text>
    </Split>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
