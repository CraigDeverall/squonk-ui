import { describe, expect, it } from "vitest";
import { listItemRadius, listPanelRadius } from "./list-radius";
import { buildTheme } from "./theme";
import { themeCssVariables } from "./theme-css-vars";

const row = { inset: "4px", border: "1px", rowText: "14px", rowLineHeight: "1.25", rowInsetBlock: "8px" };
const vars = (...args: Parameters<typeof buildTheme>) => themeCssVariables(buildTheme(...args));

describe("list radii", () => {
  it("a panel keeps the surface radius while a row can follow it", () => {
    expect(listPanelRadius({ ...row, surface: "12px" })).toBe("12px");
    expect(listItemRadius({ list: "12px", item: "3px", inset: "4px", border: "1px" })).toBe("7px");
  });

  it("a panel stops at half a row plus the row's distance from its edge", () => {
    // 14px × 1.25 ÷ 2 + 8px of padding = 16.75px, half a row; + 4px inset + 1px border.
    expect(listPanelRadius({ ...row, surface: "48px" })).toBe("21.75px");
    expect(listItemRadius({ list: "21.75px", item: "6px", inset: "4px", border: "1px" })).toBe("16.75px");
  });

  it("a row is never sharper than an item, and a square theme has square rows", () => {
    expect(listItemRadius({ list: "4px", item: "2px", inset: "4px", border: "1px" })).toBe("2px");
    expect(listItemRadius({ list: "0px", item: "0px", inset: "4px", border: "1px" })).toBe("0px");
  });

  it("leaves the sum to the browser when a part is not in pixels", () => {
    expect(listPanelRadius({ ...row, surface: "1.5rem" })).toBe("min(1.5rem, calc(14px * 1.25 / 2 + 8px + 4px + 1px))");
    expect(listItemRadius({ list: "1rem", item: "6px", inset: "4px", border: "1px" })).toBe("max(6px, calc(1rem - 4px - 1px))");
  });

  it("the default theme's rows are half a row round, inside a panel that fits them", () => {
    const v = vars();
    expect(v["--squonk-roles-radius-list"]).toBe("21.75px");
    expect(v["--squonk-roles-radius-list-item"]).toBe("16.75px");
  });

  it("a square theme has square panels and rows", () => {
    const v = vars({ borderRadiusPx: 0 });
    expect(v["--squonk-roles-radius-list"]).toBe("0px");
    expect(v["--squonk-roles-radius-list-item"]).toBe("0px");
  });

  it("follows the purposes it is worked out from when a theme re-points them", () => {
    const tight = vars(undefined, "light", {}, {}, { "roles.radius.surface": "8px" });
    expect(tight["--squonk-roles-radius-list"]).toBe("8px");
    expect(tight["--squonk-roles-radius-list-item"]).toBe("6px");
    const roomy = vars(undefined, "light", {}, {}, { "roles.space.listInset": "spacing.sm" });
    expect(roomy["--squonk-roles-radius-list"]).toBe("24px");
    expect(roomy["--squonk-roles-radius-list-item"]).toBe("15px");
  });

  it("re-pointing a list radius directly wins, and the rows follow the panel", () => {
    const v = vars(undefined, "light", {}, {}, { "roles.radius.list": "10px" });
    expect(v["--squonk-roles-radius-list"]).toBe("10px");
    expect(v["--squonk-roles-radius-list-item"]).toBe("6px");
    const rows = vars(undefined, "light", {}, {}, { "roles.radius.listItem": "borders.radius.none" });
    expect(rows["--squonk-roles-radius-list-item"]).toBe("0px");
  });
});
