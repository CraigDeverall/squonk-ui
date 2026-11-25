import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { AddIcon, CloseIcon, GitHubIcon, SearchIcon, WarningIcon } from "./icon";
import { Presentation } from "../../style/presentation/presentation";

test("Default render of the Icon component", async ({ mount }) => {
  const component = await mount(
    <div style={{ display: "flex", gap: 12, fontSize: 24 }}>
      <SearchIcon /><CloseIcon /><WarningIcon /><AddIcon /><GitHubIcon />
    </div>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Decorative icons are hidden from assistive technology; labelled icons are images", async ({ mount }) => {
  const component = await mount(<p>Search <SearchIcon /> <WarningIcon label="Warning" /></p>);
  await expect(component.locator('[data-icon="search"]')).toHaveAttribute("aria-hidden", "true");
  await expect(component.getByRole("img", { name: "Warning" })).toBeVisible();
  await expect(component.getByRole("img")).toHaveCount(1);
});

test("Icon sizes follow the text, the type scale or the register", async ({ mount }) => {
  const component = await mount(
    <div style={{ fontSize: 32 }}>
      <SearchIcon data-testid="inherit" />
      <SearchIcon data-testid="sm" size="sm" />
      <Presentation register="hero"><SearchIcon data-testid="control" size="control" /></Presentation>
    </div>
  );
  const width = (id: string) => component.getByTestId(id).evaluate((el) => el.getBoundingClientRect().width);
  expect(await width("inherit")).toBe(32);
  expect(await width("sm")).toBe(14);
  expect(await width("control")).toBe(20);
});
