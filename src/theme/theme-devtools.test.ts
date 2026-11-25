import { describe, expect, it } from "vitest";
import { mergePrimitives } from "./theme";
import { applyThemeDevtoolsOverride, parseThemeDevtoolsOverride } from "./theme-devtools";

const own = {
  primitives: mergePrimitives({ colors: { primary: "#2255aa" } }),
  mode: "light" as const,
  colorBindings: { "colors.link": "primary" },
  addedColorPrimitives: {},
  roleBindings: { "roles.space.questionGap": "spacing.xl" },
};

describe("parseThemeDevtoolsOverride", () => {
  it("reads null as clearing the override", () => {
    expect(parseThemeDevtoolsOverride("null")).toBeNull();
  });

  it("reads a theme and a mode", () => {
    const parsed = parseThemeDevtoolsOverride(
      JSON.stringify({ theme: { primitives: { colors: { primary: "#00aa55" } } }, mode: "dark" }),
    );
    expect(parsed?.theme.primitives?.colors?.primary).toBe("#00aa55");
    expect(parsed?.mode).toBe("dark");
  });

  it("reads a mode on its own", () => {
    expect(parseThemeDevtoolsOverride(JSON.stringify({ mode: "dark" }))).toMatchObject({ mode: "dark" });
  });

  it.each([
    ["text that is not JSON", "{"],
    ["a value that is not an object", "[]"],
    ["an unknown mode", JSON.stringify({ mode: "sepia" })],
    ["a theme that is not an object", JSON.stringify({ theme: "blue" })],
    ["a colour that is not one", JSON.stringify({ theme: { primitives: { colors: { primary: "not a colour" } } } })],
  ])("ignores %s", (_, json) => {
    expect(parseThemeDevtoolsOverride(json)).toBeUndefined();
  });
});

describe("applyThemeDevtoolsOverride", () => {
  it("returns the app's own inputs when no tool is attached", () => {
    expect(applyThemeDevtoolsOverride(own, null)).toBe(own);
  });

  it("lays the tool's values over the app's and keeps the rest", () => {
    const next = applyThemeDevtoolsOverride(own, {
      theme: {
        primitives: { colors: { accent: "#123456" } },
        roleBindings: { "roles.color.heading": "#111111" },
      },
      mode: "dark",
    });
    expect(next.primitives.colors.accent).toBe("#123456");
    expect(next.primitives.colors.primary).toBe("#2255aa");
    expect(next.mode).toBe("dark");
    expect(next.colorBindings).toBe(own.colorBindings);
    expect(next.roleBindings).toEqual({ "roles.space.questionGap": "spacing.xl", "roles.color.heading": "#111111" });
  });

  it("keeps the app's mode when the tool sets none", () => {
    expect(applyThemeDevtoolsOverride(own, { theme: {} }).mode).toBe("light");
  });
});
