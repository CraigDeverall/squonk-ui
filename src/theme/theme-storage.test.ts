import { describe, expect, it } from "vitest";
import { parseStoredThemePart } from "./theme-storage";

describe("theme storage recovery", () => {
  it("retains valid legacy wrapped primitive overrides", () => {
    expect(parseStoredThemePart('{"overrides":{"fontPx":20},"mode":"dark"}', "primitives")).toEqual({ fontPx: 20 });
  });
  it("discards malformed restored fields instead of crashing theme construction", () => {
    expect(parseStoredThemePart('{"brand":null}', "addedPrimitives")).toBeUndefined();
    expect(parseStoredThemePart('{"fontPx":"oops"}', "primitives")).toBeUndefined();
    expect(parseStoredThemePart('{"colors.primary":false}', "bindings")).toBeUndefined();
    expect(parseStoredThemePart('not json', "primitives")).toBeUndefined();
    expect(parseStoredThemePart(null, "primitives")).toBeUndefined();
  });
  it("preserves valid fallback bindings and permits subsequent recovery", () => {
    expect(parseStoredThemePart('{"colors.primary":"missing"}', "bindings")).toEqual({ "colors.primary": "missing" });
    expect(parseStoredThemePart('{"brand":{"light":"red","dark":"blue"}}', "addedPrimitives")).toEqual({ brand: { light: "red", dark: "blue" } });
  });
});
