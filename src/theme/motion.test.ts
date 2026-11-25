import { describe, expect, it } from "vitest";
import { easingFunction, sampleEasing, springEasing, springOvershoot } from "./motion-curves";
import { MOTION_LEVEL_VARS, motionLevelCss, motionLevelDeclarations } from "./motion-level";
import { buildTheme, isEasing, parseThemeDocument, theme } from "./theme";
import { themeCssVariables } from "./theme-css-vars";

describe("spring easing", () => {
  it("is absent without bounce", () => {
    expect(springEasing(0)).toBeUndefined();
    expect(springEasing(-1)).toBeUndefined();
    expect(springEasing(Number.NaN)).toBeUndefined();
  });

  it("starts at 0, ends at 1 and overshoots more as bounce rises", () => {
    const easing = springEasing(0.5)!;
    expect(easing).toMatch(/^linear\(0, .+, 1\)$/);
    expect(isEasing(easing)).toBe(true);
    const low = springOvershoot(0.2);
    const mid = springOvershoot(0.5);
    const high = springOvershoot(1);
    expect(low).toBeGreaterThan(0);
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(mid);
    expect(high).toBeLessThan(0.4);
  });
});

describe("easing functions", () => {
  it("follow cubic-bezier, keywords and linear() stops", () => {
    expect(easingFunction("linear")(0.3)).toBeCloseTo(0.3);
    expect(easingFunction("cubic-bezier(0, 0, 1, 1)")(0.5)).toBeCloseTo(0.5, 3);
    // Decelerating: well past halfway at half time.
    expect(easingFunction("cubic-bezier(0, 0, 0.2, 1)")(0.5)).toBeGreaterThan(0.75);
    expect(easingFunction("ease-in")(0.25)).toBeLessThan(0.25);
    expect(easingFunction("linear(0, 0.5, 1)")(0.25)).toBeCloseTo(0.25);
    expect(sampleEasing("ease", 4)).toHaveLength(5);
  });
});

describe("isEasing", () => {
  it.each(["linear", "ease-out", "cubic-bezier(0.2, 0, 0, 1)", "cubic-bezier(.4,-0.5,.6,1.5)", "linear(0, 0.4 30%, 1)"])(
    "accepts %s",
    (value) => expect(isEasing(value)).toBe(true),
  );
  it.each(["", "fast", "cubic-bezier(0, 0, 1)", "steps(4)", "linear(0)", "ease; } body { color: red", "var(--x)"])(
    "rejects %s",
    (value) => expect(isEasing(value)).toBe(false),
  );
});

describe("theme motion primitives", () => {
  it("derive distances, pop scale, stagger and curves", () => {
    const t = buildTheme({ motionTravelPx: 20, motionStaggerMs: 60, motionEaseEnter: "linear", motionBounce: 0 });
    expect(t.motion.distances.md).toBe("20px");
    expect(t.motion.distances.lg).toBe("30px");
    expect(t.motion.scales.pop).toBe("0.95");
    expect(t.motion.stagger).toBe("60ms");
    expect(t.motion.easings.enter).toBe("linear");
    // No bounce: the spring is the plain arrival curve.
    expect(t.motion.easings.spring).toBe("linear");
  });

  it("keep the library's defaults", () => {
    expect(theme.motion.scales.pop).toBe("0.96");
    expect(theme.motion.easings.enter).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
    expect(theme.motion.easings.exit).toBe("cubic-bezier(0.55, 0, 1, 0.45)");
    expect(theme.motion.easings.standard).toBe("cubic-bezier(0.65, 0, 0.35, 1)");
    expect(theme.motion.stagger).toBe("45ms");
    expect(theme.motion.easings.spring).toMatch(/^linear\(/);
  });

  it("travel 0 makes overlays fade without growing", () => {
    expect(buildTheme({ motionTravelPx: 0 }).motion.scales.pop).toBe("1");
  });

  it("springs only when the theme bounces", () => {
    expect(buildTheme({ motionBounce: 0.5 }).motion.easings.spring).toMatch(/^linear\(/);
  });

  it("fall back to the default curve when a curve isn't an easing", () => {
    expect(buildTheme({ motionEaseExit: "nonsense; }" }).motion.easings.exit).toBe(theme.motion.easings.exit);
  });

  it("reach the motion purposes", () => {
    const vars = themeCssVariables(buildTheme({ motionTravelPx: 8, motionBounce: 0.4 }));
    expect(vars["--squonk-roles-motion-nudge"]).toBe("8px");
    expect(vars["--squonk-roles-motion-reveal-offset"]).toBe("12px");
    expect(vars["--squonk-roles-motion-pop-scale"]).toBe("0.98");
    expect(vars["--squonk-roles-motion-spring"]).toMatch(/^linear\(/);
  });
});

describe("theme documents with motion", () => {
  const doc = (primitives: object) => JSON.stringify({ version: 1, primitives });

  it("accept valid motion primitives", () => {
    expect(parseThemeDocument(doc({ motionBounce: 0.5, motionEaseEnter: "cubic-bezier(0.2, 0, 0, 1)" })).ok).toBe(true);
  });

  it("reject a bounce over one and a curve that isn't an easing", () => {
    expect(parseThemeDocument(doc({ motionBounce: 2 })).ok).toBe(false);
    expect(parseThemeDocument(doc({ motionEaseEnter: "red" })).ok).toBe(false);
  });
});

describe("motion levels", () => {
  it("system sets nothing", () => {
    expect(motionLevelDeclarations("system")).toEqual({});
    expect(motionLevelCss(undefined)).toBe("");
  });

  it("reduced stops travel and decorative loops but keeps time", () => {
    const d = motionLevelDeclarations("reduced");
    expect(d[MOTION_LEVEL_VARS.reduced]).toBe("1");
    expect(d[MOTION_LEVEL_VARS.decor]).toBe("paused");
    expect(d[MOTION_LEVEL_VARS.time]).toBeUndefined();
    expect(d[MOTION_LEVEL_VARS.work]).toBeUndefined();
  });

  it("none stops everything", () => {
    expect(motionLevelCss("none")).toBe(
      "--squonk-motion-level-reduced:1;--squonk-motion-level-time:0;--squonk-motion-level-decor:paused;--squonk-motion-level-work:paused",
    );
  });
});
