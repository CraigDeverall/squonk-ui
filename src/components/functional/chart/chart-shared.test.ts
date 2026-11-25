import { describe, expect, it } from "vitest";
import { axisWidth, valueAxisLabels, valueExtent } from "./chart-shared";

const plain = (v: number) => String(v);

describe("valueExtent", () => {
  it("always includes zero", () => {
    expect(valueExtent([{ a: 40 }, { a: 84 }], ["a"])).toEqual([0, 84]);
    expect(valueExtent([{ a: -12 }, { a: -3 }], ["a"])).toEqual([-12, 0]);
  });

  it("spans the largest and smallest value across series", () => {
    expect(valueExtent([{ a: 10, b: -35 }, { a: 84, b: 5 }], ["a", "b"])).toEqual([-35, 84]);
  });

  it("sums positive and negative parts separately in a stack", () => {
    const data = [
      { a: 60, b: 50, c: -20 },
      { a: 30, b: 20, c: -40 },
    ];
    expect(valueExtent(data, ["a", "b", "c"], true)).toEqual([-40, 110]);
  });

  it("ignores missing and non-numeric values", () => {
    expect(valueExtent([{ a: 5 }, { a: undefined }, { a: "n/a" }], ["a", "b"])).toEqual([0, 5]);
  });
});

describe("valueAxisLabels", () => {
  it("includes the rounded-up top tick the axis draws, not just the data maximum", () => {
    // Recharts draws 0, 25, 50, 75, 100 for 0–84: "100" is wider than "84" or "90".
    expect(valueAxisLabels(plain, [0, 84])).toEqual(["0", "25", "50", "75", "100"]);
    expect(valueAxisLabels(plain, [0, 99])).toContain("100");
    expect(valueAxisLabels(plain, [0, 840])).toContain("1000");
  });

  it("includes the negative ticks below zero", () => {
    const labels = valueAxisLabels(plain, [-35, 84]);
    expect(labels[0]).toBe("-35");
    expect(labels).toContain("0");
    expect(labels.at(-1)).toBe("105");
  });

  it("sizes the axis from the widest drawn tick", () => {
    expect(axisWidth(valueAxisLabels(plain, [0, 84]))).toBe(axisWidth(["100"]));
    expect(axisWidth(valueAxisLabels(plain, [0, 84]))).toBeGreaterThan(axisWidth(["84", "90"]));
  });

  it("uses the chart's tick formatter", () => {
    expect(valueAxisLabels((v) => `$${v}K`, [0, 86.6]).at(-1)).toBe("$100K");
  });
});
