import Color from "color";
import { themeHelpers } from "./theme";
import type { SquonkTheme } from "./theme-context";

export function surfaceForeground(background: string, preferred: string): string {
  try {
    const foreground = Color(preferred);
    const surface = Color(background);
    // Alpha requires the actual composited backdrop. Do not replace a supplied
    // readable role using a contrast calculation against uncomposited RGB.
    if (foreground.alpha() < 1 || surface.alpha() < 1) return preferred;
    return foreground.contrast(surface) >= 4.5
      ? preferred
      : themeHelpers.getMinContrastTextColor(background);
  } catch {
    // Browser-resolved colors (var/currentColor/color-mix) cannot be measured
    // here. Preserve explicit theme roles; consumers must verify those pairs.
    return preferred;
  }
}

export function themeForSurface(theme: SquonkTheme, background: string): SquonkTheme {
  return {
    ...theme,
    colors: {
      ...theme.colors,
      link: surfaceForeground(background, theme.colors.link),
      border: { ...theme.colors.border, focus: surfaceForeground(background, theme.colors.border.focus) },
      text: {
        ...theme.colors.text,
        primary: surfaceForeground(background, theme.colors.text.primary),
        secondary: surfaceForeground(background, theme.colors.text.secondary),
        muted: surfaceForeground(background, theme.colors.text.muted),
      },
    },
  };
}

