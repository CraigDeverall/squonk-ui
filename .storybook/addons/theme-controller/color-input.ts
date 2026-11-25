import Color from "color";

/** Native color inputs need opaque six-digit hex; this is display-only. */
export function nativeColorInputValue(value: string): string {
  try {
    return Color(value).hex().toLowerCase();
  } catch {
    // Keep partially typed text in the adjacent text field, not the native input.
    return "#000000";
  }
}
