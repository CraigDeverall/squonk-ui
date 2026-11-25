import { describe, expect, it } from "vitest";
import { fitLayout, initialLayout, isCollapsed, movePair, pairRange, resolveConstraints, toPercent } from "./resizable-layout";

const sum = (sizes: number[]) => sizes.reduce((total, size) => total + size, 0);

describe("toPercent", () => {
  it("reads numbers as percentages and px strings against the group's length", () => {
    expect(toPercent(25, 800)).toBe(25);
    expect(toPercent("200px", 800)).toBe(25);
    expect(toPercent("40%", 800)).toBe(40);
  });

  it("can't place pixel sizes before the group is measured", () => {
    expect(toPercent("200px", 0)).toBeUndefined();
    expect(toPercent(undefined, 800)).toBeUndefined();
  });
});

describe("resolveConstraints", () => {
  it("keeps the maximum at or above the minimum and the collapsed size below it", () => {
    const r = resolveConstraints({ minSize: "400px", maxSize: 30, collapsible: true, collapsedSize: "800px" }, 1000);
    expect(r.min).toBe(40);
    expect(r.max).toBe(40);
    expect(r.collapsed).toBe(40);
  });
});

describe("initialLayout", () => {
  it("shares what the defaults leave between panels without one", () => {
    const resolved = [resolveConstraints({ defaultSize: 20 }, 1000), resolveConstraints({}, 1000), resolveConstraints({}, 1000)];
    expect(initialLayout(resolved)).toEqual([20, 40, 40]);
  });

  it("prefers a defaultLayout of the right length, within the limits", () => {
    const resolved = [resolveConstraints({ maxSize: 40 }, 1000), resolveConstraints({}, 1000)];
    expect(initialLayout(resolved, [70, 30])).toEqual([40, 60]);
    expect(initialLayout(resolved, [10, 20, 70])).toEqual([40, 60]); // ignored: equal shares, capped at 40
  });
});

describe("fitLayout", () => {
  it("holds a pixel minimum as the group shrinks", () => {
    const at = (px: number) => [resolveConstraints({ minSize: "200px" }, px), resolveConstraints({}, px)];
    const sizes = fitLayout([25, 75], at(500));
    expect(sizes[0]).toBeCloseTo(40);
    expect(sum(sizes)).toBeCloseTo(100);
  });

  it("leaves a collapsed panel collapsed", () => {
    const resolved = [resolveConstraints({ minSize: 20, collapsible: true }, 1000), resolveConstraints({}, 1000)];
    expect(fitLayout([0, 90], resolved)).toEqual([0, 100]);
  });
});

describe("movePair", () => {
  const resolved = [
    resolveConstraints({ minSize: 10, maxSize: 50 }, 1000),
    resolveConstraints({ minSize: 20 }, 1000),
    resolveConstraints({}, 1000),
  ];

  it("trades size between the two panels beside the handle only", () => {
    expect(movePair([30, 40, 30], 0, 1, 35, resolved)).toEqual([35, 35, 30]);
  });

  it("stops at either panel's limit", () => {
    expect(movePair([30, 40, 30], 0, 1, 80, resolved)).toEqual([50, 20, 30]);
    expect(movePair([30, 40, 30], 0, 1, 2, resolved)).toEqual([10, 60, 30]);
    expect(pairRange([30, 40, 30], 0, 1, resolved)).toEqual({ total: 70, lo: 10, hi: 50 });
  });

  it("snaps a collapsible panel shut past halfway below its minimum when dragged", () => {
    const limits = [resolveConstraints({ minSize: 20, collapsible: true }, 1000), resolveConstraints({}, 1000)];
    expect(movePair([30, 70], 0, 1, 12, limits)).toEqual([20, 80]);
    const shut = movePair([30, 70], 0, 1, 8, limits);
    expect(shut).toEqual([0, 100]);
    expect(isCollapsed(shut[0], limits[0])).toBe(true);
    // An exact move only collapses when asked for the collapsed size.
    expect(movePair([30, 70], 0, 1, 8, limits, "exact")).toEqual([20, 80]);
    expect(movePair([30, 70], 0, 1, 0, limits, "exact")).toEqual([0, 100]);
  });

  it("collapses the panel after the handle when it is the collapsible one", () => {
    const limits = [resolveConstraints({}, 1000), resolveConstraints({ minSize: 20, collapsible: true, collapsedSize: "50px" }, 1000)];
    expect(movePair([70, 30], 0, 1, 97, limits)).toEqual([95, 5]);
  });
});
