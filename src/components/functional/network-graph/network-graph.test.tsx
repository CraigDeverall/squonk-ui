import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import type { Page } from "playwright";
import { SquonkThemeProvider } from "../../../theme/theme-provider";
import { Card } from "../../layout/card/card";
import { NetworkGraph } from "./network-graph";
import {
  FitHarness,
  GraphHarness,
  IconHarness,
  KeyHarness,
  LegendHarness,
  LiveHarness,
  PinHarness,
  RenderNodeHarness,
  RichHarness,
  SameKindHarness,
  SelectionHarness,
} from "./network-graph.harness";

const node = (page: Page, name: string) => page.getByRole("button", { name: new RegExp(`^${name}, `) });
const drawing = (page: Page) => page.getByRole("group", { name: "Chapter links in the Waikato region" }).locator("svg").first();
/** Each drawn node's place, by id. */
const places = (page: Page) =>
  page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll<SVGGElement>("[data-node-id]")].map((el) => [el.dataset.nodeId, el.getAttribute("transform")]),
    ),
  );
const view = (page: Page) => drawing(page).locator("> g").getAttribute("transform");

for (const mode of ["light", "dark"] as const) {
  test(`Default render of the NetworkGraph component with its legend (${mode})`, async ({ mount, page }) => {
    const component = await mount(
      <SquonkThemeProvider mode={mode}>
        <Card>
          <KeyHarness hiddenKinds={{ links: ["directs"] }} />
          <GraphHarness defaultSelectedId="waikato" />
        </Card>
      </SquonkThemeProvider>,
    );
    await expect(node(page, "Waikato Chapter")).toBeVisible();
    await expect(await component.screenshot()).toMatchSnapshot();
  });
}

test("NetworkGraph gives each node an accessible name and keeps the full label when it is cut short", async ({ mount, page }) => {
  await mount(<GraphHarness />);
  await expect(page.getByRole("group", { name: "Chapter links in the Waikato region" })).toBeVisible();
  await expect(node(page, "Waikato Chapter")).toHaveAccessibleName("Waikato Chapter, Chapter, 3 connections");
  const long = page.locator('[data-node-id="old"]');
  await expect(long).toHaveAccessibleName(
    "Waikato Watchers (1998) Group, formerly Waikato and Coastal Watchers, Chapter, Closed chapter, 1 connection",
  );
  await expect(long.locator("text")).toHaveText("Waikato Watchers (1998)…");
  await expect(long.locator("title")).toHaveText(
    "Waikato Watchers (1998) Group, formerly Waikato and Coastal Watchers (Closed chapter)",
  );
  await expect(long).toHaveAttribute("data-variant", "dashed");
});

test("NetworkGraph repeats its data as accessible tables for screen readers", async ({ mount, page }) => {
  await mount(<GraphHarness />);
  const nodesTable = page.getByRole("table", { name: "Chapter links in the Waikato region: nodes" });
  await expect(nodesTable.getByRole("row")).toHaveCount(7);
  await expect(nodesTable.getByRole("row", { name: /^Waikato Chapter/ })).toContainText(
    "Chen Household, Hemlock Hollow Chapter",
  );
  const linksTable = page.getByRole("table", { name: "Chapter links in the Waikato region: links" });
  await expect(linksTable.getByRole("row")).toHaveCount(6);
  await expect(linksTable.getByRole("row").nth(1)).toContainText("Funds 60%");
});

test("NetworkGraph selects a node on click, dims what is not connected and clears on a background click (uncontrolled)", async ({ mount, page }) => {
  await mount(<SelectionHarness />);
  await node(page, "Hemlock Hollow Chapter").click();
  await expect(node(page, "Hemlock Hollow Chapter")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-node-id][data-selected]")).toHaveCount(1);
  // Hemlock Hollow's neighbours are Waikato and Priya; the other three are set back.
  await expect(page.locator("[data-node-id][data-dimmed]")).toHaveCount(3);
  await expect(node(page, "Waikato Chapter")).not.toHaveAttribute("data-dimmed");
  await expect(page.locator("[data-link-source][data-dimmed]")).toHaveCount(3);

  await drawing(page).click({ position: { x: 8, y: 8 } });
  await expect(page.locator("[data-selected]")).toHaveCount(0);
  await expect(page.locator("[data-dimmed]")).toHaveCount(0);
  await expect(page.getByLabel("Selection changes")).toHaveText("hollow none");
});

test("NetworkGraph follows a selection its parent holds, and does not change it itself", async ({ mount, page }) => {
  const changes: (string | null)[] = [];
  await mount(<GraphHarness selectedId="hollow" onSelectionChange={(id) => changes.push(id)} />);
  await expect(node(page, "Hemlock Hollow Chapter")).toHaveAttribute("aria-pressed", "true");
  await node(page, "Avery Chen").click({ force: true });
  expect(changes).toEqual(["avery"]);
  await expect(node(page, "Hemlock Hollow Chapter")).toHaveAttribute("aria-pressed", "true");
  await expect(node(page, "Avery Chen")).toHaveAttribute("aria-pressed", "false");
});

test("NetworkGraph keyboard: one tab stop, arrows follow links, Enter and Space select, Escape clears", async ({ mount, page }) => {
  await mount(<SelectionHarness controlled />);
  await expect(page.locator('[data-node-id][tabindex="0"]')).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(node(page, "Waikato Chapter")).toBeFocused();

  // An arrow towards Hemlock Hollow lands on a node linked to Waikato.
  const at = await places(page);
  const point = (id: string) => at[id]!.match(/-?[\d.]+/g)!.map(Number);
  const [hx, hy] = point("waikato");
  const [kx, ky] = point("hollow");
  const arrow = Math.abs(kx - hx) > Math.abs(ky - hy) ? (kx > hx ? "ArrowRight" : "ArrowLeft") : ky > hy ? "ArrowDown" : "ArrowUp";
  await page.keyboard.press(arrow);
  const focused = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.nodeId);
  expect(["hollow", "trust", "old"]).toContain(focused);

  // Page Down and Up step through the nodes in order; Home and End jump.
  await page.keyboard.press("Home");
  await expect(node(page, "Waikato Chapter")).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect(node(page, "Hemlock Hollow Chapter")).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.locator('[data-node-id="old"]')).toBeFocused();
  await page.keyboard.press("PageUp");
  await expect(node(page, "Chen Household")).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(node(page, "Chen Household")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(page.locator("[data-selected]")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-selected]")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-selected]")).toHaveCount(0);
  await expect(page.getByLabel("Selection changes")).toHaveText("trust none trust none");
  // The node that had focus stays the tab stop.
  await expect(page.locator('[data-node-id][tabindex="0"]')).toHaveAttribute("data-node-id", "trust");
});

test("NetworkGraph shows a link's label while a node at either end has focus", async ({ mount, page }) => {
  await mount(<GraphHarness />);
  await expect(node(page, "Waikato Chapter")).toBeVisible();
  await expect(drawing(page).getByText("Funds 60%")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(drawing(page).getByText("Funds 60%")).toBeVisible();
  // A link with no label of its own shows its kind's.
  await expect(drawing(page).getByText("Funds", { exact: true })).toHaveCount(2);
});

test("NetworkGraphLegend hides and shows a kind, and the other nodes stay stable", async ({ mount, page }) => {
  await mount(<LegendHarness />);
  await expect(page.locator("[data-node-id]")).toHaveCount(6);
  const before = await places(page);
  const person = page.getByRole("button", { name: /^Member/ });
  await expect(person).toHaveAttribute("aria-pressed", "true");

  await person.click();
  await expect(person).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("[data-node-id]")).toHaveCount(4);
  await expect(page.locator("[data-link-source]")).toHaveCount(3);
  const after = await places(page);
  for (const id of Object.keys(after)) expect(after[id]).toBe(before[id]);

  await page.getByRole("button", { name: /^Funds/ }).click();
  await expect(page.locator("[data-link-source]")).toHaveCount(0);
  await expect(page.locator("[data-node-id]")).toHaveCount(4);

  await person.click();
  await expect(page.locator("[data-node-id]")).toHaveCount(6);
  expect(await places(page)).toEqual(before);
});

test("NetworkGraphLegend without a change handler is a key with no buttons", async ({ mount, page }) => {
  const component = await mount(<KeyHarness hiddenKinds={{ nodes: ["person"] }} />);
  await expect(component.getByRole("button")).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Node kinds" }).getByRole("listitem")).toHaveText(["Chapter", "Member", "Household"]);
  await expect(page.getByRole("list", { name: "Link kinds" }).getByRole("listitem")).toHaveText(["Funds", "Leads"]);
});

test("NetworkGraph stays stable when nodes are added and removed", async ({ mount, page }) => {
  await mount(<LiveHarness />);
  await expect(page.locator("[data-node-id]")).toHaveCount(6);
  const before = await places(page);
  const viewBefore = await view(page);

  await page.getByRole("button", { name: "Add a node" }).click();
  await page.getByRole("button", { name: "Add a node" }).click();
  await expect(page.locator("[data-node-id]")).toHaveCount(8);
  const after = await places(page);
  for (const id of Object.keys(before)) expect(after[id]).toBe(before[id]);
  expect(await view(page)).toBe(viewBefore);

  await page.getByRole("button", { name: "Remove a node" }).click();
  await expect(page.locator("[data-node-id]")).toHaveCount(7);
  const fewer = await places(page);
  for (const id of Object.keys(fewer)) expect(fewer[id]).toBe(after[id]);
});

test("NetworkGraph fades new nodes in, and with reduced motion draws them still", async ({ mount, page }) => {
  await mount(<LiveHarness />);
  await expect(page.locator("[data-node-id]")).toHaveCount(6);
  // Record which elements the graph animates, so the check does not race the fade.
  await page.evaluate(() => {
    const started: string[] = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<typeof animate>) {
      const { nodeId, linkTarget } = (this as SVGElement).dataset;
      started.push(nodeId ?? `link to ${linkTarget}`);
      return animate.apply(this, args);
    };
    (window as unknown as { fades: string[] }).fades = started;
  });
  const fades = () => page.evaluate(() => (window as unknown as { fades: string[] }).fades);

  await page.getByRole("button", { name: "Add a node" }).click();
  await expect(page.locator("[data-node-id]")).toHaveCount(7);
  // The new node and its link fade in; nothing that was already there does.
  await expect.poll(async () => (await fades()).sort()).toEqual(["link to new-0", "new-0"]);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Add a node" }).click();
  await expect(page.locator("[data-node-id]")).toHaveCount(8);
  await expect(page.locator('[data-node-id="new-1"]')).toBeVisible();
  expect(await fades()).toHaveLength(2);
});

test("NetworkGraph zoom buttons are accessible; wheel and drag change the view and Fit to view restores it", async ({ mount, page }) => {
  await mount(<GraphHarness />);
  await expect(node(page, "Waikato Chapter")).toBeVisible();
  const fitted = await view(page);
  const scale = async () => Number((await view(page))!.match(/scale\(([\d.]+)\)/)![1]);
  const initial = await scale();

  // The buttons ease the view, so each check waits for the move to end.
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect.poll(scale).toBeCloseTo(initial * 1.4);
  await page.getByRole("button", { name: "Zoom out" }).click();
  await expect.poll(scale).toBeCloseTo(initial);

  const box = (await drawing(page).boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.wheel(0, -300);
  await expect.poll(scale).toBeGreaterThan(initial);

  // Dragging the background pans.
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 60, { steps: 4 });
  await page.mouse.up();
  expect(await view(page)).not.toBe(fitted);

  await page.getByRole("button", { name: "Fit to view" }).click();
  await expect.poll(() => view(page)).toBe(fitted);
});

test("NetworkGraph fills its container, stays centred on resize and does not overflow it", async ({ mount, page }) => {
  const component = await mount(<GraphHarness />);
  const graph = page.getByRole("group", { name: "Chapter links in the Waikato region" });
  await expect(node(page, "Waikato Chapter")).toBeVisible();
  const box = (await graph.boundingBox())!;
  expect([Math.round(box.width), Math.round(box.height)]).toEqual([640, 420]);
  const before = await view(page);
  await component.evaluate((element) => {
    (element as HTMLElement).style.width = "400px";
  });
  await expect.poll(() => view(page)).not.toBe(before);
  expect(Math.round((await graph.boundingBox())!.width)).toBe(400);
  // Only the middle moved: the scale and the reader's pan are kept.
  expect((await view(page))!.replace(/^translate\([^)]*\)/, "")).toBe(before!.replace(/^translate\([^)]*\)/, ""));
});

test("NetworkGraph shows an empty state with no nodes", async ({ mount, page }) => {
  const component = await mount(
    <div style={{ width: 480, height: 300 }}>
      <NetworkGraph label="Related chapters" nodes={[]} links={[]} empty="No related chapters yet" />
    </div>,
  );
  const graph = page.getByRole("group", { name: "Related chapters" });
  await expect(graph).toContainText("No related chapters yet");
  await expect(graph.getByRole("button")).toHaveCount(0);
  const box = (await graph.boundingBox())!;
  expect([Math.round(box.width), Math.round(box.height)]).toEqual([480, 300]);
  await expect(component.getByRole("table")).toHaveCount(0);
});

const scaleOf = async (page: Page) => Number((await view(page))!.match(/scale\(([\d.]+)\)/)![1]);

test("NetworkGraph with autoFit and settleOnChange zooms in on what a search leaves, up to maxFitZoom", async ({ mount, page }) => {
  await mount(<FitHarness />);
  await expect(node(page, "Waikato Chapter")).toBeVisible();
  const before = await scaleOf(page);
  await page.getByRole("button", { name: "Narrow" }).click();
  await expect(node(page, "Avery Chen")).toHaveCount(0);
  await expect.poll(() => scaleOf(page)).toBeGreaterThan(before);
  await expect.poll(() => scaleOf(page)).toBeLessThanOrEqual(2);
  // The two that are left drew together: closer than before the search.
  const gap = async () => {
    const [a, b] = await Promise.all(["waikato", "hollow"].map((id) => page.locator(`[data-node-id="${id}"]`).getAttribute("transform")));
    const [ax, ay] = a!.match(/[-\d.]+/g)!.map(Number);
    const [bx, by] = b!.match(/[-\d.]+/g)!.map(Number);
    return Math.hypot(ax - bx, ay - by);
  };
  await expect.poll(gap).toBeLessThan(400);
});

test("NetworkGraph with reduced motion moves the view at once", async ({ mount, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mount(<GraphHarness />);
  await expect(node(page, "Waikato Chapter")).toBeVisible();
  const initial = await scaleOf(page);
  await page.getByRole("button", { name: "Zoom in" }).click();
  expect(await scaleOf(page)).toBeCloseTo(initial * 1.4);
});

test("NetworkGraph full screen keyboard: focus moves to the way out, the page behind is inert, and focus comes back", async ({ mount, page }) => {
  await mount(<FitHarness fullscreen />);
  await expect(node(page, "Waikato Chapter")).toBeVisible();
  await page.getByRole("button", { name: "Full screen" }).click();
  const exit = page.getByRole("button", { name: "Exit full screen" });
  await expect(exit).toBeFocused();
  await expect(page.getByRole("textbox", { name: "Search the graph" })).toBeVisible();
  const narrowIsInert = () => page.locator("button", { hasText: "Narrow" }).evaluate((element) => element.closest("[inert]") !== null);
  expect(await narrowIsInert()).toBe(true);
  // The graph covers the window. Where the browser's own full screen starts, the window is the screen.
  const box = (await page.getByRole("group", { name: "Chapter links in the Waikato region" }).boundingBox())!;
  const windowSize = await page.evaluate(() => [window.innerWidth, window.innerHeight]);
  expect([Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height)]).toEqual([0, 0, ...windowSize]);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Full screen" })).toBeFocused();
  expect(await narrowIsInert()).toBe(false);
});

test("NetworkGraph in full screen with autoFit fits again, clear of an aside that opens on selection", async ({ mount, page }) => {
  await mount(<FitHarness fullscreen />);
  await expect(node(page, "Waikato Chapter")).toBeVisible();
  await page.getByRole("button", { name: "Full screen" }).click();
  await expect(page.getByRole("button", { name: "Exit full screen" })).toBeFocused();
  const before = await view(page);
  await node(page, "Waikato Chapter").focus();
  await page.keyboard.press("Enter");
  const aside = page.getByText("Details of waikato");
  await expect(aside).toBeVisible();
  await expect.poll(() => view(page)).not.toBe(before);
  // Every node ends up to the left of the aside.
  const asideLeft = (await aside.boundingBox())!.x;
  await expect
    .poll(async () => {
      const boxes = await page.locator("[data-node-id] path").evaluateAll((paths) => paths.map((path) => path.getBoundingClientRect().right));
      return Math.max(...boxes);
    })
    .toBeLessThan(asideLeft);
});

test("NetworkGraph draws a kind's icon on its nodes and its legend key", async ({ mount, page }) => {
  await mount(<IconHarness />);
  await expect(node(page, "Avery Chen")).toBeVisible();
  await expect(page.locator('[data-node-id="avery"] [data-icon="user"]')).toHaveCount(1);
  await expect(page.locator('[data-node-id="waikato"] [data-icon]')).toHaveCount(0);
  await expect(page.locator('svg [data-icon="user"]')).toHaveCount(3);
});

test("NetworkGraph draws icons, images, sizes, line weights and link animations", async ({ mount, page }) => {
  await mount(<RichHarness />);
  await expect(page.locator("[data-node-id]")).toHaveCount(6);
  // A kind's icon on each node of that kind; an image in place of the shape.
  await expect(page.getByTestId("kind-icon")).toHaveCount(2);
  await expect(page.locator('[data-node-id="packhouse"] image')).toHaveCount(1);
  await expect(page.locator('[data-node-id="packhouse"] path')).toHaveCount(0);
  // A node of size 2 is drawn twice as wide.
  const width = (id: string) =>
    page.locator(`[data-node-id="${id}"] path`).first().evaluate((el) => (el as SVGGraphicsElement).getBBox().width);
  expect(await width("orchard")).toBeCloseTo((await width("farm")) * 2, 0);
  // A kind's thickness and animation, and a link's own.
  const link = (source: string) => page.locator(`[data-link-source="${source}"]`);
  await expect(link("orchard")).toHaveAttribute("data-animation", "flow");
  await expect(link("farm")).toHaveAttribute("data-animation", "particles");
  await expect(link("farm").locator("circle")).toHaveCount(3);
  await expect(link("other")).not.toHaveAttribute("data-animation");
  const lineWidth = (source: string) =>
    link(source).locator("path").first().evaluate((el) => getComputedStyle(el).strokeWidth);
  expect(await lineWidth("orchard")).toBe("4px");
  expect(await lineWidth("farm")).toBe("8px");
  expect(await lineWidth("other")).toBe("1.5px");
  // Each animation runs the Motion loop for it, at the kind's pace.
  const motion = (locator: ReturnType<typeof link>) =>
    locator.evaluate((el) => {
      const style = getComputedStyle(el);
      return `${style.animationName} ${style.animationDuration} ${style.animationPlayState}`;
    });
  expect(await motion(link("orchard").locator("path").first())).toMatch(/flow\S* 0\.9s running/);
  expect(await motion(link("farm").locator("circle").first())).toMatch(/travel\S* 0\.9s running/);
  expect(await motion(page.locator('[data-link-source="packhouse"][data-link-target="shop-b"] path').first())).toMatch(/pulse\S* 1\.6s running/);
});

test("NetworkGraph stops link animations with reduced motion", async ({ mount, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mount(<RichHarness />);
  // The flow holds still and the travelling dots hide.
  const line = page.locator('[data-link-source="orchard"] path').first();
  expect(await line.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
  const dot = page.locator('[data-link-source="farm"] circle').first();
  expect(await dot.evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
});

test("NetworkGraph lights the structure around the node pointed at", async ({ mount, page }) => {
  await mount(<RichHarness hoverHighlight="downstream" />);
  await expect(page.locator("[data-dimmed]")).toHaveCount(0);
  await page.locator('[data-node-id="orchard"]').hover();
  // Orchard feeds the packhouse, which sells to both shops.
  const lit = await page
    .locator("[data-node-id][data-highlighted]")
    .evaluateAll((els) => els.map((el) => (el as SVGElement).dataset.nodeId).sort());
  expect(lit).toEqual(["orchard", "packhouse", "shop-a", "shop-b"]);
  await expect(page.locator("[data-node-id][data-dimmed]")).toHaveCount(2);
  await expect(page.locator('[data-link-source="other"]')).toHaveAttribute("data-dimmed");
  await page.mouse.move(2, 2);
  await expect(page.locator("[data-dimmed]")).toHaveCount(0);
});

test("NetworkGraph lights a structure from a function, and from keyboard focus", async ({ mount, page }) => {
  await mount(<SameKindHarness />);
  await expect(page.locator('[data-node-id="orchard"]')).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator('[data-node-id="orchard"]')).toBeFocused();
  const lit = await page
    .locator("[data-node-id][data-highlighted]")
    .evaluateAll((els) => els.map((el) => (el as SVGElement).dataset.nodeId).sort());
  expect(lit).toEqual(["farm", "orchard"]);
});

test("NetworkGraph draws each node with renderNode, keeping its label and name", async ({ mount, page }) => {
  await mount(<RenderNodeHarness />);
  await expect(page.getByTestId("custom-waikato")).toHaveCount(1);
  await expect(page.locator('[data-node-id="waikato"] path')).toHaveCount(0);
  await expect(node(page, "Waikato Chapter")).toHaveAccessibleName("Waikato Chapter, Chapter, 3 connections");
});

test("NetworkGraph with the force layout pulls neighbours after a dragged node and keeps pinned nodes still", async ({ mount, page }) => {
  await mount(<PinHarness />);
  await expect(page.locator("[data-node-id]")).toHaveCount(6);
  await expect(page.locator("[data-pinned]")).toHaveCount(1);
  const before = await places(page);
  const box = (await node(page, "Hemlock Hollow Chapter").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 60, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => (await places(page)).priya).not.toBe(before.priya);
  const after = await places(page);
  expect(after.hollow).not.toBe(before.hollow);
  expect(after.waikato).toBe(before.waikato);
  // A drag is not a click: nothing is selected.
  await expect(page.locator("[data-selected]")).toHaveCount(0);
});

test("NetworkGraph pins and unpins a node by double-click and by P", async ({ mount, page }) => {
  await mount(<PinHarness controlled />);
  await node(page, "Avery Chen").dblclick();
  await expect(node(page, "Avery Chen")).toHaveAttribute("data-pinned");
  await expect(node(page, "Avery Chen")).toHaveAccessibleName(/, pinned$/);
  await page.keyboard.press("p");
  await expect(node(page, "Avery Chen")).not.toHaveAttribute("data-pinned");
  await expect(page.getByLabel("Pin changes")).toHaveText("avery,waikato | waikato");
});

test("NetworkGraph with the static layout moves only the dragged node when nodes are draggable", async ({ mount, page }) => {
  await mount(<GraphHarness draggableNodes />);
  await expect(page.locator("[data-node-id]")).toHaveCount(6);
  const before = await places(page);
  const box = (await node(page, "Avery Chen").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  const after = await places(page);
  expect(after.avery).not.toBe(before.avery);
  for (const id of Object.keys(before).filter((id) => id !== "avery")) expect(after[id]).toBe(before[id]);
});
