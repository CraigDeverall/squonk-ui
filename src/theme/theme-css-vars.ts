import Color from "color";
import { themeHelpers } from "./theme";
import { surfaceForeground } from "./theme-surface";
import type { SquonkTheme } from "./theme-context";
import { listItemRadius, listPanelRadius } from "./list-radius";
import { defaultPurposeBindings, isSafeBindingValue, resolveRoleBinding, type RoleBindingsOverride } from "./purpose";

export type ThemeCssVars = Record<`--squonk-${string}`, string>;

export const kebab = (segment: string) =>
  segment.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * CSS custom property name for a theme path, mirroring the TS path 1:1 so
 * `theme.colors.text.primary` ↔ `var(--squonk-colors-text-primary)`.
 */
export const themeCssVarName = (path: readonly string[]): `--squonk-${string}` =>
  `--squonk-${path.map(kebab).join("-")}`;

const flatten = (node: object, path: string[], out: ThemeCssVars) => {
  for (const [key, value] of Object.entries(node)) {
    if (value !== null && typeof value === "object") {
      flatten(value, [...path, key], out);
    } else if (typeof value === "string" || typeof value === "number") {
      out[themeCssVarName([...path, key])] = String(value);
    }
  }
};

/** WCAG contrast between two colours, or 0 when either can't be parsed. */
const contrastRatio = (a: string, b: string): number => {
  try {
    return Color(a).contrast(Color(b));
  } catch {
    return 0;
  }
};

const translucent = (background: string): string => {
  try {
    const color = Color(background);
    return color.alpha(color.alpha() * 0.8).rgb().string();
  } catch {
    // CSS variables resolve in the browser, outside the color parser.
    return `color-mix(in srgb, ${background} 80%, transparent)`;
  }
};

/**
 * Colors that components used to compute while styling (contrast picks,
 * hover/active darkening). Static CSS can't run that math, so it happens
 * once per theme scope and is published as tokens alongside the theme.
 *
 * Naming (all under `--squonk-colors-`):
 * - `X-hover` / `X-active` — X darkened 15% / 30%.
 * - `contrast-X` — the minimum-contrast (7:1) text color on X.
 * - `primary-gradient` (`-hover`, `-active`) — the primary gradient, from
 *   `gradients.primaryStart` to the primary fill in each state, or `none` when
 *   the primaryGradient switch is off. With it on, the `contrast-primary` and
 *   `on-primary*` text colours are picked to read on both ends.
 * - `on-X` — readable text on X, preferring `text.primary` (ink) when it
 *   already meets 4.5:1. `on-ink` prefers `background.surface` instead.
 * - `on-background-B` — readable primary text on background B; `-secondary`
 *   and `-error` variants for secondary and error text.
 * - `background-subtle-shade` / `-highlight` — `background.subtle` darkened
 *   5% (bevels, insets) / lightened 30% (skeleton shimmer).
 * - `background-default-translucent` — `background.default` at 80% of its
 *   alpha (frosted header).
 * - `tone-T-*` — a palette per tone T (neutral, primary, success, warning,
 *   error, info, and each colour the theme added, by its key): `solid`, `contrast` (text on solid), `subtle` / `on-subtle`
 *   (tinted chip), `outline-text`, and `wash` / `on-wash` / `wash-border`
 *   (tinted panel).
 * - `status-text-X` — status colour X tinted to stay readable (4.5:1) on
 *   `background.subtle`, for status-toned text.
 */
export function derivedColorTokens(theme: SquonkTheme) {
  const { colors } = theme;
  // When text on a fill turns light, and how far the fill deepens for it.
  const balance = theme.contrast.lightTextBalance;
  // How strongly that text stands apart: a tint of the fill, up to white or black.
  const strength = theme.contrast.textOnFillStrength;
  const contrastOn = (fill: string) => themeHelpers.getMinContrastTextColor(fill, balance, strength);
  const ink = colors.text.primary;
  const on = (background: string) => surfaceForeground(background, ink);
  const secondary = (background: string) => surfaceForeground(background, colors.text.secondary);
  const statusText = (color: string) =>
    themeHelpers.readableTint(color, colors.background.subtle, theme.mode === "dark", 0);
  const states = (color: string) => {
    const hover = themeHelpers.darken(color, 0.15);
    const active = themeHelpers.darken(color, 0.3);
    return {
      contrast: contrastOn(color),
      on: on(color),
      hover,
      onHover: on(hover),
      active,
      onActive: on(active),
    };
  };
  const isDark = theme.mode === "dark";
  // One palette per tone, so a component can switch tone by pointing its
  // local --tone-* variables at a different set. Values reproduce what Badge
  // (subtle / outline) and Alert (wash) used to compute.
  const tone = (base: string, neutral = false) => {
    // Strong fills carry light text when they're dark enough to; soft fills
    // stay light enough for body text in light mode.
    const color = themeHelpers.forLightText(base, balance);
    const soft = (fill: string) => (isDark ? fill : themeHelpers.softUnder(fill, colors.text.primary));
    // softToneStrength above 0 makes the soft fills a quiet tint of the tone
    // over the surface colour, in place of a light or deep version of it.
    const quiet = theme.contrast.softToneStrength;
    const tint = quiet > 0 ? themeHelpers.tintOf(base, colors.background.default, quiet) : undefined;
    const subtle = neutral ? colors.background.subtle
      : (tint ?? soft(isDark ? themeHelpers.darken(base, 0.5) : themeHelpers.lighten(base, 0.5)));
    const wash = tint ?? soft(isDark ? themeHelpers.darken(base, 0.65) : themeHelpers.lighten(base, 0.5));
    return {
      solid: color,
      contrast: contrastOn(color),
      subtle,
      onSubtle: neutral ? colors.text.secondary : themeHelpers.readableTint(base, subtle, isDark, 0.4),
      outlineText: themeHelpers.readableTint(base, colors.background.subtle, isDark, 0.1),
      wash,
      onWash: contrastOn(wash),
      washBorder: isDark ? themeHelpers.darken(base, 0.35) : themeHelpers.lighten(base, 0.2),
    };
  };
  // The primary as a fill that carries text (the accent: primary buttons,
  // ticked boxes, the active tab), deepened for light text as the balance
  // decides, the same way a primary badge is.
  const deepened = themeHelpers.forLightText(colors.primary, balance);
  const primaryFill = deepened.toLowerCase() === colors.primary.toLowerCase() ? colors.primary : deepened;
  const primary = states(primaryFill);
  const error = states(colors.error);

  // The primary gradient (the primaryGradient switch) runs from its start
  // colour to the primary fill, in each state. Text on it must read on both
  // ends, so it is the candidate whose weaker contrast is strongest.
  const gradientStart = theme.gradients.primaryStart;
  const start = gradientStart === "none" ? null : states(gradientStart);
  const linear = (from: string, to: string) => `linear-gradient(${theme.gradients.primaryAngle}, ${from}, ${to})`;
  const onBoth = (a: string, b: string, candidates: string[]) => {
    const weaker = (text: string) => Math.min(contrastRatio(text, a), contrastRatio(text, b));
    return [...candidates, "#000000", "#ffffff"].reduce((best, text) => (weaker(text) > weaker(best) ? text : best));
  };
  const gradient = start && {
    primaryGradient: linear(gradientStart, primaryFill),
    primaryGradientHover: linear(start.hover, primary.hover),
    primaryGradientActive: linear(start.active, primary.active),
    contrastPrimary: onBoth(primaryFill, gradientStart, [primary.contrast, start.contrast]),
    onPrimary: onBoth(primaryFill, gradientStart, [primary.on, start.on, primary.contrast, start.contrast]),
    onPrimaryHover: onBoth(primary.hover, start.hover, [primary.onHover, start.onHover]),
    onPrimaryActive: onBoth(primary.active, start.active, [primary.onActive, start.onActive]),
  };

  return {
    primaryFill,
    primaryHover: primary.hover,
    primaryActive: primary.active,
    contrastPrimary: gradient ? gradient.contrastPrimary : primary.contrast,
    // Text on the flat primary fill alone (ticked boxes, the active tab),
    // which the gradient never covers.
    contrastPrimaryFill: primary.contrast,
    onPrimary: gradient ? gradient.onPrimary : primary.on,
    onPrimaryHover: gradient ? gradient.onPrimaryHover : primary.onHover,
    onPrimaryActive: gradient ? gradient.onPrimaryActive : primary.onActive,
    primaryGradient: gradient ? gradient.primaryGradient : "none",
    primaryGradientHover: gradient ? gradient.primaryGradientHover : "none",
    primaryGradientActive: gradient ? gradient.primaryGradientActive : "none",
    errorHover: error.hover,
    errorActive: error.active,
    contrastError: error.contrast,
    onErrorHover: error.onHover,
    onErrorActive: error.onActive,
    onInk: surfaceForeground(ink, colors.background.surface),
    backgroundSubtleShade: themeHelpers.darken(colors.background.subtle, 0.05),
    backgroundSubtleHighlight: themeHelpers.lighten(colors.background.subtle, 0.3),
    backgroundDefaultTranslucent: translucent(colors.background.default),
    tone: {
      // A colour the theme added is a tone under its own key. A built-in
      // tone's name always means the built-in tone.
      ...Object.fromEntries(Object.entries(colors.added).map(([key, color]) => [key, tone(color)])),
      neutral: tone(colors.text.secondary, true),
      primary: tone(colors.primary),
      success: tone(colors.success),
      warning: tone(colors.warning),
      error: tone(colors.error),
      info: tone(colors.info),
    },
    statusText: {
      success: statusText(colors.success),
      warning: statusText(colors.warning),
      error: statusText(colors.error),
      info: statusText(colors.info),
    },
    onBackground: {
      default: on(colors.background.default),
      surface: on(colors.background.surface),
      subtle: on(colors.background.subtle),
      defaultSecondary: secondary(colors.background.default),
      surfaceSecondary: secondary(colors.background.surface),
      subtleSecondary: secondary(colors.background.subtle),
      defaultError: surfaceForeground(colors.background.default, colors.error),
      subtleError: surfaceForeground(colors.background.subtle, colors.error),
    },
  };
}

/** A raw token path (`spacing.md`, `colors.tone.primary.subtle`) as its variable name. */
const pathVar = (path: string) => themeCssVarName(path.split("."));

/**
 * Resolve every purpose token against the raw and derived variables: a
 * binding that names a token takes that token's value; anything else is a
 * literal CSS value. Computed here rather than chained with var(), so a
 * nested scope that changes a raw token re-emits the purposes bound to it.
 * A `{ light, dark }` binding gives the value for `mode`.
 */
export function purposeCssVariables(
  raw: ThemeCssVars,
  bindings: RoleBindingsOverride = {},
  mode: "light" | "dark" = "light",
): ThemeCssVars {
  const out: ThemeCssVars = {};
  const defaults = defaultPurposeBindings();
  // An unsafe value (one that could break out of its declaration) or a
  // malformed per-mode pair is ignored, leaving the default.
  const chosen = (path: string) => {
    const bind = resolveRoleBinding(bindings[path], mode);
    return bind !== undefined && isSafeBindingValue(bind) ? bind : undefined;
  };
  // A binding may name another purpose (a component token pointing at a
  // shared role), so re-pointing the role reaches the component too.
  const resolvePurpose = (path: string, seen: Set<string>): string => {
    const bind = chosen(path) ?? defaults[path];
    if (bind in defaults && !seen.has(bind)) return resolvePurpose(bind, new Set(seen).add(bind));
    return resolve(bind);
  };
  const resolve = (bind: string) => raw[pathVar(bind)] ?? bind;
  for (const path of Object.keys(defaults)) {
    out[pathVar(path)] = resolvePurpose(path, new Set([path]));
  }
  // Purposes computed in the theme itself (roles.radius.*, roles.elevation.*)
  // are re-pointed the same way.
  for (const path of Object.keys(bindings)) {
    const bind = chosen(path);
    if (bind !== undefined && /^(roles|components)\./.test(path) && raw[pathVar(path)] !== undefined) {
      out[pathVar(path)] = resolve(bind);
    }
  }
  // The list radii follow the purposes they are worked out from, so a theme
  // that re-points the surface radius or the list's inset keeps rows nested.
  // Re-pointing either one directly wins.
  const value = (path: string) => out[pathVar(path)] ?? raw[pathVar(path)];
  const listParts = [
    "roles.radius.surface", "roles.radius.item", "roles.space.listInset", "roles.border.width",
    "roles.type.listItem", "roles.type.tightLineHeight", "roles.space.listItemInsetBlock",
  ].map(value);
  if (raw[pathVar("roles.radius.list")] !== undefined && listParts.every((part) => part !== undefined)) {
    const [surface, item, inset, border, rowText, rowLineHeight, rowInsetBlock] = listParts as string[];
    if (chosen("roles.radius.list") === undefined) {
      out[pathVar("roles.radius.list")] = listPanelRadius({ surface, inset, border, rowText, rowLineHeight, rowInsetBlock });
    }
    if (chosen("roles.radius.listItem") === undefined) {
      out[pathVar("roles.radius.listItem")] = listItemRadius({ list: value("roles.radius.list")!, item, inset, border });
    }
  }
  return out;
}

/** Every theme token plus the derived colors, as `--squonk-*` custom properties. */
export function themeCssVariables(theme: SquonkTheme): ThemeCssVars {
  const out: ThemeCssVars = {};
  const tokens: Partial<SquonkTheme> = { ...theme };
  delete tokens.mode;
  delete tokens.roleBindings;
  delete tokens.switchBindings;
  flatten(tokens, [], out);
  flatten(derivedColorTokens(theme), ["colors"], out);
  return { ...out, ...purposeCssVariables(out, { ...theme.switchBindings, ...theme.roleBindings }, theme.mode) };
}

/** Only the variables whose value differs from `parent` — what a nested scope must set. */
export function changedCssVariables(next: ThemeCssVars, parent: ThemeCssVars): ThemeCssVars {
  const out: ThemeCssVars = {};
  for (const [name, value] of Object.entries(next) as [`--squonk-${string}`, string][]) {
    if (parent[name] !== value) out[name] = value;
  }
  return out;
}

/** A `:root` stylesheet of the given theme's variables (the checked-in tokens.css). */
export function renderTokensCss(theme: SquonkTheme): string {
  const declarations = Object.entries(themeCssVariables(theme))
    .map(([name, value]) => `    ${name}: ${value};`)
    .join("\n");
  return [
    "/* Generated by `npm run tokens:generate` from the default light theme. Do not edit. */",
    "@layer dt.tokens, dt.components, dt.motion;",
    "",
    "@layer dt.tokens {",
    "  :root {",
    declarations,
    "  }",
    "}",
    "",
  ].join("\n");
}
