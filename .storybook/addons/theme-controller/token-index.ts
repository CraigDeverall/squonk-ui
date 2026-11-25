/*
 * What every `--squonk-*` variable is: its theme path, which layer it belongs
 * to, why it exists and, for purposes, what it is bound to.
 */
import { buildTheme } from "../../../src/theme/theme";
import { computedRoleReasons, defaultPurposeBindings, purposeReasons, type ResolvedRoleBindings } from "../../../src/theme/purpose";
import { derivedColorTokens, themeCssVarName } from "../../../src/theme/theme-css-vars";

/** component: one component's decision; role: a shared purpose; raw: a scale step or palette value; derived: a colour computed from the palette. */
export type TokenKind = "component" | "role" | "raw" | "derived";

export interface TokenInfo {
  name: `--squonk-${string}`;
  path: string;
  kind: TokenKind;
  why?: string;
  /** For purposes in the purpose table: the default binding. */
  defaultBind?: string;
  /** For purposes the theme computes itself (radius, elevation). */
  computed?: boolean;
}

const leafPaths = (node: unknown, path: string[] = []): string[] =>
  node !== null && typeof node === "object"
    ? Object.entries(node).flatMap(([key, value]) => leafPaths(value, [...path, key]))
    : [path.join(".")];

let cached: Map<string, TokenInfo> | undefined;

/** Every theme variable, keyed by name. */
export function tokenIndex(): Map<string, TokenInfo> {
  if (cached) return cached;
  const index = new Map<string, TokenInfo>();
  const put = (info: Omit<TokenInfo, "name">) => {
    const name = themeCssVarName(info.path.split("."));
    index.set(name, { ...info, name });
  };
  const theme = buildTheme();
  const raw: Partial<typeof theme> = { ...theme };
  delete raw.mode;
  delete raw.roleBindings;
  delete raw.roles;
  const roles = theme.roles;
  for (const path of leafPaths(raw)) put({ path, kind: "raw" });
  for (const path of leafPaths(derivedColorTokens(theme), ["colors"])) put({ path, kind: "derived" });
  for (const path of leafPaths(roles, ["roles"])) put({ path, kind: "role", why: computedRoleReasons[path], computed: true });
  const reasons = purposeReasons();
  for (const [path, bind] of Object.entries(defaultPurposeBindings())) {
    // Register-stepped purposes share their parent's reason.
    const why = reasons[path] ?? reasons[path.split(".").slice(0, -1).join(".")];
    put({ path, kind: path.startsWith("components.") ? "component" : "role", why, defaultBind: bind });
  }
  cached = index;
  return index;
}

/** A purpose path's info, by path rather than variable name. */
export const infoForPath = (path: string) => tokenIndex().get(themeCssVarName(path.split(".")));

/**
 * The chain from a purpose to what it finally reads: purpose → (purpose…) →
 * raw path or literal. Honours the panel's current bindings.
 */
export function bindingChain(path: string, bindings: ResolvedRoleBindings): string[] {
  const defaults = defaultPurposeBindings();
  const chain = [path];
  let current = path;
  for (let i = 0; i < 10; i++) {
    const next = bindings[current] ?? defaults[current];
    if (next === undefined) break;
    chain.push(next);
    if (!(next in defaults)) break;
    current = next;
  }
  return chain;
}

/**
 * What a purpose can be re-pointed at: raw tokens of the same kind as its
 * default, and other purposes in the same group.
 */
/** The kind of value a purpose ends at: the raw family it can be bound to. */
function familyOf(path: string): string {
  // Radius and elevation roles are computed in the theme, with no binding to
  // follow; they belong to their scale.
  if (path.startsWith("roles.radius.")) return "borders.radius";
  if (path.startsWith("roles.elevation.")) return "shadows";
  const chain = bindingChain(path, {});
  const finalRaw = chain[chain.length - 1];
  return finalRaw.startsWith("colors.") ? "colors" : finalRaw.split(".").slice(0, -1).join(".");
}

export function bindingOptions(path: string): { raw: string[]; purposes: string[] } {
  const index = Array.from(tokenIndex().values());
  const family = familyOf(path);
  const raw = family
    ? index.filter((t) => (t.kind === "raw" || t.kind === "derived") && t.path.startsWith(`${family}.`)).map((t) => t.path)
    : [];
  const chain = bindingChain(path, {});
  const group = path.split(".").slice(0, 2).join(".");
  const sharedGroup = path.startsWith("components.") ? `roles.${finalRawGroup(chain)}` : group;
  // Only purposes that hold the same kind of value: a transition can point at
  // another transition, not at an easing or a bare duration.
  const purposes = index
    .filter((t) => (t.kind === "role" || t.kind === "component") && t.path.startsWith(`${sharedGroup}.`) && t.path !== path)
    .filter((t) => familyOf(t.path) === family)
    .map((t) => t.path);
  return { raw, purposes };
}

// A component token's sensible shared group: the group of the role its
// default chain passes through, else the raw family's nearest role group.
function finalRawGroup(chain: string[]): string {
  const role = chain.find((step) => step.startsWith("roles."));
  if (role) return role.split(".")[1];
  const raw = chain[chain.length - 1];
  if (raw.startsWith("spacing.")) return "space";
  if (raw.startsWith("typography.")) return "type";
  if (raw.startsWith("colors.")) return "color";
  if (raw.startsWith("borders.radius.")) return "radius";
  if (raw.startsWith("borders.")) return "border";
  return "space";
}
