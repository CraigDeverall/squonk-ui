import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Cluster } from "./cluster";
import { Badge } from "../../functional/badge/badge";
import { Block } from "../../layout-primitive/block/block";

test("Default render of the Cluster component", async ({ mount }) => {
  const component = await mount(
    <Cluster>
      <Badge tone="primary" variant="subtle">React</Badge>
      <Badge tone="primary" variant="subtle">TypeScript</Badge>
      <Badge tone="primary" variant="subtle">styled-components</Badge>
    </Cluster>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders centered", async ({ mount }) => {
  const component = await mount(
    <Cluster justify="center">
      <Badge tone="neutral" variant="outline">One</Badge>
      <Badge tone="neutral" variant="outline">Two</Badge>
    </Cluster>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Wraps items onto multiple lines in a constrained container", async ({
  mount,
}) => {
  const component = await mount(
    <Block bordered padding="md" radius="base" maxWidth="320px">
      <Cluster>
        {Array.from({ length: 12 }).map((_, i) => (
          <Badge key={i} tone="neutral" variant="outline">
            tag-{i + 1}
          </Badge>
        ))}
      </Cluster>
    </Block>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
