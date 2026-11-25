import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { EmptyState } from "./empty-state";
import { Button } from "../../functional/button/button";

test("Default render of the EmptyState component", async ({ mount }) => {
  const component = await mount(
    <EmptyState
      title="No projects yet"
      body="Create your first project to get started."
      action={<Button variant="primary">New project</Button>}
    />,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders without an action", async ({ mount }) => {
  const component = await mount(
    <EmptyState
      title="All caught up"
      body="No new notifications since yesterday."
    />,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders title only", async ({ mount }) => {
  const component = await mount(<EmptyState title="No results" />);
  await expect(await component.screenshot()).toMatchSnapshot();
});
