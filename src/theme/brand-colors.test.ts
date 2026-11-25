import chroma from "chroma-js";
import { describe, expect, it } from "vitest";
import { EXAMPLE_THEMES } from "../design-system/themes/themes";
import { readableOn } from "./brand-colors";
import { buildTheme, parseThemeDocument, theme } from "./theme";

const WHITE = ["#ffffff", "#f6f6f5"];
const SLATE = ["#1e252d", "#28303a"];

describe("readableOn", () => {
  it("leaves a colour that already reads alone", () => {
    expect(readableOn("#1d3557", WHITE, 4.5)).toBe("#1d3557");
  });

  it("darkens a light brand colour on light backgrounds until it reads, keeping its hue", () => {
    const out = readableOn("#94d500", WHITE, 4.5);
    for (const bg of WHITE) expect(chroma.contrast(out, bg)).toBeGreaterThanOrEqual(4.5);
    expect(chroma(out).luminance()).toBeLessThan(chroma("#94d500").luminance());
    expect(Math.abs(chroma(out).oklch()[2] - chroma("#94d500").oklch()[2])).toBeLessThan(6);
  });

  it("lightens a dark brand colour on dark backgrounds", () => {
    const out = readableOn("#1d3557", SLATE, 4.5);
    for (const bg of SLATE) expect(chroma.contrast(out, bg)).toBeGreaterThanOrEqual(4.5);
    expect(chroma(out).luminance()).toBeGreaterThan(chroma("#1d3557").luminance());
  });

  it("moves no further than the contrast it's asked for", () => {
    const focus = readableOn("#94d500", WHITE, 3);
    const link = readableOn("#94d500", WHITE, 4.5);
    expect(chroma(focus).luminance()).toBeGreaterThan(chroma(link).luminance());
  });
});

describe("deriveFromPrimary", () => {
  it("is off by default, so the default theme's link and focus ring are as written", () => {
    expect(theme.colors.link).toBe("#b42d1f");
    expect(theme.colors.border.focus).toBe("#d0362a");
  });

  it("makes the link, focus ring and accent follow the primary", () => {
    const plum = buildTheme({ deriveFromPrimary: true, colors: { primary: "#7a3e9d" } });
    expect(plum.colors.accent).toBe("#7a3e9d");
    expect(plum.colors.link).toBe("#7a3e9d");
    expect(plum.colors.border.focus).toBe("#7a3e9d");
  });

  it("keeps a colour a binding re-points", () => {
    const built = buildTheme({ deriveFromPrimary: true, colors: { primary: "#7a3e9d" } }, "light", { "colors.link": "info" });
    expect(built.colors.link).toBe(built.colors.info);
  });

  it("keeps links and focus rings readable whatever primary a theme is given", () => {
    const primaries = ["#ffd23f", "#94d500", "#4fd1c5", "#7a3e9d", "#c2410c", "#1d3557", "#ffffff", "#000000"];
    const themes = EXAMPLE_THEMES.filter((entry) => entry.primitives.deriveFromPrimary);
    expect(themes.length).toBeGreaterThan(0);
    for (const entry of themes) {
      for (const mode of ["light", "dark"] as const) {
        for (const primary of primaries) {
          const colors = mode === "dark" ? { darkColors: { primary } } : { colors: { primary } };
          const built = buildTheme({ ...entry.primitives, ...colors, colors: { ...entry.primitives.colors, ...colors.colors }, darkColors: { ...entry.primitives.darkColors, ...colors.darkColors } }, mode);
          for (const bg of [built.colors.background.default, built.colors.background.surface]) {
            const where = `${entry.id} ${mode} primary ${primary} on ${bg}`;
            expect(chroma.contrast(built.colors.link, bg), `link, ${where}`).toBeGreaterThanOrEqual(4.5);
            expect(chroma.contrast(built.colors.border.focus, bg), `focus, ${where}`).toBeGreaterThanOrEqual(3);
          }
        }
      }
    }
  });

  it("is checked as true or false in a theme document", () => {
    expect(parseThemeDocument(JSON.stringify({ version: 1, primitives: { deriveFromPrimary: true } })).ok).toBe(true);
    expect(parseThemeDocument(JSON.stringify({ version: 1, primitives: { deriveFromPrimary: 1 } })).ok).toBe(false);
  });
});
