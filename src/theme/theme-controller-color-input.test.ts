import { describe, expect, it } from "vitest";
import { nativeColorInputValue } from "../../.storybook/addons/theme-controller/color-input";

describe("theme-controller native color display", () => {
  it.each([
    ["rgba(33, 37, 41, 0.5)", "#212529"],
    ["rgba(0, 0, 0, 0.65)", "#000000"],
    ["#abc", "#aabbcc"],
    ["#11223380", "#112233"],
    ["rebeccapurple", "#663399"],
    ["hsl(120, 100%, 50%)", "#00ff00"],
  ])("normalizes %s without changing the stored source", (source, expected) => {
    const state = { value: source };
    expect(nativeColorInputValue(state.value)).toBe(expected);
    expect(state.value).toBe(source);
  });

  it("keeps incomplete text out of the native control", () => {
    expect(nativeColorInputValue("#12")).toBe("#000000");
  });
});
