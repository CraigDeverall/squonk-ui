import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Textarea } from "./textarea";

test("Renders the Textarea with helper text and a count", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 360, display: "grid", gap: 16, padding: 4 }}>
      <Textarea label="Reason" helperText="Explain what changed." maxLength={200} showCount defaultValue="Late invoice for March." />
      <Textarea label="Reason" error="Tell us why you are amending this return." />
    </div>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Label, helper, error and count reach the textarea", async ({ mount, page }) => {
  await mount(
    <div>
      <Textarea label="Reason" helperText="Explain what changed." maxLength={10} showCount required />
      <Textarea label="Notes" error="Too short" />
    </div>
  );
  const reason = page.getByRole("textbox", { name: "Reason" });
  await expect(reason).toHaveAccessibleDescription("Explain what changed. 0 / 10 characters");
  await expect(reason).toHaveAttribute("required", "");
  await reason.fill("Late invoice for March");
  await expect(reason).toHaveValue("Late invoi");
  await expect(page.getByText("10 / 10")).toBeVisible();
  const notes = page.getByRole("textbox", { name: "Notes" });
  await expect(notes).toHaveAttribute("aria-invalid", "true");
  await expect(notes).toHaveAccessibleDescription("Too short");
});

test("autoResize grows with the content", async ({ mount, page }) => {
  await mount(<div style={{ width: 300 }}><Textarea label="Notes" autoResize rows={2} /></div>);
  const notes = page.getByRole("textbox", { name: "Notes" });
  const before = (await notes.boundingBox())!.height;
  await notes.fill("one\ntwo\nthree\nfour\nfive\nsix");
  await expect.poll(async () => (await notes.boundingBox())!.height).toBeGreaterThan(before + 40);
});

test("Controlled value stays put and reports each change", async ({ mount, page }) => {
  let changes = 0;
  await mount(<Textarea label="Notes" value="" onChange={() => changes++} />);
  const notes = page.getByRole("textbox", { name: "Notes" });
  await notes.press("a");
  await expect.poll(() => changes).toBe(1);
  await expect(notes).toHaveValue("");
});
