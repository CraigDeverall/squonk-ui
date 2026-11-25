import type { ThemeVars } from "storybook/theming";
import { create } from "storybook/theming";
import { primitives, type Primitives, type ColorMode } from "../src/theme/theme";

/**
 * The SquonkUI docs brand accent (Squonk red). NOT a library token —
 * specifically the colour identity of the Storybook documentation site.
 * Kept separate from `primitives.colors.primary` so the Theme Controller
 * panel can recolour the library's `primary` without recolouring the
 * docs chrome. Promote to `primitives.brand` if that distinction stops
 * being useful.
 */
const SQUONK_BRAND = "#ef4237";

const SHARED = {
  // Panels such as the onboarding checklist read this; a full-pill value
  // turns them into stadiums. Inputs keep their pill shape below.
  appBorderRadius: 8,
  fontBase:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontCode:
    'ui-monospace, Menlo, Monaco, "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Droid Sans Mono", "Courier New", monospace',
  brandTitle: "SquonkUI",
  brandUrl: "/",
  brandTarget: "_self",
  inputBorderRadius: 9999,
} as const;

/**
 * Build a Storybook ThemeVars from our library primitives + mode.
 * Everything except the docs brand red maps onto the primitives
 * palette, so changing `primitives.colors.*` (or `darkColors.*`)
 * propagates into the Storybook chrome.
 */
export function buildManagerTheme(mode: ColorMode): ThemeVars {
  const c: Primitives["colors"] =
    mode === "dark" ? primitives.darkColors : primitives.colors;

  return create({
    ...SHARED,
    base: mode,
    // The docs chrome stays greyscale so library components shine
    // against a neutral surround. Red is reserved for hover / momentary
    // attention only — see `barHoverColor` below.
    colorPrimary: c.textPrimary,
    colorSecondary: c.textPrimary,
    brandImage:
      mode === "dark"
        ? "squonk-ui-components-dark.svg"
        : "squonk-ui-components.svg",
    appBg: c.backgroundDefault,
    appContentBg: c.backgroundSurface,
    appPreviewBg: c.backgroundSubtle,
    appBorderColor: c.borderDefault,
    textColor: c.textPrimary,
    textInverseColor: c.textInverse,
    textMutedColor: c.textMuted,
    barBg: c.backgroundDefault,
    barTextColor: c.textPrimary,
    barHoverColor: SQUONK_BRAND,
    barSelectedColor: c.textPrimary,
    buttonBg: c.backgroundSurface,
    buttonBorder: c.borderDefault,
    booleanBg: c.backgroundSurface,
    booleanSelectedBg: c.backgroundSubtle,
    inputBg: c.backgroundDefault,
    inputBorder: c.borderDefault,
    inputTextColor: c.textPrimary,
  });
}

export const lightManagerTheme = buildManagerTheme("light");
export const darkManagerTheme = buildManagerTheme("dark");

// Legacy export name retained for any consumer that imports `theme`.
export const theme = darkManagerTheme;

/**
 * Docs-specific Storybook theme. Same color primitives as the manager
 * chrome, but with tighter radii. The args-table outer wrapper,
 * BooleanControl pills and input/select widgets inside docs all read
 * `appBorderRadius` / `inputBorderRadius` from the emotion theme — and
 * the manager's full-pill input radius makes those widgets look like
 * stadiums. Squaring them off here keeps the docs surface readable
 * without changing the manager chrome.
 */
export function buildDocsTheme(mode: ColorMode): ThemeVars {
  return {
    ...buildManagerTheme(mode),
    appBorderRadius: 6,
    inputBorderRadius: 4,
  };
}
