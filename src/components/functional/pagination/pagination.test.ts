import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { theme } from "../../../theme/theme";
import { getPageItems } from "./pagination";

describe("Pagination breakpoints", () => {
  it("match the default theme's tablet breakpoint", () => {
    const css = readFileSync(new URL("./pagination.module.css", import.meta.url), "utf8");
    const queries = [...css.matchAll(/@media \(min-width: (\d+px)\)/g)].map((m) => m[1]);
    expect(queries).toEqual([theme.breakpoints.tablet]);
  });
});

describe("getPageItems", () => {
  it("lists every page when they fit", () => {
    expect(getPageItems(1, 0)).toEqual([]);
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps the first and last page and siblings around the current one", () => {
    expect(getPageItems(1, 12)).toEqual([1, 2, 3, 4, 5, "ellipsis", 12]);
    expect(getPageItems(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
    expect(getPageItems(12, 12)).toEqual([1, "ellipsis", 8, 9, 10, 11, 12]);
    expect(getPageItems(10, 20, 2)).toEqual([1, "ellipsis", 8, 9, 10, 11, 12, "ellipsis", 20]);
  });

  it("shows a single hidden page instead of an ellipsis", () => {
    expect(getPageItems(4, 8, 0)).toEqual([1, "ellipsis", 4, "ellipsis", 8]);
    expect(getPageItems(3, 8, 0)).toEqual([1, 2, 3, "ellipsis", 8]);
  });
});
