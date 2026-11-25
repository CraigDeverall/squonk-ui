import { describe, expect, it } from "vitest";
import {
  buildTheme,
  parseThemeDocument,
  primitives,
  serializeThemeDocument,
  theme,
  themeBindings,
  themeHelpers,
  themeToCssVars,
  resolveBinding,
} from "./theme";
import Color from "color";
import type { ThemeDocument } from "./theme";

describe("theme tokens derive from primitives", () => {
  it("spacing.sm = 8px (1x spacingPx)", () => {
    expect(theme.spacing.sm).toBe("8px");
  });

  it("spacing.md = 16px (2x spacingPx)", () => {
    expect(theme.spacing.md).toBe("16px");
  });

  it("spacing.cardPadding = spacing.md", () => {
    expect(theme.spacing.cardPadding).toBe(theme.spacing.md);
  });

  it("typography.sizes.base = 16px (1x fontPx)", () => {
    expect(theme.typography.sizes.base).toBe("16px");
  });

  it("borders.radius.base derives from primitives.borderRadiusPx", () => {
    expect(theme.borders.radius.base).toBe("12px");
  });
});

describe("control size tokens", () => {
  it("control heights step with the spacing primitive", () => {
    expect(theme.presentation.controlHeight).toEqual({ compact: "28px", default: "40px", large: "48px", hero: "56px" });
    expect(buildTheme({ spacingPx: 4 }).presentation.controlHeight.default).toBe("20px");
  });

  it("icon sizes step with the font primitive", () => {
    expect(theme.presentation.iconSize).toEqual({ compact: "14px", default: "16px", large: "18px", hero: "20px" });
  });
  it("roles map purposes to the scales, and controlRadiusPx sets every control's shape", () => {
    expect(theme.roles.radius).toEqual({
      control: "10px", surface: "24px", overlay: "24px", item: "6px", chip: "6px", list: "21.75px", listItem: "16.75px",
    });
    expect(theme.roles.elevation.floating).toBe(theme.shadows.md);
    expect(theme.roles.elevation.overlay).toBe(theme.shadows.lg);
    expect(theme.roles.elevation.raised).toBe(theme.shadows.sm);
    expect(buildTheme({ controlRadiusPx: 9999 }).roles.radius.control).toBe("9999px");
    expect(buildTheme({ controlRadiusPx: 9999 }).roles.radius.surface).toBe("24px");
  });
});

describe("motion and state tokens", () => {
  it("motion durations derive from transitionDurationMs like transitions", () => {
    const t = buildTheme({ transitionDurationMs: 200 });
    expect(t.motion.durations.fast).toBe("200ms");
    expect(t.motion.durations.normal).toBe("300ms");
    expect(t.motion.durations.slow).toBe("500ms");
    expect(t.transitions.normal.startsWith(t.motion.durations.normal)).toBe(true);
  });

  it("easings and the disabled opacity are fixed", () => {
    expect(theme.motion.easings.enter).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
    expect(theme.motion.easings.exit).toBe("cubic-bezier(0.55, 0, 1, 0.45)");
    expect(theme.motion.easings.standard).toBe("cubic-bezier(0.65, 0, 0.35, 1)");
    expect(theme.states.disabledOpacity).toBe(0.5);
  });
});

describe("themeBindings", () => {
  // Walk the theme and collect every leaf path. The bindings map must
  // describe each one — if buildTheme grows a new getter and we forget to
  // add a binding, this fails loudly.
  const collectLeafPaths = (obj: unknown, prefix = ""): string[] => {
    if (obj === null || typeof obj !== "object") return [prefix];
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      // The `mode` field is metadata, not a getter — skip it. `switchBindings`
      // is the bag of purpose bindings the theme's switches apply (keyed by
      // purpose path), not theme getters, so it has no bindings entry either.
      if (path === "mode" || path === "switchBindings") return [];
      return collectLeafPaths(v, path);
    });
  };

  it("has an entry for every leaf in the built theme", () => {
    const paths = collectLeafPaths(theme);
    const missing = paths.filter((p) => !(p in themeBindings));
    expect(missing).toEqual([]);
  });

  it("does not declare bindings for paths that aren't in the theme", () => {
    const paths = new Set(collectLeafPaths(theme));
    const orphans = Object.keys(themeBindings).filter((p) => !paths.has(p));
    expect(orphans).toEqual([]);
  });

  it("resolveBinding swaps colors.* to darkColors.* in dark mode", () => {
    expect(resolveBinding("colors.primary", "light")).toBe("colors.primary");
    expect(resolveBinding("colors.primary", "dark")).toBe("darkColors.primary");
  });

  it("resolveBinding passes through non-color bindings unchanged", () => {
    expect(resolveBinding("spacing.md", "light")).toBe("spacingPx × 2");
    expect(resolveBinding("spacing.md", "dark")).toBe("spacingPx × 2");
  });

  it("resolveBinding returns em-dash for unknown paths", () => {
    expect(resolveBinding("does.not.exist", "light")).toBe("—");
  });
});

describe("color rebinding via buildTheme(_, _, colorBindings)", () => {
  it("default (no bindings) resolves to the built-in primitive", () => {
    const t = buildTheme(undefined, "light");
    expect(t.colors.primary).toBe(primitives.colors.primary);
  });

  it("rebinds a top-level color getter to a different primitive", () => {
    const t = buildTheme(undefined, "light", { "colors.primary": "accent" });
    expect(t.colors.primary).toBe(primitives.colors.accent);
    // sibling getters untouched
    expect(t.colors.accent).toBe(primitives.colors.accent);
    expect(t.colors.secondary).toBe(primitives.colors.secondary);
  });

  it("rebinds a nested color getter (background.subtle)", () => {
    const t = buildTheme(undefined, "light", {
      "colors.background.subtle": "backgroundDefault",
    });
    expect(t.colors.background.subtle).toBe(primitives.colors.backgroundDefault);
  });

  it("rebinding follows the active mode (dark)", () => {
    const t = buildTheme(undefined, "dark", { "colors.primary": "accent" });
    expect(t.colors.primary).toBe(primitives.darkColors.accent);
  });

  it("rebinding composes with primitives overrides", () => {
    const t = buildTheme(
      { colors: { accent: "#ff00ff" } },
      "light",
      { "colors.primary": "accent" }
    );
    expect(t.colors.primary).toBe("#ff00ff");
  });
});

describe("added (custom) color primitives via buildTheme", () => {
  it("a custom primitive key is reachable by rebinding a getter to it", () => {
    const t = buildTheme(
      undefined,
      "light",
      { "colors.primary": "tertiary" },
      { tertiary: { light: "#ff00ff", dark: "#aa00aa" } }
    );
    expect(t.colors.primary).toBe("#ff00ff");
  });

  it("custom primitive follows the active mode", () => {
    const t = buildTheme(
      undefined,
      "dark",
      { "colors.primary": "tertiary" },
      { tertiary: { light: "#ff00ff", dark: "#aa00aa" } }
    );
    expect(t.colors.primary).toBe("#aa00aa");
  });

  it("custom primitives do not affect unbound getters", () => {
    const t = buildTheme(
      undefined,
      "light",
      {},
      { tertiary: { light: "#ff00ff", dark: "#aa00aa" } }
    );
    expect(t.colors.primary).toBe(primitives.colors.primary);
    expect(t.colors.accent).toBe(primitives.colors.accent);
  });

  it("rebinding to an unknown key falls back to the getter's default", () => {
    const t = buildTheme(
      undefined,
      "light",
      { "colors.primary": "nonexistent" }
    );
    expect(t.colors.primary).toBe(primitives.colors.primary);
  });
});

describe("ThemeDocument serialize / parse", () => {
  it("round-trips a populated document", () => {
    const doc: ThemeDocument = {
      version: 1,
      primitives: { colors: { primary: "#abcdef" } },
      bindings: { "colors.primary": "accent" },
      addedPrimitives: { tertiary: { light: "#ff00ff", dark: "#aa00aa" } },
    };
    const result = parseThemeDocument(serializeThemeDocument(doc));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.doc).toEqual(doc);
  });

  it("accepts an empty document with just a version", () => {
    const result = parseThemeDocument('{"version":1}');
    expect(result.ok).toBe(true);
  });

  it("rejects unsupported versions", () => {
    const result = parseThemeDocument('{"version":2}');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unsupported version/);
  });

  it("rejects non-object payloads", () => {
    expect(parseThemeDocument("[]").ok).toBe(false);
    expect(parseThemeDocument("42").ok).toBe(false);
    expect(parseThemeDocument('"hello"').ok).toBe(false);
  });

  it("rejects invalid JSON with the parser error", () => {
    const result = parseThemeDocument("{not json");
    expect(result.ok).toBe(false);
  });

  it("rejects non-object sub-fields", () => {
    const r = parseThemeDocument('{"version":1,"bindings":"oops"}');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/bindings/);
  });
});

describe("ThemeDocument nested validation", () => {
  it.each([
    ["null pair", { addedPrimitives: { brand: null } }, "addedPrimitives.brand"],
    ["array pair", { addedPrimitives: { brand: [] } }, "addedPrimitives.brand"],
    ["missing dark color", { addedPrimitives: { brand: { light: "red" } } }, "addedPrimitives.brand.dark"],
    ["invalid custom color", { addedPrimitives: { brand: { light: "oops", dark: "black" } } }, "addedPrimitives.brand.light"],
    ["extra pair field", { addedPrimitives: { brand: { light: "red", dark: "black", extra: true } } }, "addedPrimitives.brand"],
    ["wrong number type", { primitives: { fontPx: "oops" } }, "primitives.fontPx"],
    ["null number", { primitives: { fontPx: null } }, "primitives.fontPx"],
    ["negative spacing", { primitives: { spacingPx: -1 } }, "primitives.spacingPx"],
    ["zero font", { primitives: { fontPx: 0 } }, "primitives.fontPx"],
    ["negative ratio", { primitives: { compactFontRatio: -1 } }, "primitives.compactFontRatio"],
    ["opacity above one", { primitives: { depthOpacity: 1.1 } }, "primitives.depthOpacity"],
    ["invalid palette", { primitives: { colors: [] } }, "primitives.colors"],
    ["unknown primitive", { primitives: { typoPx: 20 } }, "primitives.typoPx"],
    ["unknown built-in color", { primitives: { colors: { brand: "red" } } }, "primitives.colors.brand"],
    ["invalid color", { primitives: { colors: { primary: "not-a-color" } } }, "primitives.colors.primary"],
    ["browser-only color", { primitives: { colors: { primary: "var(--brand)" } } }, "primitives.colors.primary"],
    ["empty font stack", { primitives: { fontFamily: " " } }, "primitives.fontFamily"],
    ["non-string binding", { bindings: { "colors.primary": null } }, "bindings.colors.primary"],
    ["inherited-property binding", { bindings: { "colors.primary": "toString" } }, "bindings.colors.primary"],
    ["reserved added key", { addedPrimitives: { constructor: { light: "red", dark: "black" } } }, "addedPrimitives.constructor"],
    ["array field", { bindings: [] }, "bindings"],
    ["unknown document field", { extra: {} }, "extra"],
  ])("rejects %s with its field path", (_name, fields, path) => {
    const result = parseThemeDocument(JSON.stringify({ version: 1, ...fields }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(path);
  });

  it("rejects numbers that overflow JSON's finite range", () => {
    const result = parseThemeDocument('{"version":1,"primitives":{"fontPx":1e309}}');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("finite number");
  });

  it.each(["#abc", "#aabbcc", "rgb(10, 20, 30)", "rgba(10, 20, 30, 0.5)", "hsl(120, 50%, 50%)", "rebeccapurple", "transparent"])(
    "preserves supported imported color %s", (color) => {
      const doc: ThemeDocument = {
        version: 1,
        primitives: { colors: { primary: color } },
        addedPrimitives: { brand: { light: color, dark: color } },
      };
      expect(parseThemeDocument(serializeThemeDocument(doc))).toEqual({ ok: true, doc });
    },
  );

  it("accepts zero geometry and preserves unknown-binding fallback", () => {
    const doc: ThemeDocument = {
      version: 1,
      primitives: { spacingPx: 0, borderPx: 0, transitionDurationMs: 0 },
      bindings: { "colors.primary": "missing-color", "unknown.path": "accent" },
    };
    const result = parseThemeDocument(serializeThemeDocument(doc));
    expect(result).toEqual({ ok: true, doc });
    if (result.ok) {
      const resolved = buildTheme(result.doc.primitives, "light", result.doc.bindings);
      expect(resolved.colors.primary).toBe(primitives.colors.primary);
      expect(resolved.spacing.md).toBe("0px");
    }
  });

  it("accepts the complete default primitive schema", () => {
    const doc: ThemeDocument = { version: 1, primitives };
    expect(parseThemeDocument(serializeThemeDocument(doc))).toEqual({ ok: true, doc });
  });
});

describe("themeToCssVars", () => {
  // Note: the current emitted format uses 3 dashes between parent and child
  // (`--spacing---sm`) due to the prefix concatenation in themeToCssVars.
  // Asserting current behavior; cleaning to `--spacing-sm` would be a
  // breaking change to anyone consuming the exported `cssVariables` string.
  it("emits a CSS variable for every primitive-backed token", () => {
    const out = themeToCssVars(theme);
    expect(out).toContain("--spacing---sm: 8px");
    expect(out).toContain("--spacing---md: 16px");
    expect(out).toContain("--spacing---cardPadding: 16px");
    expect(out).toContain("--colors---primary: #ef4237");
  });
});

describe("text on filled surfaces leans to white", () => {
  const contrast = (a: string, b: string) => Color(a).contrast(Color(b));

  it("picks white wherever it passes AA, even if black scores higher", () => {
    // Black scores 4.6 here, white 4.5: white reads better on a strong red.
    expect(themeHelpers.getMinContrastTextColor("#DC3545").toLowerCase()).toBe("#ffffff");
  });

  it("deepens a strong fill that white nearly reads on, until it passes AA", () => {
    for (const fill of ["#28a745", "#17a2b8", "#e5484d"]) {
      const settled = themeHelpers.forLightText(fill);
      expect(contrast(settled, "#ffffff"), fill).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("leaves light fills (dark text) and already dark fills alone", () => {
    expect(themeHelpers.forLightText("#94d500")).toBe("#94d500");
    expect(themeHelpers.forLightText("#1d3557")).toBe("#1D3557");
  });

  it("keeps a soft fill a clear tint under body text, even from a dark brand colour", () => {
    expect(contrast(themeHelpers.softUnder("#2B4F82", "#1b1f24"), "#1b1f24")).toBeGreaterThanOrEqual(7);
  });

  it("never leaves an example theme's fills mid-tone under dark text", async () => {
    const { EXAMPLE_THEMES } = await import("../design-system/themes/themes");
    const { themeCssVariables } = await import("./theme-css-vars");
    for (const theme of EXAMPLE_THEMES) {
      for (const mode of ["light", "dark"] as const) {
        const vars = themeCssVariables(buildTheme(theme.primitives, mode, {}, {}, theme.roleBindings)) as Record<string, string>;
        for (const tone of ["neutral", "primary", "success", "warning", "error", "info"]) {
          for (const [fill, text] of [["solid", "contrast"], ["wash", "on-wash"], ["subtle", "on-subtle"]]) {
            const bg = vars[`--squonk-colors-tone-${tone}-${fill}`];
            const fg = vars[`--squonk-colors-tone-${tone}-${text}`];
            const label = `${theme.id}/${mode} ${tone} ${fill}`;
            expect(contrast(bg, fg), label).toBeGreaterThanOrEqual(4.5);
            const darkText = Color(fg).luminosity() < Color(bg).luminosity();
            if (darkText) expect(contrast(bg, "#ffffff"), `${label}: dark text on a dark-ish fill`).toBeLessThan(3);
          }
        }
      }
    }
  });
});
