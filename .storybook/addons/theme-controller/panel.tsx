import React, { useCallback, useEffect, useMemo, useState } from "react";
import { parseStoredThemePart } from "../../../src/theme/theme-storage";
import { addons } from "storybook/manager-api";
import { useBasePrimitives, useThemeGlobal } from "./base-primitives";
import { UPDATE_GLOBALS } from "storybook/internal/core-events";
import { EXAMPLE_THEMES, exampleTheme } from "../../../src/design-system/themes/themes";
import {
  buildTheme,
  parseThemeDocument,
  primitives as defaultPrimitives,
  resolveBinding,
  serializeThemeDocument,
} from "../../../src/theme/theme";
import type {
  AddedColorPrimitives,
  ColorBindingsOverride,
  ColorMode,
  Primitives,
  PrimitivesOverride,
  ThemeDocument,
} from "../../../src/theme/theme";
import type { RoleBindingsOverride } from "../../../src/theme/purpose";
import { themeCssVariables } from "../../../src/theme/theme-css-vars";
import { RELIEF_BLENDS, RELIEF_PROFILES } from "../../../src/theme/relief";
import { BINDING_SWITCHES, INDICATOR_STYLE_NAMES, INDICATOR_STYLES } from "../../../src/theme/switches";
import {
  ADDED_PRIMITIVES_STORAGE_KEY,
  BINDINGS_STORAGE_KEY,
  EVENTS,
  ROLE_BINDINGS_STORAGE_KEY,
  STORAGE_KEY,
} from "./constants";
import { InThisStorySection, PurposeTokensSection } from "./purpose-section";
import { MotionSection } from "./motion-section";
import { diffSnippet } from "./snippet";
import { FontPicker } from "./font-picker";
import { modeStore } from "./mode-store";
import { nativeColorInputValue } from "./color-input";

const EMPTY: PrimitivesOverride = {};
const EMPTY_BINDINGS: ColorBindingsOverride = {};
const EMPTY_ADDED: AddedColorPrimitives = {};
const EMPTY_ROLES: RoleBindingsOverride = {};

function loadOverrides(): PrimitivesOverride {
  try {
    return parseStoredThemePart(localStorage.getItem(STORAGE_KEY), "primitives") ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

function saveOverrides(overrides: PrimitivesOverride) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    /* no-op */
  }
}

function loadBindings(): ColorBindingsOverride {
  try {
    return parseStoredThemePart(localStorage.getItem(BINDINGS_STORAGE_KEY), "bindings") ?? EMPTY_BINDINGS;
  } catch {
    return EMPTY_BINDINGS;
  }
}

function saveBindings(bindings: ColorBindingsOverride) {
  try {
    localStorage.setItem(BINDINGS_STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    /* no-op */
  }
}

function loadAdded(): AddedColorPrimitives {
  try {
    return parseStoredThemePart(localStorage.getItem(ADDED_PRIMITIVES_STORAGE_KEY), "addedPrimitives") ?? EMPTY_ADDED;
  } catch {
    return EMPTY_ADDED;
  }
}

function saveAdded(added: AddedColorPrimitives) {
  try {
    localStorage.setItem(ADDED_PRIMITIVES_STORAGE_KEY, JSON.stringify(added));
  } catch {
    /* no-op */
  }
}

function loadRoleBindings(): RoleBindingsOverride {
  try {
    return parseStoredThemePart(localStorage.getItem(ROLE_BINDINGS_STORAGE_KEY), "roleBindings") ?? EMPTY_ROLES;
  } catch {
    return EMPTY_ROLES;
  }
}

function saveRoleBindings(roleBindings: RoleBindingsOverride) {
  try {
    localStorage.setItem(ROLE_BINDINGS_STORAGE_KEY, JSON.stringify(roleBindings));
  } catch {
    /* no-op */
  }
}

/** A primitive key is valid if it's a camelCase identifier and not already
 *  reserved by the built-in palette. */
function validateNewPrimitiveKey(
  key: string,
  taken: Set<string>
): string | null {
  if (!key.trim()) return "Name required";
  if (!/^[a-z][a-zA-Z0-9]*$/.test(key))
    return "Use camelCase (a-z, 0-9, no spaces)";
  if (taken.has(key)) return "Already in use";
  return null;
}

/** All available color primitive keys — what a getter can be bound to. */
const COLOR_PRIMITIVE_KEYS = Object.keys(defaultPrimitives.colors) as Array<
  keyof Primitives["colors"]
>;

const COLOR_KEYS = Object.keys(defaultPrimitives.colors) as Array<
  keyof Primitives["colors"]
>;

const NUMERIC_FIELDS: Array<{
  key: keyof Primitives;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
}> = [
  { key: "spacingPx", label: "Spacing base", min: 2, max: 24, step: 1, suffix: "px" },
  { key: "fontPx", label: "Font base", min: 10, max: 28, step: 1, suffix: "px" },
  { key: "borderPx", label: "Border width", min: 0, max: 6, step: 1, suffix: "px" },
  { key: "borderRadiusPx", label: "Border radius", min: 0, max: 24, step: 1, suffix: "px" },
  { key: "depthOpacity", label: "Shadow opacity", min: 0, max: 1, step: 0.05, suffix: "" },
  { key: "breakpointMobilePx", label: "Mobile", min: 320, max: 640, step: 8, suffix: "px" },
  { key: "breakpointTabletPx", label: "Tablet", min: 600, max: 960, step: 8, suffix: "px" },
  { key: "breakpointDesktopPx", label: "Desktop", min: 900, max: 1440, step: 8, suffix: "px" },
  { key: "breakpointWidePx", label: "Wide", min: 1200, max: 1920, step: 8, suffix: "px" },
  { key: "zIndexStep", label: "z-index step", min: 1, max: 1000, step: 10, suffix: "" },
];

const RELIEF_NUMERIC_FIELDS: Array<{
  key: keyof Primitives;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
}> = [
  { key: "lightAngle", label: "Light from", min: 0, max: 355, step: 5, suffix: "°" },
  { key: "reliefDepth", label: "Relief depth", min: 0, max: 1, step: 0.05, suffix: "" },
  { key: "reliefSheen", label: "Relief sheen", min: 0, max: 1, step: 0.05, suffix: "" },
];

type SwitchField = { key: keyof Primitives; label: string; hint: string };
const bindingSwitch = (key: keyof typeof BINDING_SWITCHES, label: string): SwitchField => ({ key, label, hint: BINDING_SWITCHES[key].what });

/** The theme switches, each a yes-or-no decision that sets several purposes, grouped by what they shape. */
const SWITCH_GROUPS: Array<{ title: string; fields: SwitchField[] }> = [
  {
    title: "Colour",
    fields: [
      { key: "deriveFromPrimary", label: "Derive from primary", hint: "Link, focus ring and accent follow the primary, kept readable." },
      {
        key: "primaryGradient",
        label: "Primary gradient",
        hint: "The primary button filled with a gradient from the gradient start colour to the primary, its label readable on both ends.",
      },
      bindingSwitch("brandHeadings", "Brand headings"),
    ],
  },
  {
    title: "Type",
    fields: [
      { key: "uppercaseControls", label: "Uppercase controls", hint: "Button labels in tracked capitals." },
      { key: "underlineLinks", label: "Underline links", hint: "Links underlined at rest, not only when pointed at." },
    ],
  },
  {
    title: "Shape and depth",
    fields: [bindingSwitch("pillControls", "Pill controls"), bindingSwitch("inkShadows", "Ink shadows")],
  },
  {
    title: "Fields",
    fields: [
      { key: "filledFields", label: "Filled fields", hint: "Fields filled with the well colour." },
      bindingSwitch("underlinedFields", "Underlined fields"),
    ],
  },
  {
    title: "Buttons and focus",
    fields: [
      bindingSwitch("outlinedSecondary", "Outlined secondary"),
      bindingSwitch("liftOnHover", "Lift on hover"),
      bindingSwitch("squeezeOnPress", "Squeeze on press"),
      bindingSwitch("strongFocus", "Strong focus"),
    ],
  },
  {
    title: "Print",
    fields: [
      { key: "printBackgrounds", label: "Print backgrounds", hint: "Print in the theme's colours instead of ink on white." },
      { key: "printLinkUrls", label: "Print link addresses", hint: "Print each link's address after it." },
    ],
  },
];

const RELIEF_CHOICE_FIELDS: Array<{ key: "reliefProfile" | "reliefBlend"; label: string; options: readonly string[] }> = [
  { key: "reliefProfile", label: "Relief profile", options: RELIEF_PROFILES },
  { key: "reliefBlend", label: "Relief blend", options: RELIEF_BLENDS },
];

const RATIO_FIELDS: Array<{
  key: keyof Primitives;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "compactSpacingRatio", label: "Spacing ×", min: 0.25, max: 1, step: 0.05 },
  { key: "compactFontRatio", label: "Font ×", min: 0.5, max: 1, step: 0.025 },
  { key: "compactBorderRadiusRatio", label: "Radius ×", min: 0.25, max: 1, step: 0.05 },
  { key: "displaySpacingRatio", label: "Spacing ×", min: 1, max: 3, step: 0.05 },
  { key: "displayFontRatio", label: "Font ×", min: 1, max: 2.5, step: 0.025 },
  { key: "displayBorderRadiusRatio", label: "Radius ×", min: 1, max: 3, step: 0.05 },
];

const STRING_FIELDS: Array<{
  key: keyof Primitives;
  label: string;
  placeholder?: string;
}> = [
  {
    key: "fontFamily",
    label: "Font family (body)",
    placeholder: defaultPrimitives.fontFamily,
  },
  {
    key: "fontFamilyHeading",
    label: "Font family (heading)",
    placeholder: defaultPrimitives.fontFamilyHeading,
  },
  {
    key: "fontFamilyCode",
    label: "Font family (code)",
    placeholder: defaultPrimitives.fontFamilyCode,
  },
];

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}


export const ThemeControllerPanel: React.FC = () => {
  const base = useBasePrimitives();
  const [overrides, setOverrides] = useState<PrimitivesOverride>(() =>
    loadOverrides()
  );
  const [bindings, setBindings] = useState<ColorBindingsOverride>(() =>
    loadBindings()
  );
  const [added, setAdded] = useState<AddedColorPrimitives>(() => loadAdded());
  const [roleBindings, setRoleBindings] = useState<RoleBindingsOverride>(() => loadRoleBindings());
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<ColorMode>(() => modeStore.get());

  // Track the live mode so the Computed theme section reflects whichever
  // palette the canvas is currently rendering.
  useEffect(() => modeStore.subscribe(setMode), []);

  // Push overrides + bindings to preview whenever they change
  useEffect(() => {
    addons.getChannel().emit(EVENTS.OVERRIDE_CHANGED, overrides);
    saveOverrides(overrides);
  }, [overrides]);
  useEffect(() => {
    addons.getChannel().emit(EVENTS.BINDINGS_CHANGED, bindings);
    saveBindings(bindings);
  }, [bindings]);
  useEffect(() => {
    addons.getChannel().emit(EVENTS.ADDED_PRIMITIVES_CHANGED, added);
    saveAdded(added);
  }, [added]);
  useEffect(() => {
    addons.getChannel().emit(EVENTS.ROLE_BINDINGS_CHANGED, roleBindings);
    saveRoleBindings(roleBindings);
  }, [roleBindings]);

  // Re-sync when preview asks (e.g. on iframe reload) — push all three.
  useEffect(() => {
    const channel = addons.getChannel();
    const handler = () => {
      channel.emit(EVENTS.OVERRIDE_CHANGED, overrides);
      channel.emit(EVENTS.BINDINGS_CHANGED, bindings);
      channel.emit(EVENTS.ADDED_PRIMITIVES_CHANGED, added);
      channel.emit(EVENTS.ROLE_BINDINGS_CHANGED, roleBindings);
    };
    channel.on(EVENTS.REQUEST_STATE, handler);
    return () => channel.off(EVENTS.REQUEST_STATE, handler);
  }, [overrides, bindings, added, roleBindings]);

  const setRoleBinding = useCallback((path: string, value: string | null) => {
    setRoleBindings((s) => {
      const next = { ...s };
      if (value === null) delete next[path];
      else next[path] = value;
      return next;
    });
  }, []);

  // Purpose values for the panel, from the same inputs the canvas uses.
  const themeVars = useMemo(
    () => themeCssVariables(buildTheme(overrides, mode, bindings, added, roleBindings)),
    [overrides, mode, bindings, added, roleBindings]
  );

  const setBinding = useCallback<RebindHandler>(
    (getterPath, primitiveKey) => {
      setBindings((s) => {
        const next = { ...s };
        // null means "reset to default" — remove the override.
        if (primitiveKey === null) delete next[getterPath];
        else next[getterPath] = primitiveKey;
        return next;
      });
    },
    []
  );

  const setColor = useCallback(
    (group: "colors" | "darkColors", key: string, value: string) => {
      const withColor = (
        s: PrimitivesOverride,
        g: "colors" | "darkColors",
      ): PrimitivesOverride => {
        const defaultsForGroup =
          g === "colors" ? base.colors : base.darkColors;
        const isDefault =
          value.toLowerCase() ===
          (defaultsForGroup as Record<string, string>)[key].toLowerCase();
        const current = { ...(s[g] ?? {}) } as Record<string, string>;
        if (isDefault) delete current[key];
        else current[key] = value;
        const nextGroup =
          Object.keys(current).length > 0 ? current : undefined;
        const next: PrimitivesOverride = { ...s };
        if (nextGroup) (next as Record<string, unknown>)[g] = nextGroup;
        else delete (next as Record<string, unknown>)[g];
        return next;
      };
      const effective = (s: PrimitivesOverride, g: "colors" | "darkColors") =>
        ((s[g] as Record<string, string> | undefined)?.[key] ??
          (g === "colors"
            ? (base.colors as Record<string, string>)[key]
            : (base.darkColors as Record<string, string>)[key]) ??
          ""
        ).toLowerCase();
      setOverrides((s) => {
        const next = withColor(s, group);
        // A dark value still equal to the light one has not been set apart,
        // so it follows a light edit. Otherwise a primary change misses dark
        // mode and inverted bands, which read the dark palette.
        return group === "colors" && effective(s, "colors") === effective(s, "darkColors")
          ? withColor(next, "darkColors")
          : next;
      });
    },
    [base]
  );

  const setNumeric = useCallback(
    (key: keyof Primitives, value: number) => {
      setOverrides((s) => {
        const isDefault = value === (base[key] as number);
        const next: PrimitivesOverride = { ...s };
        if (isDefault) delete (next as Record<string, unknown>)[key];
        else (next as Record<string, unknown>)[key] = value;
        return next;
      });
    },
    [base]
  );

  const setBoolean = useCallback(
    (key: keyof Primitives, value: boolean) => {
      setOverrides((s) => {
        const next: PrimitivesOverride = { ...s };
        if (value === (base[key] as boolean)) delete (next as Record<string, unknown>)[key];
        else (next as Record<string, unknown>)[key] = value;
        return next;
      });
    },
    [base]
  );

  const setString = useCallback(
    (key: keyof Primitives, value: string) => {
      setOverrides((s) => {
        const trimmed = value.trim();
        const isDefault =
          trimmed.length === 0 ||
          trimmed === (base[key] as string);
        const next: PrimitivesOverride = { ...s };
        if (isDefault) delete (next as Record<string, unknown>)[key];
        else (next as Record<string, unknown>)[key] = trimmed;
        return next;
      });
    },
    [base]
  );

  const reset = useCallback(() => {
    setOverrides(EMPTY);
    setBindings(EMPTY_BINDINGS);
    setAdded(EMPTY_ADDED);
    setRoleBindings(EMPTY_ROLES);
  }, []);

  const addPrimitive = useCallback(
    (key: string, light: string, dark: string) => {
      setAdded((s) => ({ ...s, [key]: { light, dark } }));
    },
    []
  );

  const removePrimitive = useCallback((key: string) => {
    setAdded((s) => {
      const next = { ...s };
      delete next[key];
      return next;
    });
    // Also clear any binding pointing at this key — otherwise a stale
    // rebound getter would silently fall back to its default once the
    // custom primitive vanishes.
    setBindings((b) => {
      const stale = Object.entries(b).filter(([, v]) => v === key);
      if (stale.length === 0) return b;
      const next = { ...b };
      for (const [path] of stale) delete next[path];
      return next;
    });
  }, []);

  const copyDiff = useCallback(async () => {
    const snippet = diffSnippet(overrides, bindings, roleBindings);
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* no-op */
    }
  }, [overrides, bindings, roleBindings]);

  const [exported, setExported] = useState(false);
  const exportDocument = useCallback(async () => {
    const doc: ThemeDocument = {
      version: 1,
      ...(Object.keys(overrides).length ? { primitives: overrides } : {}),
      ...(Object.keys(bindings).length ? { bindings } : {}),
      ...(Object.keys(added).length ? { addedPrimitives: added } : {}),
      ...(Object.keys(roleBindings).length ? { roleBindings } : {}),
    };
    try {
      await navigator.clipboard.writeText(serializeThemeDocument(doc));
      setExported(true);
      setTimeout(() => setExported(false), 1500);
    } catch {
      /* no-op */
    }
  }, [overrides, bindings, added, roleBindings]);

  const [importOpen, setImportOpen] = useState(false);
  const applyDocument = useCallback(
    (doc: ThemeDocument) => {
      setOverrides(doc.primitives ?? EMPTY);
      setBindings(doc.bindings ?? EMPTY_BINDINGS);
      setAdded(doc.addedPrimitives ?? EMPTY_ADDED);
      setRoleBindings(doc.roleBindings ?? EMPTY_ROLES);
      setImportOpen(false);
    },
    []
  );

  const hasOverrides = useMemo(
    () =>
      !deepEqual(overrides, EMPTY) ||
      !deepEqual(bindings, EMPTY_BINDINGS) ||
      !deepEqual(added, EMPTY_ADDED) ||
      !deepEqual(roleBindings, EMPTY_ROLES),
    [overrides, bindings, added, roleBindings]
  );

  return (
    <div style={styles.root}>
      <Toolbar
        hasOverrides={hasOverrides}
        copied={copied}
        exported={exported}
        onReset={reset}
        onCopy={copyDiff}
        onExport={exportDocument}
        onImport={() => setImportOpen((o) => !o)}
        importOpen={importOpen}
      />

      <ThemePresetPicker />

      {importOpen && (
        <ImportPanel
          onApply={applyDocument}
          onClose={() => setImportOpen(false)}
        />
      )}

      <InThisStorySection roleBindings={roleBindings} onBind={setRoleBinding} mode={mode} />

      <PurposeTokensSection roleBindings={roleBindings} onBind={setRoleBinding} vars={themeVars} mode={mode} />

      <Section title="Colors">
        <ColorPairHeader mode={mode} />
        <div style={styles.colorPairList}>
          {COLOR_KEYS.map((key) => (
            <ColorPairRow
              key={key}
              label={key}
              mode={mode}
              light={
                (overrides.colors?.[key] as string | undefined) ??
                base.colors[key]
              }
              dark={
                (overrides.darkColors?.[key as keyof Primitives["darkColors"]] as
                  | string
                  | undefined) ??
                base.darkColors[
                  key as keyof Primitives["darkColors"]
                ]
              }
              lightDefault={base.colors[key]}
              darkDefault={
                base.darkColors[
                  key as keyof Primitives["darkColors"]
                ]
              }
              onLightChange={(v) => setColor("colors", key, v)}
              onDarkChange={(v) => setColor("darkColors", key, v)}
            />
          ))}
        </div>
      </Section>

      <Section title="Neutral tint and light text">
        <p style={styles.sectionHint}>
          Neutral tint leans the greys (page, surfaces, text, borders) towards
          the primary colour&rsquo;s hue, keeping their lightness. Light text
          balance decides when text on a coloured fill turns light and how far
          the fill deepens to carry it: higher gives richer fills with white
          text, lower keeps dark text on more fills. Text on fill strength sets
          how far that text stands apart: pure white or black at 100, a quiet
          tint of the fill at 0. Every pairing still meets AA.
        </p>
        <div style={styles.numericList}>
          <NumericRow
            label="Light text balance"
            tokenKey="lightTextBalance"
            min={0}
            max={100}
            step={5}
            suffix=""
            value={(overrides.lightTextBalance as number | undefined) ?? base.lightTextBalance}
            isOverridden={overrides.lightTextBalance !== undefined}
            onChange={(v) => setNumeric("lightTextBalance", v)}
          />
          <NumericRow
            label="Text on fill strength"
            tokenKey="textOnFillStrength"
            min={0}
            max={100}
            step={5}
            suffix=""
            value={(overrides.textOnFillStrength as number | undefined) ?? base.textOnFillStrength}
            isOverridden={overrides.textOnFillStrength !== undefined}
            onChange={(v) => setNumeric("textOnFillStrength", v)}
          />
          <NumericRow
            label="Neutral tint"
            tokenKey="neutralTint"
            min={0}
            max={1}
            step={0.05}
            suffix=""
            value={(overrides.neutralTint as number | undefined) ?? base.neutralTint}
            isOverridden={overrides.neutralTint !== undefined}
            onChange={(v) => setNumeric("neutralTint", v)}
          />
        </div>
      </Section>

      <Section title="Switches">
        <p style={styles.sectionHint}>
          Yes-or-no theme decisions. Each sets purpose tokens, which a theme can
          still re-point one by one.
        </p>
        <div style={styles.numericList}>
          <span style={styles.numericKey}>Navigation</span>
          <label style={styles.numericRow}>
            <div style={styles.numericHeader}>
              <span style={styles.numericLabelGroup}>
                <span style={{ ...styles.overrideDot, opacity: overrides.indicatorStyle !== undefined ? 1 : 0 }} />
                <span style={styles.numericLabel}>Indicator style</span>
                <span style={styles.numericKey}>indicatorStyle</span>
              </span>
            </div>
            <select
              value={(overrides.indicatorStyle as string | undefined) ?? base.indicatorStyle}
              onChange={(e) => setString("indicatorStyle", e.target.value)}
              style={styles.stringInput}
            >
              {INDICATOR_STYLE_NAMES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <span style={styles.sectionHint}>
              {INDICATOR_STYLES[((overrides.indicatorStyle as string | undefined) ?? base.indicatorStyle) as keyof typeof INDICATOR_STYLES]?.what}
            </span>
          </label>
        </div>
        {SWITCH_GROUPS.map((group) => (
        <div key={group.title} style={styles.numericList}>
          <span style={styles.numericKey}>{group.title}</span>
          {group.fields.map((f) => {
            const checked = (overrides[f.key] as boolean | undefined) ?? (base[f.key] as boolean);
            return (
              <label key={f.key as string} style={{ ...styles.numericRow, cursor: "pointer" }}>
                <div style={styles.numericHeader}>
                  <span style={styles.numericLabelGroup}>
                    <span style={{ ...styles.overrideDot, opacity: overrides[f.key] !== undefined ? 1 : 0 }} />
                    <input type="checkbox" checked={checked} onChange={(e) => setBoolean(f.key, e.target.checked)} />
                    <span style={styles.numericLabel}>{f.label}</span>
                    <span style={styles.numericKey}>{f.key as string}</span>
                  </span>
                </div>
                <span style={styles.sectionHint}>{f.hint}</span>
              </label>
            );
          })}
        </div>
        ))}
      </Section>

      <Section title={`Custom primitives${
        Object.keys(added).length ? ` (${Object.keys(added).length})` : ""
      }`}>
        <CustomPrimitivesSection
          added={added}
          mode={mode}
          onAdd={addPrimitive}
          onRemove={removePrimitive}
        />
      </Section>

        <Section title="Numeric primitives">
          <div style={styles.numericList}>
            {NUMERIC_FIELDS.map((f) => (
              <NumericRow
                key={f.key as string}
                label={f.label}
                tokenKey={f.key as string}
                min={f.min}
                max={f.max}
                step={f.step}
                suffix={f.suffix}
                value={
                  (overrides[f.key] as number | undefined) ??
                  (base[f.key] as number)
                }
                isOverridden={overrides[f.key] !== undefined}
                onChange={(v) => setNumeric(f.key, v)}
              />
            ))}
        </div>
      </Section>

      <MotionSection overrides={overrides} onNumeric={setNumeric} onString={setString} />

      <Section title="Light and relief">
        <p style={styles.sectionHint}>
          One light source turns every drop shadow and relief edge. Depth and
          sheen of 0 keep surfaces flat; posture-level choices are purpose
          tokens under <code style={styles.codeInline}>roles.relief</code>.
        </p>
        <div style={styles.numericList}>
          {RELIEF_NUMERIC_FIELDS.map((f) => (
            <NumericRow
              key={f.key as string}
              label={f.label}
              tokenKey={f.key as string}
              min={f.min}
              max={f.max}
              step={f.step}
              suffix={f.suffix}
              value={(overrides[f.key] as number | undefined) ?? (base[f.key] as number)}
              isOverridden={overrides[f.key] !== undefined}
              onChange={(v) => setNumeric(f.key, v)}
            />
          ))}
          {RELIEF_CHOICE_FIELDS.map((f) => {
            const value = (overrides[f.key] as string | undefined) ?? (base[f.key] as string);
            return (
              <label key={f.key} style={styles.numericRow}>
                <div style={styles.numericHeader}>
                  <span style={styles.numericLabelGroup}>
                    <span style={{ ...styles.overrideDot, opacity: overrides[f.key] !== undefined ? 1 : 0 }} />
                    <span style={styles.numericLabel}>{f.label}</span>
                    <span style={styles.numericKey}>{f.key}</span>
                  </span>
                </div>
                <select value={value} onChange={(e) => setString(f.key, e.target.value)} style={styles.stringInput}>
                  {f.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="ThemeStyleBlock Modifier Ratios">
        <p style={styles.sectionHint}>
          Multipliers applied by{" "}
          <code style={styles.codeInline}>{`<ThemeStyleBlock register="…">`}</code>{" "}
          over the root primitives.{" "}
          <code style={styles.codeInline}>register="normal"</code> always resets
          to 1×.
        </p>
        <RegisterRatioGroup label={`register="compact" (× root)`} overrides={overrides} onSet={setNumeric} keys={["compactSpacingRatio", "compactFontRatio", "compactBorderRadiusRatio"]} />
        <RegisterRatioGroup label={`register="display" (× root)`} overrides={overrides} onSet={setNumeric} keys={["displaySpacingRatio", "displayFontRatio", "displayBorderRadiusRatio"]} />
      </Section>

      <Section title="Font primitives">
        <div style={styles.numericList}>
          {STRING_FIELDS.map((f) => {
            const value =
              (overrides[f.key] as string | undefined) ??
              (base[f.key] as string);
            const isOverridden = overrides[f.key] !== undefined;
            // The three font-family primitives get the searchable Google-Fonts
            // picker (self-contained; loads the face on selection); any future
            // non-font string field falls back to the plain input row.
            const usePicker =
              f.key === "fontFamily" ||
              f.key === "fontFamilyHeading" ||
              f.key === "fontFamilyCode";
            return (
              <div key={f.key as string} style={styles.numericRow}>
                <div style={styles.numericHeader}>
                  <span style={styles.numericLabelGroup}>
                    <span
                      style={{
                        ...styles.overrideDot,
                        opacity: isOverridden ? 1 : 0,
                      }}
                    />
                    <span style={styles.numericLabel}>{f.label}</span>
                    <span style={styles.numericKey}>{f.key as string}</span>
                  </span>
                </div>
                {usePicker ? (
                  <FontPicker
                    pool={f.key === "fontFamilyCode" ? "code" : "text"}
                    value={value}
                    placeholder={f.placeholder ?? ""}
                    onChange={(v) => setString(f.key, v)}
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    placeholder={f.placeholder}
                    onChange={(e) => setString(f.key, e.target.value)}
                    style={styles.stringInput}
                    spellCheck={false}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <ComputedThemeSection
        overrides={overrides}
        bindings={bindings}
        added={added}
        onRebind={setBinding}
        mode={mode}
      />
    </div>
  );
};

// ---- Computed-theme reference ------------------------------------------------

/**
 * Read-only view of the fully-resolved `theme.*` getters for the current
 * mode + overrides. Lets a consumer of the panel see exactly which tokens
 * are available and what they evaluate to — without re-reading theme.ts.
 */
// Primitive key the rebinder targets — `string` (not the narrow
// `keyof Primitives["colors"]`) so custom keys added via the
// added-primitives store are also valid rebinding targets.
type RebindHandler = (
  getterPath: string,
  primitiveKey: string | null
) => void;

const CustomPrimitivesSection: React.FC<{
  added: AddedColorPrimitives;
  mode: ColorMode;
  onAdd: (key: string, light: string, dark: string) => void;
  onRemove: (key: string) => void;
}> = ({ added, mode, onAdd, onRemove }) => {
  const [draftKey, setDraftKey] = useState("");
  const [draftLight, setDraftLight] = useState("#888888");
  const [draftDark, setDraftDark] = useState("#888888");
  const taken = useMemo(() => {
    const s = new Set<string>(Object.keys(defaultPrimitives.colors));
    Object.keys(added).forEach((k) => s.add(k));
    return s;
  }, [added]);
  const err = draftKey ? validateNewPrimitiveKey(draftKey, taken) : null;
  const entries = Object.entries(added);

  const tryAdd = () => {
    const e = validateNewPrimitiveKey(draftKey, taken);
    if (e) return;
    onAdd(draftKey, draftLight, draftDark);
    setDraftKey("");
    setDraftLight("#888888");
    setDraftDark("#888888");
  };

  return (
    <div style={styles.colorPairList}>
      <ColorPairHeader mode={mode} />
      {entries.map(([key, pair]) => (
        <div key={key} style={styles.colorPairRow}>
          <span style={styles.colorPairRowLabel} title={key}>
            <span style={{ ...styles.overrideDot, opacity: 1 }} />
            <span style={styles.colorPairRowLabelText}>{key}</span>
          </span>
          <ColorPairCell
            value={pair.light}
            active={mode === "light"}
            onChange={(v) => onAdd(key, v, pair.dark)}
          />
          <ColorPairCell
            value={pair.dark}
            active={mode === "dark"}
            onChange={(v) => onAdd(key, pair.light, v)}
          />
        </div>
      ))}
      <div style={styles.customAddRow}>
        <input
          type="text"
          value={draftKey}
          onChange={(e) => setDraftKey(e.target.value)}
          placeholder="newPrimitive"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !err) tryAdd();
          }}
          style={styles.customAddInput}
          spellCheck={false}
        />
        <ColorPairCell
          value={draftLight}
          active={mode === "light"}
          onChange={setDraftLight}
        />
        <ColorPairCell
          value={draftDark}
          active={mode === "dark"}
          onChange={setDraftDark}
        />
      </div>
      <div style={styles.customAddActions}>
        {err && draftKey ? (
          <span style={styles.customAddError}>{err}</span>
        ) : (
          <span style={styles.customAddHint}>
            camelCase name, then pick light + dark
          </span>
        )}
        <button
          type="button"
          className="squonk-button"
          onClick={tryAdd}
          style={{
            opacity: !err && draftKey ? 1 : 0.4,
            pointerEvents: !err && draftKey ? "auto" : "none",
          }}
        >
          + Add
        </button>
      </div>
      {entries.length > 0 && (
        <div style={styles.customRemoveRow}>
          {entries.map(([key]) => (
            <button
              key={key}
              type="button"
              className="squonk-button"
              onClick={() => onRemove(key)}
              style={styles.customRemoveButton}
              title={`Remove custom primitive ${key} (and any bindings pointing at it)`}
            >
              × {key}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ComputedThemeSection: React.FC<{
  overrides: PrimitivesOverride;
  bindings: ColorBindingsOverride;
  added: AddedColorPrimitives;
  onRebind: RebindHandler;
  mode: ColorMode;
}> = ({ overrides, bindings, added, onRebind, mode }) => {
  const theme = useMemo(
    () => buildTheme(overrides, mode, bindings, added),
    [overrides, mode, bindings, added]
  );
  const customKeys = useMemo(() => Object.keys(added), [added]);
  // `mode` is metadata on the theme object, not a leaf to render.
  const themeWithoutMode = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(theme).filter(([k]) => k !== "mode")
      ),
    [theme]
  );

  return (
    <Section title={`Computed theme (${mode})`}>
      <div style={styles.tree}>
        {Object.entries(themeWithoutMode).map(([k, v]) => (
          <TreeNode
            key={k}
            name={k}
            path={k}
            value={v}
            mode={mode}
            level={0}
            bindings={bindings}
            customKeys={customKeys}
            onRebind={onRebind}
          />
        ))}
      </div>
    </Section>
  );
};

const TreeNode: React.FC<{
  name: string;
  path: string;
  value: unknown;
  mode: ColorMode;
  level: number;
  bindings: ColorBindingsOverride;
  customKeys: string[];
  onRebind: RebindHandler;
}> = ({ name, path, value, mode, level, bindings, customKeys, onRebind }) => {
  const isBranch = value !== null && typeof value === "object";
  if (!isBranch) {
    return (
      <TreeLeaf
        name={name}
        path={path}
        value={String(value)}
        mode={mode}
        level={level}
        bindings={bindings}
        customKeys={customKeys}
        onRebind={onRebind}
      />
    );
  }
  return (
    <TreeBranch
      name={name}
      path={path}
      value={value as object}
      mode={mode}
      level={level}
      bindings={bindings}
      customKeys={customKeys}
      onRebind={onRebind}
    />
  );
};

const TreeBranch: React.FC<{
  name: string;
  path: string;
  value: object;
  mode: ColorMode;
  level: number;
  bindings: ColorBindingsOverride;
  customKeys: string[];
  onRebind: RebindHandler;
}> = ({ name, path, value, mode, level, bindings, customKeys, onRebind }) => {
  const [open, setOpen] = useState(false);
  const childCount = Object.keys(value).length;
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      style={styles.treeBranch}
    >
      <summary
        style={{
          ...styles.treeBranchSummary,
          paddingLeft: 6 + level * 12,
        }}
      >
        <span
          style={{
            ...styles.treeChevron,
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          ›
        </span>
        <span style={styles.treeBranchName}>{name}</span>
        <span style={styles.treeBranchCount}>{childCount}</span>
      </summary>
      <div>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <TreeNode
            key={k}
            name={k}
            path={`${path}.${k}`}
            value={v}
            mode={mode}
            level={level + 1}
            bindings={bindings}
            customKeys={customKeys}
            onRebind={onRebind}
          />
        ))}
      </div>
    </details>
  );
};

const TreeLeaf: React.FC<{
  name: string;
  path: string;
  value: string;
  mode: ColorMode;
  level: number;
  bindings: ColorBindingsOverride;
  customKeys: string[];
  onRebind: RebindHandler;
}> = ({ name, path, value, mode, level, bindings, customKeys, onRebind }) => {
  const isColor = path.startsWith("colors.");
  const overrideKey = bindings[path];
  const isRebound = overrideKey !== undefined;
  return (
    <div
      style={{
        ...styles.treeLeaf,
        paddingLeft: 6 + level * 12 + 12, // align with branch name (skip chevron width)
      }}
    >
      <span style={styles.computedSwatchSlot}>{swatchFor(path, value)}</span>
      <span style={styles.computedNameCol}>
        <span style={styles.computedName}>{name}</span>
        {isColor ? (
          <BindingControl
            path={path}
            isRebound={isRebound}
            mode={mode}
            currentKey={overrideKey}
            customKeys={customKeys}
            onRebind={onRebind}
          />
        ) : (
          <span style={styles.computedBinding} title={resolveBinding(path, mode)}>
            {resolveBinding(path, mode)}
          </span>
        )}
      </span>
      <span style={styles.computedValue} title={value}>
        {value}
      </span>
    </div>
  );
};

/**
 * Inline `<select>` that lets the user rebind a color getter to a
 * different primitive color key — built-in OR custom. The "default"
 * option clears any override and falls back to the built-in
 * `themeBindings` entry.
 */
const BindingControl: React.FC<{
  path: string;
  isRebound: boolean;
  mode: ColorMode;
  currentKey: string | undefined;
  customKeys: string[];
  onRebind: RebindHandler;
}> = ({ path, isRebound, mode, currentKey, customKeys, onRebind }) => {
  const defaultLabel = resolveBinding(path, mode);
  const prefix = mode === "dark" ? "darkColors" : "colors";
  return (
    <select
      value={currentKey ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onRebind(path, v === "" ? null : v);
      }}
      style={{
        ...styles.computedBinding,
        ...styles.bindingSelect,
        ...(isRebound ? styles.bindingSelectRebound : null),
      }}
      title={
        isRebound
          ? `Rebound to ${prefix}.${currentKey}`
          : `Default: ${defaultLabel}`
      }
    >
      <option value="">↺ {defaultLabel}</option>
      {COLOR_PRIMITIVE_KEYS.map((k) => (
        <option key={k} value={k}>
          → {prefix}.{k}
        </option>
      ))}
      {customKeys.length > 0 && (
        <optgroup label="Custom">
          {customKeys.map((k) => (
            <option key={k} value={k}>
              ★ {prefix}.{k}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
};

export function swatchFor(path: string, value: string): React.ReactNode {
  if (path.startsWith("colors.")) return <ColorSwatch color={value} />;
  if (path.startsWith("spacing.")) return <SpacingSwatch px={value} />;
  if (path.startsWith("borders.radius.")) return <RadiusSwatch radius={value} />;
  if (path.startsWith("shadows.")) return <ShadowSwatch shadow={value} />;
  if (path.startsWith("typography.sizes.")) return <FontSwatch size={value} />;
  if (path.startsWith("typography.weights.")) {
    return <FontSwatch weight={Number(value)} />;
  }
  return null;
}

const ColorSwatch: React.FC<{ color: string }> = ({ color }) => (
  <span style={{ ...styles.swatchBox, background: color }} />
);

const SpacingSwatch: React.FC<{ px: string }> = ({ px }) => {
  const numeric = parseFloat(px) || 0;
  return (
    <span
      style={{
        ...styles.swatchBox,
        width: Math.min(numeric, 22),
        background: "var(--sb-accent)",
        opacity: numeric === 0 ? 0.2 : 0.85,
      }}
    />
  );
};

const RadiusSwatch: React.FC<{ radius: string }> = ({ radius }) => (
  <span
    style={{
      ...styles.swatchBox,
      borderRadius: radius,
      background: "var(--sb-border-strong)",
    }}
  />
);

const ShadowSwatch: React.FC<{ shadow: string }> = ({ shadow }) => (
  <span
    style={{
      ...styles.swatchBox,
      background: "var(--sb-bg-raised)",
      boxShadow: shadow,
    }}
  />
);

const FontSwatch: React.FC<{ size?: string; weight?: number }> = ({
  size,
  weight,
}) => (
  <span
    style={{
      ...styles.swatchBox,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "transparent",
      color: "var(--sb-fg)",
      fontSize: size ? `min(${size}, 14px)` : 12,
      fontWeight: weight ?? 500,
      lineHeight: 1,
    }}
  >
    Aa
  </span>
);

// --- Subcomponents ---

const Toolbar: React.FC<{
  hasOverrides: boolean;
  copied: boolean;
  exported: boolean;
  importOpen: boolean;
  onReset: () => void;
  onCopy: () => void;
  onExport: () => void;
  onImport: () => void;
}> = ({
  hasOverrides,
  copied,
  exported,
  importOpen,
  onReset,
  onCopy,
  onExport,
  onImport,
}) => (
  <div style={styles.toolbar}>
    <button
      type="button"
      className="squonk-button"
      style={{
        opacity: hasOverrides ? 1 : 0.4,
        pointerEvents: hasOverrides ? "auto" : "none",
      }}
      onClick={onReset}
    >
      Reset
    </button>
    <button
      type="button"
      className="squonk-button"
      style={{
        opacity: hasOverrides ? 1 : 0.4,
        pointerEvents: hasOverrides ? "auto" : "none",
      }}
      onClick={onExport}
      title="Copy the full theme document (primitives, colour bindings, custom primitives and purpose bindings) as JSON"
    >
      {exported ? "✓ Exported" : "Export"}
    </button>
    <button
      type="button"
      className="squonk-button"
      onClick={onImport}
      title="Paste a theme document JSON and apply it"
      style={importOpen ? styles.toolbarButtonActive : undefined}
    >
      Import
    </button>
    <button
      type="button"
      className="squonk-button"
      style={{
        opacity: hasOverrides ? 1 : 0.4,
        pointerEvents: hasOverrides ? "auto" : "none",
        marginLeft: "auto",
      }}
      onClick={onCopy}
      title="Copy what changed: primitives for src/theme/theme.ts, and colorBindings / roleBindings for your SquonkThemeProvider"
    >
      {copied ? "✓ Copied" : "Copy diff"}
    </button>
  </div>
);

const ImportPanel: React.FC<{
  onApply: (doc: ThemeDocument) => void;
  onClose: () => void;
}> = ({ onApply, onClose }) => {
  const [text, setText] = useState("");
  const result = useMemo(
    () => (text.trim() ? parseThemeDocument(text) : null),
    [text]
  );
  const canApply = result?.ok === true;
  return (
    <div style={styles.importPanel}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Paste a theme document, e.g. {"version":1,"primitives":{...},"bindings":{...},"addedPrimitives":{...},"roleBindings":{...}}'
        spellCheck={false}
        rows={5}
        style={styles.importTextarea}
      />
      <div style={styles.importActions}>
        {result && !result.ok ? (
          <span style={styles.customAddError}>{result.error}</span>
        ) : (
          <span style={styles.customAddHint}>
            {canApply ? "Looks valid — Apply to overwrite current state" : "Paste JSON to validate"}
          </span>
        )}
        <span style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="squonk-button"
            onClick={onClose}
            style={{ fontSize: 10, padding: "2px 8px" }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="squonk-button"
            onClick={() => {
              if (result?.ok) onApply(result.doc);
            }}
            style={{
              fontSize: 10,
              padding: "2px 8px",
              opacity: canApply ? 1 : 0.4,
              pointerEvents: canApply ? "auto" : "none",
            }}
          >
            Apply
          </button>
        </span>
      </div>
    </div>
  );
};

const SECTION_STORAGE_KEY = "squonk-theme-panel-open-sections";

const readOpenSections = (): Record<string, boolean> => {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SECTION_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
};

const writeOpenSection = (key: string, open: boolean) => {
  try {
    const next = { ...readOpenSections() };
    if (open) next[key] = true;
    else delete next[key];
    window.localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the section still opens and closes, it just isn't remembered */
  }
};

/**
 * A collapsible panel section. Every section starts closed; the ones you
 * open are remembered in local storage. Sections are keyed by their title
 * without a trailing count or mode ("Custom primitives (2)" → "Custom
 * primitives"), or by `storageKey`.
 */
export const Section: React.FC<{
  title: string;
  storageKey?: string;
  children: React.ReactNode;
}> = ({ title, storageKey, children }) => {
  const key = storageKey ?? title.replace(/\s*\([^)]*\)\s*$/, "");
  const [open, setOpen] = useState(() => readOpenSections()[key] === true);
  return (
    <details
      open={open}
      onToggle={(event) => {
        const next = event.currentTarget.open;
        if (next === open) return;
        setOpen(next);
        writeOpenSection(key, next);
      }}
      style={styles.section}
    >
      <summary style={styles.summary}>{title}</summary>
      <div style={styles.sectionBody}>{children}</div>
    </details>
  );
};

/**
 * The example theme the whole Storybook shows, as the toolbar menu and the
 * introduction's dropdown set it. Everything below edits on top of it.
 */
const ThemePresetPicker: React.FC = () => {
  // The dock renders outside the manager API's context, so follow the
  // globals over the channel, as the preview does.
  const themeId = useThemeGlobal();
  const updateGlobals = (globals: Record<string, string>) => addons.getChannel().emit(UPDATE_GLOBALS, { globals });
  const current = exampleTheme(themeId);
  return (
    <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid rgba(128, 128, 128, 0.25)" }}>
      <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 600 }}>
        Theme
        <select
          value={current.id}
          onChange={(event) => updateGlobals({ theme: event.target.value })}
          style={{ font: "inherit", fontWeight: 400, padding: "4px 6px", borderRadius: 4 }}
        >
          {EXAMPLE_THEMES.map((theme) => (
            <option key={theme.id} value={theme.id}>{theme.name}</option>
          ))}
        </select>
      </label>
      <p style={{ ...styles.sectionHint, margin: "4px 0 0" }}>
        {current.description} Your edits below apply on top of it.
      </p>
    </div>
  );
};

const ColorPairHeader: React.FC<{ mode: ColorMode }> = ({ mode }) => (
  <div style={styles.colorPairHeader}>
    <span />
    <span
      style={{
        ...styles.colorPairHeaderCol,
        ...(mode === "light" ? styles.colorPairColActive : null),
      }}
    >
      Light
    </span>
    <span
      style={{
        ...styles.colorPairHeaderCol,
        ...(mode === "dark" ? styles.colorPairColActive : null),
      }}
    >
      Dark
    </span>
  </div>
);

const ColorPairRow: React.FC<{
  label: string;
  mode: ColorMode;
  light: string;
  dark: string;
  lightDefault: string;
  darkDefault: string;
  onLightChange: (v: string) => void;
  onDarkChange: (v: string) => void;
}> = ({
  label,
  mode,
  light,
  dark,
  lightDefault,
  darkDefault,
  onLightChange,
  onDarkChange,
}) => {
  const lightOverridden = light.toLowerCase() !== lightDefault.toLowerCase();
  const darkOverridden = dark.toLowerCase() !== darkDefault.toLowerCase();
  return (
    <div style={styles.colorPairRow}>
      <span style={styles.colorPairRowLabel} title={label}>
        <span
          style={{
            ...styles.overrideDot,
            opacity: lightOverridden || darkOverridden ? 1 : 0,
          }}
        />
        <span style={styles.colorPairRowLabelText}>{label}</span>
      </span>
      <ColorPairCell
        value={light}
        active={mode === "light"}
        onChange={onLightChange}
      />
      <ColorPairCell
        value={dark}
        active={mode === "dark"}
        onChange={onDarkChange}
      />
    </div>
  );
};

const ColorPairCell: React.FC<{
  value: string;
  active: boolean;
  onChange: (v: string) => void;
}> = ({ value, active, onChange }) => (
  <span
    style={{
      ...styles.colorPairCell,
      ...(active ? styles.colorPairCellActive : null),
    }}
  >
    <input
      type="color"
      value={nativeColorInputValue(value)}
      onChange={(e) => onChange(e.target.value)}
      style={styles.colorPairColorInput}
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.colorPairTextInput}
      spellCheck={false}
    />
  </span>
);

const RegisterRatioGroup: React.FC<{
  label: string;
  overrides: PrimitivesOverride;
  onSet: (key: keyof Primitives, value: number) => void;
  keys: Array<keyof Primitives>;
}> = ({ label, overrides, onSet, keys }) => {
  const base = useBasePrimitives();
  const fields = useMemo(
    () => RATIO_FIELDS.filter((f) => keys.includes(f.key)),
    [keys]
  );
  return (
    <div style={styles.ratioGroup}>
      <div style={styles.ratioGroupLabel}>{label}</div>
      <div style={styles.numericList}>
        {fields.map((f) => (
          <NumericRow
            key={f.key as string}
            label={f.label}
            tokenKey={f.key as string}
            min={f.min}
            max={f.max}
            step={f.step}
            suffix=""
            value={
              (overrides[f.key] as number | undefined) ??
              (base[f.key] as number)
            }
            isOverridden={overrides[f.key] !== undefined}
            onChange={(v) => onSet(f.key, v)}
          />
        ))}
      </div>
    </div>
  );
};

export const NumericRow: React.FC<{
  label: string;
  tokenKey: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  isOverridden: boolean;
  onChange: (v: number) => void;
}> = ({
  label,
  tokenKey,
  value,
  min,
  max,
  step,
  suffix,
  isOverridden,
  onChange,
}) => (
  <div style={styles.numericRow}>
    <div style={styles.numericHeader}>
      <span style={styles.numericLabelGroup}>
        <span
          style={{
            ...styles.overrideDot,
            opacity: isOverridden ? 1 : 0,
          }}
        />
        <span style={styles.numericLabel}>{label}</span>
        <span style={styles.numericKey}>{tokenKey}</span>
      </span>
      <span style={styles.numericValue}>
        {value}
        {suffix}
      </span>
    </div>
    <div style={styles.numericInputs}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={styles.range}
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={styles.numberInput}
      />
    </div>
  </div>
);

// --- Styles ---

// All palette values come from CSS variables set on html[data-mode=...] by
// .storybook/manager.ts, so the panel re-skins with the rest of Storybook.
// The dock provides the surface; cards inside it use --sb-card-bg which
// gives a one-step elevation (subtly darker in light mode, one shade
// lighter in dark mode — the inverse-elevation pattern that keeps a
// consistent "raised card" metaphor across modes).
const C = {
  bg: "var(--sb-dock-bg)",
  bgRaised: "var(--sb-card-bg)",
  bgInput: "var(--sb-bg-input)",
  fg: "var(--sb-fg)",
  fgMuted: "var(--sb-fg)",
  fgDim: "var(--sb-fg-dim)",
  accent: "var(--sb-accent)",
  border: "var(--sb-border)",
  borderStrong: "var(--sb-border-strong)",
} as const;

const monoFamily =
  'ui-monospace, Menlo, Monaco, "Roboto Mono", monospace';

export const styles: Record<string, React.CSSProperties> = {
  root: {
    padding: 14,
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 12,
    color: C.fg,
    background: C.bg,
    overflowY: "auto",
    height: "100%",
    boxSizing: "border-box",
  },
  toolbar: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 14,
    borderBottom: `1px solid ${C.border}`,
    position: "sticky",
    top: -14,
    background: C.bg,
    zIndex: 1,
  },
  toolbarButtonActive: {
    background: "color-mix(in srgb, var(--sb-accent) 18%, transparent)",
    borderColor: "color-mix(in srgb, var(--sb-accent) 50%, transparent)",
  },
  importPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: 10,
    marginBottom: 12,
    background: C.bgRaised,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
  },
  importTextarea: {
    width: "100%",
    boxSizing: "border-box",
    fontFamily: monoFamily,
    fontSize: 11,
    padding: 6,
    border: `1px solid ${C.border}`,
    borderRadius: 4,
    background: C.bgInput,
    color: C.fg,
    outline: "none",
    resize: "vertical",
    minHeight: 80,
  },
  importActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  section: {
    marginBottom: 10,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    background: C.bgRaised,
  },
  summary: {
    cursor: "pointer",
    fontWeight: 600,
    padding: "9px 11px",
    listStyle: "revert",
    userSelect: "none",
    color: C.fg,
    letterSpacing: "0.01em",
  },
  sectionBody: {
    padding: "4px 11px 12px",
  },
  colorPairHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 90px 90px",
    gap: 8,
    padding: "4px 4px 6px",
    alignItems: "center",
    borderBottom: `1px solid ${C.border}`,
    marginBottom: 4,
  },
  colorPairHeaderCol: {
    fontFamily: monoFamily,
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: C.fgDim,
    padding: "2px 6px",
    borderRadius: 4,
    textAlign: "center",
  },
  colorPairColActive: {
    color: C.fg,
    background: "color-mix(in srgb, var(--sb-accent) 14%, transparent)",
  },
  colorPairList: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  colorPairRow: {
    display: "grid",
    gridTemplateColumns: "1fr 90px 90px",
    gap: 8,
    alignItems: "center",
    padding: "3px 4px",
    borderRadius: 4,
  },
  colorPairRowLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: monoFamily,
    fontSize: 11,
    color: C.fg,
    minWidth: 0,
  },
  colorPairRowLabelText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  colorPairCell: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 4px",
    borderRadius: 4,
    background: "transparent",
    transition: "background 160ms ease",
  },
  colorPairCellActive: {
    background: "color-mix(in srgb, var(--sb-accent) 9%, transparent)",
  },
  colorPairColorInput: {
    width: 22,
    height: 20,
    padding: 0,
    border: `1px solid ${C.borderStrong}`,
    borderRadius: 4,
    background: "none",
    cursor: "pointer",
    flexShrink: 0,
  },
  colorPairTextInput: {
    width: "100%",
    minWidth: 0,
    fontFamily: monoFamily,
    fontSize: 11,
    padding: "3px 4px",
    border: `1px solid ${C.border}`,
    borderRadius: 4,
    background: C.bgInput,
    color: C.fg,
    outline: "none",
  },
  numericList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  numericRow: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  numericHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  numericLabelGroup: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  numericLabel: {
    fontWeight: 500,
    color: C.fg,
  },
  numericKey: {
    fontFamily: monoFamily,
    fontSize: 10,
    color: C.fgDim,
  },
  numericValue: {
    fontFamily: monoFamily,
    fontSize: 11,
    fontWeight: 600,
    color: C.fgMuted,
  },
  numericInputs: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  range: {
    flex: 1,
    accentColor: C.fgMuted,
  },
  numberInput: {
    width: 64,
    fontFamily: monoFamily,
    fontSize: 11,
    padding: "3px 6px",
    border: `1px solid ${C.border}`,
    borderRadius: 4,
    background: C.bgInput,
    color: C.fg,
    outline: "none",
  },
  overrideDot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    background: C.accent,
    display: "inline-block",
    transition: "opacity 160ms ease",
  },
  stringInput: {
    width: "100%",
    boxSizing: "border-box",
    fontFamily: monoFamily,
    fontSize: 11,
    padding: "5px 8px",
    border: `1px solid ${C.border}`,
    borderRadius: 4,
    background: C.bgInput,
    color: C.fg,
    outline: "none",
  },
  tree: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  treeBranch: {
    // no inline border, no margin — branches stack flush
  },
  treeBranchSummary: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 4px",
    cursor: "pointer",
    userSelect: "none",
    listStyle: "none",
    borderRadius: 4,
    color: C.fg,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.01em",
  },
  treeChevron: {
    display: "inline-block",
    width: 10,
    textAlign: "center",
    fontFamily: monoFamily,
    fontSize: 14,
    color: C.fgDim,
    transition: "transform 160ms ease",
    flexShrink: 0,
  },
  treeBranchName: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  treeBranchCount: {
    fontFamily: monoFamily,
    fontSize: 10,
    color: C.fgDim,
    padding: "1px 6px",
    borderRadius: 9999,
    background: "color-mix(in srgb, var(--sb-fg) 8%, transparent)",
    fontWeight: 400,
  },
  treeLeaf: {
    display: "grid",
    gridTemplateColumns: "20px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 8,
    padding: "3px 4px",
    fontFamily: monoFamily,
    fontSize: 11,
    color: C.fg,
    borderRadius: 4,
  },
  computedSwatchSlot: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
  },
  computedNameCol: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    gap: 1,
    lineHeight: 1.2,
  },
  computedName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  computedBinding: {
    fontFamily: monoFamily,
    fontSize: 9,
    color: C.fgDim,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  bindingSelect: {
    background: "transparent",
    border: "1px solid transparent",
    padding: "1px 4px",
    margin: "-1px -4px",
    borderRadius: 3,
    cursor: "pointer",
    color: C.fgDim,
    outline: "none",
    appearance: "none",
    // Show the select's chrome on hover/focus so it's discoverable
    // without cluttering the resting row.
  },
  bindingSelectRebound: {
    color: C.fg,
    background: "color-mix(in srgb, var(--sb-accent) 12%, transparent)",
    border: `1px solid color-mix(in srgb, var(--sb-accent) 30%, transparent)`,
  },
  customAddRow: {
    display: "grid",
    gridTemplateColumns: "1fr 90px 90px",
    gap: 8,
    alignItems: "center",
    padding: "6px 4px 2px",
    borderTop: `1px dashed ${C.border}`,
    marginTop: 4,
  },
  customAddInput: {
    width: "100%",
    minWidth: 0,
    fontFamily: monoFamily,
    fontSize: 11,
    padding: "3px 6px",
    border: `1px solid ${C.border}`,
    borderRadius: 4,
    background: C.bgInput,
    color: C.fg,
    outline: "none",
  },
  customAddActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "0 4px 6px",
  },
  customAddHint: {
    fontFamily: monoFamily,
    fontSize: 10,
    color: C.fgDim,
  },
  customAddError: {
    fontFamily: monoFamily,
    fontSize: 10,
    color: "var(--sb-accent)",
  },
  customRemoveRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    padding: "8px 4px 0",
    borderTop: `1px solid ${C.border}`,
    marginTop: 6,
  },
  customRemoveButton: {
    fontSize: 10,
    padding: "2px 8px",
  },
  computedValue: {
    color: C.fgDim,
    maxWidth: 140,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  sectionHint: {
    margin: "0 0 10px",
    fontSize: 11,
    lineHeight: 1.5,
    color: C.fgDim,
  },
  codeInline: {
    fontFamily: monoFamily,
    fontSize: 10.5,
    padding: "1px 5px",
    background: "color-mix(in srgb, var(--sb-fg) 7%, transparent)",
    color: C.fg,
    borderRadius: 3,
  },
  ratioGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "8px 0 10px",
    borderTop: `1px dashed ${C.border}`,
    marginTop: 8,
  },
  ratioGroupLabel: {
    fontFamily: monoFamily,
    fontSize: 10,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: C.fgDim,
  },
  swatchBox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    border: `1px solid ${C.border}`,
    display: "inline-block",
  },
};
