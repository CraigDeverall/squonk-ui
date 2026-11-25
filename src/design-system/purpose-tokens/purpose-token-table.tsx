import React from "react";
import { componentPurposes, rolePurposes, type PurposeToken, type RegisterPurposeToken } from "../../theme/purpose";
import { themeCssVarName } from "../../theme/theme-css-vars";
import { useSquonkTheme } from "../../theme/theme-context";
import { cssVariablesFor } from "../../theme/use-theme-css-vars";

type Tree = { [key: string]: PurposeToken | RegisterPurposeToken | Tree };
const isLeaf = (node: unknown): node is PurposeToken | RegisterPurposeToken =>
  typeof node === "object" && node !== null && ("bind" in node || "registers" in node);

interface Row { name: string; why: string; bind: string; value: string }

function rows(tree: Tree, path: string[], vars: Record<string, string>): Row[] {
  return Object.entries(tree).flatMap(([key, node]) => {
    const here = [...path, key];
    if (!isLeaf(node)) return rows(node, here, vars);
    if ("bind" in node) {
      const name = themeCssVarName(here);
      return [{ name, why: node.why, bind: node.bind, value: vars[name] ?? "" }];
    }
    return Object.entries(node.registers).map(([register, bind]) => {
      const name = themeCssVarName([...here, register]);
      return { name, why: register === "default" ? node.why : `As above, ${register} register.`, bind, value: vars[name] ?? "" };
    });
  });
}

const cell: React.CSSProperties = { padding: "6px 8px", borderBottom: "1px solid #ddd", verticalAlign: "top", textAlign: "left" };

/**
 * Every purpose (or component) token in one group, with why it exists, its
 * default binding and its value in the current theme. Generated from
 * purpose.ts, so it can't drift from the code.
 */
export function PurposeTokenTable({ group, kind = "roles" }: { group: string; kind?: "roles" | "components" }) {
  const theme = useSquonkTheme();
  const vars = cssVariablesFor(theme);
  const source = (kind === "roles" ? rolePurposes : componentPurposes) as unknown as Tree;
  const node = source[group];
  if (!node || isLeaf(node)) return null;
  return (
    // Scrolls inside its own box on narrow screens rather than widening the page.
    <div style={{ overflowX: "auto", maxWidth: "100%" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr><th style={cell}>Token</th><th style={cell}>Why it exists</th><th style={cell}>Bound to</th><th style={cell}>Value</th></tr>
      </thead>
      <tbody>
        {rows(node, [kind, group], vars).map((row) => (
          <tr key={row.name}>
            <td style={cell}><code>{row.name}</code></td>
            <td style={cell}>{row.why}</td>
            <td style={cell}><code>{row.bind}</code></td>
            <td style={cell}><code>{row.value}</code></td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

/** The groups in a purpose table, for listing them all. */
export const purposeGroups = (kind: "roles" | "components") => Object.keys(kind === "roles" ? rolePurposes : componentPurposes);

const title = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

/** Every group of one kind, each under its own heading. */
export function PurposeTokenGroups({ kind }: { kind: "roles" | "components" }) {
  return (
    <>
      {purposeGroups(kind).map((group) => (
        <section key={group}>
          <h3>{title(group)}</h3>
          <PurposeTokenTable group={group} kind={kind} />
        </section>
      ))}
    </>
  );
}
