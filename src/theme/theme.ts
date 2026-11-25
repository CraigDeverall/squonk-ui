import chroma from "chroma-js";
import Color from "color";
import { defaultPurposeBindings, isSafeBindingValue, type RoleBindingsOverride } from "./purpose";
import { springEasing } from "./motion-curves";
import { listItemRadius, listPanelRadius } from "./list-radius";
import { INDICATOR_STYLE_NAMES, switchBindingsFor, type IndicatorStyle } from "./switches";
import { isNeutralColorKey, tintNeutral } from "./neutral-tint";
import { DERIVED_CONTRAST, isDerivedBrandKey, readableOn } from "./brand-colors";
import {
  RELIEF_BLENDS,
  RELIEF_PROFILES,
  RELIEF_STRENGTHS,
  inkOffset,
  reliefLayers,
  shadowOffset,
  type ReliefBlend,
  type ReliefProfile,
  type ReliefStrength,
} from "./relief";

const cache: { [key: string]: string } = {};
const WHITE = Color("#ffffff");
const BLACK = Color("#000000");

// --- Helpers ---

/** The default `lightTextBalance`: light text on fills it reads on at AA, with fills deepened a little past it. */
export const DEFAULT_LIGHT_TEXT_BALANCE = 50;

const clampBalance = (balance: number): number =>
  Number.isFinite(balance) ? Math.min(100, Math.max(0, balance)) : DEFAULT_LIGHT_TEXT_BALANCE;

/** Straight-line steps through (0, at0), (50, at50), (100, at100). */
const alongBalance = (balance: number, at0: number, at50: number, at100: number): number => {
  const b = clampBalance(balance);
  return b <= 50 ? at0 + ((at50 - at0) * b) / 50 : at50 + ((at100 - at50) * (b - 50)) / 50;
};

/**
 * What `lightTextBalance` (0–100) decides for text on a coloured fill.
 *
 * - `lightFrom`: how well white must already read on a strong fill (its
 *   contrast ratio) for the fill to carry light text. Lower turns text light
 *   sooner, on brighter fills.
 * - `deepenTo`: the contrast a fill carrying light text is deepened to.
 *   Higher deepens it further, for crisper text on a richer fill.
 * - `preferLightAt`: on a fill the library doesn't recolour, the contrast at
 *   which light text wins over dark text that scores higher. Never below AA
 *   (4.5:1); at 0 light text wins only when it reaches the full target
 *   (7:1 for text), otherwise the higher-contrast text does.
 *
 * At the default (50): light text from 3:1, fills deepened to 4.6:1, light
 * text preferred once it passes AA.
 */
export function lightTextBalanceSettings(balance: number = DEFAULT_LIGHT_TEXT_BALANCE) {
  return {
    lightFrom: alongBalance(balance, 4.5, 3, 1.4),
    deepenTo: alongBalance(balance, 4.5, 4.6, 7),
    preferLightAt: alongBalance(balance, 21, 4.5, 4.5),
  };
}

/** The default `textOnFillStrength`: text on a fill reads at 7:1, as a light or dark tint of the fill. */
export const DEFAULT_TEXT_ON_FILL_STRENGTH = 50;

/**
 * The contrast `textOnFillStrength` (0–100) asks of text on a coloured fill:
 * 4.5:1 at 0 (the subtlest tint of the fill that still meets AA), 7:1 at the
 * default 50, and 21:1 at 100 (pure white or black).
 */
export function textOnFillContrast(strength: number = DEFAULT_TEXT_ON_FILL_STRENGTH): number {
  const s = Number.isFinite(strength) ? Math.min(100, Math.max(0, strength)) : DEFAULT_TEXT_ON_FILL_STRENGTH;
  return s <= 50 ? 4.5 + (2.5 * s) / 50 : 7 + (14 * (s - 50)) / 50;
}

export const getForegroundColorByDesiredContrastRatio = (
  baseColor: string,
  targetContrast: number,
  balance: number = DEFAULT_LIGHT_TEXT_BALANCE
): string => {
  const prefix = "getForeGroundByDesiredContrastRatio_";
  const key = `${prefix}${baseColor}_${targetContrast}_${clampBalance(balance)}`;
  if (cache[key]) return cache[key];

  let bgColor: ReturnType<typeof Color>;
  try {
    bgColor = Color(baseColor);
    if (bgColor.alpha() < 1) return "currentColor";
  } catch {
    // Browser-resolved or translucent backgrounds have no knowable contrast
    // here. Inherit the consumer's foreground; this is not an AA guarantee.
    return "currentColor";
  }
  let textColorLight = bgColor;
  let textColorDark = bgColor;
  let lightContrast = bgColor.contrast(textColorLight);
  let darkContrast = bgColor.contrast(textColorDark);

  while (
    lightContrast < targetContrast &&
    textColorLight.hex() !== textColorLight.mix(Color("white"), 0.1).hex()
  ) {
    textColorLight = textColorLight.mix(Color("white"), 0.1);
    lightContrast = bgColor.contrast(textColorLight);
  }

  while (
    darkContrast < targetContrast &&
    textColorDark.hex() !== textColorDark.mix(Color("black"), 0.1).hex()
  ) {
    textColorDark = textColorDark.mix(Color("black"), 0.1);
    darkContrast = bgColor.contrast(textColorDark);
  }

  // The 10% steps can stop just short of pure white or black; when the
  // target isn't reached, the extreme is the best that colour can do.
  if (lightContrast < targetContrast && bgColor.contrast(WHITE) > lightContrast) {
    textColorLight = WHITE;
    lightContrast = bgColor.contrast(WHITE);
  }
  if (darkContrast < targetContrast && bgColor.contrast(BLACK) > darkContrast) {
    textColorDark = BLACK;
    darkContrast = bgColor.contrast(BLACK);
  }

  // Weighted toward light text: on a dark-ish fill, white that passes AA
  // reads better than black that merely scores higher, so it wins outright.
  // A lower balance asks more of light text before it wins.
  const { preferLightAt } = lightTextBalanceSettings(balance);
  const lightPasses = lightContrast >= Math.max(Math.min(targetContrast, 4.5), Math.min(targetContrast, preferLightAt));
  cache[key] =
    lightPasses || lightContrast > darkContrast ? textColorLight.hex() : textColorDark.hex();
  return cache[key];
};


// A fill is clearly dark (light text) or clearly light (dark text), never a
// mid-tone where black text narrowly beats white. A strong fill that white
// nearly reads on (3:1 or more, at the default balance) darkens until white
// passes AA, a little past it so rounding never tips the text back to black.
const forLightText = (fill: string, balance: number = DEFAULT_LIGHT_TEXT_BALANCE): string => {
  try {
    const { lightFrom, deepenTo } = lightTextBalanceSettings(balance);
    let color = Color(fill);
    if (color.alpha() < 1 || color.contrast(WHITE) < lightFrom) return fill;
    for (let i = 0; i < 40 && color.contrast(WHITE) < deepenTo; i++) color = color.darken(0.05);
    // Darkening by a share of its lightness slows near black: finish the
    // job by mixing towards black.
    for (let i = 0; i < 20 && color.contrast(WHITE) < deepenTo; i++) color = color.mix(BLACK, 0.1);
    return color.hex();
  } catch {
    return fill;
  }
};

// A soft fill (a selected row, a tinted chip, an alert's wash) under body
// text: lighten it toward white, in light mode, until that text reads at 7:1,
// so it's clearly a light tint. A dark brand colour's tint then stays a tint,
// not a mid-tone block under black text.
const softUnder = (fill: string, text: string): string => {
  try {
    let color = Color(fill);
    const ink = Color(text);
    if (color.alpha() < 1) return fill;
    for (let i = 0; i < 20 && color.contrast(ink) < 7; i++) color = color.mix(WHITE, 0.15);
    return color.hex();
  } catch {
    return fill;
  }
};

// Concrete colors retain the existing HSL adjustment. Browser-only colors
// use a bounded white/black blend; no DOM lookup is needed during SSR.
const adjustColor = (baseColor: string, ratio: number, lighten: boolean): string => {
  try {
    return (lighten ? Color(baseColor).lighten(ratio) : Color(baseColor).darken(ratio)).toString();
  } catch {
    if (!Number.isFinite(ratio) || ratio === 0) return baseColor;
    const amount = Math.min(1, Math.abs(ratio));
    const mix = (ratio > 0) === lighten ? "white" : "black";
    return `color-mix(in srgb, ${baseColor} ${(1 - amount) * 100}%, ${mix})`;
  }
};

// Tints a fixed amount can leave bright tones (such as a bright brand colour)
// below AA, so step further from the base until the text reads.
const readableTint = (baseColor: string, background: string, lighten: boolean, start: number): string => {
  try {
    const bg = Color(background);
    for (let ratio = start; ratio <= 0.95; ratio += 0.05) {
      const tint = lighten ? Color(baseColor).lighten(ratio) : Color(baseColor).darken(ratio);
      if (tint.contrast(bg) >= 4.5) return tint.hex();
    }
    return lighten ? "#ffffff" : "#000000";
  } catch {
    return adjustColor(baseColor, start, lighten);
  }
};

export const themeHelpers = {
  /** The surface colour with `share` (0–1) of `baseColor` mixed in: a quiet tint of a tone. */
  tintOf: (baseColor: string, surface: string, share: number): string => {
    try {
      return Color(surface).mix(Color(baseColor), share).hex();
    } catch {
      // A colour only the browser can resolve (a var(), say): let CSS mix it.
      return `color-mix(in srgb, ${surface} ${Math.round((1 - share) * 100)}%, ${baseColor})`;
    }
  },
  lighten: (baseColor: string, ratio: number): string => adjustColor(baseColor, ratio, true),
  darken: (baseColor: string, ratio: number): string => adjustColor(baseColor, ratio, false),
  readableTint,
  /** Readable text on a fill: 7:1 by default, or as `strength` (textOnFillStrength) asks. */
  getMinContrastTextColor: (
    baseColor: string,
    balance: number = DEFAULT_LIGHT_TEXT_BALANCE,
    strength: number = DEFAULT_TEXT_ON_FILL_STRENGTH
  ): string => getForegroundColorByDesiredContrastRatio(baseColor, textOnFillContrast(strength), balance),
  getMinContrastGraphicColor: (baseColor: string, balance: number = DEFAULT_LIGHT_TEXT_BALANCE): string =>
    getForegroundColorByDesiredContrastRatio(baseColor, 3, balance),
  getForegroundColorByDesiredContrastRatio,
  forLightText,
  softUnder,
  createGradient: (
    gradientValues: string[],
    direction = "to bottom",
    grade = 0,
    type = "linear-gradient"
  ) => {
    const key = `createGradient_${gradientValues.join("-")}${direction}${grade}${type}`;
    if (!cache[key]) {
      cache[key] = `${type}(${direction}, ${gradientValues.reduce(
        (acc: string, value: string): string => {
          let _value = value;
          if (grade !== 0) {
            try {
              _value = grade > 0 ? chroma(value).brighten(grade).hex() : chroma(value).darken(Math.abs(grade)).hex();
            } catch {
              // Preserve browser-resolved gradient stops instead of failing SSR.
            }
          }
          return acc ? `${acc}, ${_value}` : _value;
        },
        ""
      )})`;
    }
    return cache[key];
  },
};

// --- Primitives ---
// Raw design tokens. Integer values with units in key names so they remain calculable.
// These should NOT be referenced directly in components — use theme getters instead.

export const primitives = {
  /**
   * Light-mode color set. Keys are semantic — the same shape as
   * `darkColors` so consumers and tooling can treat them symmetrically.
   */
  colors: {
    // Squonk orange (squonkstack.io). Filled controls pick their own readable ink.
    primary: "#ef4237",
    secondary: "#62574c",
    accent: "#f08a24",
    success: "#23824f",
    warning: "#c27c0e",
    error: "#b8202a",
    info: "#2f6db3",
    // Dedicated link tone, distinct from `primary`. Held separately so
    // consumers can override `primary` for brand identity without
    // painting every default-variant link in that brand colour, and so
    // links stay readable when the brand colour lacks text contrast.
    // Meets AA on every light background.
    link: "#b42d1f",
    backgroundDefault: "#fbf6ec",
    backgroundSurface: "#f0e6d6",
    backgroundSubtle: "#e7dac6",
    // Scrim behind overlays (Modal, drawers). Semi-transparent so the page
    // stays visible but recedes; alpha lives in the value, not a getter.
    backgroundOverlay: "rgba(31, 24, 20, 0.5)",
    textPrimary: "#1f1f1f",
    textSecondary: "#4f463e",
    textMuted: "#675d53",
    textInverse: "#fbf6ec",
    borderDefault: "#e0d2bc",
    borderStrong: "#bfae94",
    borderFocus: "#d0362a",
    // Where the primary gradient starts when the primaryGradient switch is
    // on; it runs from here to the primary. Unused while the switch is off.
    primaryGradientStart: "#c2410c",
    // Categorical data-series colours for charts, in a fixed order that keeps
    // neighbouring series apart for colour-vision deficiencies (validated
    // against the default surface). Series take slots in order; a ninth series
    // folds into "Other" rather than cycling. Slots 3–5 sit under 3:1 on white,
    // so charts always offer a table view and a legend.
    dataSeries1: "#2a78d6",
    dataSeries2: "#eb6834",
    dataSeries3: "#1baf7a",
    dataSeries4: "#eda100",
    dataSeries5: "#e87ba4",
    dataSeries6: "#008300",
    dataSeries7: "#6250d6",
    dataSeries8: "#e34948",
  },
  /**
   * Dark-mode color set. Used by the `darkTheme` export and by
   * `ThemeModifier` when the consumer opts into a dark subtree. Every
   * library component that reads color tokens automatically picks these
   * up via mode resolution — no per-component dark variant required.
   */
  darkColors: {
    primary: "#ff5c4a",
    secondary: "#b8aa9a",
    accent: "#ffa04d",
    success: "#4fc27f",
    warning: "#e8a93a",
    error: "#ff6b74",
    info: "#7fb2f0",
    // Mirror of `colors.link` for dark mode. Lighter than the light-mode
    // value because the WCAG AA threshold against the slate backgrounds
    // needs more luminance than the white-bg light value.
    link: "#ff8a72",
    backgroundDefault: "#221c18",
    backgroundSurface: "#171311",
    backgroundSubtle: "#2e2621",
    // Deeper scrim than light mode — dark surfaces need more contrast
    // against the dialog for the overlay to read as "behind".
    backgroundOverlay: "rgba(8, 5, 4, 0.7)",
    textPrimary: "#f7efe3",
    textSecondary: "#d6cab9",
    textMuted: "#ab9e8e",
    textInverse: "#171311",
    borderDefault: "#3b322b",
    borderStrong: "#5a4c41",
    borderFocus: "#ff7a66",
    primaryGradientStart: "#c2410c",
    // The same eight hues stepped for the dark surface (all 3:1 or more on
    // backgroundDefault), validated as a set in the same order.
    dataSeries1: "#3987e5",
    dataSeries2: "#d95926",
    dataSeries3: "#199e70",
    dataSeries4: "#c98500",
    dataSeries5: "#d55181",
    dataSeries6: "#008300",
    dataSeries7: "#9085e9",
    dataSeries8: "#e66767",
  },
  spacingPx: 8,
  fontPx: 16,
  // Inter ships with the package via `@squonk/ui/fonts.css`; the
  // fallbacks cover apps that don't import it.
  fontFamily: '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  /**
   * Heading font stack. Bound to `typography.fonts.heading` so a
   * different display face can pair with the body font without touching
   * the body type. Defaults to the same stack as `fontFamily` so
   * existing themes look unchanged until a consumer picks something
   * distinct.
   */
  fontFamilyHeading: '"Space Grotesk Variable", "Space Grotesk", "Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  fontFamilyCode: 'ui-monospace, "SF Mono", Menlo, Monaco, Consolas, "Courier New", monospace',
  borderPx: 1,
  borderRadiusPx: 12,
  // Corner radius of every control (buttons, fields, selects, pagination).
  // Its own primitive so a theme can make controls pill-shaped (9999) or
  // square (0) without changing surfaces. Bound to `roles.radius.control`.
  controlRadiusPx: 10,
  depthOpacity: 0.18,
  // Motion personality. `transitionDurationMs` is the tempo every motion
  // duration scales from; the rest give a theme its character.
  transitionDurationMs: 220,
  // How far things travel and grow as they arrive: a popover grows from
  // (1 − travel ÷ 400) of its size, content rises from 1.5 × travel below its
  // place. 0 makes every arrival a plain fade.
  motionTravelPx: 16,
  // The gap between items arriving in sequence (Motion.Stagger).
  motionStaggerMs: 45,
  // How much arrivals overshoot and settle, like a spring: 0 (none) to 1.
  motionBounce: 0.12,
  // The curves things arrive, leave and move within the page on.
  motionEaseEnter: "cubic-bezier(0.22, 1, 0.36, 1)",
  motionEaseExit: "cubic-bezier(0.55, 0, 1, 0.45)",
  motionEaseStandard: "cubic-bezier(0.65, 0, 0.35, 1)",
  breakpointMobilePx: 480,
  breakpointTabletPx: 768,
  breakpointDesktopPx: 1024,
  breakpointWidePx: 1280,
  zIndexStep: 100,
  // Size-register ratios consumed by `<ThemeStyleBlock register="compact">`
  // and `<ThemeStyleBlock register="display">`. Held here (not in the
  // component) so the theme-controller panel — which already pipes primitives
  // via `SquonkThemeProvider` — can tune them at preview-time without a
  // code change.
  compactSpacingRatio: 0.75,
  compactFontRatio: 0.875,
  compactBorderRadiusRatio: 0.75,
  displaySpacingRatio: 1.5,
  displayFontRatio: 1.25,
  displayBorderRadiusRatio: 1.5,
  // Light and surface relief. One light source, in degrees clockwise from
  // above, turns every computed drop shadow and every relief gradient and
  // edge, so the whole interface agrees about where the light comes from.
  // Relief is off by default (depth and sheen 0): surfaces stay flat.
  lightAngle: 0,
  /** 0–1: how far a surface's tone shifts across its face, lit side to far side. */
  reliefDepth: 0.2,
  /** 0–1: the strength of the highlight and shade strokes along a surface's edges. */
  reliefSheen: 0.25,
  /** The shape of the relief: `soft`, `bevel`, `glass`, `pillow` or `print`. */
  reliefProfile: "soft" as ReliefProfile,
  /** How relief combines with the colour beneath: `normal`, `soft-light` or `overlay`. */
  reliefBlend: "normal" as ReliefBlend,
  /**
   * 0–1: how far the neutral colours (page, surfaces, wells, text and borders)
   * lean towards the primary colour's hue. 0 keeps them as written; a little
   * (0.3–0.7) gives the whole interface a tinge of the brand that follows the
   * primary when it changes. Each neutral keeps its lightness, so contrast
   * holds; the tint is strongest in the mid-tones.
   */
  neutralTint: 0,
  /**
   * 0–1: how much of a tone's colour its soft fills carry (a subtle badge, an
   * alert's wash, the tinted current item). 0 keeps the built-in fills, which
   * are a light or deep version of the tone. Above 0, a soft fill is the
   * surface colour with that share of the tone mixed in (0.1–0.2 is a quiet
   * tint), so tinted blocks sit close to the surface in both modes. The text
   * on them is still computed to stay readable.
   */
  softToneStrength: 0.16,
  /**
   * 0–100: when text on a coloured fill turns light, and how far the fill
   * deepens to carry it. 50 is the default; higher turns text light on
   * brighter fills and deepens them more (richer buttons and badges, crisper
   * white text); lower keeps dark text on more fills and deepens them only to
   * AA. Every pairing still meets AA, whatever the setting.
   */
  lightTextBalance: DEFAULT_LIGHT_TEXT_BALANCE,
  /**
   * 0–100: how strongly text on a coloured fill stands apart from it. 100 is
   * pure white or black; 0 is a light or dark tint of the fill itself, just
   * strong enough to meet AA (4.5:1), for quiet, tonal buttons and badges.
   * 50, the default, reads at 7:1.
   */
  textOnFillStrength: DEFAULT_TEXT_ON_FILL_STRENGTH,
  // Theme switches: yes-or-no decisions that set several purposes at once.
  // Components read the purposes, not the switches, so a theme can still
  // re-point any one of them.
  /**
   * Derive the link, focus ring and accent from the primary instead of taking
   * them as written, so changing the primary carries the whole brand. Each is
   * moved only as far as it must go in lightness to read on the theme's
   * backgrounds (4.5:1 for links, 3:1 for the focus ring).
   */
  deriveFromPrimary: false,
  /** Button labels in capitals with a little open tracking, for a technical voice. */
  uppercaseControls: false,
  /** Links underlined at rest, not only when pointed at, for text-heavy or public-service pages. */
  underlineLinks: false,
  /** Fields filled with the well colour instead of the surface colour. Their borders stay, so they keep their contrast. */
  filledFields: false,
  /** Print with the theme's colours and backgrounds; off prints ink on plain paper. */
  printBackgrounds: false,
  /** Print each link's address after its text, so the page still works on paper. */
  printLinkUrls: true,
  /** Pill-shaped controls and tags: fully rounded ends whatever the radius primitives say. */
  pillControls: true,
  /**
   * Ruled fields: a single line under each field instead of a box, on the
   * background behind it, with a firm underline in the accent when it has focus.
   */
  underlinedFields: false,
  /** Buttons that lift (the primary, by default) rise a little under the pointer. Off keeps every button flat. */
  liftOnHover: true,
  /** Buttons shrink a little while pressed, like a key going down. */
  squeezeOnPress: true,
  /**
   * Hard, offset shadows in the text colour, like a print or a sticker, for
   * lifted buttons and fields. They fall away from `lightAngle`.
   */
  inkShadows: false,
  /** A thicker keyboard focus ring (three borders wide), for public services and dense screens. */
  strongFocus: false,
  /** Headings in the brand colour (the link tone, so they stay readable) instead of the text colour. */
  brandHeadings: false,
  /** Secondary buttons outlined in the brand colour, with no fill, instead of a quiet neutral button. */
  outlinedSecondary: false,
  /**
   * Fill the primary button with a gradient from `primaryGradientStart` to the
   * primary, over its solid colour, instead of the solid primary alone. Text
   * on it is chosen to read on both ends of the gradient.
   */
  primaryGradient: true,
  /** The direction of the primary gradient, as a CSS angle in degrees: 90 runs from the start edge to the end. */
  primaryGradientAngle: 160,
  /**
   * How navigation marks the current item and the one under the pointer:
   * `bar` (a bar along the start edge), `fill`, `underline`, `ring` (a ring
   * standing off the fill by a gap), `quiet` or `tint` (a tint of the primary
   * with text to match). Sets `roles.indicator.*`,
   * which a theme can still re-point one by one.
   */
  indicatorStyle: "tint" as IndicatorStyle,
};

export type Primitives = typeof primitives;
export type PrimitivesOverride = {
  [K in keyof Primitives]?: Primitives[K] extends object
    ? Partial<Primitives[K]>
    : Primitives[K];
};

/**
 * Merge primitives overrides over an arbitrary base. Color/darkColor
 * sub-objects are merged shallowly so a single color can be overridden
 * without losing the rest of the palette. Used by `mergePrimitives` (merging
 * over the module-level defaults) and by the `Theme*` containers
 * (merging over an inherited primitives bag — see `theme-meta-context`).
 */
export function mergeOverPrimitives(
  base: Primitives,
  overrides?: PrimitivesOverride
): Primitives {
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    colors: { ...base.colors, ...overrides.colors },
    darkColors: { ...base.darkColors, ...overrides.darkColors },
  };
}

/**
 * Merge primitives overrides over the defaults. Sugar around
 * `mergeOverPrimitives(primitives, overrides)`.
 */
export function mergePrimitives(
  overrides?: PrimitivesOverride
): Primitives {
  return mergeOverPrimitives(primitives, overrides);
}

// --- Theme ---
// All values are computed getters deriving from primitives.
// This encourages building on existing design variables and ensures consistency.

export type ColorMode = "light" | "dark";

/**
 * Override map for color-getter bindings. Keys are dotted theme paths
 * (`colors.primary`, `colors.background.subtle`, …); values are the
 * primitive color key the getter should read from. Values are typed
 * as plain `string` rather than `keyof Primitives["colors"]` so
 * consumers can rebind to custom primitives added at runtime via
 * `addedColorPrimitives` (see `buildTheme`). Anything not present in
 * the override falls back to its built-in default binding (see
 * `themeBindings`).
 *
 * Mode-aware: the same override applies in both light and dark — the
 * mode picks which of `colors` / `darkColors` to look the rebound key
 * up in. Re-pointing `colors.primary` at `accent` means
 * `theme.colors.primary === colors.accent` in light mode AND
 * `theme.colors.primary === darkColors.accent` in dark mode.
 */
export type ColorBindingsOverride = Partial<Record<string, string>>;

/**
 * Map of custom primitive color keys added at runtime, e.g. a brand
 * `tertiary` color. Each entry pairs a light value with a dark value
 * so the new key behaves like every built-in primitive (mode-aware).
 * Consumed by `buildTheme` and merged into the primitives bag; a
 * `ColorBindingsOverride` entry can then rebind a getter to one of
 * these custom keys.
 */
export type AddedColorPrimitives = Record<string, { light: string; dark: string }>;

/**
 * Build a theme object bound to a given primitives bag and color mode.
 * The default `theme` (light) and `darkTheme` exports below are produced
 * by this function; Storybook (and any other dev tooling) calls
 * `buildTheme(overrides, mode, colorBindings, addedColorPrimitives)` to
 * preview alternative primitives, alternative getter→primitive bindings,
 * and/or runtime-added custom color primitives.
 */
export function buildTheme(
  overrides?: PrimitivesOverride,
  mode: ColorMode = "light",
  colorBindings: ColorBindingsOverride = {},
  addedColorPrimitives: AddedColorPrimitives = {},
  roleBindings: RoleBindingsOverride = {}
) {
  return buildThemeFromPrimitives(
    mergePrimitives(overrides),
    mode,
    colorBindings,
    addedColorPrimitives,
    roleBindings
  );
}

/**
 * Lower-level theme constructor that takes a fully-merged `Primitives` bag
 * directly, rather than merging an override onto the module defaults.
 *
 * Used by `ThemeStyleBlock`, which needs to derive a new theme from the
 * inherited primitives bag — not from the static module defaults. Everyday
 * consumers should call `buildTheme`.
 */
const scaledLengths = <T extends Record<string | number, number>>(ratios: T, base: number): { [K in keyof T]: string } =>
  Object.defineProperties({}, Object.fromEntries(
    Object.entries(ratios).map(([key, ratio]) => [key, { enumerable: true, get: () => `${base * ratio}px` }])
  )) as { [K in keyof T]: string };

export function buildThemeFromPrimitives(
  merged: Primitives,
  mode: ColorMode = "light",
  colorBindings: ColorBindingsOverride = {},
  addedColorPrimitives: AddedColorPrimitives = {},
  roleBindings: RoleBindingsOverride = {}
) {
  // Fold any custom primitives into the colors/darkColors palettes so
  // they're addressable by the same lookup as built-in keys.
  const lightColors: Record<string, string> = { ...merged.colors };
  const darkColors: Record<string, string> = { ...merged.darkColors };
  for (const [key, pair] of Object.entries(addedColorPrimitives)) {
    lightColors[key] = pair.light;
    darkColors[key] = pair.dark;
  }
  const p = { ...merged, colors: lightColors, darkColors };
  // Resolve a color getter to its primitive value. Honour any override
  // in `colorBindings`; otherwise read the built-in default key from
  // the current mode's palette. The lookup is cast through
  // `Record<string, string>` so custom (added) keys resolve too.
  const r = (path: string, fallback: keyof Primitives["colors"]): string => {
    const key = colorBindings[path] ?? fallback;
    const palette = mode === "dark" ? p.darkColors : p.colors;
    const value = (palette as Record<string, string>)[key] ?? (palette as Record<string, string>)[fallback];
    const primary = (palette as Record<string, string>)[colorBindings["colors.primary"] ?? "primary"] ?? palette.primary;
    // With deriveFromPrimary, the link, focus ring and accent come from the
    // primary (unless a binding re-points them), moved only as far as their
    // contrast on the theme's backgrounds needs.
    if (p.deriveFromPrimary && isDerivedBrandKey(fallback) && colorBindings[path] === undefined) {
      const backgrounds = [r("colors.background.default", "backgroundDefault"), r("colors.background.surface", "backgroundSurface")];
      return readableOn(primary, backgrounds, DERIVED_CONTRAST[fallback]);
    }
    // The neutrals lean towards the primary's hue by `neutralTint`.
    return isNeutralColorKey(fallback) && p.neutralTint > 0 ? tintNeutral(value, primary, p.neutralTint) : value;
  };
  // One profile's relief at each strength, as `fill` and `edge` getters.
  const reliefStrengths = (profile: () => ReliefProfile) => {
    const layers = (strength: ReliefStrength) =>
      reliefLayers(profile(), strength, {
        depth: p.reliefDepth,
        sheen: p.reliefSheen,
        angle: p.lightAngle,
        blend: p.reliefBlend,
        dark: mode === "dark",
      });
    const pair = (strength: ReliefStrength) => ({
      get fill() { return layers(strength).fill; },
      get edge() { return layers(strength).edge; },
    });
    return {
      raised: pair("raised"),
      raisedSubtle: pair("raisedSubtle"),
      recessed: pair("recessed"),
    };
  };

  return {
    colors: {
      get primary()   { return r("colors.primary", "primary"); },
      get secondary() { return r("colors.secondary", "secondary"); },
      get accent()    { return r("colors.accent", "accent"); },
      get success()   { return r("colors.success", "success"); },
      get warning()   { return r("colors.warning", "warning"); },
      get error()     { return r("colors.error", "error"); },
      get info()      { return r("colors.info", "info"); },
      get link()      { return r("colors.link", "link"); },
      background: {
        get default() { return r("colors.background.default", "backgroundDefault"); },
        get surface() { return r("colors.background.surface", "backgroundSurface"); },
        get subtle()  { return r("colors.background.subtle", "backgroundSubtle"); },
        get overlay() { return r("colors.background.overlay", "backgroundOverlay"); },
      },
      text: {
        get primary()   { return r("colors.text.primary", "textPrimary"); },
        get secondary() { return r("colors.text.secondary", "textSecondary"); },
        get muted()     { return r("colors.text.muted", "textMuted"); },
        get inverse()   { return r("colors.text.inverse", "textInverse"); },
      },
      border: {
        get default() { return r("colors.border.default", "borderDefault"); },
        get strong()  { return r("colors.border.strong", "borderStrong"); },
        get focus()   { return r("colors.border.focus", "borderFocus"); },
      },
      data: {
        get series1() { return r("colors.data.series1", "dataSeries1"); },
        get series2() { return r("colors.data.series2", "dataSeries2"); },
        get series3() { return r("colors.data.series3", "dataSeries3"); },
        get series4() { return r("colors.data.series4", "dataSeries4"); },
        get series5() { return r("colors.data.series5", "dataSeries5"); },
        get series6() { return r("colors.data.series6", "dataSeries6"); },
        get series7() { return r("colors.data.series7", "dataSeries7"); },
        get series8() { return r("colors.data.series8", "dataSeries8"); },
      },
      // The colours the theme added (`addedColorPrimitives`), in this mode.
      // Each is also a tone: see `derivedColorTokens`.
      added: Object.fromEntries(
        Object.entries(addedColorPrimitives).map(([key, pair]) => [key, mode === "dark" ? pair.dark : pair.light]),
      ) as Record<string, string>,
    },

    presentation: {
      cardPadding: scaledLengths({ compact: 2, default: 4, large: 5, hero: 6 }, p.spacingPx),
      headerPaddingBlock: scaledLengths({ compact: 1, default: 2, large: 2.5, hero: 3 }, p.spacingPx),
      // One height per register for single-line controls (Button, TextField,
      // Select…) so they line up in a row; icons inside them use iconSize.
      controlHeight: scaledLengths({ compact: 3.5, default: 5, large: 6, hero: 7 }, p.spacingPx),
      iconSize: scaledLengths({ compact: 0.875, default: 1, large: 1.125, hero: 1.25 }, p.fontPx),
      sectionPadding: {
        get compact() { return `${p.spacingPx * 4}px 0`; },
        get default() { return `${p.spacingPx * 10}px 0`; },
        get large() { return `clamp(${p.spacingPx * 9}px, 10vw, ${p.spacingPx * 15}px) 0`; },
        get hero() { return `clamp(${p.spacingPx * 10}px, 12vw, ${p.spacingPx * 17.5}px) 0`; },
      },
      headingSizes: {
        compact: scaledLengths({ 1: 1.5, 2: 1.25, 3: 1.125, 4: 1, 5: 0.9375, 6: 0.875 }, p.fontPx),
        default: scaledLengths({ 1: 2.5, 2: 2, 3: 1.75, 4: 1.5, 5: 1.25, 6: 1 }, p.fontPx),
        large: {
          get 2() { return `${p.fontPx * 2.5}px`; },
          get 3() { return `${p.fontPx * 2}px`; },
          get 4() { return `${p.fontPx * 1.75}px`; },
          get 5() { return `${p.fontPx * 1.5}px`; },
          get 6() { return `${p.fontPx * 1.25}px`; },
          get 1() { return `clamp(${p.fontPx * 2.125}px, 5vw, ${p.fontPx * 3.5}px)`; },
        },
        hero: {
          get 1() { return `clamp(${p.fontPx * 2.75}px, 7vw, ${p.fontPx * 4.5}px)`; },
          get 2() { return `clamp(${p.fontPx * 2.125}px, 5vw, ${p.fontPx * 3.5}px)`; },
          get 3() { return `clamp(${p.fontPx * 1.75}px, 4vw, ${p.fontPx * 2.5}px)`; },
          get 4() { return `${p.fontPx * 2}px`; },
          get 5() { return `${p.fontPx * 1.75}px`; },
          get 6() { return `${p.fontPx * 1.5}px`; },
        },
      },
    },

    typography: {
      fonts: {
        get base() { return p.fontFamily; },
        get heading() { return p.fontFamilyHeading; },
        get code() { return p.fontFamilyCode; },
      },
      sizes: {
        get xs() { return `${p.fontPx * 0.75}px`; },
        get sm() { return `${p.fontPx * 0.875}px`; },
        get base() { return `${p.fontPx}px`; },
        get lg() { return `${p.fontPx * 1.25}px`; },
        get xl() { return `${p.fontPx * 1.5}px`; },
        get xxl() { return `${p.fontPx * 2}px`; },

        get h1() { return `${p.fontPx * 2.5}px`; },
        get h2() { return `${p.fontPx * 2}px`; },
        get h3() { return `${p.fontPx * 1.75}px`; },
        get h4() { return `${p.fontPx * 1.5}px`; },
        get h5() { return `${p.fontPx * 1.25}px`; },
        get h6() { return `${p.fontPx}px`; },
      },
      weights: {
        get light() { return 300; },
        get regular() { return 400; },
        get bold() { return 700; },
      },
      lineHeights: {
        get tight() { return 1.25; },
        get base() { return 1.5; },
        get loose() { return 1.75; },
      },
    },

    spacing: {
      get none() { return "0px"; },
      get xxs() { return `${p.spacingPx * 0.25}px`; },
      get xs() { return `${p.spacingPx * 0.5}px`; },
      get sm() { return `${p.spacingPx}px`; },
      get md() { return `${p.spacingPx * 2}px`; },
      get lg() { return `${p.spacingPx * 3}px`; },
      get xl() { return `${p.spacingPx * 4}px`; },
      get xxl() { return `${p.spacingPx * 6}px`; },

      get gutter() { return `${p.spacingPx}px`; },
      get containerPadding() { return `${p.spacingPx * 2}px`; },
      get cardPadding() { return `${p.spacingPx * 2}px`; },
    },

    borders: {
      get width() { return `${p.borderPx}px`; },
      // Focus affordance ring: the outline width + offset every interactive
      // component uses for :focus-visible. Deriving both from borderPx keeps
      // the ring proportionate to a chunkier/finer border scale.
      get focusWidth() { return `${p.borderPx * 2}px`; },
      get focusOffset() { return `${p.borderPx * 2}px`; },
      // A focus ring a step heavier than focusWidth (the strongFocus switch).
      get focusWidthStrong() { return `${p.borderPx * 2 + 1}px`; },
      // A border on the bottom edge only, as a border-width list (the
      // underlinedFields switch), and the focus bar along it, as an inset.
      get underline() { return `0 0 ${p.borderPx}px`; },
      get focusUnderline() { return `-${p.borderPx * 2}px`; },
      radius: {
        get none() { return "0px"; },
        get sm() { return `${p.borderRadiusPx / 2}px`; },
        get base() { return `${p.borderRadiusPx}px`; },
        get md() { return `${p.borderRadiusPx * 3.5}px`; },
        get lg() { return `${p.borderRadiusPx * 2}px`; },
        get xl() { return `${p.borderRadiusPx * 5.5}px`; },
        get full() { return "9999px"; },
      },
    },

    shadows: {
      // Every computed shadow falls away from the light (lightAngle); at
      // the default 0° that is straight down.
      get sm() {
        const g = p.spacingPx;
        const d = p.depthOpacity;
        return `${shadowOffset(p.lightAngle, g / 2)} ${g}px rgba(0, 0, 0, ${d})`;
      },
      get md() {
        const g = p.spacingPx;
        const d = p.depthOpacity;
        return `${shadowOffset(p.lightAngle, g)} ${g * 2}px rgba(0, 0, 0, ${d + 0.1})`;
      },
      get lg() {
        const g = p.spacingPx;
        const d = p.depthOpacity;
        return `${shadowOffset(p.lightAngle, g * 1.5)} ${g * 3}px rgba(0, 0, 0, ${d + 0.2})`;
      },
      // soft/pop derive from the same primitives as sm/md/lg (they were the
      // last literal shadows). Opacity factors are rounded to 2dp so the
      // emitted string is stable against float artifacts (0.2 × 0.4 in JS is
      // 0.08000000000000002 — a snapshot-breaking difference).
      get soft() {
        const g = p.spacingPx;
        const d = Math.round(p.depthOpacity * 0.4 * 100) / 100;
        return `${shadowOffset(p.lightAngle, g)} ${g * 3.75}px rgba(0, 0, 0, ${d})`;
      },
      get pop() {
        const g = p.spacingPx;
        const d = Math.round(p.depthOpacity * 1.1 * 100) / 100;
        return `${shadowOffset(p.lightAngle, g * 1.75)} ${g * 5}px rgba(0, 0, 0, ${d})`;
      },
      // Hard offset shadows in the text colour (the inkShadows switch): one
      // at rest, a longer one for something lifted.
      get inkRest() { return `${inkOffset(p.lightAngle, p.spacingPx * 0.375)} 0 var(--squonk-colors-text-primary)`; },
      get inkLift() { return `${inkOffset(p.lightAngle, p.spacingPx * 0.625)} 0 var(--squonk-colors-text-primary)`; },
    },

    // Text on coloured fills (see lightTextBalanceSettings).
    contrast: {
      get lightTextBalance() { return Math.min(100, Math.max(0, p.lightTextBalance)); },
      get textOnFillStrength() { return Math.min(100, Math.max(0, p.textOnFillStrength)); },
      get softToneStrength() { return Math.min(1, Math.max(0, p.softToneStrength)); },
    },

    // The primary gradient (the primaryGradient switch). `primaryStart` is
    // `none` while the switch is off; the gradients themselves are derived
    // with the other fill colours (see derivedColorTokens).
    gradients: {
      get primaryStart() {
        return p.primaryGradient ? r("colors.primaryGradientStart", "primaryGradientStart") : "none";
      },
      get primaryAngle() { return `${((p.primaryGradientAngle % 360) + 360) % 360}deg`; },
    },

    // Surface relief (see ./relief.ts). `raised`, `raisedSubtle` and
    // `recessed` use the theme's own profile; the per-profile groups let a
    // theme give one purpose a different profile through roleBindings.
    relief: {
      get blend() { return p.reliefBlend; },
      ...reliefStrengths(() => p.reliefProfile),
      ...Object.fromEntries(
        RELIEF_PROFILES.map((profile) => [profile, reliefStrengths(() => profile)]),
      ) as Record<ReliefProfile, ReturnType<typeof reliefStrengths>>,
    },

    // What the theme switches (uppercaseControls, underlineLinks,
    // filledFields, printBackgrounds, printLinkUrls) decide, as values the
    // purposes bind to.
    switches: {
      get buttonCase() { return p.uppercaseControls ? "uppercase" : "none"; },
      get buttonTracking() { return p.uppercaseControls ? "0.06em" : "normal"; },
      get linkDecoration() { return p.underlineLinks ? "underline" : "none"; },
      get fieldBackground() {
        return p.filledFields ? r("colors.background.subtle", "backgroundSubtle") : r("colors.background.default", "backgroundDefault");
      },
      print: {
        // On plain paper by default: white page, near-black ink, grey rules.
        get paper() { return p.printBackgrounds ? r("colors.background.surface", "backgroundSurface") : "#ffffff"; },
        get surface() { return p.printBackgrounds ? r("colors.background.default", "backgroundDefault") : "#ffffff"; },
        get well() { return p.printBackgrounds ? r("colors.background.subtle", "backgroundSubtle") : "#ffffff"; },
        get ink() { return p.printBackgrounds ? r("colors.text.primary", "textPrimary") : "#111111"; },
        get inkSupporting() { return p.printBackgrounds ? r("colors.text.secondary", "textSecondary") : "#444444"; },
        get line() { return p.printBackgrounds ? r("colors.border.default", "borderDefault") : "#999999"; },
        get colorAdjust() { return p.printBackgrounds ? "exact" : "economy"; },
        get linkUrls() { return p.printLinkUrls ? "inline" : "none"; },
      },
    },

    // Purpose-based roles. Components read these, never the raw scales
    // above, so one theme decision ("controls are pills") reaches every
    // component in that role at once.
    roles: {
      radius: {
        /** Buttons, fields, selects, pagination, enclosed tabs. */
        get control() { return `${p.controlRadiusPx}px`; },
        /** Panels that float or sit on the page: popovers, cards, alerts. */
        get surface() { return `${p.borderRadiusPx * 2}px`; },
        /** Modal dialogs and drawers. */
        get overlay() { return `${p.borderRadiusPx * 2}px`; },
        /** Small buttons and rows inside a surface: close buttons, tabs, feed items. */
        get item() { return `${p.borderRadiusPx / 2}px`; },
        /** Compact labels: tags. */
        get chip() { return `${p.borderRadiusPx / 2}px`; },
        /**
         * Panels of rows: menus and listboxes. The surface radius, limited so
         * the first and last rows can still follow the panel's curve.
         */
        get list() {
          return listPanelRadius({
            surface: `${p.borderRadiusPx * 2}px`,
            inset: `${p.spacingPx * 0.5}px`,
            border: `${p.borderPx}px`,
            rowText: `${p.fontPx * 0.875}px`,
            rowLineHeight: "1.25",
            rowInsetBlock: `${p.spacingPx}px`,
          });
        },
        /** Rows in a panel of rows: menu items and options, concentric with the panel's corners. */
        get listItem() {
          return listItemRadius({
            list: this.list,
            item: `${p.borderRadiusPx / 2}px`,
            inset: `${p.spacingPx * 0.5}px`,
            border: `${p.borderPx}px`,
          });
        },
      },
      elevation: {
        /** Content raised a little off the page: tooltips. */
        get raised() {
          const g = p.spacingPx;
          return `${shadowOffset(p.lightAngle, g / 2)} ${g}px rgba(0, 0, 0, ${p.depthOpacity})`;
        },
        /** Panels floating over the page: menus, listboxes, popovers. */
        get floating() {
          const g = p.spacingPx;
          return `${shadowOffset(p.lightAngle, g)} ${g * 2}px rgba(0, 0, 0, ${p.depthOpacity + 0.1})`;
        },
        /** Modal dialogs and drawers above a backdrop. */
        get overlay() {
          const g = p.spacingPx;
          return `${shadowOffset(p.lightAngle, g * 1.5)} ${g * 3}px rgba(0, 0, 0, ${p.depthOpacity + 0.2})`;
        },
      },
    },

    breakpoints: {
      get mobile() { return `${p.breakpointMobilePx}px`; },
      get tablet() { return `${p.breakpointTabletPx}px`; },
      get desktop() { return `${p.breakpointDesktopPx}px`; },
      get wide() { return `${p.breakpointWidePx}px`; },
    },

    transitions: {
      // No transition: the change is there the moment it happens.
      get instant() { return "0ms linear"; },
      // A short settle: three quarters of the base duration, easing out so
      // the change shows at once and then softens.
      get quick() { return `${p.transitionDurationMs * 0.75}ms ease-out`; },
      get fast() { return `${p.transitionDurationMs}ms ease-in-out`; },
      get normal() { return `${p.transitionDurationMs * 1.5}ms ease-in-out`; },
      get slow() { return `${p.transitionDurationMs * 2.5}ms ease-in-out`; },
    },

    // Animation timing kept separate from easing, for keyframe animations
    // (open/close of overlays, menus, toasts). Durations share the
    // transition-duration primitive; easings, distances and the stagger
    // come from the theme's motion primitives.
    motion: {
      durations: {
        get fast() { return `${p.transitionDurationMs}ms`; },
        get normal() { return `${p.transitionDurationMs * 1.5}ms`; },
        get slow() { return `${p.transitionDurationMs * 2.5}ms`; },
      },
      easings: {
        // A value that isn't an easing falls back to the default curve, so
        // a typo can't break every animation (or the stylesheet).
        get standard() { return easingOr(p.motionEaseStandard, primitives.motionEaseStandard); },
        get enter() { return easingOr(p.motionEaseEnter, primitives.motionEaseEnter); },
        get exit() { return easingOr(p.motionEaseExit, primitives.motionEaseExit); },
        // The arrival curve with the theme's bounce; the plain arrival
        // curve when the theme doesn't bounce.
        get spring() { return springEasing(p.motionBounce) ?? easingOr(p.motionEaseEnter, primitives.motionEaseEnter); },
      },
      distances: {
        get sm() { return `${p.motionTravelPx * 0.5}px`; },
        get md() { return `${p.motionTravelPx}px`; },
        get lg() { return `${p.motionTravelPx * 1.5}px`; },
      },
      scales: {
        // What an overlay grows from: 0.96 at the default 16px travel.
        get pop() { return String(Math.max(0.5, Math.round((1 - p.motionTravelPx / 400) * 1000) / 1000)); },
      },
      get stagger() { return `${p.motionStaggerMs}ms`; },
    },

    states: {
      get disabledOpacity() { return 0.5; },
    },

    zIndices: {
      get base() { return 0; },
      get dropdown() { return p.zIndexStep * 10; },
      get sticky() { return p.zIndexStep * 11; },
      get fixed() { return p.zIndexStep * 12; },
      get modal() { return p.zIndexStep * 13; },
      get popover() { return p.zIndexStep * 14; },
      get tooltip() { return p.zIndexStep * 15; },
    },

    mode,

    /**
     * Purpose tokens re-pointed by this theme; see `purpose.ts`. A value is a
     * string or a `{ light, dark }` pair; `mode` picks from a pair when the
     * variables are written.
     */
    roleBindings,

    /** Purpose tokens re-pointed by the theme's switches; see `switches.ts`. `roleBindings` win over these. */
    switchBindings: switchBindingsFor(p),
  };
}

/**
 * Provenance map for every leaf in the theme tree. Keys are the dotted
 * getter path (e.g. `spacing.md`, `colors.background.subtle`); values
 * describe which primitive(s) the getter derives from.
 *
 * Color bindings are stored under the `colors.*` primitive name and
 * swapped to `darkColors.*` by `resolveBinding` when the active mode is
 * dark.
 *
 * Used by the Storybook theme panel to show getter → primitive lookup
 * alongside the resolved value. Keep in sync with `buildTheme` — a
 * regression test in theme.test.ts enforces that every leaf has an entry.
 */
export const themeBindings: Record<string, string> = {
  "colors.primary":            "colors.primary",
  "colors.secondary":          "colors.secondary",
  "colors.accent":             "colors.accent",
  "colors.success":            "colors.success",
  "colors.warning":            "colors.warning",
  "colors.error":              "colors.error",
  "colors.info":               "colors.info",
  "colors.link":               "colors.link",
  "colors.background.default": "colors.backgroundDefault",
  "colors.background.surface": "colors.backgroundSurface",
  "colors.background.subtle":  "colors.backgroundSubtle",
  "colors.background.overlay": "colors.backgroundOverlay",
  "colors.text.primary":       "colors.textPrimary",
  "colors.text.secondary":     "colors.textSecondary",
  "colors.text.muted":         "colors.textMuted",
  "colors.text.inverse":       "colors.textInverse",
  "colors.border.default":     "colors.borderDefault",
  "colors.border.strong":      "colors.borderStrong",
  "colors.border.focus":       "colors.borderFocus",
  "colors.data.series1":      "colors.dataSeries1",
  "colors.data.series2":      "colors.dataSeries2",
  "colors.data.series3":      "colors.dataSeries3",
  "colors.data.series4":      "colors.dataSeries4",
  "colors.data.series5":      "colors.dataSeries5",
  "colors.data.series6":      "colors.dataSeries6",
  "colors.data.series7":      "colors.dataSeries7",
  "colors.data.series8":      "colors.dataSeries8",

  "typography.fonts.base":      "fontFamily",
  "typography.fonts.heading":   "fontFamilyHeading",
  "typography.fonts.code":      "fontFamilyCode",
  "typography.sizes.xs":        "fontPx × 0.75",
  "typography.sizes.sm":        "fontPx × 0.875",
  "typography.sizes.base":      "fontPx",
  "typography.sizes.lg":        "fontPx × 1.25",
  "typography.sizes.xl":        "fontPx × 1.5",
  "typography.sizes.xxl":       "fontPx × 2",
  "typography.sizes.h1":        "fontPx × 2.5",
  "typography.sizes.h2":        "fontPx × 2",
  "typography.sizes.h3":        "fontPx × 1.75",
  "typography.sizes.h4":        "fontPx × 1.5",
  "typography.sizes.h5":        "fontPx × 1.25",
  "typography.sizes.h6":        "fontPx",
  "typography.weights.light":   "literal 300",
  "typography.weights.regular": "literal 400",
  "typography.weights.bold":    "literal 700",
  "typography.lineHeights.tight": "literal 1.25",
  "typography.lineHeights.base":  "literal 1.5",
  "typography.lineHeights.loose": "literal 1.75",

  "spacing.none":             "literal 0px",
  "spacing.xxs":              "spacingPx × 0.25",
  "spacing.xs":               "spacingPx × 0.5",
  "spacing.sm":               "spacingPx",
  "spacing.md":               "spacingPx × 2",
  "spacing.lg":               "spacingPx × 3",
  "spacing.xl":               "spacingPx × 4",
  "spacing.xxl":              "spacingPx × 6",
  "spacing.gutter":           "spacingPx",
  "spacing.containerPadding": "spacingPx × 2",
  "spacing.cardPadding":      "spacingPx × 2",

  "borders.width":         "borderPx",
  "borders.focusWidth":    "borderPx × 2",
  "borders.focusOffset":   "borderPx × 2",
  "borders.focusWidthStrong": "borderPx × 2 + 1",
  "borders.underline":     "0 0 borderPx",
  "borders.focusUnderline": "−borderPx × 2",
  "borders.radius.none":   "literal 0px",
  "borders.radius.sm":     "borderRadiusPx ÷ 2",
  "borders.radius.base":   "borderRadiusPx",
  "borders.radius.md":     "borderRadiusPx × 3.5",
  "borders.radius.lg":     "borderRadiusPx × 2",
  "borders.radius.xl":     "borderRadiusPx × 5.5",
  "borders.radius.full":   "literal 9999px",

  "roles.radius.control":  "controlRadiusPx",
  "roles.radius.surface":  "borderRadiusPx × 2",
  "roles.radius.overlay":  "borderRadiusPx × 2",
  "roles.radius.item":     "borderRadiusPx ÷ 2",
  "roles.radius.chip":     "borderRadiusPx ÷ 2",
  "roles.radius.list":     "roles.radius.surface, at most half a row + roles.space.listInset + roles.border.width",
  "roles.radius.listItem": "roles.radius.list − roles.space.listInset − roles.border.width, at least roles.radius.item",
  "roles.elevation.raised":   "f(spacingPx, depthOpacity, lightAngle), as shadows.sm",
  "roles.elevation.floating": "f(spacingPx, depthOpacity + 0.1, lightAngle), as shadows.md",
  "roles.elevation.overlay":  "f(spacingPx, depthOpacity + 0.2, lightAngle), as shadows.lg",
  "shadows.sm":   "f(spacingPx, depthOpacity, lightAngle)",
  "shadows.md":   "f(spacingPx, depthOpacity + 0.1, lightAngle)",
  "shadows.lg":   "f(spacingPx, depthOpacity + 0.2, lightAngle)",
  "shadows.soft": "f(spacingPx, depthOpacity × 0.4, lightAngle)",
  "shadows.pop":  "f(spacingPx, depthOpacity × 1.1, lightAngle)",
  "shadows.inkRest": "f(spacingPx × 0.375, lightAngle), in colors.text.primary",
  "shadows.inkLift": "f(spacingPx × 0.625, lightAngle), in colors.text.primary",
  "contrast.lightTextBalance": "lightTextBalance",
  "contrast.textOnFillStrength": "textOnFillStrength",
  "contrast.softToneStrength": "softToneStrength",
  "relief.blend": "reliefBlend",
  "gradients.primaryStart": "primaryGradient ? colors.primaryGradientStart : none",
  "gradients.primaryAngle": "primaryGradientAngle",
  "switches.buttonCase":     "uppercaseControls ? uppercase : none",
  "switches.buttonTracking":  "uppercaseControls ? 0.06em : normal",
  "switches.linkDecoration":  "underlineLinks ? underline : none",
  "switches.fieldBackground": "filledFields ? colors.background.subtle : colors.background.default",
  "switches.print.paper":         "printBackgrounds ? colors.background.surface : #ffffff",
  "switches.print.surface":       "printBackgrounds ? colors.background.default : #ffffff",
  "switches.print.well":          "printBackgrounds ? colors.background.subtle : #ffffff",
  "switches.print.ink":           "printBackgrounds ? colors.text.primary : #111111",
  "switches.print.inkSupporting": "printBackgrounds ? colors.text.secondary : #444444",
  "switches.print.line":          "printBackgrounds ? colors.border.default : #999999",
  "switches.print.colorAdjust":   "printBackgrounds ? exact : economy",
  "switches.print.linkUrls":      "printLinkUrls ? inline : none",

  "breakpoints.mobile":  "breakpointMobilePx",
  "breakpoints.tablet":  "breakpointTabletPx",
  "breakpoints.desktop": "breakpointDesktopPx",
  "breakpoints.wide":    "breakpointWidePx",

  "transitions.instant": "0ms",
  "transitions.quick":  "transitionDurationMs × 0.75, ease-out",
  "transitions.fast":   "transitionDurationMs",
  "transitions.normal": "transitionDurationMs × 1.5",
  "transitions.slow":   "transitionDurationMs × 2.5",

  "motion.durations.fast":   "transitionDurationMs",
  "motion.durations.normal": "transitionDurationMs × 1.5",
  "motion.durations.slow":   "transitionDurationMs × 2.5",
  "motion.easings.standard": "motionEaseStandard",
  "motion.easings.enter":    "motionEaseEnter",
  "motion.easings.exit":     "motionEaseExit",
  "motion.easings.spring":   "f(motionBounce), else motionEaseEnter",
  "motion.distances.sm":     "motionTravelPx × 0.5",
  "motion.distances.md":     "motionTravelPx",
  "motion.distances.lg":     "motionTravelPx × 1.5",
  "motion.scales.pop":       "1 − motionTravelPx ÷ 400",
  "motion.stagger":          "motionStaggerMs",

  "states.disabledOpacity": "literal 0.5",

  "zIndices.base":     "literal 0",
  "zIndices.dropdown": "zIndexStep × 10",
  "zIndices.sticky":   "zIndexStep × 11",
  "zIndices.fixed":    "zIndexStep × 12",
  "zIndices.modal":    "zIndexStep × 13",
  "zIndices.popover":  "zIndexStep × 14",
  "zIndices.tooltip":  "zIndexStep × 15",
};

// Relief leaves: the theme's profile, then one group per profile.
for (const strength of Object.keys(RELIEF_STRENGTHS)) {
  for (const layer of ["fill", "edge"]) {
    const inputs = `reliefDepth × ${RELIEF_STRENGTHS[strength as ReliefStrength]}, reliefSheen, lightAngle`;
    themeBindings[`relief.${strength}.${layer}`] = `f(reliefProfile, ${inputs})`;
    for (const profile of RELIEF_PROFILES) themeBindings[`relief.${profile}.${strength}.${layer}`] = `f(${profile}, ${inputs})`;
  }
}

// Presentation leaves follow the same provenance/CSS-variable contract.
for (const [group, values] of Object.entries(buildTheme().presentation)) {
  if (group === "headingSizes") {
    for (const [register, levels] of Object.entries(values)) {
      for (const level of Object.keys(levels))
        themeBindings[`presentation.headingSizes.${register}.${level}`] = "f(fontPx, viewport width)";
    }
  } else {
    for (const register of Object.keys(values))
      themeBindings[`presentation.${group}.${register}`] = "f(spacingPx, viewport width)";
  }
}

/**
 * Resolve the primitive-source description for a theme getter path,
 * accounting for color bindings that swap primitives by mode.
 */
export function resolveBinding(path: string, mode: ColorMode): string {
  const raw = themeBindings[path];
  if (!raw) return "—";
  if (mode === "dark" && raw.startsWith("colors.")) {
    return raw.replace(/^colors\./, "darkColors.");
  }
  return raw;
}

/**
 * Serializable bundle of every kind of theme override the panel can
 * produce. Used by the Storybook addon to export / import a tweaked
 * theme as JSON.
 *
 * Versioned so future shape changes can be migrated rather than
 * silently misinterpreted — if you change the shape, bump the version
 * and update `parseThemeDocument` to handle the old form.
 */
export interface ThemeDocument {
  version: 1;
  /** Direct overrides to primitive values (e.g. `colors.primary: "#ff00ff"`). */
  primitives?: PrimitivesOverride;
  /** Redirects from a getter path to a different primitive key. */
  bindings?: ColorBindingsOverride;
  /** New primitive keys added at runtime (each with light + dark values). */
  addedPrimitives?: AddedColorPrimitives;
  /**
   * Purpose tokens re-pointed at a raw token path or a literal CSS value:
   * one string for both colour modes, or `{ light, dark }` for one each.
   */
  roleBindings?: RoleBindingsOverride;
}

/**
 * Whether a value is a CSS easing the theme accepts for its motion curves:
 * `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `cubic-bezier()`
 * with four numbers, or `linear()` with numeric stops.
 */
export function isEasing(value: string): boolean {
  const v = value.trim();
  if (/^(linear|ease|ease-in|ease-out|ease-in-out)$/.test(v)) return true;
  const n = String.raw`-?\d*\.?\d+`;
  if (new RegExp(`^cubic-bezier\\(\\s*${n}\\s*,\\s*${n}\\s*,\\s*${n}\\s*,\\s*${n}\\s*\\)$`).test(v)) return true;
  return new RegExp(`^linear\\(\\s*${n}%?(\\s+${n}%)*(\\s*,\\s*${n}%?(\\s+${n}%)*)+\\s*\\)$`).test(v);
}

const easingOr = (value: string, fallback: string) => (typeof value === "string" && isEasing(value) ? value.trim() : fallback);

export function serializeThemeDocument(doc: ThemeDocument): string {
  return JSON.stringify(doc, null, 2);
}

/** Result of attempting to parse a theme document — either the doc or
 *  a human-readable error string. */
export type ParseResult =
  | { ok: true; doc: ThemeDocument }
  | { ok: false; error: string };

export function parseThemeDocument(json: string): ParseResult {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value);
  const fail = (path: string, reason: string): ParseResult => ({
    ok: false,
    error: `${path}: ${reason}`,
  });
  const unsafeKeys = new Set([...Object.getOwnPropertyNames(Object.prototype), "prototype"]);
  const isColor = (value: unknown): value is string => {
    if (typeof value !== "string" || !value.trim()) return false;
    try {
      // Both parsers participate in derived colors; imported values must
      // work without browser-only resolution such as var() or currentColor.
      Color(value);
      return chroma.valid(value);
    } catch {
      return false;
    }
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
  if (!isRecord(parsed))
    return { ok: false, error: "Document must be a JSON object" };
  const obj = parsed;
  if (obj.version !== 1)
    return { ok: false, error: `Unsupported version (expected 1, got ${String(obj.version)})` };
  const documentKeys = new Set(["version", "primitives", "bindings", "addedPrimitives", "roleBindings"]);
  for (const key of Object.keys(obj)) {
    if (!documentKeys.has(key)) return fail(key, "Unknown document field");
  }
  for (const key of ["primitives", "bindings", "addedPrimitives", "roleBindings"] as const) {
    if (key in obj && !isRecord(obj[key])) return fail(key, "Must be an object");
  }

  for (const [key, value] of Object.entries(obj.primitives ?? {})) {
    const path = `primitives.${key}`;
    if (!Object.hasOwn(primitives, key)) return fail(path, "Unknown primitive");
    if (key === "colors" || key === "darkColors") {
      if (!isRecord(value)) return fail(path, "Must be an object");
      for (const [colorKey, color] of Object.entries(value)) {
        if (!Object.hasOwn(primitives[key], colorKey))
          return fail(`${path}.${colorKey}`, "Unknown color primitive; use addedPrimitives for custom colors");
        if (!isColor(color)) return fail(`${path}.${colorKey}`, "Must be a color supported by Color and chroma-js");
      }
      continue;
    }
    const defaultValue = primitives[key as keyof Primitives];
    if (typeof defaultValue === "number") {
      if (typeof value !== "number" || !Number.isFinite(value))
        return fail(path, "Must be a finite number");
      const positive = key === "fontPx" || key.startsWith("breakpoint") || key.endsWith("Ratio");
      if (positive ? value <= 0 : value < 0)
        return fail(path, positive ? "Must be greater than zero" : "Must be nonnegative");
      if ((key === "depthOpacity" || key === "motionBounce") && value > 1)
        return fail(path, "Must be between zero and one");
      if ((key === "reliefDepth" || key === "reliefSheen" || key === "neutralTint" || key === "softToneStrength") && value > 1)
        return fail(path, "Must be between zero and one");
      if ((key === "lightTextBalance" || key === "textOnFillStrength") && value > 100)
        return fail(path, "Must be between 0 and 100");
      if ((key === "lightAngle" || key === "primaryGradientAngle") && value >= 360)
        return fail(path, "Must be at least 0 and less than 360");
    } else if (typeof defaultValue === "boolean") {
      if (typeof value !== "boolean") return fail(path, "Must be true or false");
    } else if (key.startsWith("motionEase")) {
      if (typeof value !== "string" || !isEasing(value))
        return fail(path, "Must be a CSS easing: a keyword, cubic-bezier() or linear()");
    } else if (key === "indicatorStyle") {
      if (typeof value !== "string" || !(INDICATOR_STYLE_NAMES as readonly string[]).includes(value))
        return fail(path, `Must be one of ${INDICATOR_STYLE_NAMES.join(", ")}`);
    } else if (key === "reliefProfile" || key === "reliefBlend") {
      const allowed: readonly string[] = key === "reliefProfile" ? RELIEF_PROFILES : RELIEF_BLENDS;
      if (typeof value !== "string" || !allowed.includes(value))
        return fail(path, `Must be one of ${allowed.join(", ")}`);
    } else if (typeof value !== "string" || !value.trim()) {
      return fail(path, "Must be a nonempty font-family string");
    }
  }

  for (const [path, target] of Object.entries(obj.bindings ?? {})) {
    if (unsafeKeys.has(path) || typeof target !== "string" || !target.trim() || unsafeKeys.has(target))
      return fail(`bindings.${path}`, "Must reference a nonempty, non-reserved primitive key");
    // Unknown paths remain inert and unknown targets retain buildTheme's
    // documented fallback; importing a theme must preserve that contract.
  }

  for (const [key, pair] of Object.entries(obj.addedPrimitives ?? {})) {
    const path = `addedPrimitives.${key}`;
    if (!key.trim() || unsafeKeys.has(key)) return fail(path, "Invalid custom primitive key");
    if (!isRecord(pair)) return fail(path, "Must contain light and dark colors");
    for (const mode of ["light", "dark"] as const) {
      if (!isColor(pair[mode])) return fail(`${path}.${mode}`, "Must be a color supported by Color and chroma-js");
    }
    if (Object.keys(pair).some((mode) => mode !== "light" && mode !== "dark"))
      return fail(path, "Only light and dark fields are supported");
  }
  // Purposes from the purpose table, plus the radius and elevation roles
  // the theme computes itself.
  const purposePaths = new Set([
    ...Object.keys(defaultPurposeBindings()),
    ...Object.entries(theme.roles).flatMap(([group, leaves]) => Object.keys(leaves).map((leaf) => `roles.${group}.${leaf}`)),
  ]);
  const bindingRule = "Must be a token path or a CSS value without ; { } < > or comments";
  for (const [path, value] of Object.entries(obj.roleBindings ?? {})) {
    if (!purposePaths.has(path)) return fail(`roleBindings.${path}`, "Unknown purpose token");
    // One value per colour mode: each is checked as a single value is.
    if (isRecord(value)) {
      const extra = Object.keys(value).find((key) => key !== "light" && key !== "dark");
      if (extra !== undefined)
        return fail(`roleBindings.${path}.${extra}`, "Only light and dark fields are supported");
      for (const mode of ["light", "dark"] as const) {
        if (!Object.hasOwn(value, mode))
          return fail(`roleBindings.${path}.${mode}`, "Missing: a per-mode binding needs both light and dark");
        const bind = value[mode];
        if (typeof bind !== "string" || !isSafeBindingValue(bind))
          return fail(`roleBindings.${path}.${mode}`, bindingRule);
      }
      continue;
    }
    if (typeof value !== "string" || !isSafeBindingValue(value))
      return fail(`roleBindings.${path}`, `${bindingRule}, or { light, dark } with one of those each`);
  }
  return { ok: true, doc: obj as unknown as ThemeDocument };
}

/**
 * The default light theme. Components consume these semantic getters; the
 * actual values resolve from `primitives` on every read.
 */
export const theme = buildTheme();

/**
 * `darkTheme` is the library's built-in dark variant. Drop it into a
 * `ThemeProvider` (or pass it as the `override` to a `ThemeModifier`) to
 * switch a tree to dark mode. Every component that consumes color tokens
 * adapts automatically — no per-component dark variant required.
 */
export const darkTheme = buildTheme(undefined, "dark");

// Recursive function to convert the theme object into CSS variable declarations
export function themeToCssVars(themeObj: object, prefix = ""): string {
  return Object.entries(themeObj)
    .map(([key, value]) => {
      const varName = `${prefix}--${key}`;

      if (value !== null && typeof value === "object") {
        return themeToCssVars(value, `${varName}-`);
      }

      return `${varName}: ${value};`;
    })
    .join("\n");
}

// Generate the CSS string with the variables
export const cssVariables = themeToCssVars(theme);
