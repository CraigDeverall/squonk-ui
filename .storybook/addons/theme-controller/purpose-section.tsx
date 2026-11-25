import React, { useEffect, useMemo, useState } from "react";
import { addons } from "storybook/manager-api";
import { resolveBinding, type ColorMode } from "../../../src/theme/theme";
import { resolveRoleBindings, type ResolvedRoleBindings, type RoleBindingsOverride } from "../../../src/theme/purpose";
import { themeCssVarName, type ThemeCssVars } from "../../../src/theme/theme-css-vars";
import { EVENTS } from "./constants";
import { Section, styles, swatchFor } from "./panel";
import { bindingChain, bindingOptions, tokenIndex, type TokenInfo } from "./token-index";
import type { TokenUse } from "./token-usage";

// A visible, native select: it must read as something you can change.
const purposeSelect: React.CSSProperties = {
  appearance: "auto",
  cursor: "pointer",
  maxWidth: "100%",
  padding: "1px 2px",
  borderRadius: 3,
  border: "1px solid color-mix(in srgb, var(--sb-fg, #333) 25%, transparent)",
  background: "color-mix(in srgb, var(--sb-fg, #333) 4%, transparent)",
  fontSize: 10,
};

export type RoleBindHandler = (path: string, value: string | null) => void;

/** The tokens the preview reports in use, kept current. */
function useUsedTokens(): TokenUse[] {
  const [uses, setUses] = useState<TokenUse[]>([]);
  useEffect(() => {
    const channel = addons.getChannel();
    channel.on(EVENTS.USED_TOKENS, setUses);
    channel.emit(EVENTS.REQUEST_USED_TOKENS);
    return () => channel.off(EVENTS.USED_TOKENS, setUses);
  }, []);
  return uses;
}

const isStatusTone = (path: string) => /^colors\.(tone|statusText)\./.test(path);

type UseGroup = "component" | "role" | "prop" | "tone" | "raw";

const USE_GROUPS: { key: UseGroup; title: string; hint: string }[] = [
  { key: "component", title: "Component tokens", hint: "Decisions only these components make." },
  { key: "role", title: "Purpose tokens", hint: "Shared decisions: re-pointing one changes every component with that purpose." },
  { key: "prop", title: "Raw, chosen by a prop", hint: "Layout and text props such as gap=\"md\" pick a step of the scale directly." },
  { key: "tone", title: "Status tones", hint: "Picked by a tone prop (tone=\"error\")." },
  { key: "raw", title: "Raw, in app or story CSS", hint: "Read directly by CSS outside the library's components." },
];

const groupOf = (info: TokenInfo | undefined, use: TokenUse): UseGroup => {
  if (info?.kind === "component") return "component";
  if (info?.kind === "role") return "role";
  if (use.viaProp) return "prop";
  if (info && isStatusTone(info.path)) return "tone";
  return "raw";
};

/** The last step of a purpose's chain, for its swatch and provenance. */
const finalStep = (path: string, roleBindings: ResolvedRoleBindings) => {
  const chain = bindingChain(path, roleBindings);
  return chain[chain.length - 1];
};

const PurposeControl: React.FC<{
  info: TokenInfo;
  roleBindings: ResolvedRoleBindings;
  onBind: RoleBindHandler;
  /** Set when the value itself was clicked: start editing it as a custom value. */
  editRequest?: { n: number; value: string };
}> = ({ info, roleBindings, onBind, editRequest }) => {
  const current = roleBindings[info.path];
  const options = useMemo(() => bindingOptions(info.path), [info.path]);
  const known = current === undefined || options.raw.includes(current) || options.purposes.includes(current);
  const [custom, setCustom] = useState(!known || editRequest !== undefined);
  const [draft, setDraft] = useState(editRequest?.value ?? current ?? "");
  const defaultLabel = info.computed ? resolveBinding(info.path, "light") : info.defaultBind;

  if (custom) {
    return (
      <span style={{ display: "flex", gap: 4 }}>
        <input
          style={{ ...styles.computedBinding, ...purposeSelect, ...styles.bindingSelectRebound, width: "100%" }}
          value={draft}
          placeholder="token path or CSS value"
          aria-label={`Custom value for ${info.path}`}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onBind(info.path, draft.trim() || null);
            if (e.key === "Escape") { setCustom(false); setDraft(current ?? ""); }
          }}
          onBlur={() => onBind(info.path, draft.trim() || null)}
        />
        <button type="button" style={styles.computedBinding} onClick={() => { setCustom(false); onBind(info.path, null); }} title="Back to the default">↺</button>
      </span>
    );
  }
  return (
    <select
      value={current ?? ""}
      aria-label={`Binding for ${info.path}`}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "__custom") { setDraft(current ?? ""); setCustom(true); return; }
        onBind(info.path, v === "" ? null : v);
      }}
      style={{ ...styles.computedBinding, ...purposeSelect, ...(current !== undefined ? styles.bindingSelectRebound : null) }}
      title={current !== undefined ? `Re-pointed to ${current}` : `Default: ${defaultLabel}`}
    >
      <option value="">↺ {defaultLabel}</option>
      {options.purposes.length > 0 && (
        <optgroup label="Another purpose">
          {options.purposes.filter((p) => p !== info.defaultBind).map((p) => <option key={p} value={p}>→ {p}</option>)}
        </optgroup>
      )}
      {options.raw.length > 0 && (
        <optgroup label="Raw token">
          {options.raw.filter((p) => p !== info.defaultBind).map((p) => <option key={p} value={p}>→ {p}</option>)}
        </optgroup>
      )}
      <option value="__custom">Custom value…</option>
    </select>
  );
};

const TokenRow: React.FC<{
  info: TokenInfo | undefined;
  name: string;
  value: string;
  mode: ColorMode;
  roleBindings: ResolvedRoleBindings;
  onBind: RoleBindHandler;
  tags?: string[];
}> = ({ info, name, value, mode, roleBindings, onBind, tags = [] }) => {
  const [editRequest, setEditRequest] = useState<{ n: number; value: string }>();
  const isPurpose = info?.kind === "role" || info?.kind === "component";
  const path = info?.path ?? name;
  const swatchPath = isPurpose && !info?.computed ? finalStep(path, roleBindings) : path;
  const chain = isPurpose && !info?.computed ? bindingChain(path, roleBindings).slice(1) : [];
  const last = chain[chain.length - 1];
  // A computed role's dropdown already shows its formula.
  const provenance = info?.computed
    ? undefined
    : last && tokenIndex().has(themeCssVarName(last.split(".")))
      ? resolveBinding(last, mode)
      : undefined;
  return (
    <div style={{ ...styles.treeLeaf, alignItems: "start", padding: "5px 4px" }}>
      <span style={styles.computedSwatchSlot}>{swatchFor(swatchPath, value)}</span>
      <span style={{ ...styles.computedNameCol, gap: 2 }}>
        <span style={{ ...styles.computedName, whiteSpace: "normal", overflowWrap: "anywhere" }} title={name}>
          {path}
          {tags.map((tag) => (
            <span key={tag} style={{ ...styles.codeInline, marginLeft: 6, fontSize: 9, whiteSpace: "nowrap", display: "inline-block" }}>{tag}</span>
          ))}
        </span>
        {info?.why ? <span style={{ ...styles.computedBinding, whiteSpace: "normal", fontFamily: "inherit", fontSize: 10 }}>{info.why}</span> : null}
        {isPurpose ? (
          // A click on the value remounts the control in edit mode, filled in.
          <PurposeControl key={editRequest?.n ?? 0} info={info} roleBindings={roleBindings} onBind={onBind} editRequest={editRequest} />
        ) : (
          <span style={styles.computedBinding}>{resolveBinding(path, mode)}</span>
        )}
        {(() => {
          // The rest of the chain beyond what the binding control shows:
          // purposes it passes through, then the primitive it comes from.
          const steps = [...chain.slice(1), provenance].filter(
            (step, i, all): step is string => Boolean(step && /[A-Za-z0-9]/.test(step)) && step !== all[i - 1] && step !== chain[0]
          );
          return steps.length ? <span style={styles.computedBinding} title={steps.join(" → ")}>→ {steps.join(" → ")}</span> : null;
        })()}
      </span>
      {isPurpose ? (
        // The value is where people look to change it: clicking it edits it.
        <button
          type="button"
          style={{ ...styles.computedValue, background: "none", border: "1px dashed transparent", borderRadius: 3, padding: "0 3px", cursor: "text", font: "inherit", textAlign: "right" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "color-mix(in srgb, var(--sb-fg, #333) 35%, transparent)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
          title={`${value}. Click to change it.`}
          aria-label={`Change the value of ${path}, now ${value}`}
          onClick={() => setEditRequest((prev) => ({ n: (prev?.n ?? 0) + 1, value }))}
        >
          {value}
        </button>
      ) : (
        <span style={styles.computedValue} title={value}>{value}</span>
      )}
    </div>
  );
};

/**
 * "In this story": every token the rendered page reads, grouped by layer,
 * with purposes editable in place. Component tokens appear only here, and
 * only when that component is on the page.
 */
export const InThisStorySection: React.FC<{
  roleBindings: RoleBindingsOverride;
  onBind: RoleBindHandler;
  mode: ColorMode;
}> = ({ roleBindings: allBindings, onBind, mode }) => {
  // A per-mode binding shows its value for the mode on screen. Editing it
  // here writes one value for both modes.
  const roleBindings = useMemo(() => resolveRoleBindings(allBindings, mode), [allBindings, mode]);
  const uses = useUsedTokens();
  const index = tokenIndex();
  const grouped = useMemo(() => {
    const out = new Map<UseGroup, TokenUse[]>();
    for (const use of uses) {
      const group = groupOf(index.get(use.token), use);
      out.set(group, [...(out.get(group) ?? []), use]);
    }
    return out;
  }, [uses, index]);
  return (
    <Section title={`In this story (${uses.length})`}>
      <p style={styles.sectionHint}>
        The tokens the page actually reads, including states not showing now and
        content in popovers. On a docs page, everything on the page. Click a
        purpose or component token's value to change it.
      </p>
      {uses.length === 0 ? <p style={styles.sectionHint}>Nothing yet: the story is still rendering, or uses no theme tokens.</p> : null}
      {USE_GROUPS.filter((g) => grouped.has(g.key)).map((group) => (
        <details key={group.key} open={group.key !== "raw"} style={{ marginBottom: 6 }}>
          <summary style={{ ...styles.computedName, cursor: "pointer", fontWeight: 600, padding: "4px 0" }}>
            {group.title} ({grouped.get(group.key)!.length})
          </summary>
          <p style={{ ...styles.sectionHint, margin: "2px 0 6px" }}>{group.hint}</p>
          {grouped.get(group.key)!.map((use) => (
            <TokenRow
              key={use.token}
              info={index.get(use.token)}
              name={use.token}
              value={use.value}
              mode={mode}
              roleBindings={roleBindings}
              onBind={onBind}
              tags={[...(use.inState ? ["in a state"] : []), ...use.sources.slice(0, 3)]}
            />
          ))}
        </details>
      ))}
    </Section>
  );
};

/** Every shared purpose, by group, editable. Component tokens are left to "In this story". */
export const PurposeTokensSection: React.FC<{
  roleBindings: RoleBindingsOverride;
  onBind: RoleBindHandler;
  vars: ThemeCssVars;
  mode: ColorMode;
}> = ({ roleBindings: allBindings, onBind, vars, mode }) => {
  const roleBindings = useMemo(() => resolveRoleBindings(allBindings, mode), [allBindings, mode]);
  const groups = useMemo(() => {
    const out = new Map<string, TokenInfo[]>();
    for (const info of tokenIndex().values()) {
      if (info.kind !== "role") continue;
      const group = info.path.split(".")[1];
      out.set(group, [...(out.get(group) ?? []), info]);
    }
    return out;
  }, []);
  const changed = Object.keys(allBindings).length;
  return (
    <Section title={`Purpose tokens${changed ? ` (${changed} re-pointed)` : ""}`}>
      <p style={styles.sectionHint}>
        The theme's decisions. Each is shared by every component with that
        purpose. Click a value to type a new one, or pick what it's bound to
        from its dropdown.
      </p>
      {Array.from(groups, ([group, infos]) => (
        <details key={group} style={{ marginBottom: 6 }}>
          <summary style={{ ...styles.computedName, cursor: "pointer", fontWeight: 600, padding: "4px 0" }}>
            {group} ({infos.length})
          </summary>
          {infos.map((info) => (
            <TokenRow
              key={info.name}
              info={info}
              name={info.name}
              value={vars[info.name] ?? ""}
              mode={mode}
              roleBindings={roleBindings}
              onBind={onBind}
            />
          ))}
        </details>
      ))}
    </Section>
  );
};
