import { describe, expect, it } from "vitest";
import { FLAT, NO_SHADOW, RELIEF_PROFILES, reliefLayers, shadowOffset, type ReliefSettings } from "./relief";
import { buildTheme, parseThemeDocument, theme } from "./theme";
import { themeCssVariables } from "./theme-css-vars";

const settings = (over: Partial<ReliefSettings> = {}): ReliefSettings => ({
  depth: 0.5,
  sheen: 0.5,
  angle: 0,
  blend: "normal",
  dark: false,
  ...over,
});

describe("shadowOffset", () => {
  it("falls straight down at 0°, written as the theme always wrote it", () => {
    expect(shadowOffset(0, 4)).toBe("0 4px");
  });

  it("falls away from the light as it moves round", () => {
    expect(shadowOffset(90, 4)).toBe("-4px 0");
    expect(shadowOffset(180, 4)).toBe("0 -4px");
    expect(shadowOffset(270, 4)).toBe("4px 0");
    expect(shadowOffset(315, 4)).toBe("2.83px 2.83px");
  });

  it("normalises angles outside one turn", () => {
    expect(shadowOffset(-90, 4)).toBe(shadowOffset(270, 4));
    expect(shadowOffset(450, 4)).toBe(shadowOffset(90, 4));
  });
});

describe("reliefLayers", () => {
  it("draws nothing at zero depth and sheen", () => {
    for (const profile of RELIEF_PROFILES) {
      expect(reliefLayers(profile, "raised", settings({ depth: 0, sheen: 0 }))).toEqual(FLAT);
      expect(reliefLayers(profile, "recessed", settings({ depth: 0, sheen: 0 }))).toEqual(FLAT);
    }
    expect(FLAT.edge).toBe(NO_SHADOW);
  });

  it("lights a raised surface on the lit side and shades a recessed one there", () => {
    const raised = reliefLayers("soft", "raised", settings());
    const recessed = reliefLayers("soft", "recessed", settings());
    expect(raised.fill).toMatch(/^linear-gradient\(180deg, rgb\(255 255 255/);
    expect(recessed.fill).toMatch(/^linear-gradient\(180deg, rgb\(0 0 0/);
  });

  it("puts the highlight stroke on the lit edge", () => {
    // Light from above: an inset shadow offset down paints the top edge.
    expect(reliefLayers("soft", "raised", settings()).edge).toMatch(/^inset 0 1px 0 rgb\(255 255 255/);
    // Light from the right: offset left paints the right edge.
    expect(reliefLayers("soft", "raised", settings({ angle: 90 })).edge).toMatch(/^inset -1px 0 0 rgb\(255 255 255/);
  });

  it("scales with strength: a subtle raise is half a control's", () => {
    const alpha = (fill: string) => Number(fill.match(/rgb\(255 255 255 \/ ([\d.]+)\)/)![1]);
    const full = alpha(reliefLayers("soft", "raised", settings()).fill);
    const subtle = alpha(reliefLayers("soft", "raisedSubtle", settings()).fill);
    expect(subtle).toBeCloseTo(full / 2, 3);
  });

  it("tones highlights down and shading up on dark surfaces", () => {
    const alphas = (fill: string) => fill.match(/\/ ([\d.]+)\)/g)!.map((m) => Number(m.slice(2, -1)));
    const [lightHi, lightSh] = alphas(reliefLayers("soft", "raised", settings()).fill);
    const [darkHi, darkSh] = alphas(reliefLayers("soft", "raised", settings({ dark: true })).fill);
    expect(darkHi).toBeLessThan(lightHi);
    expect(darkSh).toBeGreaterThan(lightSh);
  });

  it("keeps print relief to hard edges, with no gradient", () => {
    const print = reliefLayers("print", "raised", settings());
    expect(print.fill).toBe("none");
    expect(print.edge).toMatch(/^inset 0 2px 0 /);
  });
});

describe("relief in the theme", () => {
  it("is flat at zero depth and sheen, so no component changes", () => {
    const flat = buildTheme({ reliefDepth: 0, reliefSheen: 0 });
    expect(flat.relief.raised.fill).toBe("none");
    expect(flat.relief.recessed.edge).toBe(NO_SHADOW);
    expect(flat.relief.glass.raised.fill).toBe("none");
    expect(flat.relief.blend).toBe("normal");
  });

  it("leaves the computed shadows exactly as they were at the default light angle", () => {
    expect(theme.shadows.sm).toBe("0 4px 8px rgba(0, 0, 0, 0.18)");
    expect(theme.roles.elevation.overlay).toBe("0 12px 24px rgba(0, 0, 0, 0.38)");
  });

  it("turns every computed shadow with the light", () => {
    const t = buildTheme({ lightAngle: 90 });
    expect(t.shadows.sm).toBe("-4px 0 8px rgba(0, 0, 0, 0.18)");
    expect(t.shadows.pop).toBe("-14px 0 40px rgba(0, 0, 0, 0.2)");
    expect(t.roles.elevation.floating).toBe("-8px 0 16px rgba(0, 0, 0, 0.28)");
  });

  it("follows the theme's profile, and offers every profile for re-pointing", () => {
    const t = buildTheme({ reliefDepth: 0.6, reliefSheen: 0.4, reliefProfile: "glass" });
    expect(t.relief.raised.fill).toBe(t.relief.glass.raised.fill);
    expect(t.relief.soft.raised.fill).not.toBe(t.relief.glass.raised.fill);
  });

  it("binds each posture's purpose tokens to the theme's relief", () => {
    const vars = themeCssVariables(buildTheme({ reliefDepth: 0.6, reliefSheen: 0.4 }));
    expect(vars["--squonk-roles-relief-control-fill"]).toBe(vars["--squonk-relief-raised-fill"]);
    expect(vars["--squonk-roles-relief-surface-edge"]).toBe(vars["--squonk-relief-raised-subtle-edge"]);
    expect(vars["--squonk-roles-relief-well-fill"]).toBe(vars["--squonk-relief-recessed-fill"]);
    expect(vars["--squonk-roles-relief-pressed-edge"]).toBe(vars["--squonk-relief-recessed-edge"]);
    expect(vars["--squonk-roles-relief-blend"]).toBe("normal");
  });

  it("lets a theme give one posture its own profile through roleBindings", () => {
    const t = buildTheme({ reliefDepth: 0.6, reliefSheen: 0.4 }, "light", {}, {}, {
      "roles.relief.control.fill": "relief.pillow.raised.fill",
    });
    const vars = themeCssVariables(t);
    expect(vars["--squonk-roles-relief-control-fill"]).toBe(vars["--squonk-relief-pillow-raised-fill"]);
    expect(vars["--squonk-roles-relief-surface-fill"]).toBe(vars["--squonk-relief-raised-subtle-fill"]);
  });
});

describe("theme documents with relief", () => {
  const doc = (primitives: Record<string, unknown>) => JSON.stringify({ version: 1, primitives });

  it("accepts valid relief primitives", () => {
    expect(parseThemeDocument(doc({ lightAngle: 315, reliefDepth: 0.5, reliefSheen: 1, reliefProfile: "print", reliefBlend: "soft-light" })).ok).toBe(true);
  });

  it("rejects out-of-range or unknown values", () => {
    expect(parseThemeDocument(doc({ reliefDepth: 1.5 }))).toMatchObject({ ok: false, error: "primitives.reliefDepth: Must be between zero and one" });
    expect(parseThemeDocument(doc({ reliefSheen: -0.1 })).ok).toBe(false);
    expect(parseThemeDocument(doc({ lightAngle: 360 })).ok).toBe(false);
    expect(parseThemeDocument(doc({ reliefProfile: "chrome" }))).toMatchObject({
      ok: false,
      error: "primitives.reliefProfile: Must be one of soft, bevel, glass, pillow, print",
    });
    expect(parseThemeDocument(doc({ reliefBlend: "multiply" })).ok).toBe(false);
  });
});
