import { describe, expect, it } from "vitest";
import { buildTheme } from "./theme";
import { themeCssVariables } from "./theme-css-vars";
import { TONE_PARTS, toneProps } from "./tone";

const builtIn = ["neutral", "primary", "success"] as const;

describe("toneProps", () => {
  it("returns only data-tone for a built-in tone", () => {
    for (const tone of builtIn) expect(toneProps(tone, builtIn)).toEqual({ "data-tone": tone });
  });

  it("points the local palette at an added colour's tone", () => {
    expect(toneProps("violet", builtIn)).toEqual({
      "data-tone": "custom",
      style: {
        "--tone-solid": "var(--squonk-colors-tone-violet-solid)",
        "--tone-contrast": "var(--squonk-colors-tone-violet-contrast)",
        "--tone-subtle": "var(--squonk-colors-tone-violet-subtle)",
        "--tone-on-subtle": "var(--squonk-colors-tone-violet-on-subtle)",
        "--tone-outline-text": "var(--squonk-colors-tone-violet-outline-text)",
        "--tone-wash": "var(--squonk-colors-tone-violet-wash)",
        "--tone-on-wash": "var(--squonk-colors-tone-violet-on-wash)",
        "--tone-wash-border": "var(--squonk-colors-tone-violet-wash-border)",
      },
    });
  });

  it("kebab-cases the key the way the theme names its variables", () => {
    expect(toneProps("deepTeal", builtIn).style?.["--tone-solid"]).toBe("var(--squonk-colors-tone-deep-teal-solid)");
  });

  it("names variables the theme publishes for an added colour", () => {
    const theme = buildTheme({}, "light", {}, { deepTeal: { light: "#0f766e", dark: "#5eead4" } });
    const published = themeCssVariables(theme);
    const style = toneProps("deepTeal", builtIn).style!;
    for (const part of TONE_PARTS) {
      const name = style[`--tone-${part}`].slice("var(".length, -1);
      expect(published).toHaveProperty([name]);
    }
  });

  it("does not build a variable name from something that is not a key", () => {
    expect(toneProps("x); color: red", builtIn)).toEqual({ "data-tone": "x); color: red" });
    expect(toneProps("", builtIn)).toEqual({ "data-tone": "" });
  });
});
