import type { ResolvedRoleBindings } from "./purpose";

/**
 * Theme switches that work by re-pointing purposes. Each is a yes-or-no
 * primitive; turning it away from its default applies a set of purpose
 * bindings, the same bindings a theme could write by hand in `roleBindings`.
 * A theme's own `roleBindings` still win over a switch, so a theme can take a
 * switch and then adjust one of the purposes it sets.
 *
 * Bindings point at meaningful tokens (other purposes where one fits), so a
 * switch carries a theme's other decisions with it: `brandHeadings` points
 * headings at `roles.color.link`, so a theme that re-points its links moves
 * its headings too.
 */
export interface BindingSwitch {
  /** The switch's default value. */
  default: boolean;
  /** What it does, for the theme panel and docs. */
  what: string;
  /** The purposes it sets when it's turned away from its default. */
  bindings: ResolvedRoleBindings;
}

export const BINDING_SWITCHES = {
  pillControls: {
    default: false,
    what: "Pill-shaped buttons, fields and tags: fully rounded ends.",
    bindings: {
      "roles.radius.control": "borders.radius.full",
      "roles.radius.chip": "borders.radius.full",
    },
  },
  underlinedFields: {
    default: false,
    what: "Ruled fields: one line under each field on the background behind it, and a firm accent underline on focus instead of a halo.",
    bindings: {
      "roles.control.fieldBorder": "borders.underline",
      "roles.color.fieldBackground": "transparent",
      "roles.interaction.fieldFocusHalo": "0px",
      "roles.interaction.fieldFocusUnderline": "borders.focusUnderline",
    },
  },
  liftOnHover: {
    default: true,
    what: "Lifted buttons (the primary, by default) rise a little under the pointer. Off keeps every button flat.",
    bindings: {
      "roles.interaction.hoverLift": "0px",
    },
  },
  squeezeOnPress: {
    default: false,
    what: "Buttons shrink a little while pressed, like a key going down.",
    bindings: {
      "roles.interaction.pressScale": "0.97",
    },
  },
  inkShadows: {
    default: false,
    what: "Hard, offset shadows in the text colour under buttons and fields, like a print, falling away from the light.",
    bindings: {
      "roles.elevation.lift": "shadows.inkLift",
      "roles.elevation.field": "shadows.inkRest",
      "components.button.primary.shadow": "shadows.inkRest",
      "components.button.secondary.shadow": "shadows.inkRest",
    },
  },
  strongFocus: {
    default: false,
    what: "A thicker keyboard focus ring, for public services and dense screens.",
    bindings: {
      "roles.border.focusWidth": "borders.focusWidthStrong",
    },
  },
  brandHeadings: {
    default: false,
    what: "Headings in the brand colour (the link tone, so they stay readable) instead of the text colour.",
    bindings: {
      "roles.color.heading": "roles.color.link",
    },
  },
  outlinedSecondary: {
    default: false,
    what: "Secondary buttons outlined in the brand colour with no fill, instead of a quiet neutral button.",
    bindings: {
      "components.button.secondary.background": "transparent",
      "components.button.secondary.border": "roles.color.accent",
      "components.button.secondary.text": "roles.color.link",
      "components.button.secondary.hoverBorder": "roles.color.accent",
      "components.button.secondary.hoverText": "roles.color.link",
    },
  },
} satisfies Record<string, BindingSwitch>;

export type BindingSwitchKey = keyof typeof BINDING_SWITCHES;

/**
 * How navigation marks the current item and the one under the pointer. Each
 * style is a set of `roles.indicator.*` bindings; `bar` is the default and
 * sets nothing.
 */
export const INDICATOR_STYLES = {
  bar: {
    what: "A bar along the current item's start edge, on a quiet fill.",
    bindings: {},
  },
  fill: {
    what: "The current item filled with the accent; a quiet fill under the pointer.",
    bindings: {
      "roles.indicator.current.bar": "0px",
      "roles.indicator.current.background": "roles.color.accent",
      "roles.indicator.current.text": "roles.color.onAccent",
    },
  },
  underline: {
    what: "An underline under the current item, and a quieter one under the pointer, with no fill.",
    bindings: {
      "roles.indicator.current.bar": "0px",
      "roles.indicator.current.underline": "borders.focusWidth",
      "roles.indicator.current.background": "transparent",
      "roles.indicator.current.text": "roles.color.text",
      "roles.indicator.hover.underline": "borders.width",
      "roles.indicator.hover.background": "transparent",
      "roles.indicator.hover.text": "roles.color.text",
    },
  },
  ring: {
    what: "A ring standing off a filled centre by a small gap, for the current item and, more quietly, under the pointer.",
    bindings: {
      "roles.indicator.current.bar": "0px",
      "roles.indicator.current.ring": "borders.focusWidth",
      "roles.indicator.current.gap": "borders.focusOffset",
      "roles.indicator.hover.ring": "borders.width",
      "roles.indicator.hover.gap": "borders.focusOffset",
    },
  },
  quiet: {
    what: "Only a quiet fill and a stronger label for the current item: no mark.",
    bindings: {
      "roles.indicator.current.bar": "0px",
    },
  },
  tint: {
    what: "The current item on a tint of the primary, with text to match: no mark.",
    bindings: {
      "roles.indicator.current.bar": "0px",
      "roles.indicator.current.background": "colors.tone.primary.subtle",
      "roles.indicator.current.text": "colors.tone.primary.onSubtle",
    },
  },
} satisfies Record<string, { what: string; bindings: ResolvedRoleBindings }>;

export type IndicatorStyle = keyof typeof INDICATOR_STYLES;

export const INDICATOR_STYLE_NAMES = Object.keys(INDICATOR_STYLES) as IndicatorStyle[];

export const BINDING_SWITCH_KEYS = Object.keys(BINDING_SWITCHES) as BindingSwitchKey[];

/** The purpose bindings a set of switch values applies (empty when every switch is at its default). */
export function switchBindingsFor(
  values: Partial<Record<BindingSwitchKey, boolean>> & { indicatorStyle?: string },
): ResolvedRoleBindings {
  const style = values.indicatorStyle as IndicatorStyle | undefined;
  const out: ResolvedRoleBindings = { ...(style && Object.hasOwn(INDICATOR_STYLES, style) ? INDICATOR_STYLES[style].bindings : {}) };
  for (const key of BINDING_SWITCH_KEYS) {
    const sw: BindingSwitch = BINDING_SWITCHES[key];
    const value = values[key] ?? sw.default;
    if (value !== sw.default) Object.assign(out, sw.bindings);
  }
  return out;
}
