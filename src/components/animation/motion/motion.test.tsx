import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Button as AriaButton, Dialog, DialogTrigger, Popover } from "react-aria-components";
import { Motion } from "./motion";
import { CountHarness, FunctionClassHarness, LayoutHarness, LevelHarness, PresenceHarness, SwapHarness } from "./motion.harness";

test("Feedback answers at once and fades back to rest", async ({ mount, page }) => {
  const component = await mount(
    <div style={{ padding: 40 }}>
      <Motion.Feedback><AriaButton>Save</AriaButton></Motion.Feedback>
    </div>
  );
  const button = component.getByRole("button", { name: "Save" });
  await expect.poll(() => button.evaluate((el) => getComputedStyle(el).transitionDuration.split(",")[0].trim())).toBe("0.165s");
  await button.hover();
  await expect.poll(() => button.evaluate((el) => getComputedStyle(el).transitionDuration.split(",")[0].trim())).toBe("0s");
  await page.mouse.move(0, 0);
  await expect.poll(() => button.evaluate((el) => getComputedStyle(el).transitionDuration.split(",")[0].trim())).toBe("0.165s");
});

test("A Motion component keeps the child's own class, string or React Aria function", async ({ mount }) => {
  const component = await mount(
    <div>
      <Motion.Feedback><span className="own-string">A</span></Motion.Feedback>
      <FunctionClassHarness />
    </div>
  );
  await expect(component.getByText("A")).toHaveClass(/own-string .*feedback/);
  const button = component.getByRole("button", { name: "B" });
  await expect(button).toHaveClass(/own-function .*feedback/);
  await button.hover();
  await expect(button).toHaveClass(/own-hovered .*feedback/);
});

test("Pop animates an opening popover, and only fades with reduced motion", async ({ mount, page }) => {
  const popover = (
    <DialogTrigger>
      <AriaButton>Open</AriaButton>
      <Motion.Pop>
        <Popover data-testid="popover"><Dialog aria-label="Details">Details</Dialog></Popover>
      </Motion.Pop>
    </DialogTrigger>
  );
  // DialogTrigger renders no element of its own, so the mounted root is the button.
  await mount(popover);
  const open = page.getByRole("button", { name: "Open" });
  await open.click();
  const opened = page.getByTestId("popover");
  await expect(opened).toHaveClass(/pop/);
  await expect(opened).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(opened).toBeHidden();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await open.click();
  await expect(opened).toBeVisible();
  // It still fades, but doesn't grow: it starts from full size.
  expect(await opened.evaluate((el) => {
    const probe = document.createElement("div");
    probe.style.scale = getComputedStyle(el).getPropertyValue("--motion-from-scale");
    el.append(probe);
    const scale = getComputedStyle(probe).scale;
    probe.remove();
    return scale;
  })).toBe("1");
});

test("Spin slows down with reduced motion rather than stopping", async ({ mount, page }) => {
  const component = await mount(<Motion.Spin><span role="img" aria-label="Loading" style={{ display: "inline-block", width: 16, height: 16 }} /></Motion.Spin>);
  await expect.poll(() => component.evaluate((el) => getComputedStyle(el).animationDuration.split(",")[0].trim())).toBe("0.8s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => component.evaluate((el) => getComputedStyle(el).animationDuration.split(",")[0].trim())).toBe("1.8s");
});

test("Reveal animates the element itself, keeps its style, and shows it at once when focused", async ({ mount }) => {
  const component = await mount(
    <div style={{ paddingTop: 2000 }}>
      <Motion.Reveal delayMs={5000}>
        <section aria-label="Arriving" style={{ color: "rgb(1, 2, 3)" }}><button>Continue</button></section>
      </Motion.Reveal>
    </div>
  );
  const section = component.getByRole("region", { name: "Arriving" });
  await expect(section).toHaveClass(/reveal/);
  await expect(section).toHaveCSS("color", "rgb(1, 2, 3)");
  await expect(section).toHaveCSS("opacity", "0", { timeout: 10000 });
  await component.getByRole("button", { name: "Continue" }).focus();
  await expect(section).toHaveCSS("opacity", "1", { timeout: 500 });
});

test("Reveal leaves content visible when IntersectionObserver isn't available", async ({ mount, page }) => {
  await page.evaluate(() => Object.defineProperty(window, "IntersectionObserver", { value: undefined, configurable: true }));
  const component = await mount(<div style={{ paddingTop: 2000 }}><Motion.Reveal><section aria-label="Arriving"><button>Continue</button></section></Motion.Reveal></div>);
  await expect(component.getByRole("region", { name: "Arriving" })).toHaveCSS("opacity", "1");
});

test("The provider's motion level turns motion off, and reduced keeps fades", async ({ mount, page }) => {
  await mount(<LevelHarness level="none" />);
  await page.getByRole("button", { name: "Open" }).click();
  const popover = page.getByTestId("popover");
  await expect(popover).toBeVisible();
  await expect(popover).toHaveCSS("animation-duration", "0s");
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
});

test("Reduced motion from the provider stops travel but keeps time", async ({ mount }) => {
  const component = await mount(<LevelHarness level="reduced" />);
  const reduced = await component.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--squonk-motion-level-reduced").trim());
  expect(reduced).toBe("1");
});

test("Presence plays its exit before unmounting, and nests around Highlight", async ({ mount, page }) => {
  const component = await mount(<PresenceHarness />);
  const notice = component.getByText("Saved");
  await expect(notice).toHaveClass(/own .*presence.*highlight/);
  await expect(notice).not.toHaveClass(/entering/);
  await page.getByRole("button", { name: "Toggle" }).click();
  await expect(notice).toHaveClass(/exiting/);
  await expect(notice).toHaveCount(0);
  await expect(component.getByLabel("Exited")).toHaveText("1");
  await page.getByRole("button", { name: "Toggle" }).click();
  await expect(component.getByText("Saved")).toBeVisible();
  await expect(component.getByText("Saved")).toHaveClass(/entering/);
});

test("Swap plays nothing at first, then on each change", async ({ mount, page }) => {
  const component = await mount(<SwapHarness />);
  const content = component.getByLabel("Content");
  await expect(content).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(content).not.toHaveCSS("animation-name", "none");
  const first = await content.evaluate((el) => getComputedStyle(el).animationName);
  await page.getByRole("button", { name: "Next" }).click();
  await expect.poll(() => content.evaluate((el) => getComputedStyle(el).animationName)).not.toBe(first);
});

test("Layout glides moved items and fades in new ones", async ({ mount, page }) => {
  const component = await mount(<LayoutHarness />);
  await page.getByRole("button", { name: "Reverse" }).click();
  const glides = await component.locator("li").evaluateAll((els) => els.map((el) => el.getAnimations().length));
  expect(glides).toEqual([1, 0, 1]);
  await page.getByRole("button", { name: "Add" }).click();
  const added = component.locator("li").last();
  expect(await added.evaluate((el) => el.getAnimations().length)).toBe(1);
});

test("Count counts to its new value and announces only the final one", async ({ mount, page }) => {
  const component = await mount(<CountHarness />);
  const figure = component.getByLabel("Figure");
  await expect(figure.locator("[aria-hidden=true]")).toHaveText("NZ$1,000.00");
  await page.getByRole("button", { name: "Raise" }).click();
  await expect(figure.locator("[aria-hidden=true]")).not.toHaveText("NZ$1,000.00");
  await expect(figure.locator("[aria-hidden=true]")).not.toHaveText("NZ$5,000.00", { timeout: 100 });
  await expect(figure.locator("[aria-hidden=true]")).toHaveText("NZ$5,000.00");
  await expect(figure).toHaveText(/NZ\$5,000\.00$/);
});
