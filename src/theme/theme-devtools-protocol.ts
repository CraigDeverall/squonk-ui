/*
 * The messages between a page built with @squonk/ui and a theme tool (the
 * Squonk UI devtools browser extension): DOM events on `window` whose detail
 * is a JSON string. No imports, so a content script can bundle this alone.
 */
import type {
  AddedColorPrimitives,
  ColorBindingsOverride,
  ColorMode,
  Primitives,
  ThemeDocument,
} from "./theme";
import type { RoleBindingsOverride } from "./purpose";

export const THEME_DEVTOOLS_EVENTS = {
  /** Page → tool: a root provider mounted; ask if you want its state. */
  ready: "squonk-theme-devtools:ready",
  /** Tool → page: report the root provider's theme inputs. */
  request: "squonk-theme-devtools:request",
  /** Page → tool: a `ThemeDevtoolsState` as JSON. */
  state: "squonk-theme-devtools:state",
  /** Tool → page: a `ThemeDevtoolsOverride` as JSON, or `null` to clear. */
  set: "squonk-theme-devtools:set",
} as const;

/** What a tool lays over the root provider's own props. */
export interface ThemeDevtoolsOverride {
  /** Primitive, binding and purpose overrides, merged over the app's own. */
  theme: Omit<ThemeDocument, "version">;
  /** Replaces the app's colour mode while set. */
  mode?: ColorMode;
}

/** The root provider's own inputs, before any tool override. */
export interface ThemeDevtoolsState {
  protocol: 1;
  primitives: Primitives;
  mode: ColorMode;
  colorBindings: ColorBindingsOverride;
  addedColorPrimitives: AddedColorPrimitives;
  roleBindings: RoleBindingsOverride;
}
