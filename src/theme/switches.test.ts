import Color from "color";
import { describe, expect, it } from "vitest";
import { buildTheme, lightTextBalanceSettings, parseThemeDocument, textOnFillContrast } from "./theme";
import { themeCssVariables } from "./theme-css-vars";
import { BINDING_SWITCHES, BINDING_SWITCH_KEYS, INDICATOR_STYLE_NAMES, INDICATOR_STYLES, switchBindingsFor } from "./switches";
import { defaultPurposeBindings } from "./purpose";

const vars = (...args: Parameters<typeof buildTheme>) => themeCssVariables(buildTheme(...args)) as Record<string, string>;

describe("binding switches", () => {
  it("apply nothing when every switch is off", () => {
    const off = Object.fromEntries(BINDING_SWITCH_KEYS.map((key) => [key, BINDING_SWITCHES[key].default]));
    expect(switchBindingsFor({})).toEqual({});
    expect(buildTheme({ ...off, indicatorStyle: "bar" }).switchBindings).toEqual({});
  });

  it("apply the default theme's pill controls, squeeze and tint indicator", () => {
    expect(buildTheme().switchBindings).toEqual(switchBindingsFor({ pillControls: true, squeezeOnPress: true, indicatorStyle: "tint" }));
  });

  it("only re-point purposes that exist", () => {
    const purposes = new Set([
      ...Object.keys(defaultPurposeBindings()),
      "roles.radius.control",
      "roles.radius.chip",
    ]);
    for (const key of BINDING_SWITCH_KEYS) {
      for (const path of Object.keys(BINDING_SWITCHES[key].bindings)) expect(purposes, `${key} → ${path}`).toContain(path);
    }
  });

  it("set their purposes when turned away from the default", () => {
    const v = vars({ pillControls: true, underlinedFields: true, liftOnHover: false, squeezeOnPress: true });
    expect(v["--squonk-roles-radius-control"]).toBe("9999px");
    expect(v["--squonk-roles-radius-chip"]).toBe("9999px");
    expect(v["--squonk-roles-control-field-border"]).toBe("0 0 1px");
    expect(v["--squonk-roles-color-field-background"]).toBe("transparent");
    expect(v["--squonk-roles-interaction-field-focus-underline"]).toBe("-2px");
    expect(v["--squonk-roles-interaction-hover-lift"]).toBe("0px");
    expect(v["--squonk-roles-interaction-press-scale"]).toBe("0.97");
  });

  it("point at other purposes, so they follow a theme's re-pointing", () => {
    const v = vars({ brandHeadings: true }, "light", {}, {}, { "roles.color.link": "#123456" });
    expect(v["--squonk-roles-color-heading"]).toBe("#123456");
  });

  it("give way to the theme's own role bindings", () => {
    const v = vars({ squeezeOnPress: true }, "light", {}, {}, { "roles.interaction.pressScale": "0.9" });
    expect(v["--squonk-roles-interaction-press-scale"]).toBe("0.9");
  });

  it("cast ink shadows away from the light", () => {
    const v = vars({ inkShadows: true, lightAngle: 315 });
    expect(v["--squonk-roles-elevation-lift"]).toBe("5px 5px 0 var(--squonk-colors-text-primary)");
    expect(v["--squonk-components-button-primary-shadow"]).toBe("3px 3px 0 var(--squonk-colors-text-primary)");
    expect(vars({ inkShadows: true })["--squonk-roles-elevation-field"]).toBe("0 3px 0 var(--squonk-colors-text-primary)");
  });
});

describe("the purpose tier", () => {
  it("carries a shared decision to every purpose bound through it", () => {
    const v = vars(undefined, "light", {}, {}, { "roles.space.related": "13px", "roles.color.edge": "#abcdef" });
    for (const name of ["field-gap", "group-gap", "icon-gap"]) expect(v[`--squonk-roles-space-${name}`]).toBe("13px");
    for (const name of ["divider", "outline", "field-border", "floating-border"]) expect(v[`--squonk-roles-color-${name}`]).toBe("#abcdef");
  });

  it("still lets one purpose be re-pointed on its own", () => {
    const v = vars(undefined, "light", {}, {}, { "roles.space.fieldGap": "13px" });
    expect(v["--squonk-roles-space-field-gap"]).toBe("13px");
    expect(v["--squonk-roles-space-icon-gap"]).toBe("4px");
  });
});

describe("lightTextBalance", () => {
  it("is 3:1 to 4.6:1 at the default", () => {
    expect(lightTextBalanceSettings(50)).toEqual({ lightFrom: 3, deepenTo: 4.6, preferLightAt: 4.5 });
  });

  it("deepens a strong blue just enough for white labels to read at AA", () => {
    // White on #007bff is about 4:1, so the default balance darkens the fill.
    // Flat fill: the primary gradient would pick text for its start colour too.
    const v = vars({ primaryGradient: false, colors: { primary: "#007bff" } });
    expect(v["--squonk-roles-color-on-accent"].toLowerCase()).toBe("#ffffff");
    expect(Color(v["--squonk-roles-color-accent"]).contrast(Color("#ffffff"))).toBeGreaterThanOrEqual(4.5);
    expect(v["--squonk-roles-color-accent"].toLowerCase()).not.toBe("#007bff");
  });

  it("leaves a bright primary alone by default and deepens it for white text when raised", () => {
    const bright = { primary: "#94d500" };
    const at = (balance: number) => vars({ primaryGradient: false, lightTextBalance: balance, colors: bright });
    expect(at(50)["--squonk-roles-color-accent"]).toBe("#94d500");
    const high = at(100);
    // Light text: a near-white tint of the fill.
    expect(Color(high["--squonk-colors-contrast-primary"]).isLight()).toBe(true);
    expect(Color(high["--squonk-roles-color-accent"]).contrast(Color("#ffffff"))).toBeGreaterThanOrEqual(7);
  });

  it("keeps dark text on more fills when lowered, and AA either way", () => {
    const fill = "#8f7bff"; // white reads at about 3.3:1
    const colors = { primary: fill };
    expect(vars({ primaryGradient: false, colors, lightTextBalance: 50 })["--squonk-roles-color-on-accent"].toLowerCase()).toBe("#ffffff");
    const low = vars({ primaryGradient: false, colors, lightTextBalance: 0 });
    expect(low["--squonk-roles-color-accent"]).toBe(fill);
    for (const balance of [0, 25, 50, 75, 100]) {
      const v = vars({ primaryGradient: false, colors, lightTextBalance: balance });
      expect(Color(v["--squonk-roles-color-accent"]).contrast(Color(v["--squonk-roles-color-on-accent"]))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("is validated in theme files, with textOnFillStrength", () => {
    const doc = (value: number) => JSON.stringify({ version: 1, primitives: { lightTextBalance: value } });
    expect(parseThemeDocument(doc(70)).ok).toBe(true);
    expect(parseThemeDocument(doc(101)).ok).toBe(false);
    expect(parseThemeDocument(JSON.stringify({ version: 1, primitives: { textOnFillStrength: 120 } })).ok).toBe(false);
  });
});

describe("textOnFillStrength", () => {
  it("asks 4.5:1 at 0, 7:1 by default and 21:1 at 100", () => {
    expect([textOnFillContrast(0), textOnFillContrast(50), textOnFillContrast(100)]).toEqual([4.5, 7, 21]);
  });

  it("runs from a quiet tint of the fill to pure white, always at AA", () => {
    const text = (strength: number) => vars({ primaryGradient: false, colors: { primary: "#1d3557" }, textOnFillStrength: strength })["--squonk-roles-color-on-accent"];
    expect(text(100).toLowerCase()).toBe("#ffffff");
    const quiet = Color(text(0));
    expect(quiet.contrast(Color("#1d3557"))).toBeGreaterThanOrEqual(4.5);
    expect(quiet.contrast(Color("#1d3557"))).toBeLessThan(Color(text(50)).contrast(Color("#1d3557")));
  });
});

describe("indicatorStyle", () => {
  it("draws a bar along the current item when set to bar, re-pointing nothing", () => {
    const v = vars({ indicatorStyle: "bar" });
    expect(v["--squonk-roles-indicator-current-bar"]).toBe("3px");
    expect(v["--squonk-roles-indicator-current-ring"]).toBe("0px");
    expect(switchBindingsFor({ indicatorStyle: "bar" })).toEqual({});
  });

  it("only re-points indicator purposes that exist", () => {
    const purposes = new Set(Object.keys(defaultPurposeBindings()));
    for (const style of INDICATOR_STYLE_NAMES) {
      for (const path of Object.keys(INDICATOR_STYLES[style].bindings)) expect(purposes, `${style} → ${path}`).toContain(path);
    }
  });

  it("turns the bar into a ring standing off the fill by a gap", () => {
    const v = vars({ indicatorStyle: "ring" });
    expect(v["--squonk-roles-indicator-current-bar"]).toBe("0px");
    expect(v["--squonk-roles-indicator-current-ring"]).toBe("2px");
    expect(v["--squonk-roles-indicator-current-gap"]).toBe("2px");
    expect(v["--squonk-roles-indicator-hover-ring"]).toBe("1px");
  });

  it.each(["light", "dark"] as const)("tints the current item with the primary, and draws no mark (%s)", (mode) => {
    const v = vars({ indicatorStyle: "tint" }, mode);
    expect(v["--squonk-roles-indicator-current-background"]).toBe(v["--squonk-colors-tone-primary-subtle"]);
    expect(v["--squonk-roles-indicator-current-text"]).toBe(v["--squonk-colors-tone-primary-on-subtle"]);
    for (const mark of ["bar", "underline", "ring", "gap"]) expect(v[`--squonk-roles-indicator-current-${mark}`], mark).toBe("0px");
    // The shape and the hover are the bar style's.
    const base = vars({ indicatorStyle: "bar" }, mode);
    expect(v["--squonk-roles-indicator-radius"]).toBe(base["--squonk-roles-indicator-radius"]);
    for (const part of ["background", "text", "bar", "underline", "ring"]) {
      expect(v[`--squonk-roles-indicator-hover-${part}`], part).toBe(base[`--squonk-roles-indicator-hover-${part}`]);
    }
    const contrast = Color(v["--squonk-roles-indicator-current-text"]).contrast(Color(v["--squonk-roles-indicator-current-background"]));
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  it("follows the theme's primary when tinted", () => {
    const v = vars({ indicatorStyle: "tint", colors: { primary: "#6d28d9" } });
    expect(v["--squonk-roles-indicator-current-background"]).toBe(v["--squonk-colors-tone-primary-subtle"]);
    expect(v["--squonk-roles-indicator-current-background"]).not.toBe(vars({ indicatorStyle: "tint" })["--squonk-roles-indicator-current-background"]);
  });

  it("lists every style, tint included", () => {
    expect(INDICATOR_STYLE_NAMES).toEqual(["bar", "fill", "underline", "ring", "quiet", "tint"]);
    expect(parseThemeDocument(JSON.stringify({ version: 1, primitives: { indicatorStyle: "tint" } })).ok).toBe(true);
    expect(parseThemeDocument(JSON.stringify({ version: 1, primitives: { indicatorStyle: "sparkle" } }))).toEqual({
      ok: false,
      error: "primitives.indicatorStyle: Must be one of bar, fill, underline, ring, quiet, tint",
    });
  });

  it("gives way to the theme's own bindings, and is validated in theme files", () => {
    expect(vars({ indicatorStyle: "ring" }, "light", {}, {}, { "roles.indicator.current.gap": "5px" })["--squonk-roles-indicator-current-gap"]).toBe("5px");
    expect(parseThemeDocument(JSON.stringify({ version: 1, primitives: { indicatorStyle: "fill" } })).ok).toBe(true);
    expect(parseThemeDocument(JSON.stringify({ version: 1, primitives: { indicatorStyle: "sparkle" } })).ok).toBe(false);
  });
});
