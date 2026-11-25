import chroma from "chroma-js";
import Color from "color";
import { describe, expect, it } from "vitest";
import { EXAMPLE_THEMES } from "../design-system/themes/themes";
import { tintNeutral } from "./neutral-tint";
import { buildTheme, parseThemeDocument, theme } from "./theme";
import { themeCssVariables } from "./theme-css-vars";

const TEAL = "#0e7c86";

describe("tintNeutral", () => {
  it("leaves the colour alone at strength 0", () => {
    expect(tintNeutral("#545454", TEAL, 0)).toBe("#545454");
  });

  it("keeps the colour's lightness, so contrast holds", () => {
    for (const grey of ["#242424", "#646464", "#bdbdbd", "#f8f8f8"]) {
      const [before] = chroma(grey).oklch();
      const [after] = chroma(tintNeutral(grey, TEAL, 0.7)).oklch();
      expect(Math.abs(after - before)).toBeLessThan(0.006);
    }
  });

  it("takes the primary's hue, most strongly in the mid-tones", () => {
    const [, , sourceHue] = chroma(TEAL).oklch();
    const [, midChroma, midHue] = chroma(tintNeutral("#646464", TEAL, 0.7)).oklch();
    const [, paleChroma] = chroma(tintNeutral("#f8f8f8", TEAL, 0.7)).oklch();
    expect(Math.abs(midHue - sourceHue)).toBeLessThan(2);
    expect(midChroma).toBeGreaterThan(paleChroma * 3);
    expect(tintNeutral("#ffffff", TEAL, 0.7)).toBe("#ffffff");
  });

  it("does nothing when the primary is itself grey", () => {
    expect(tintNeutral("#646464", "#777777", 0.7)).toBe("#646464");
  });

  it("keeps a colour's transparency", () => {
    expect(chroma(tintNeutral("rgba(100, 100, 100, 0.5)", TEAL, 0.7)).alpha()).toBeCloseTo(0.5);
  });
});

describe("neutralTint in the theme", () => {
  const vars = (overrides: Parameters<typeof buildTheme>[0], mode: "light" | "dark" = "light") =>
    themeCssVariables(buildTheme(overrides, mode));

  it("is off by default, so the default theme is unchanged", () => {
    expect(theme.colors.text.primary).toBe("#1f1f1f");
    expect(theme.colors.background.surface).toBe("#f0e6d6");
  });

  it("follows the primary: change its hue and the greys follow", () => {
    const teal = vars({ neutralTint: 0.7, colors: { primary: TEAL } });
    const plum = vars({ neutralTint: 0.7, colors: { primary: "#7a3e9d" } });
    const page = "--squonk-roles-color-text-supporting";
    expect(teal[page]).not.toBe(plum[page]);
    const [, , tealHue] = chroma(teal[page]!).oklch();
    const [, , plumHue] = chroma(plum[page]!).oklch();
    expect(Math.abs(tealHue - chroma(TEAL).oklch()[2])).toBeLessThan(15);
    expect(Math.abs(plumHue - chroma("#7a3e9d").oklch()[2])).toBeLessThan(15);
  });

  it("keeps Tidepool's text readable on every background in both modes", () => {
    const tidepool = EXAMPLE_THEMES.find((entry) => entry.id === "tidepool")!;
    expect(tidepool.primitives.neutralTint).toBeGreaterThan(0);
    for (const mode of ["light", "dark"] as const) {
      const built = buildTheme(tidepool.primitives, mode);
      for (const text of [built.colors.text.primary, built.colors.text.secondary, built.colors.text.muted]) {
        for (const background of [built.colors.background.default, built.colors.background.surface, built.colors.background.subtle]) {
          expect(Color(text).contrast(Color(background)), `${mode} ${text} on ${background}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("is checked as a 0–1 number in a theme document", () => {
    const doc = (value: unknown) => JSON.stringify({ version: 1, primitives: { neutralTint: value } });
    expect(parseThemeDocument(doc(0.4)).ok).toBe(true);
    expect(parseThemeDocument(doc(1.5)).ok).toBe(false);
    expect(parseThemeDocument(doc("0.4")).ok).toBe(false);
  });
});

describe("theme switches", () => {
  const vars = (overrides: Parameters<typeof buildTheme>[0]) => themeCssVariables(buildTheme(overrides));

  it("uppercaseControls sets button case and tracking", () => {
    expect(vars({})["--squonk-roles-type-button-case"]).toBe("none");
    expect(vars({ uppercaseControls: true })["--squonk-roles-type-button-case"]).toBe("uppercase");
    expect(vars({ uppercaseControls: true })["--squonk-roles-type-button-tracking"]).toBe("0.06em");
  });

  it("underlineLinks underlines links at rest", () => {
    expect(vars({})["--squonk-roles-type-link-decoration"]).toBe("none");
    expect(vars({ underlineLinks: true })["--squonk-roles-type-link-decoration"]).toBe("underline");
  });

  it("filledFields fills fields with the well colour and keeps their border", () => {
    const plain = vars({});
    const filled = vars({ filledFields: true });
    expect(filled["--squonk-roles-color-field-background"]).toBe(theme.colors.background.subtle);
    expect(filled["--squonk-roles-color-field-border"]).toBe(plain["--squonk-roles-color-field-border"]);
  });

  it("printBackgrounds keeps the theme's colours on paper; off, it prints ink on white", () => {
    expect(vars({})["--squonk-roles-print-paper"]).toBe("#ffffff");
    expect(vars({})["--squonk-roles-print-color-adjust"]).toBe("economy");
    const kept = vars({ printBackgrounds: true });
    expect(kept["--squonk-roles-print-paper"]).toBe(theme.colors.background.surface);
    expect(kept["--squonk-roles-print-color-adjust"]).toBe("exact");
  });

  it("printLinkUrls prints each link's address after it", () => {
    expect(vars({})["--squonk-roles-print-link-urls"]).toBe("inline");
    expect(vars({ printLinkUrls: false })["--squonk-roles-print-link-urls"]).toBe("none");
  });

  it("a theme can still re-point one purpose a switch sets", () => {
    const built = buildTheme({ uppercaseControls: true }, "light", {}, {}, { "roles.type.buttonTracking": "0.1em" });
    expect(themeCssVariables(built)["--squonk-roles-type-button-tracking"]).toBe("0.1em");
  });

  it("is checked as true or false in a theme document", () => {
    const doc = (value: unknown) => JSON.stringify({ version: 1, primitives: { underlineLinks: value } });
    expect(parseThemeDocument(doc(true)).ok).toBe(true);
    expect(parseThemeDocument(doc("yes")).ok).toBe(false);
  });
});
