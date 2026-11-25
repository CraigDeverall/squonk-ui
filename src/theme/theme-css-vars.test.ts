import Color from "color";
import { describe, expect, it } from "vitest";
import { buildTheme, darkTheme, parseThemeDocument, theme, themeHelpers, type PrimitivesOverride } from "./theme";
import {
  changedCssVariables,
  themeCssVarName,
  themeCssVariables,
} from "./theme-css-vars";
import { surfaceForeground } from "./theme-surface";

describe("themeCssVarName", () => {
  it("mirrors the theme path in kebab case", () => {
    expect(themeCssVarName(["colors", "text", "primary"])).toBe("--squonk-colors-text-primary");
    expect(themeCssVarName(["borders", "focusWidth"])).toBe("--squonk-borders-focus-width");
    expect(themeCssVarName(["typography", "lineHeights", "tight"])).toBe("--squonk-typography-line-heights-tight");
  });
});

describe("themeCssVariables", () => {
  const vars = themeCssVariables(theme);

  it("emits a variable for every theme leaf", () => {
    expect(vars["--squonk-spacing-md"]).toBe(theme.spacing.md);
    expect(vars["--squonk-colors-background-surface"]).toBe(theme.colors.background.surface);
    expect(vars["--squonk-borders-radius-full"]).toBe(theme.borders.radius.full);
    expect(vars["--squonk-typography-weights-bold"]).toBe("700");
    expect(vars["--squonk-presentation-heading-sizes-hero-1"]).toBe(theme.presentation.headingSizes.hero[1]);
  });

  it("does not emit the mode flag", () => {
    expect(Object.keys(vars).some((name) => name.includes("mode"))).toBe(false);
  });

  it("publishes the colors components used to derive while styling", () => {
    // A bright primary keeps dark text, so the fill is used exactly as written.
    // Flat fill: the primary gradient would pick text for its start colour too.
    const theme = buildTheme({ primaryGradient: false, colors: { primary: "#94d500" } });
    const vars = themeCssVariables(theme);
    const ink = theme.colors.text.primary;
    const hover = themeHelpers.darken(theme.colors.primary, 0.15);
    expect(vars["--squonk-colors-primary-hover"]).toBe(hover);
    expect(vars["--squonk-colors-on-primary-hover"]).toBe(surfaceForeground(hover, ink));
    expect(vars["--squonk-colors-contrast-primary"]).toBe(themeHelpers.getMinContrastTextColor(theme.colors.primary));
    expect(vars["--squonk-colors-on-ink"]).toBe(surfaceForeground(ink, theme.colors.background.surface));
    expect(vars["--squonk-colors-on-background-subtle"]).toBe(surfaceForeground(theme.colors.background.subtle, ink));
  });
});

describe("primary gradient", () => {
  const contrast = (a: string, b: string) => Color(a).contrast(Color(b));
  const teal = "#2dd4bf";
  const violet = "#a78bfa";
  const on = (mode: "light" | "dark", overrides: PrimitivesOverride = {}) =>
    themeCssVariables(
      buildTheme(
        {
          primaryGradient: true,
          colors: { primary: "#6d28d9", primaryGradientStart: "#0f766e" },
          darkColors: { primary: violet, primaryGradientStart: teal },
          ...overrides,
        },
        mode,
      ),
    );

  it("leaves the primary button flat when off", () => {
    const theme = buildTheme({ primaryGradient: false, colors: { primary: "#94d500" } });
    const vars = themeCssVariables(theme);
    expect(vars["--squonk-colors-primary-gradient"]).toBe("none");
    expect(vars["--squonk-colors-primary-gradient-hover"]).toBe("none");
    expect(vars["--squonk-colors-primary-gradient-active"]).toBe("none");
    expect(vars["--squonk-components-button-primary-image"]).toBe("none");
    expect(vars["--squonk-colors-contrast-primary"]).toBe(themeHelpers.getMinContrastTextColor(theme.colors.primary));
  });

  it("runs from the start colour to the primary fill at the theme's angle", () => {
    const vars = on("dark", { primaryGradientAngle: 135 });
    const fill = vars["--squonk-colors-primary-fill"];
    expect(vars["--squonk-colors-primary-gradient"]).toBe(`linear-gradient(135deg, ${teal}, ${fill})`);
    expect(vars["--squonk-colors-primary-gradient-hover"]).toMatch(/^linear-gradient\(135deg, /);
    expect(vars["--squonk-components-button-primary-image"]).toBe(vars["--squonk-colors-primary-gradient"]);
    expect(vars["--squonk-components-button-primary-hover-image"]).toBe(vars["--squonk-colors-primary-gradient-hover"]);
    expect(vars["--squonk-components-button-primary-pressed-image"]).toBe(vars["--squonk-colors-primary-gradient-active"]);
  });

  it("imports and validates in a theme document", () => {
    const doc = (primitives: object) => JSON.stringify({ version: 1, primitives });
    expect(
      parseThemeDocument(doc({ primaryGradient: true, primaryGradientAngle: 45, darkColors: { primaryGradientStart: teal } })).ok,
    ).toBe(true);
    expect(parseThemeDocument(doc({ primaryGradientAngle: 360 }))).toMatchObject({
      ok: false,
      error: "primitives.primaryGradientAngle: Must be at least 0 and less than 360",
    });
    expect(parseThemeDocument(doc({ primaryGradient: "yes" })).ok).toBe(false);
    expect(parseThemeDocument(doc({ colors: { primaryGradientStart: "var(--brand)" } })).ok).toBe(false);
  });

  it("normalises the angle", () => {
    expect(on("light", { primaryGradientAngle: -90 })["--squonk-gradients-primary-angle"]).toBe("270deg");
  });

  it.each(["light", "dark"] as const)("keeps the primary button's label readable on both ends in %s mode", (mode) => {
    const vars = on(mode);
    const start = mode === "dark" ? teal : "#0f766e";
    const fill = vars["--squonk-colors-primary-fill"];
    for (const text of [vars["--squonk-colors-contrast-primary"], vars["--squonk-components-button-primary-text"]]) {
      expect(contrast(text, start)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(text, fill)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("changedCssVariables", () => {
  it("keeps only values that differ from the parent scope", () => {
    const light = themeCssVariables(theme);
    const dark = changedCssVariables(themeCssVariables(darkTheme), light);
    expect(dark["--squonk-colors-background-default"]).toBe(darkTheme.colors.background.default);
    expect(dark["--squonk-spacing-md"]).toBeUndefined();
  });

  it("is empty for an identical theme", () => {
    expect(changedCssVariables(themeCssVariables(buildTheme()), themeCssVariables(theme))).toEqual({});
  });
});

describe("colours a theme adds", () => {
  const teal = { light: "#0f766e", dark: "#5eead4" };
  const TONE_PARTS = ["solid", "contrast", "subtle", "on-subtle", "outline-text", "wash", "on-wash", "wash-border"];
  const withAdded = (mode: "light" | "dark", added = { brandTeal: teal }, overrides: PrimitivesOverride = {}) =>
    themeCssVariables(buildTheme(overrides, mode, {}, added)) as Record<string, string>;

  it("adds nothing to the default theme", () => {
    expect(theme.colors.added).toEqual({});
    expect(Object.keys(themeCssVariables(theme)).some((name) => name.startsWith("--squonk-colors-added-"))).toBe(false);
  });

  it.each(["light", "dark"] as const)("resolves each added colour for %s mode", (mode) => {
    const built = buildTheme(undefined, mode, {}, { brandTeal: teal, ink: { light: "#111111", dark: "#eeeeee" } });
    expect(built.colors.added).toEqual({ brandTeal: teal[mode], ink: mode === "dark" ? "#eeeeee" : "#111111" });
  });

  it.each(["light", "dark"] as const)("emits the colour as a variable, its key in kebab case (%s)", (mode) => {
    const vars = withAdded(mode);
    expect(vars["--squonk-colors-added-brand-teal"]).toBe(teal[mode]);
    expect(vars).not.toHaveProperty("--squonk-colors-added-brandTeal");
  });

  it.each(["light", "dark"] as const)("gives the colour the tone palette a built-in colour of that value gets (%s)", (mode) => {
    // The info tone, set to the same colour, is the reference.
    const vars = withAdded(mode, { brandTeal: teal }, { colors: { info: teal.light }, darkColors: { info: teal.dark } });
    for (const part of TONE_PARTS) {
      expect(vars[`--squonk-colors-tone-brand-teal-${part}`], part).toBeDefined();
      expect(vars[`--squonk-colors-tone-brand-teal-${part}`], part).toBe(vars[`--squonk-colors-tone-info-${part}`]);
    }
  });

  it("gives each mode its own palette", () => {
    const light = withAdded("light");
    const dark = withAdded("dark");
    expect(light["--squonk-colors-tone-brand-teal-solid"]).not.toBe(dark["--squonk-colors-tone-brand-teal-solid"]);
    expect(light["--squonk-colors-tone-brand-teal-subtle"]).not.toBe(dark["--squonk-colors-tone-brand-teal-subtle"]);
  });

  it.each(["light", "dark"] as const)("keeps a built-in tone's name for the built-in tone (%s)", (mode) => {
    const plain = themeCssVariables(buildTheme(undefined, mode)) as Record<string, string>;
    const vars = withAdded(mode, { neutral: { light: "#ff0000", dark: "#ff0000" } } as never);
    expect(vars["--squonk-colors-added-neutral"]).toBe("#ff0000");
    for (const part of TONE_PARTS) expect(vars[`--squonk-colors-tone-neutral-${part}`], part).toBe(plain[`--squonk-colors-tone-neutral-${part}`]);
  });

  it("lets a purpose point at an added colour or its tone", () => {
    const vars = themeCssVariables(
      buildTheme(undefined, "dark", {}, { brandTeal: teal }, {
        "roles.color.heading": "colors.added.brandTeal",
        "roles.color.selected": "colors.tone.brandTeal.subtle",
      }),
    ) as Record<string, string>;
    expect(vars["--squonk-roles-color-heading"]).toBe(teal.dark);
    expect(vars["--squonk-roles-color-selected"]).toBe(vars["--squonk-colors-tone-brand-teal-subtle"]);
  });
});

describe("softToneStrength", () => {
  const vars = (mode: "light" | "dark", overrides: PrimitivesOverride = {}) => themeCssVariables(buildTheme(overrides, mode)) as Record<string, string>;

  it("leaves the soft fills as a light or deep version of the tone at 0", () => {
    const dark = buildTheme({ softToneStrength: 0 }, "dark");
    expect(themeCssVariables(dark)["--squonk-colors-tone-info-wash"]).toBe(themeHelpers.darken(dark.colors.info, 0.65));
    const light = buildTheme({ softToneStrength: 0 }, "light");
    expect(themeCssVariables(light)["--squonk-colors-tone-info-subtle"]).toBe(
      themeHelpers.softUnder(themeHelpers.lighten(light.colors.info, 0.5), light.colors.text.primary),
    );
  });

  it.each(["light", "dark"] as const)("makes subtle and wash the surface with that share of the tone mixed in (%s)", (mode) => {
    const built = buildTheme({ softToneStrength: 0.12 }, mode);
    const out = themeCssVariables(built) as Record<string, string>;
    const expected = Color(built.colors.background.default).mix(Color(built.colors.info), 0.12).hex();
    expect(out["--squonk-colors-tone-info-subtle"]).toBe(expected);
    expect(out["--squonk-colors-tone-info-wash"]).toBe(expected);
  });

  it.each(["light", "dark"] as const)("keeps the text on a quiet fill readable (%s)", (mode) => {
    const out = vars(mode, { softToneStrength: 0.12 });
    for (const tone of ["primary", "success", "warning", "error", "info"]) {
      expect(Color(out[`--squonk-colors-tone-${tone}-on-subtle`]).contrast(Color(out[`--squonk-colors-tone-${tone}-subtle`]))).toBeGreaterThanOrEqual(4.5);
      expect(Color(out[`--squonk-colors-tone-${tone}-on-wash`]).contrast(Color(out[`--squonk-colors-tone-${tone}-wash`]))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("leaves the neutral tone's subtle fill alone", () => {
    expect(vars("light", { softToneStrength: 0.2 })["--squonk-colors-tone-neutral-subtle"]).toBe(vars("light", { softToneStrength: 0 })["--squonk-colors-tone-neutral-subtle"]);
  });

  it("rejects a value above one in a theme document", () => {
    const parsed = parseThemeDocument(JSON.stringify({ version: 1, primitives: { softToneStrength: 1.5 } }));
    expect(parsed.ok).toBe(false);
  });
});
