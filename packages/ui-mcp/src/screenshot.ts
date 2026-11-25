// Optional screenshots through the app's own Playwright, so an agent that
// can't see the story page can still look at the story it showed.
import { pathToFileURL } from "node:url";
import { resolveFromProject, type Project } from "./project.ts";
import type { StoryStatus } from "./shell/protocol.ts";

type Browser = { newPage(options: object): Promise<Page>; close(): Promise<void> };
type Page = {
  goto(url: string): Promise<unknown>;
  waitForFunction(fn: string, arg?: unknown, options?: object): Promise<unknown>;
  evaluate<T>(fn: string): Promise<T>;
  waitForTimeout(ms: number): Promise<void>;
  locator(selector: string): { screenshot(options: object): Promise<Buffer> };
  close(): Promise<void>;
};

export class Screenshots {
  private browser?: Promise<Browser>;

  constructor(private project: Project) {}

  available(): boolean {
    return Boolean(resolveFromProject(this.project, "playwright"));
  }

  private launch(): Promise<Browser> {
    this.browser ??= (async () => {
      const entry = resolveFromProject(this.project, "playwright");
      if (!entry) throw new Error("Playwright is not installed in this app.");
      const playwright = await import(pathToFileURL(entry).href);
      return (playwright.chromium ?? playwright.default.chromium).launch();
    })();
    this.browser.catch(() => (this.browser = undefined));
    return this.browser;
  }

  /**
   * A PNG of the story's frame (not the toolbar or controls) at `width`
   * (default 1024), once it has rendered or failed, and what it reported.
   */
  async capture(url: string, width = 1024): Promise<{ png: Buffer; status?: StoryStatus }> {
    const page = await (await this.launch()).newPage({ viewport: { width, height: 720 } });
    try {
      await page.goto(url);
      await page.waitForFunction("window.__PRODUCT_UI_STORY_STATUS__ !== undefined", undefined, { timeout: 20_000 });
      // Let entrance motion settle.
      await page.waitForTimeout(400);
      const status = await page.evaluate<StoryStatus | undefined>("window.__PRODUCT_UI_STORY_STATUS__");
      return { png: await page.locator(".sv-stage").screenshot({ type: "png" }), status };
    } finally {
      await page.close();
    }
  }

  async close() {
    if (this.browser) await (await this.browser).close().catch(() => {});
  }
}
