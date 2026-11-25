import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { theme } from "../../../theme/theme";

describe("Grid breakpoints", () => {
  it("match the default theme breakpoints", () => {
    const css = readFileSync(new URL("./grid.module.css", import.meta.url), "utf8");
    const queries = [...css.matchAll(/@media \(min-width: (\d+px)\)/g)].map((m) => m[1]);
    expect(queries).toEqual([theme.breakpoints.tablet, theme.breakpoints.desktop, theme.breakpoints.wide]);
  });
});
