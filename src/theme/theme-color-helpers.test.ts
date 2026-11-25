import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { Button } from "../components/functional/button/button";
import { Kbd } from "../components/functional-primitive/kbd/kbd";
import { mergeTheme } from "./theme-overrides";
import { buildTheme, themeHelpers } from "./theme";
import { surfaceForeground } from "./theme-surface";
import { SquonkThemeContext } from "./theme-context";

describe("uncertain color composition", () => {
  it("server-renders derived component colors without browser APIs", () => {
    const theme = mergeTheme(buildTheme(), { colors: { primary: "var(--brand)", background: { subtle: "var(--subtle)" } } });
    const html = renderToString(React.createElement(SquonkThemeContext.Provider, { value: theme, children: [
      React.createElement(Button, { key: "button", variant: "primary" }, "Send"),
      React.createElement(Kbd, { key: "kbd" }, "Ctrl K"),
    ] }));
    expect(html).toContain("Send");
    expect(html).toContain("Ctrl K");
  });
  it("preserves supplied foregrounds when either color has alpha", () => {
    expect(surfaceForeground("transparent", "#212529")).toBe("#212529");
    expect(surfaceForeground("rgba(0, 0, 0, 0.05)", "#212529")).toBe("#212529");
    expect(surfaceForeground("white", "rgba(0, 0, 0, 0.2)")).toBe("rgba(0, 0, 0, 0.2)");
  });
  it.each(["var(--brand)", "currentColor", "color-mix(in srgb, white 80%, blue)"])("uses SSR-safe derived fallbacks for %s", color => {
    expect(themeHelpers.getMinContrastTextColor(color)).toBe("currentColor");
    expect(themeHelpers.getMinContrastGraphicColor(color)).toBe("currentColor");
    expect(themeHelpers.lighten(color, 0.2)).toBe(`color-mix(in srgb, ${color} 80%, white)`);
    expect(themeHelpers.darken(color, 0.2)).toBe(`color-mix(in srgb, ${color} 80%, black)`);
    expect(themeHelpers.createGradient([color, "#000"], "to bottom", 1)).toContain(color);
  });
  it("does not claim contrast against an unknown translucent backdrop", () => {
    expect(themeHelpers.getMinContrastTextColor("transparent")).toBe("currentColor");
    expect(themeHelpers.getMinContrastTextColor("rgba(0,0,0,0.4)")).toBe("currentColor");
  });
});
