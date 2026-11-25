import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { MediaObject } from "./media-object";
import { Avatar } from "../../functional/avatar/avatar";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";

test("Default render of the MediaObject component", async ({ mount }) => {
  const component = await mount(
    <MediaObject media={<Avatar name="Ada Lovelace" />}>
      <Heading level={4}>Ada Lovelace</Heading>
      <Text tone="secondary">First programmer</Text>
    </MediaObject>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders with center alignment", async ({ mount }) => {
  const component = await mount(
    <MediaObject media={<Avatar name="Grace Hopper" />} align="center">
      <Text>
        <strong>Grace Hopper</strong> shipped COBOL.
      </Text>
    </MediaObject>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders a multi-line comment shape", async ({ mount }) => {
  const component = await mount(
    <MediaObject media={<Avatar name="Linus Torvalds" />}>
      <Heading level={5}>Linus Torvalds</Heading>
      <Text>I really appreciate this PR. Let&rsquo;s merge it and ship.</Text>
      <Text tone="muted">2 hours ago</Text>
    </MediaObject>,
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});


test("Media stays fixed while content fills and wraps in a narrow parent", async ({ mount }) => {
  const parent = await mount(
    <div style={{ width: 180 }}>
      <MediaObject media={<div data-testid="media" style={{ width: 64, height: 64 }} />}>
        <div data-testid="content">{"long-unbroken-content".repeat(8)}</div>
      </MediaObject>
    </div>,
  );
  expect((await parent.getByTestId("media").boundingBox())?.width).toBe(64);
  // 180px parent minus 64px media and the default 16px gap.
  expect((await parent.getByTestId("content").boundingBox())?.width).toBe(100);
  expect(await parent.evaluate((node) => node.scrollWidth)).toBe(180);
});
