import { describe, expect, it } from "vitest";
import { buildTheme } from "./theme";
import { changedCssVariables, themeCssVariables } from "./theme-css-vars";
import { defaultPurposeBindings, purposeReasons, resolveRoleBinding, resolveRoleBindings } from "./purpose";

describe("purpose tokens", () => {
  const vars = themeCssVariables(buildTheme());

  it("binds every default to a token that exists, or to a literal value", () => {
    for (const [path, bind] of Object.entries(defaultPurposeBindings())) {
      // A number, a CSS function or a keyword (none, normal); token paths have dots.
      const isLiteral = /^-?\d/.test(bind) || /^[a-z-]+\(/.test(bind) || !bind.includes(".");
      if (isLiteral) continue;
      const name = `--squonk-${bind.split(".").map((s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)).join("-")}`;
      expect(vars, `${path} → ${bind}`).toHaveProperty(name);
    }
  });

  it("gives every purpose a reason", () => {
    for (const [path, why] of Object.entries(purposeReasons())) expect(why.length, path).toBeGreaterThan(10);
  });

  it("emits purposes as --squonk-roles-* and --squonk-components-* with their bound values", () => {
    expect(vars["--squonk-roles-space-field-gap"]).toBe(vars["--squonk-spacing-xs"]);
    expect(vars["--squonk-roles-color-hint"]).toBe(vars["--squonk-colors-text-secondary"]);
    expect(vars["--squonk-roles-color-selected"]).toBe(vars["--squonk-colors-tone-primary-subtle"]);
    expect(vars["--squonk-components-button-padding-inline-hero"]).toBe(vars["--squonk-spacing-xxl"]);
    expect(vars["--squonk-roles-size-choice"]).toBe("18px");
  });

  it("re-points a purpose without touching the scale or other purposes", () => {
    const roomy = themeCssVariables(buildTheme(undefined, "light", {}, {}, { "roles.space.questionGap": "spacing.xxl", "roles.color.hint": "#555" }));
    expect(roomy["--squonk-roles-space-question-gap"]).toBe(vars["--squonk-spacing-xxl"]);
    expect(roomy["--squonk-roles-color-hint"]).toBe("#555");
    expect(roomy["--squonk-spacing-lg"]).toBe(vars["--squonk-spacing-lg"]);
    expect(roomy["--squonk-roles-space-field-gap"]).toBe(vars["--squonk-roles-space-field-gap"]);
  });

  it("follows the scale: a nested scope with a new spacing re-emits the purposes bound to it", () => {
    const tighter = themeCssVariables(buildTheme({ spacingPx: 4 }));
    const changed = changedCssVariables(tighter, vars);
    expect(changed).toHaveProperty("--squonk-roles-space-field-gap");
    expect(changed).not.toHaveProperty("--squonk-roles-color-hint");
  });
});

describe("purposes computed in the theme", () => {
  it("are re-pointed by roleBindings too", () => {
    const pill = themeCssVariables(buildTheme(undefined, "light", {}, {}, { "roles.radius.control": "borders.radius.full" }));
    expect(pill["--squonk-roles-radius-control"]).toBe("9999px");
  });
});

describe("role bindings in theme documents", () => {
  it("round-trips through export and import", async () => {
    const { parseThemeDocument, serializeThemeDocument } = await import("./theme");
    const doc = { version: 1 as const, roleBindings: { "roles.space.fieldGap": "spacing.md", "roles.radius.control": "12px" } };
    const parsed = parseThemeDocument(serializeThemeDocument(doc));
    expect(parsed).toEqual({ ok: true, doc });
  });

  it("rejects unknown purposes and values that could break out of a declaration", async () => {
    const { parseThemeDocument } = await import("./theme");
    const parse = (roleBindings: object) => parseThemeDocument(JSON.stringify({ version: 1, roleBindings }));
    expect(parse({ "roles.space.nope": "spacing.md" }).ok).toBe(false);
    expect(parse({ "roles.space.fieldGap": "4px; } body { display: none" }).ok).toBe(false);
    expect(parse({ "roles.color.hint": "</style><script>" }).ok).toBe(false);
  });

  it("ignores an unsafe binding passed in code, keeping the default", () => {
    const vars = themeCssVariables(buildTheme(undefined, "light", {}, {}, { "roles.space.fieldGap": "1px;}" }));
    expect(vars["--squonk-roles-space-field-gap"]).toBe(themeCssVariables(buildTheme())["--squonk-roles-space-field-gap"]);
  });

  it("reads role bindings back from panel storage", async () => {
    const { parseStoredThemePart } = await import("./theme-storage");
    expect(parseStoredThemePart(JSON.stringify({ "roles.space.fieldGap": "spacing.md" }), "roleBindings")).toEqual({ "roles.space.fieldGap": "spacing.md" });
    expect(parseStoredThemePart("{\"roles.bogus\":\"x\"}", "roleBindings")).toBeUndefined();
  });
});

describe("role bindings per colour mode", () => {
  const build = (mode: "light" | "dark", roleBindings: Parameters<typeof buildTheme>[4]) =>
    themeCssVariables(buildTheme(undefined, mode, {}, {}, roleBindings)) as Record<string, string>;
  const plain = (mode: "light" | "dark") => themeCssVariables(buildTheme(undefined, mode)) as Record<string, string>;

  it.each(["light", "dark"] as const)("keeps a string binding the same in %s mode", (mode) => {
    expect(build(mode, { "roles.color.heading": "#123456" })["--squonk-roles-color-heading"]).toBe("#123456");
  });

  it("picks the value for the mode from a { light, dark } binding", () => {
    const heading = { "roles.color.heading": { light: "#1d3557", dark: "#f1faee" } };
    expect(build("light", heading)["--squonk-roles-color-heading"]).toBe("#1d3557");
    expect(build("dark", heading)["--squonk-roles-color-heading"]).toBe("#f1faee");
  });

  it("follows a token path or another purpose in either form", () => {
    const bindings = {
      "roles.color.heading": { light: "roles.color.link", dark: "colors.text.secondary" },
      "roles.color.link": "#0a58ca",
    };
    expect(build("light", bindings)["--squonk-roles-color-heading"]).toBe("#0a58ca");
    expect(build("dark", bindings)["--squonk-roles-color-heading"]).toBe(plain("dark")["--squonk-colors-text-secondary"]);
  });

  it("carries a per-mode binding to the purposes bound through it", () => {
    const accent = { "roles.color.accent": { light: "#aa0000", dark: "#ffaaaa" } };
    expect(build("light", accent)["--squonk-components-heading-accent"]).toBe("#aa0000");
    expect(build("dark", accent)["--squonk-components-heading-accent"]).toBe("#ffaaaa");
  });

  it("re-points a purpose the theme computes, per mode", () => {
    const radius = { "roles.radius.control": { light: "borders.radius.full", dark: "3px" } };
    expect(build("light", radius)["--squonk-roles-radius-control"]).toBe("9999px");
    expect(build("dark", radius)["--squonk-roles-radius-control"]).toBe("3px");
  });

  it("wins over a switch, like a string binding", () => {
    const vars = themeCssVariables(
      buildTheme({ brandHeadings: true }, "dark", {}, {}, { "roles.color.heading": { light: "#111111", dark: "#eeeeee" } }),
    ) as Record<string, string>;
    expect(vars["--squonk-roles-color-heading"]).toBe("#eeeeee");
  });

  it("ignores a malformed or unsafe pair passed in code, keeping the default", () => {
    const fallback = plain("light")["--squonk-roles-color-heading"];
    for (const bad of [{ light: "#111111" }, { light: "#111111", dark: "#eeeeee", hover: "#333333" }, { light: "red;}", dark: "#eeeeee" }, 4]) {
      expect(build("light", { "roles.color.heading": bad as never })["--squonk-roles-color-heading"]).toBe(fallback);
    }
  });

  it("resolves bindings for a mode", () => {
    expect(resolveRoleBinding("spacing.md", "dark")).toBe("spacing.md");
    expect(resolveRoleBinding({ light: "a", dark: "b" }, "dark")).toBe("b");
    expect(resolveRoleBinding({ light: "a" }, "light")).toBeUndefined();
    expect(resolveRoleBindings({ "roles.color.heading": { light: "a", dark: "b" }, "roles.space.fieldGap": "4px" }, "light")).toEqual({
      "roles.color.heading": "a",
      "roles.space.fieldGap": "4px",
    });
  });

  it("round-trips through export and import", async () => {
    const { parseThemeDocument, serializeThemeDocument } = await import("./theme");
    const doc = {
      version: 1 as const,
      roleBindings: {
        "roles.color.heading": { light: "#1d3557", dark: "roles.color.link" },
        "roles.space.fieldGap": "spacing.md",
      },
    };
    expect(parseThemeDocument(serializeThemeDocument(doc))).toEqual({ ok: true, doc });
  });

  it("rejects a pair with a missing mode, another field or a bad value, saying which", async () => {
    const { parseThemeDocument } = await import("./theme");
    const parse = (value: unknown) => parseThemeDocument(JSON.stringify({ version: 1, roleBindings: { "roles.color.heading": value } }));
    expect(parse({ light: "#111111", dark: "#eeeeee" }).ok).toBe(true);
    expect(parse({ light: "#111111" })).toEqual({
      ok: false,
      error: "roleBindings.roles.color.heading.dark: Missing: a per-mode binding needs both light and dark",
    });
    expect(parse({})).toMatchObject({ ok: false, error: expect.stringContaining("roles.color.heading.light: Missing") });
    expect(parse({ light: "#111111", dark: "#eeeeee", hover: "#333333" })).toEqual({
      ok: false,
      error: "roleBindings.roles.color.heading.hover: Only light and dark fields are supported",
    });
    expect(parse({ light: "#111111", dark: "red; } body { display: none" })).toMatchObject({
      ok: false,
      error: expect.stringContaining("roleBindings.roles.color.heading.dark: Must be a token path"),
    });
    expect(parse({ light: "#111111", dark: 4 }).ok).toBe(false);
    expect(parse({ light: "#111111", dark: { light: "#111111", dark: "#eeeeee" } }).ok).toBe(false);
    expect(parse(["#111111", "#eeeeee"]).ok).toBe(false);
    expect(parse(null).ok).toBe(false);
    expect(parseThemeDocument(JSON.stringify({ version: 1, roleBindings: { "roles.color.nope": { light: "a", dark: "b" } } })).ok).toBe(false);
  });

  it("reads a per-mode binding back from panel storage", async () => {
    const { parseStoredThemePart } = await import("./theme-storage");
    const stored = { "roles.color.heading": { light: "#1d3557", dark: "#f1faee" } };
    expect(parseStoredThemePart(JSON.stringify(stored), "roleBindings")).toEqual(stored);
    expect(parseStoredThemePart(JSON.stringify({ "roles.color.heading": { light: "#1d3557" } }), "roleBindings")).toBeUndefined();
  });
});

describe("the page background image", () => {
  const build = (mode: "light" | "dark", roleBindings: Parameters<typeof buildTheme>[4] = {}) =>
    themeCssVariables(buildTheme(undefined, mode, {}, {}, roleBindings)) as Record<string, string>;

  it.each(["light", "dark"] as const)("is none by default in %s mode", (mode) => {
    expect(build(mode)["--squonk-components-page-background-image"]).toBe("none");
  });

  it("takes a gradient from a binding", () => {
    const gradient = "linear-gradient(180deg, #ffffff 0%, #eef2ff 100%)";
    expect(build("light", { "components.page.backgroundImage": gradient })["--squonk-components-page-background-image"]).toBe(gradient);
  });

  it("takes a gradient per mode", () => {
    const image = {
      "components.page.backgroundImage": {
        light: "linear-gradient(180deg, #ffffff, #eef2ff)",
        dark: "radial-gradient(circle at top, #1e1b4b, #020617)",
      },
    };
    expect(build("light", image)["--squonk-components-page-background-image"]).toBe("linear-gradient(180deg, #ffffff, #eef2ff)");
    expect(build("dark", image)["--squonk-components-page-background-image"]).toBe("radial-gradient(circle at top, #1e1b4b, #020617)");
  });

  it("is accepted in a theme document", async () => {
    const { parseThemeDocument } = await import("./theme");
    const roleBindings = { "components.page.backgroundImage": { light: "linear-gradient(#fff, #eee)", dark: "none" } };
    expect(parseThemeDocument(JSON.stringify({ version: 1, roleBindings })).ok).toBe(true);
  });
});

describe("default heading weights", () => {
  const LEVELS = [1, 2, 3, 4, 5, 6];
  const vars = themeCssVariables(buildTheme()) as Record<string, string>;

  it("are the bold weight at every level by default", () => {
    for (const level of LEVELS) {
      expect(vars[`--squonk-components-heading-weight-level${level}`], `level ${level}`).toBe("700");
      expect(vars[`--squonk-components-heading-weight-level${level}`]).toBe(vars["--squonk-roles-type-strong"]);
    }
  });

  it("change one level at a time", () => {
    const heavy = themeCssVariables(
      buildTheme(undefined, "light", {}, {}, { "components.heading.weight.level1": "900", "components.heading.weight.level2": "800" }),
    ) as Record<string, string>;
    expect(LEVELS.map((level) => heavy[`--squonk-components-heading-weight-level${level}`])).toEqual(["900", "800", "700", "700", "700", "700"]);
    expect(heavy["--squonk-roles-type-strong"]).toBe("700");
  });

  it("follow the strong weight when a theme re-points it", () => {
    const lighter = themeCssVariables(buildTheme(undefined, "light", {}, {}, { "roles.type.strong": "600" })) as Record<string, string>;
    for (const level of LEVELS) expect(lighter[`--squonk-components-heading-weight-level${level}`]).toBe("600");
  });
});

describe("the outlined card's shadow", () => {
  const vars = themeCssVariables(buildTheme()) as Record<string, string>;

  it("draws nothing by default, as a shadow that can sit in a list", () => {
    expect(vars["--squonk-components-card-outlined-elevation"]).toBe("0 0 #0000");
  });

  it("takes an elevation from a binding, per mode if wanted", () => {
    const build = (mode: "light" | "dark") =>
      themeCssVariables(
        buildTheme(undefined, mode, {}, {}, {
          "components.card.outlinedElevation": { light: "roles.elevation.soft", dark: "0 1px 2px rgba(0, 0, 0, 0.6)" },
        }),
      ) as Record<string, string>;
    expect(build("light")["--squonk-components-card-outlined-elevation"]).toBe(build("light")["--squonk-roles-elevation-soft"]);
    expect(build("dark")["--squonk-components-card-outlined-elevation"]).toBe("0 1px 2px rgba(0, 0, 0, 0.6)");
  });
});
