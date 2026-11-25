import type { ColorBindingsOverride, PrimitivesOverride } from "../../../src/theme/theme";
import type { RoleBindingsOverride } from "../../../src/theme/purpose";

/**
 * "Copy diff": what the panel changed, ready to paste. Primitives go in
 * src/theme/theme.ts; colour and purpose bindings are SquonkThemeProvider props.
 */
export function diffSnippet(
  overrides: PrimitivesOverride,
  colorBindings: ColorBindingsOverride = {},
  roleBindings: RoleBindingsOverride = {}
): string {
  const parts: string[] = [];
  if (overrides.colors) {
    const lines = Object.entries(overrides.colors).map(
      ([k, v]) => `    ${k}: "${v}",`
    );
    parts.push(`  colors: {\n${lines.join("\n")}\n  },`);
  }
  if (overrides.darkColors) {
    const lines = Object.entries(overrides.darkColors).map(
      ([k, v]) => `    ${k}: "${v}",`
    );
    parts.push(`  darkColors: {\n${lines.join("\n")}\n  },`);
  }
  for (const k of Object.keys(overrides) as Array<keyof PrimitivesOverride>) {
    if (k === "colors" || k === "darkColors") continue;
    const v = overrides[k];
    if (typeof v === "string") parts.push(`  ${k}: "${v}",`);
    else parts.push(`  ${k}: ${v as number},`);
  }
  // Only the parts that changed: primitives for theme.ts, then the binding
  // props a SquonkThemeProvider takes.
  // A role binding may hold one value per colour mode.
  const literal = (v: string | { light: string; dark: string } | undefined) =>
    typeof v === "object" ? `{ light: "${v.light}", dark: "${v.dark}" }` : `"${v}"`;
  const prop = (name: string, map: Record<string, string | { light: string; dark: string } | undefined>) =>
    `${name}={{\n${Object.entries(map).map(([k, v]) => `    "${k}": ${literal(v)},`).join("\n")}\n}}`;
  const sections: string[] = [];
  if (parts.length) sections.push(`// Apply to primitives in src/theme/theme.ts\n{\n${parts.join("\n")}\n}`);
  const providerProps = [
    ...(Object.keys(colorBindings).length ? [prop("colorBindings", colorBindings)] : []),
    ...(Object.keys(roleBindings).length ? [prop("roleBindings", roleBindings)] : []),
  ];
  if (providerProps.length) sections.push(`// Pass to your SquonkThemeProvider\n${providerProps.join("\n")}`);
  return sections.join("\n\n");
}
