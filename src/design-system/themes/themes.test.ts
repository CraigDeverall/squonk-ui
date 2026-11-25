import Color from "color";
import { describe, expect, it } from "vitest";
import { defaultPurposeBindings } from "../../theme/purpose";
import { buildTheme } from "../../theme/theme";
import { derivedColorTokens, themeCssVariables } from "../../theme/theme-css-vars";
import { EXAMPLE_THEMES } from "./themes";

const contrast = (a: string, b: string) => Color(a).contrast(Color(b));

describe("example themes", () => {
  it("only re-point purposes that exist", () => {
    const known = new Set(Object.keys(defaultPurposeBindings()));
    const computed = Object.keys(buildTheme().roles.radius).map((key) => `roles.radius.${key}`);
    for (const theme of EXAMPLE_THEMES) {
      for (const path of Object.keys(theme.roleBindings)) {
        expect(known.has(path) || computed.includes(path), `${theme.id}: ${path}`).toBe(true);
      }
    }
  });

  it("resolve every purpose they re-point to a value in both modes", () => {
    for (const theme of EXAMPLE_THEMES) {
      for (const mode of ["light", "dark"] as const) {
        const vars = themeCssVariables(buildTheme(theme.primitives, mode, {}, {}, theme.roleBindings)) as Record<string, string>;
        for (const path of Object.keys(theme.roleBindings)) {
          const name = `--squonk-${path.split(".").map((part) => part.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)).join("-")}`;
          expect(vars[name], `${theme.id} ${mode}: ${name}`).toBeTruthy();
          expect(vars[name], `${theme.id} ${mode}: ${name}`).not.toMatch(/^(roles|colors|spacing|typography|borders|motion)\./);
        }
      }
    }
  });

  it("keep text, links and the focus ring readable on every background in both modes", () => {
    for (const theme of EXAMPLE_THEMES) {
      for (const mode of ["light", "dark"] as const) {
        const { colors } = buildTheme(theme.primitives, mode);
        const backgrounds = [colors.background.default, colors.background.surface, colors.background.subtle];
        for (const background of backgrounds) {
          const at = `${theme.id} ${mode} on ${background}`;
          expect(contrast(colors.text.primary, background), `${at}: text`).toBeGreaterThanOrEqual(7);
          expect(contrast(colors.text.secondary, background), `${at}: secondary text`).toBeGreaterThanOrEqual(4.5);
          expect(contrast(colors.text.muted, background), `${at}: muted text`).toBeGreaterThanOrEqual(4.5);
          expect(contrast(colors.link, background), `${at}: link`).toBeGreaterThanOrEqual(4.5);
          expect(contrast(colors.border.focus, background), `${at}: focus ring`).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it("keep labels on the accent and across the primary gradient at AA in both modes", () => {
    const failures: string[] = [];
    const check = (ratio: number, what: string) => {
      if (ratio < 4.5) failures.push(`${what}: ${ratio.toFixed(2)}`);
    };
    for (const theme of EXAMPLE_THEMES) {
      for (const mode of ["light", "dark"] as const) {
        const built = buildTheme(theme.primitives, mode);
        const derived = derivedColorTokens(built);
        const at = `${theme.id} ${mode}`;
        check(contrast(derived.contrastPrimaryFill, derived.primaryFill), `${at} on accent ${derived.primaryFill}`);
        const start = built.gradients.primaryStart;
        for (const end of start === "none" ? [derived.primaryFill] : [derived.primaryFill, start]) {
          check(contrast(derived.contrastPrimary, end), `${at} button label ${derived.contrastPrimary} on ${end}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
