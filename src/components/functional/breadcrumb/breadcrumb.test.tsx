import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { Breadcrumb } from "./breadcrumb";

const trail = [
  { label: "My account", href: "/account" },
  { label: "Waikato Chapter", href: "/chapter" },
  { label: "Sightings", href: "/sightings" },
  { label: "Sighting of 14 March 2026" },
];

test("Renders the Breadcrumb", async ({ mount }) => {
  const component = await mount(
    <div style={{ display: "grid", gap: 16, padding: 4, width: 520 }}>
      <Breadcrumb items={trail} />
      <Breadcrumb items={trail} homeIcon />
      <Breadcrumb items={[...trail.slice(0, 3), { label: "a", href: "/a" }, { label: "Current" }]} maxItems={3} />
    </div>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("A named nav landmark with an ordered list and the current page last", async ({ mount, page }) => {
  await mount(<Breadcrumb items={trail} homeIcon />);
  const nav = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(nav.getByRole("listitem")).toHaveCount(4);
  await expect(nav.getByRole("link")).toHaveCount(3);
  await expect(nav.getByRole("link", { name: "My account" })).toHaveAttribute("href", "/account");
  await expect(nav.getByText("Sighting of 14 March 2026")).toHaveAttribute("aria-current", "page");
  await expect(nav.locator("svg").first()).toHaveAttribute("aria-hidden", "true");
});

test("A collapsed trail expands and focuses the first revealed crumb", async ({ mount, page }) => {
  const long = [
    { label: "Account", href: "/account" },
    { label: "Membership", href: "/membership" },
    { label: "Aroha Ngata", href: "/aroha" },
    { label: "Waikato Chapter", href: "/chapter" },
    { label: "Sightings", href: "/sightings" },
    { label: "March 2026" },
  ];
  await mount(<Breadcrumb items={long} maxItems={3} />);
  const nav = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(nav.getByRole("link")).toHaveText(["Account", "Sightings"]);
  const expand = nav.getByRole("button", { name: "Show 3 more levels" });
  await expand.focus();
  await page.keyboard.press("Enter");
  await expect(nav.getByRole("link")).toHaveCount(5);
  await expect(nav.getByRole("link", { name: "Membership" })).toBeFocused();
});
