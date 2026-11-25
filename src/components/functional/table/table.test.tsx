import type {} from "./table.typecheck";
import { TableCompactCurrencyHarness, TableStatefulHarness } from "./table.harness";
import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Table, type TableColumn } from "./table";

interface DemoUser {
  name: string;
  email: string;
  role: string;
}

const columns: TableColumn<DemoUser>[] = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "role", header: "Role", align: "right" },
];

const rows: DemoUser[] = [
  { name: "Ada Lovelace", email: "ada@example.com", role: "Admin" },
  { name: "Grace Hopper", email: "grace@example.com", role: "Member" },
];

// when updating the snapshot, add .only so that you don"t update the snapshot for all tests, then run npm run test:update
test("Renders the Table", async ({ mount }) => {
  const component = await mount(
    <Table
      columns={columns}
      rows={rows}
      rowKey="email"
      caption="Project users"
    />
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders striped rows", async ({ mount }) => {
  const component = await mount(
    <Table columns={columns} rows={rows} striped />
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders the empty state", async ({ mount }) => {
  const component = await mount(
    <Table columns={columns} rows={[]} empty="No users yet." />
  );
  await expect(component.getByText("No users yet.")).toBeVisible();
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Stable identity fields retain cell state after row reordering", async ({ mount }) => {
  const component = await mount(<TableStatefulHarness />);
  await component.getByRole("textbox", { name: "Name 1" }).fill("Edited Ada");
  await component.update(<TableStatefulHarness reversed />);
  await expect(component.getByRole("textbox", { name: "Name 1" })).toHaveValue("Edited Ada");
  await expect(component.getByRole("textbox", { name: "Name 2" })).toHaveValue("Grace");
  await expect(component.getByRole("cell", { name: "2026-01-01", exact: true })).toBeVisible();
  await expect(component.getByRole("cell", { name: "A", exact: true })).toBeVisible();
});

interface Person {
  id: string;
  name: string;
  team: string;
  age: number;
}

const people: Person[] = [
  { id: "a", name: "Ada", team: "Compilers", age: 36 },
  { id: "b", name: "Grace", team: "Navy", age: 85 },
  { id: "c", name: "Alan", team: "Bletchley", age: 41 },
  { id: "d", name: "Katherine", team: "NASA", age: 101 },
];

const personColumns: TableColumn<Person>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "team", header: "Team" },
  { key: "age", header: "Age", align: "right", sortable: true },
];

test("Sortable headers are buttons, cycle the sort and expose aria-sort", async ({ mount }) => {
  const component = await mount(<Table columns={personColumns} rows={people} rowKey="id" caption="People" />);
  const ageHeader = component.getByRole("columnheader", { name: "Age" });
  const ageButton = ageHeader.getByRole("button");
  await expect(ageHeader).not.toHaveAttribute("aria-sort");
  await ageButton.click();
  await expect(ageHeader).toHaveAttribute("aria-sort", "ascending");
  await expect(component.getByRole("row").nth(1)).toContainText("Ada");
  await ageButton.click();
  await expect(ageHeader).toHaveAttribute("aria-sort", "descending");
  await expect(component.getByRole("row").nth(1)).toContainText("Katherine");
  await expect(component.getByRole("status")).toHaveText("Sorted by Age, descending");
  await ageButton.click();
  await expect(ageHeader).not.toHaveAttribute("aria-sort");
  await expect(component.getByRole("row").nth(1)).toContainText("Ada");
  await expect(component.getByRole("table", { name: "People" })).toBeVisible();
});


test("Filtering announces the row count and paging exposes row positions", async ({ mount }) => {
  const component = await mount(<Table columns={personColumns} rows={people} rowKey="id" caption="People" pageSize={2} />);
  const table = component.getByRole("table", { name: "People" });
  await expect(table).toHaveAttribute("aria-rowcount", "5");
  await expect(component.getByRole("row").nth(1)).toHaveAttribute("aria-rowindex", "2");
  await component.getByRole("button", { name: "Next page" }).click();
  await expect(component.getByText("Page 2 of 2")).toBeVisible();
  await expect(component.getByRole("row").nth(1)).toHaveAttribute("aria-rowindex", "4");
  await component.update(<Table columns={personColumns} rows={people} rowKey="id" caption="People" pageSize={2} filter="a" />);
  await component.update(<Table columns={personColumns} rows={people} rowKey="id" caption="People" pageSize={2} filter="nav" />);
  await expect(component.getByRole("status")).toHaveText("1 row");
  await expect(table).toHaveAttribute("aria-rowcount", "2");
  // One page left: the pager goes away.
  await expect(component.getByRole("navigation", { name: "People pages" })).toHaveCount(0);
});


test("Keyboard-only grid: one tab stop, arrows between rows and cells, selection, sorting and Tab out", async ({ mount, page }) => {
  const changes: string[][] = [];
  const component = await mount(
    <div>
      <button>Before</button>
      <Table columns={personColumns} rows={people} rowKey="id" caption="People" selectable onSelectionChange={(keys) => changes.push(keys)} />
      <button>After</button>
    </div>
  );
  const grid = component.getByRole("grid", { name: "People" });
  await expect(grid).toHaveAttribute("aria-multiselectable", "true");
  await component.getByRole("button", { name: "Before" }).focus();
  await page.keyboard.press("Tab");
  const rows = component.getByRole("row");
  await expect(rows.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(rows.nth(2)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(component.getByRole("rowheader", { name: "Grace" })).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("Control+End");
  await expect(rows.last()).toContainText("Katherine");
  await page.keyboard.press("Space");
  await expect(rows.last()).toHaveAttribute("aria-selected", "true");
  expect(changes.at(-1)).toEqual(["d"]);
  await page.keyboard.press("Control+Home");
  await page.keyboard.press("ArrowUp");
  await expect(component.getByRole("checkbox", { name: "Select all rows" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(component.getByRole("columnheader", { name: "Name" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(component.getByRole("columnheader", { name: "Name" })).toHaveAttribute("data-sort-direction", "ascending");
  await page.keyboard.press("Tab");
  await expect(component.getByRole("button", { name: "After" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(component.getByRole("columnheader", { name: "Name" })).toBeFocused();
});

test("Keyboard focus moves to a remaining row when the focused row is filtered out", async ({ mount, page }) => {
  const component = await mount(<Table columns={personColumns} rows={people} rowKey="id" caption="People" interactive />);
  await component.getByRole("rowheader", { name: "Grace" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(component.getByRole("rowheader", { name: "Alan" })).toBeFocused();
  await component.update(<Table columns={personColumns} rows={people} rowKey="id" caption="People" interactive filter="a" />);
  await component.update(<Table columns={personColumns} rows={people} rowKey="id" caption="People" interactive filter="ada" />);
  await expect(component.getByRole("rowheader", { name: "Ada" })).toBeFocused();
});

test("Visually hidden cell content stays inside the scroll area at phone width", async ({ mount, page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const component = await mount(<TableCompactCurrencyHarness />);
  await expect(component.getByRole("cell").first()).toHaveText("$1.8M$1,800,000.00");
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  // 1px of slack: emulated phones round the layout viewport (981 against 980).
  expect(size.scroll).toBeLessThanOrEqual(size.client + 1);
});
