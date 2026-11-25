// Themes for story previews: the docs' example themes (from the stories
// manifest), a starter for writing a theme from scratch, and custom themes
// validated with the installed library's own parser before they're shown.
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Project } from "./project.ts";
import type { StoriesManifest } from "./stories.ts";

/** The library's theme document (version 1), as the Storybook theme panel exports it. */
export type ThemeDocument = {
  version: 1;
  /** Raw inputs: palettes (`colors`, `darkColors`), sizes, fonts, motion, relief, switches and sliders. */
  primitives?: Record<string, unknown>;
  /** Colour getters re-pointed at palette keys, e.g. `{ "colors.link": "accent" }`. */
  bindings?: Record<string, string>;
  /** Custom palette keys, each with a light and a dark value. */
  addedPrimitives?: Record<string, { light: string; dark: string }>;
  /** Purposes re-pointed at a raw token, another purpose or a literal CSS value. */
  /** A value is one string for both modes, or a pair with one value per mode. */
  roleBindings?: Record<string, string | { light: string; dark: string }>;
};

/** A custom theme for a preview: a theme document, optionally on top of an example theme. */
export type CustomTheme = Omit<ThemeDocument, "version"> & {
  version?: 1;
  /** An example theme's id to copy and change, e.g. "tidepool". */
  basedOn?: string;
  /** A name to show in the page's Theme picker. */
  name?: string;
};

/** A resolved custom theme, ready for the page. */
export type ResolvedTheme = ThemeDocument & { name: string };

type ParseResult = { ok: true; doc: ThemeDocument } | { ok: false; error: string };
type ThemeModule = { parseThemeDocument(json: string): ParseResult; primitives: Record<string, unknown> };
type PurposeModule = { purposeReasons(): Record<string, string> };
type SwitchModule = {
  BINDING_SWITCHES: Record<string, { default: boolean; what: string }>;
  INDICATOR_STYLES: Record<string, { what: string }>;
};

/** Loads one of the installed library's built theme modules, when it ships them. */
async function libraryModule<T>(project: Project, name: string): Promise<T | undefined> {
  const file = path.join(project.libraryDir, "dist", "theme", `${name}.mjs`);
  if (!existsSync(file)) return undefined;
  return (await import(pathToFileURL(file).href)) as T;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * A theme over a base: primitives merge key by key (the colour palettes too,
 * so changing one colour keeps the rest), and each kind of binding merges,
 * the custom theme winning.
 */
export function mergeThemes(base: ThemeDocument | undefined, custom: ThemeDocument): ThemeDocument {
  const bp = base?.primitives ?? {};
  const cp = custom.primitives ?? {};
  const primitives: Record<string, unknown> = { ...bp, ...cp };
  for (const palette of ["colors", "darkColors"]) {
    if (isRecord(bp[palette]) || isRecord(cp[palette])) primitives[palette] = { ...(bp[palette] as object), ...(cp[palette] as object) };
  }
  const merged: ThemeDocument = { version: 1, primitives };
  const bindings = { ...base?.bindings, ...custom.bindings };
  const addedPrimitives = { ...base?.addedPrimitives, ...custom.addedPrimitives };
  const roleBindings = { ...base?.roleBindings, ...custom.roleBindings };
  if (Object.keys(bindings).length) merged.bindings = bindings;
  if (Object.keys(addedPrimitives).length) merged.addedPrimitives = addedPrimitives;
  if (Object.keys(roleBindings).length) merged.roleBindings = roleBindings;
  return merged;
}

/** An example theme as a theme document, to copy and change. */
export function exampleThemeDocument(manifest: StoriesManifest | undefined, id: string): (ThemeDocument & { id: string; name: string; description: string }) | undefined {
  const theme = manifest?.exampleThemes?.find((t) => t.id === id);
  if (!theme) return undefined;
  return { id: theme.id, name: theme.name, description: theme.description ?? "", version: 1, primitives: theme.primitives ?? {}, roleBindings: theme.roleBindings ?? {} };
}

const exampleIds = (manifest: StoriesManifest | undefined) => (manifest?.exampleThemes ?? []).map((t) => t.id).join(", ");

/**
 * Checks a custom theme with the installed library's parser (the same one the
 * Storybook theme panel imports with) and puts it over its `basedOn` theme.
 */
export async function resolveCustomTheme(project: Project, manifest: StoriesManifest | undefined, input: CustomTheme): Promise<{ ok: true; theme: ResolvedTheme } | { ok: false; error: string }> {
  const { basedOn, name, primitives, bindings, addedPrimitives, roleBindings } = input;
  const base = basedOn ? exampleThemeDocument(manifest, basedOn) : undefined;
  if (basedOn && !base) return { ok: false, error: `customTheme.basedOn: no example theme "${basedOn}". Use one of: ${exampleIds(manifest)}.` };
  // Only the document's own fields; undefined ones drop out of the JSON the parser reads.
  const doc: ThemeDocument = { version: 1, primitives, bindings, addedPrimitives, roleBindings };
  const parser = await libraryModule<ThemeModule>(project, "theme");
  if (parser) {
    const result = parser.parseThemeDocument(JSON.stringify(doc));
    if (!result.ok) return { ok: false, error: `customTheme.${result.error}. Call get_theme for the starter, with every primitive and its meaning.` };
  }
  const merged = mergeThemes(base, doc);
  return { ok: true, theme: { ...merged, name: name?.trim() || (base ? `${base.name}, customised` : "Custom") } };
}

/** The tier purposes a theme most often re-points: each shared decision that many purposes bind through. */
const SHARED_PURPOSES = [
  "roles.space.adjoining", "roles.space.related", "roles.space.grouped", "roles.space.separated", "roles.space.distinct",
  "roles.type.fine", "roles.type.small", "roles.type.body", "roles.type.large",
  "roles.color.edge", "roles.color.edgeStrong", "roles.color.page", "roles.color.surface", "roles.color.well",
  "roles.color.accent", "roles.color.text", "roles.color.link", "roles.color.focusRing",
  "roles.radius.control", "roles.radius.surface", "roles.radius.chip",
];

/** The radius roles the theme computes from its radius primitives, which aren't in the purpose table. */
const COMPUTED_REASONS: Record<string, string> = {
  "roles.radius.control": "Corners of buttons, fields, selects and pagination (from controlRadiusPx).",
  "roles.radius.surface": "Corners of cards, menus, popovers and alerts (from borderRadiusPx).",
  "roles.radius.chip": "Corners of tags (from borderRadiusPx).",
};

/** Everything an agent needs to write a theme from scratch, from the installed library. */
export async function starterTheme(project: Project, manifest: StoriesManifest | undefined) {
  const [theme, purpose, switches] = await Promise.all([
    libraryModule<ThemeModule>(project, "theme"),
    libraryModule<PurposeModule>(project, "purpose"),
    libraryModule<SwitchModule>(project, "switches"),
  ]);
  const reasons = purpose?.purposeReasons() ?? {};
  return {
    about:
      "A theme document for @squonkstack/ui. Start from `document` (the library's defaults) or from an example theme (get_theme with its id), change what the user asked for, and pass it to preview_story as customTheme (or { basedOn: '<example id>', ...changes }). Primitives set the character: palettes, spacingPx, fontPx, radii, fonts (Google Fonts families load in previews), motion, relief, switches and sliders. roleBindings re-point purposes for decisions scaling can't express: bind to a raw token ('spacing.lg'), another purpose ('roles.color.link') or a literal ('12px'). A value may also be { light, dark } to differ by mode. Re-point a shared purpose to change everything that shares its meaning. Read get_guide foundations-purpose-tokens and foundations-theme for the full rules.",
    document: { version: 1, primitives: theme?.primitives ?? {}, roleBindings: {} },
    switches: Object.fromEntries(Object.entries(switches?.BINDING_SWITCHES ?? {}).map(([key, s]) => [key, { default: s.default, what: s.what }])),
    otherSwitches: {
      deriveFromPrimary: "Link, focus ring and accent follow the primary, kept readable.",
      uppercaseControls: "Button labels in tracked capitals.",
      underlineLinks: "Links underlined at rest.",
      filledFields: "Fields filled with the well colour.",
      printBackgrounds: "Print in the theme's colours instead of ink on white.",
      printLinkUrls: "Print each link's address after it (on by default).",
    },
    choices: {
      indicatorStyle: Object.fromEntries(Object.entries(switches?.INDICATOR_STYLES ?? {}).map(([key, s]) => [key, s.what])),
      reliefProfile: "soft, bevel, glass, pillow or print (with reliefDepth and reliefSheen above 0)",
      reliefBlend: "normal, soft-light or overlay",
    },
    sliders: {
      neutralTint: "0–1: greys lean towards the primary's hue.",
      softToneStrength: "0–1 (default 0): above 0, a tone's soft fills (subtle badge, alert wash, tinted current item) become the surface with that share of the tone mixed in. 0.1–0.2 is a quiet tint.",
      lightTextBalance: "0–100 (default 50): when text on coloured fills turns light, and how far the fill deepens.",
      textOnFillStrength: "0–100 (default 50): that text from a quiet tint of the fill (0) to pure white or black (100).",
      motionBounce: "0–1: how much arrivals overshoot.",
      reliefDepth: "0–1: tone shift across a surface.",
      reliefSheen: "0–1: highlight and shade along edges.",
      lightAngle: "0–355 degrees: where the light comes from, for shadows and relief.",
    },
    sharedPurposes: Object.fromEntries(SHARED_PURPOSES.map((key) => [key, reasons[key] ?? COMPUTED_REASONS[key] ?? ""])),
    exampleThemes: (manifest?.exampleThemes ?? []).map((t) => ({ id: t.id, name: t.name, description: t.description })),
  };
}
