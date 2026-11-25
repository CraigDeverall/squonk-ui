import type { Page } from "playwright";

/** Wait until every finite CSS animation on the page (open/close of overlays) has finished. */
export async function settleAnimations(page: Page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => {
      const iterations = animation.effect?.getComputedTiming().iterations;
      return iterations === Infinity || animation.playState !== "running";
    })
  );
}
