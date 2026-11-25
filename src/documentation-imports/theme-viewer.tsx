import { clsx } from "clsx";
import React, { useMemo, useState } from "react";
import { Badge } from "../components/functional/badge/badge";
import { Button } from "../components/functional/button/button";
import { TextField } from "../components/functional/text-field/text-field";
import { Presentation } from "../components/style/presentation/presentation";
import {
  computedRoleReasons,
  defaultPurposeBindings,
  purposeReasons,
  resolveRoleBindings,
  type ResolvedRoleBindings,
  type RoleBindingsOverride,
} from "../theme/purpose";
import {
  type AddedColorPrimitives,
  type ColorBindingsOverride,
  type ColorMode,
  type Primitives,
  type PrimitivesOverride,
  buildTheme,
  mergePrimitives,
  resolveBinding,
} from "../theme/theme";
import { derivedColorTokens, themeCssVariables, themeCssVarName } from "../theme/theme-css-vars";
import { type SquonkTheme, useSquonkTheme } from "../theme/theme-context";
import { useThemeCssVars } from "../theme/use-theme-css-vars";
import styles from "./theme-viewer.module.css";

type View = "both" | "getters" | "resolved";

/** primitive: an input; raw: a scale step or palette value; derived: a colour computed for contrast; purpose: a shared decision; component: one component's decision. */
type Layer = "primitive" | "raw" | "derived" | "purpose" | "component";

export interface ThemeViewerProps {
  /** Primitive overrides, such as those set in the Theme Controls panel. */
  overrides?: PrimitivesOverride;
  /** Colour getters re-pointed at another primitive. */
  bindings?: ColorBindingsOverride;
  /** Custom colour primitives added at runtime. */
  added?: AddedColorPrimitives;
  /** Purpose and component tokens re-pointed at another token or a value. */
  roleBindings?: RoleBindingsOverride;
  /** Mode to compute; defaults to the surrounding theme's mode. */
  mode?: ColorMode;
}

const isColor = (value: unknown): value is string =>
  typeof value === "string" && /^(#|rgba?\(|hsla?\()/.test(value);

const getterFor = (
  path: string,
  mode: ColorMode,
  bindings: ColorBindingsOverride
) => {
  const rebound = bindings[path];
  if (rebound) return `${mode === "dark" ? "darkColors" : "colors"}.${rebound}`;
  return resolveBinding(path, mode);
};

// Shows the formula with the live primitive values in place of their names.
const substitute = (formula: string, primitives: Primitives): string | null => {
  if (formula.startsWith("literal") || /^(dark)?[cC]olors\./.test(formula))
    return null;
  let changed = false;
  const result = formula.replace(/\b[a-zA-Z]+\b/g, (name) => {
    const value = (primitives as Record<string, unknown>)[name];
    if (typeof value === "number") {
      changed = true;
      return String(value);
    }
    return name;
  });
  return changed ? result : null;
};

// A row is changed when the panel rebinds it or overrides a primitive it reads.
const isChanged = (
  path: string,
  getter: string,
  overrides: PrimitivesOverride,
  bindings: ColorBindingsOverride
) => {
  if (bindings[path]) return true;
  const colour = getter.match(/^(colors|darkColors)\.(\w+)$/);
  if (colour) {
    const palette = (
      overrides as Record<string, Record<string, unknown> | undefined>
    )[colour[1]];
    return palette?.[colour[2]] !== undefined;
  }
  return (getter.match(/\b[a-zA-Z]+\b/g) ?? []).some(
    (name) => (overrides as Record<string, unknown>)[name] !== undefined
  );
};

/** How a purpose or component token gets its value now. */
interface PurposeInfo {
  /** What it is bound to: a token path or a literal value. */
  bind: string;
  /** Purposes passed through on the way to the raw token or value. */
  chain: string[];
  why?: string;
  /** Computed by the theme (radius, elevation) unless re-pointed. */
  computed?: boolean;
  changed: boolean;
}

const purposeInfo = (roleBindings: ResolvedRoleBindings, computedPaths: string[]) => {
  const defaults = defaultPurposeBindings();
  const reasons = purposeReasons();
  const out = new Map<string, PurposeInfo>();
  for (const path of Object.keys(defaults)) {
    const chain: string[] = [];
    let changed = false;
    let at = path;
    let bind = defaults[path];
    for (const seen = new Set([path]); ; ) {
      if (roleBindings[at] !== undefined) {
        bind = roleBindings[at]!;
        changed = true;
      }
      if (!(bind in defaults) || seen.has(bind)) break;
      chain.push(bind);
      seen.add(bind);
      at = bind;
      bind = defaults[bind];
    }
    // Register-stepped tokens share their parent's reason.
    const why = reasons[path] ?? reasons[path.split(".").slice(0, -1).join(".")];
    out.set(path, { bind, chain, why, changed });
  }
  for (const path of computedPaths) {
    const rebound = roleBindings[path];
    out.set(path, {
      bind: rebound ?? "computed",
      chain: [],
      why: computedRoleReasons[path],
      computed: rebound === undefined,
      changed: rebound !== undefined,
    });
  }
  return out;
};

const leafPaths = (node: unknown, path: string[]): string[] =>
  node !== null && typeof node === "object"
    ? Object.entries(node).flatMap(([key, value]) => leafPaths(value, [...path, key]))
    : [path.join(".")];

const setIn = (tree: Record<string, unknown>, keys: string[], value: unknown) => {
  let node = tree;
  for (const key of keys.slice(0, -1))
    node = (node[key] ??= {}) as Record<string, unknown>;
  node[keys[keys.length - 1]] = value;
};

const Preview = ({
  path,
  value,
  docs,
}: {
  path: string;
  value: unknown;
  docs: SquonkTheme;
}) => {
  const text = String(value);
  if (isColor(value))
    return <span className={styles.tile} style={{ background: text }} />;
  if (path.startsWith("spacing.") || path.startsWith("roles.space.")) {
    const px = parseFloat(text) || 0;
    return (
      <span
        className={styles.bar}
        style={{
          inlineSize: Math.min(px, 112),
          opacity: px ? 1 : 0.25,
          minInlineSize: 2,
        }}
      />
    );
  }
  if (path.startsWith("borders.radius.") || path.startsWith("roles.radius."))
    return (
      <span
        className={styles.tile}
        style={{
          borderRadius: `min(${text}, 0.875rem)`,
          background: docs.colors.border.strong,
        }}
      />
    );
  if (path.startsWith("shadows.") || path.startsWith("roles.elevation."))
    return (
      <span
        className={styles.tile}
        style={{
          boxShadow: text,
          background: docs.colors.background.default,
          border: "none",
        }}
      />
    );
  if (
    path.startsWith("typography.sizes.") ||
    path.startsWith("presentation.headingSizes.")
  ) {
    return (
      <span
        className={styles.glyph}
        style={{ fontSize: `min(${text}, 2.5rem)` }}
      >
        Aa
      </span>
    );
  }
  if (path.startsWith("typography.weights."))
    return (
      <span
        className={styles.glyph}
        style={{ fontSize: "1.25rem", fontWeight: Number(value) }}
      >
        Aa
      </span>
    );
  if (path.startsWith("typography.fonts."))
    return (
      <span
        className={styles.glyph}
        style={{ fontSize: "1.25rem", fontFamily: text }}
      >
        Aa
      </span>
    );
  return null;
};

interface Context {
  mode: ColorMode;
  primitives: Primitives;
  overrides: PrimitivesOverride;
  bindings: ColorBindingsOverride;
  purposes: Map<string, PurposeInfo>;
}

interface NodeProps {
  name: string;
  value: unknown;
  path: string;
  layer: Layer;
  depth: number;
  view: View;
  openDepth: number;
  context: Context;
}

const countLeaves = (value: object): number =>
  Object.values(value).reduce<number>(
    (n, v) => n + (v && typeof v === "object" ? countLeaves(v) : 1),
    0
  );

/** The getter column for one row: its formula or binding, and whether the panel changed it. */
const describe = (path: string, layer: Layer, context: Context) => {
  if (layer === "primitive") {
    const keys = path.split(".");
    const override = keys.reduce<unknown>(
      (node, key) => (node as Record<string, unknown> | undefined)?.[key],
      context.overrides
    );
    return { getter: "primitive", detail: null, why: undefined, changed: override !== undefined };
  }
  if (layer === "derived")
    return { getter: "derived for contrast", detail: null, why: undefined, changed: false };
  if (layer === "purpose" || layer === "component") {
    const info = context.purposes.get(path);
    if (!info) return { getter: "", detail: null, why: undefined, changed: false };
    const getter = info.computed ? "computed from primitives" : [...info.chain, info.bind].join(" → ");
    return { getter, detail: null, why: info.why, changed: info.changed };
  }
  const getter = getterFor(path, context.mode, context.bindings);
  return {
    getter,
    detail: substitute(getter, context.primitives),
    why: undefined,
    changed: isChanged(path, getter, context.overrides, context.bindings),
  };
};

/** The raw token a purpose finally reads, so its preview matches the scale it comes from. */
const previewPath = (path: string, layer: Layer, context: Context) => {
  if (layer !== "purpose" && layer !== "component") return path;
  const bind = context.purposes.get(path)?.bind;
  return bind && /^[a-z][\w.]*$/i.test(bind) && bind.includes(".") ? bind : path;
};

const Node = ({
  name,
  value,
  path,
  layer,
  depth,
  view,
  openDepth,
  context,
}: NodeProps) => {
  const docs = useSquonkTheme();
  if (value && typeof value === "object") {
    return (
      <details
        className={clsx(styles.details, depth === 0 && styles.top)}
        open={depth < openDepth}
      >
        <summary
          className={clsx(styles.summary, depth === 0 && styles.top)}
          style={{ "--depth": depth }}
        >
          {name}
          <span className={styles.count}>{countLeaves(value)}</span>
        </summary>
        {Object.entries(value).map(([key, child]) => (
          <Node
            key={key}
            name={key}
            value={child}
            path={path ? `${path}.${key}` : key}
            layer={layer}
            depth={depth + 1}
            view={view}
            openDepth={openDepth}
            context={context}
          />
        ))}
      </details>
    );
  }
  const { getter, detail, why, changed } = describe(path, layer, context);
  return (
    <div className={styles.row} data-view={view}>
      <span className={styles.keyCell} style={{ "--depth": depth - 1 }}>
        <code className={styles.mono}>{name}</code>
        {changed ? (
          <Badge tone="primary" variant="subtle">
            changed
          </Badge>
        ) : null}
      </span>
      {view !== "getters" ? (
        <span>
          <Preview path={previewPath(path, layer, context)} value={value} docs={docs} />
        </span>
      ) : null}
      {view !== "resolved" ? (
        <span>
          <code className={styles.mono} data-tone="secondary">
            {getter}
          </code>
          {detail ? (
            <>
              {" "}
              <code className={styles.mono} data-tone="muted">
                = {detail}
              </code>
            </>
          ) : null}
          {why ? <span className={styles.why}>{why}</span> : null}
        </span>
      ) : null}
      {view !== "getters" ? (
        <code className={styles.mono}>{String(value)}</code>
      ) : null}
    </div>
  );
};

interface Group {
  key: string;
  title: string;
  /** Prefix of every path in the group; empty for primitives. */
  base: string;
  layer: Layer;
  tree: Record<string, unknown>;
}

const LAYERS: { id: Layer | "all"; label: string; hint: string }[] = [
  { id: "all", label: "All layers", hint: "" },
  { id: "primitive", label: "Primitives", hint: "The few inputs everything else is computed from." },
  { id: "raw", label: "Raw scales", hint: "Scale steps and palette values derived from the primitives. Components don't read these directly." },
  { id: "derived", label: "Derived colours", hint: "Colours the theme computes so text stays readable on each background and tone." },
  { id: "purpose", label: "Purpose tokens", hint: "Shared decisions, named for what they're for. Each is bound to a raw token, another purpose or a value." },
  { id: "component", label: "Component tokens", hint: "One component's own decisions, usually bound to a purpose." },
];

/** Keep only the leaves whose path or reason matches the query. */
const filterTree = (
  tree: Record<string, unknown>,
  base: string,
  match: (path: string) => boolean
): Record<string, unknown> | null => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = base ? `${base}.${key}` : key;
    if (value && typeof value === "object") {
      const child = filterTree(value as Record<string, unknown>, path, match);
      if (child) out[key] = child;
    } else if (match(path)) out[key] = value;
  }
  return Object.keys(out).length ? out : null;
};

/**
 * Every value in the theme, layer by layer: the primitives, the raw scales
 * derived from them, the contrast colours, and the purpose and component
 * tokens components read. Each row shows its getter or binding, a preview
 * and the resolved value; purposes also show why they exist.
 */
export const ThemeViewer = ({
  overrides = {},
  bindings = {},
  added = {},
  roleBindings = {},
  mode,
}: ThemeViewerProps) => {
  const docs = useSquonkTheme();
  const themeVars = useThemeCssVars();
  const activeMode = mode ?? docs.mode;
  const computed = useMemo(
    () => buildTheme(overrides, activeMode, bindings, added, roleBindings),
    [overrides, activeMode, bindings, added, roleBindings]
  );
  const primitives = useMemo(() => mergePrimitives(overrides), [overrides]);
  const { groups, purposes } = useMemo(() => {
    const vars = themeCssVariables(computed);
    const valueOf = (path: string) => vars[themeCssVarName(path.split("."))];
    const computedRoles = leafPaths(computed.roles, ["roles"]);
    const purposes = purposeInfo(resolveRoleBindings(roleBindings, activeMode), computedRoles);
    const roles: Record<string, unknown> = {};
    const components: Record<string, unknown> = {};
    for (const path of purposes.keys()) {
      const [top, ...rest] = path.split(".");
      setIn(top === "components" ? components : roles, rest, valueOf(path));
    }
    const raw: Partial<typeof computed> = { ...computed };
    delete raw.mode;
    delete raw.roleBindings;
    delete raw.roles;
    const groups: Group[] = [
      { key: "primitives", title: "primitives", base: "", layer: "primitive", tree: primitives as unknown as Record<string, unknown> },
      ...Object.entries(raw).map(([key, value]): Group => ({
        key,
        title: key,
        base: key,
        layer: "raw",
        tree: value as Record<string, unknown>,
      })),
      { key: "derived", title: "colors (derived)", base: "colors", layer: "derived", tree: derivedColorTokens(computed) as Record<string, unknown> },
      { key: "roles", title: "roles", base: "roles", layer: "purpose", tree: roles },
      { key: "components", title: "components", base: "components", layer: "component", tree: components },
    ];
    return { groups, purposes };
  }, [computed, primitives, roleBindings, activeMode]);
  const [view, setView] = useState<View>("both");
  const [layer, setLayer] = useState<Layer | "all">("all");
  const [query, setQuery] = useState("");
  // Changing the key remounts the tree so expand/collapse-all resets every group.
  const [expansion, setExpansion] = useState({ openDepth: 1, key: 0 });
  const context: Context = { mode: activeMode, primitives, overrides, bindings, purposes };
  const needle = query.trim().toLowerCase();
  const shown = groups
    .filter((group) => layer === "all" || group.layer === layer)
    .map((group) => {
      if (!needle) return group;
      const tree = filterTree(group.tree, group.base, (path) =>
        `${path} ${purposes.get(path)?.why ?? ""}`.toLowerCase().includes(needle)
      );
      return tree ? { ...group, tree } : null;
    })
    .filter((group): group is Group => group !== null);
  const views: { id: View; label: string }[] = [
    { id: "both", label: "Getters and values" },
    { id: "getters", label: "Getters" },
    { id: "resolved", label: "Resolved values" },
  ];
  const hint = LAYERS.find((l) => l.id === layer)?.hint;

  return (
    <section
      aria-label={`Computed theme (${activeMode})`}
      style={themeVars.style}
    >
      {themeVars.provide(
        <>
          <Presentation register="compact">
            <div className={styles.toolbar}>
              <div className={styles.group} role="group" aria-label="Layer">
                {LAYERS.map(({ id, label }) => (
                  <Button
                    key={id}
                    type="button"
                    shape="rounded"
                    variant={layer === id ? "primary" : "secondary"}
                    aria-pressed={layer === id}
                    onClick={() => setLayer(id)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className={styles.toolbar}>
              <div className={styles.search}>
                <TextField
                  label="Find a token"
                  type="search"
                  placeholder="fieldGap, radius, why…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className={styles.group} role="group" aria-label="Show">
                {views.map(({ id, label }) => (
                  <Button
                    key={id}
                    type="button"
                    shape="rounded"
                    variant={view === id ? "primary" : "secondary"}
                    aria-pressed={view === id}
                    onClick={() => setView(id)}
                  >
                    {label}
                  </Button>
                ))}
                <Button
                  type="button"
                  shape="rounded"
                  variant="ghost"
                  onClick={() =>
                    setExpansion((e) => ({ openDepth: 99, key: e.key + 1 }))
                  }
                >
                  Expand all
                </Button>
                <Button
                  type="button"
                  shape="rounded"
                  variant="ghost"
                  onClick={() =>
                    setExpansion((e) => ({ openDepth: 0, key: e.key + 1 }))
                  }
                >
                  Collapse all
                </Button>
              </div>
            </div>
          </Presentation>
          {hint ? <p className={styles.hint}>{hint}</p> : null}
          <div className={styles.tree} key={`${expansion.key}:${needle ? "q" : ""}`}>
            <div
              className={clsx(styles.row, styles.columnHeads)}
              data-view={view}
            >
              <span>Key</span>
              {view !== "getters" ? <span>Preview</span> : null}
              {view !== "resolved" ? <span>Getter or binding</span> : null}
              {view !== "getters" ? <span>Resolved ({activeMode})</span> : null}
            </div>
            {shown.length === 0 ? (
              <p className={styles.hint}>No token matches “{query}”.</p>
            ) : null}
            {shown.map((group) => (
              <Node
                key={group.key}
                name={group.title}
                value={group.tree}
                path={group.base}
                layer={group.layer}
                depth={0}
                view={view}
                openDepth={needle ? 99 : expansion.openDepth}
                context={context}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
