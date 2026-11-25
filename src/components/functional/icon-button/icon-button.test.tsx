import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { IconButton } from "./icon-button";
import { Button } from "../button/button";
import { Presentation } from "../../style/presentation/presentation";
import { DeleteIcon, DownloadIcon, SettingsIcon } from "../../functional-primitive/icon/icon";

test("Renders the IconButton variants", async ({ mount }) => {
  const component = await mount(
    <div style={{ display: "flex", gap: 8, padding: 4 }}>
      <IconButton icon={<SettingsIcon />} label="Ghost" />
      <IconButton icon={<SettingsIcon />} label="Secondary" variant="secondary" />
      <IconButton icon={<SettingsIcon />} label="Primary" variant="primary" lift={false} />
      <IconButton icon={<DeleteIcon />} label="Danger" variant="danger" />
      <IconButton icon={<SettingsIcon />} label="Circle" variant="secondary" shape="pill" />
    </div>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Is square and as tall as a Button in every register", async ({ mount }) => {
  const component = await mount(
    <div>
      {(["compact", "default", "large", "hero"] as const).map((register) => (
        <Presentation key={register} register={register}>
          <div style={{ display: "flex" }} data-register-row={register}>
            <Button>Export</Button>
            <IconButton icon={<DownloadIcon />} label={`Download ${register}`} />
          </div>
        </Presentation>
      ))}
    </div>
  );
  for (const [register, height] of [["compact", 28], ["default", 40], ["large", 48], ["hero", 56]] as const) {
    const box = await component.getByRole("button", { name: `Download ${register}` }).boundingBox();
    const buttonBox = await component.locator(`[data-register-row=${register}]`).getByRole("button", { name: "Export" }).boundingBox();
    expect(box?.height).toBe(height);
    expect(box?.width).toBe(height);
    expect(buttonBox?.height).toBe(height);
  }
});

test("The label names the button and shows as a tooltip on focus", async ({ mount, page }) => {
  let clicks = 0;
  await mount(<IconButton icon={<DeleteIcon />} label="Delete draft" onClick={() => clicks++} />);
  const button = page.getByRole("button", { name: "Delete draft" });
  await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveText("Delete draft");
  await expect(button.locator("svg")).toHaveAttribute("aria-hidden", "true");
  await expect(button).toHaveAttribute("type", "button");
  await page.keyboard.press("Enter");
  await expect.poll(() => clicks).toBe(1);
});

test("tooltip={false} leaves only the accessible name", async ({ mount, page }) => {
  await mount(<IconButton icon={<DeleteIcon />} label="Delete draft" tooltip={false} />);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Delete draft" })).toBeFocused();
  await page.waitForTimeout(500);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});
