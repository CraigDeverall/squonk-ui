import { describe, expect, it } from "vitest";
import Color from "color";
import { buildTheme, themeHelpers } from "./theme";
import { surfaceForeground, themeForSurface } from "./theme-surface";
import { applyThemeTransforms, mergeTheme } from "./theme-overrides";

describe("semantic surface contrast", () => {
  it("preserves explicitly supplied browser-resolved roles without crashing", () => {
    expect(surfaceForeground("var(--surface)", "var(--text)")).toBe("var(--text)");
    expect(surfaceForeground("color-mix(in srgb, white 80%, transparent)", "#212529")).toBe("#212529");
  });
  for (const mode of ["light", "dark"] as const) {
    const theme = buildTheme(undefined, mode);
    for (const background of [theme.colors.background.default, theme.colors.background.surface, theme.colors.background.subtle]) {
      it(`${mode} default text roles meet AA on ${background}`, () => {
        for (const role of ["primary", "secondary", "muted"] as const)
          expect(Color(theme.colors.text[role]).contrast(Color(background))).toBeGreaterThanOrEqual(4.5);
      });
    }
    for (const background of [theme.colors.text.primary, ...(["info", "success", "warning", "error"] as const).map(tone => themeHelpers.lighten(theme.colors[tone], 0.5))]) {
      it(`${mode} composed surface ${background} preserves independent code surfaces`, () => {
        const surface = themeForSurface(theme, background);
        for (const foreground of [surface.colors.text.primary, surface.colors.text.secondary, surface.colors.text.muted, surface.colors.link])
          expect(Color(foreground).contrast(Color(background))).toBeGreaterThanOrEqual(4.5);
        expect(surface.colors.background).toEqual(theme.colors.background);
        for (const independent of [surface.colors.background.default, surface.colors.background.subtle])
          expect(Color(themeHelpers.getMinContrastTextColor(independent)).contrast(Color(independent))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe("ordered theme transformations", () => {
  it("reapplies explicit overrides in order without freezing rebuilt mode", () => {
    const rebuilt = buildTheme({ spacingPx: 6 }, "dark");
    const result = applyThemeTransforms(rebuilt, [
      theme => mergeTheme(theme, { colors: { primary: "#ff00ff" }, spacing: { md: "42px" } }),
      theme => mergeTheme(theme, { colors: { primary: "#00ffff" } }),
    ]);
    expect(result.mode).toBe("dark");
    expect(result.colors.primary).toBe("#00ffff");
    expect(result.spacing.md).toBe("42px");
    expect(result.spacing.sm).toBe("6px");
    expect(rebuilt.colors.primary).not.toBe(result.colors.primary);
  });
  it("retains a physical surface after an inner mode rebuild", () => {
    const outer = buildTheme();
    const background = outer.colors.text.primary;
    const inner = applyThemeTransforms(buildTheme(undefined, "dark"), [theme => themeForSurface(theme, background)]);
    expect(Color(inner.colors.text.primary).contrast(Color(background))).toBeGreaterThanOrEqual(4.5);
  });
  it("scales register dimensions from the appropriate primitive", () => {
    const theme = buildTheme({ spacingPx: 10, fontPx: 20 });
    expect(theme.presentation.cardPadding.default).toBe("40px");
    expect(theme.presentation.headerPaddingBlock.compact).toBe("10px");
    expect(theme.presentation.sectionPadding.default).toBe("100px 0");
    expect(theme.presentation.headingSizes.default[1]).toBe("50px");
    expect(theme.presentation.headingSizes.hero[1]).toBe("clamp(55px, 7vw, 90px)");
  });
});
