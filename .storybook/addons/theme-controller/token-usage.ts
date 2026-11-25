/*
 * Which theme tokens the rendered story actually uses.
 *
 * Walks the preview document's stylesheets for rules that match something on
 * the page, and inline styles, and collects every `var(--squonk-*)` they read,
 * following component-local variables (`--checkbox-accent:
 * var(--squonk-roles-color-accent)`) back to the token. Rules for states that
 * aren't showing right now (hover, focus, selected, open, invalid…) still
 * count, flagged `inState`. Popovers and menus rendered outside the story
 * root are included because the whole document is scanned; on a docs page
 * that means every story on the page.
 */

export interface TokenUse {
  /** The variable, e.g. `--squonk-roles-space-field-gap`. */
  token: `--squonk-${string}`;
  /** Its value where it is used (so nested theme scopes show their own). */
  value: string;
  /** Only used by a rule for a state not currently showing. */
  inState: boolean;
  /** Read from an inline style: a value a prop chose (`gap="md"`). */
  viaProp: boolean;
  /** The stylesheets it was found in: component or file names. */
  sources: string[];
}

// React Aria and native states: rules keyed on these still count when the
// state isn't showing right now.
const STATE_ATTRS =
  "hovered|pressed|focused|focus-visible|focus-within|selected|indeterminate|open|expanded|entering|exiting|invalid|disabled|readonly|current|dragging|drop-target|pending|checked|highlighted|placement|inert|empty|allows-sorting|sort-direction|resizing|switch|state";
const STATE_ATTR = new RegExp(`\\[(?:data-(?:${STATE_ATTRS})|aria-[a-z-]+)(?:[~|^$*]?=(?:"[^"]*"|'[^']*'|[^\\]]*))?\\]`, "g");
const STATE_PSEUDO = /:(?:hover|focus-visible|focus-within|focus|active|checked|disabled|enabled|invalid|valid|placeholder-shown|target|indeterminate|open|popover-open|user-invalid)(?![\w-])/g;
const PSEUDO_ELEMENT = /::?(?:before|after|placeholder|marker|selection|backdrop|file-selector-button|-webkit-[\w-]+|-moz-[\w-]+)(?:\([^)]*\))?/g;
const SIMPLE_NOT = /:not\([^()]*\)/g;

/**
 * A selector with its state conditions removed, so it matches the element
 * whatever state it is in; `changed` says whether anything was removed.
 * Pseudo-elements are dropped because `querySelector` can't match them.
 */
export function withoutStates(selector: string): { selector: string; changed: boolean } {
  const noElements = selector.replace(PSEUDO_ELEMENT, "");
  const stripped = noElements
    .replace(SIMPLE_NOT, "")
    .replace(STATE_ATTR, ":is(*)")
    .replace(STATE_PSEUDO, ":is(*)");
  return { selector: stripped, changed: stripped !== noElements };
}

/** Every `var(--name)` a CSS value reads, in order. */
export function varRefs(value: string): string[] {
  return Array.from(value.matchAll(/var\(\s*(--[\w-]+)/g), (m) => m[1]);
}

/**
 * Every declaration in a style's `cssText`, as written. `style[i]` alone
 * misses shorthands that read a variable (`transition: var(--squonk-…)`,
 * `padding: var(--a) var(--b)`): browsers list their longhands with an empty
 * value, and only the serialised shorthand keeps the `var()`.
 */
export function declarations(cssText: string): [prop: string, value: string][] {
  const out: [string, string][] = [];
  let start = 0;
  let depth = 0;
  let quote = "";
  const push = (end: number) => {
    const decl = cssText.slice(start, end);
    const colon = decl.indexOf(":");
    if (colon > 0) out.push([decl.slice(0, colon).trim(), decl.slice(colon + 1).replace(/\s*!important\s*$/, "").trim()]);
    start = end + 1;
  };
  for (let i = 0; i < cssText.length; i++) {
    const ch = cssText[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === ";" && depth === 0) push(i);
  }
  push(cssText.length);
  return out;
}

/**
 * Follow component-local variables to the theme tokens they read.
 * `defs` maps a local variable to the variables its declarations read.
 */
export function resolveLocal(name: string, defs: ReadonlyMap<string, ReadonlySet<string>>, seen = new Set<string>()): string[] {
  if (seen.has(name)) return [];
  seen.add(name);
  return Array.from(defs.get(name) ?? []).flatMap((ref) =>
    ref.startsWith("--squonk-") ? [ref] : resolveLocal(ref, defs, seen)
  );
}

const sourceOf = (sheet: CSSStyleSheet | null): string | undefined => {
  const node = sheet?.ownerNode as Element | null | undefined;
  const id = node?.getAttribute?.("data-vite-dev-id") ?? sheet?.href ?? undefined;
  if (!id) return undefined;
  // Dev serves src/…/checkbox.module.css; a build serves checkbox-<hash>.css.
  const match = /\/([\w-]+?)(?:-[\w]{8})?(?:\.module)?\.css/.exec(id);
  return match?.[1];
};

function* styleRules(rules: CSSRuleList): Generator<CSSStyleRule> {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      yield rule;
      if (rule.cssRules?.length) yield* styleRules(rule.cssRules);
    } else if (rule instanceof CSSMediaRule) {
      if (window.matchMedia(rule.conditionText).matches) yield* styleRules(rule.cssRules);
    } else if ("cssRules" in rule && (rule as CSSGroupingRule).cssRules) {
      // @layer, @supports, @container
      yield* styleRules((rule as CSSGroupingRule).cssRules);
    }
  }
}

const firstMatch = (selector: string): Element | null => {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
};

interface Found { el: Element; inState: boolean; viaProp: boolean; source?: string }

/** Scan the document for the theme tokens in use. */
export function scanTokenUse(): TokenUse[] {
  const found = new Map<string, Found[]>();
  const add = (token: string, hit: Found) => {
    if (!token.startsWith("--squonk-")) return;
    const list = found.get(token) ?? [];
    list.push(hit);
    found.set(token, list);
  };
  const localDefs = new Map<string, Set<string>>();
  const localFromInline = new Set<string>();
  const pending: { name: string; hit: Found }[] = [];
  const read = (prop: string, value: string, hit: Found) => {
    // Theme scopes set --squonk-* values inline; those define, not use.
    if (prop.startsWith("--squonk-")) return;
    const refs = varRefs(value);
    if (!refs.length) return;
    if (prop.startsWith("--")) {
      const set = localDefs.get(prop) ?? new Set<string>();
      refs.forEach((ref) => set.add(ref));
      localDefs.set(prop, set);
      if (hit.viaProp) localFromInline.add(prop);
      return;
    }
    for (const ref of refs) {
      if (ref.startsWith("--squonk-")) add(ref, hit);
      else pending.push({ name: ref, hit });
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin
    }
    const source = sourceOf(sheet);
    for (const rule of styleRules(rules)) {
      if (!rule.style.cssText.includes("var(")) continue;
      let el = firstMatch(rule.selectorText);
      let inState = false;
      if (!el) {
        const loose = withoutStates(rule.selectorText);
        if (loose.changed) {
          el = firstMatch(loose.selector);
          inState = el !== null;
        }
      }
      if (!el) continue;
      for (const [prop, value] of declarations(rule.style.cssText)) {
        read(prop, value, { el, inState, viaProp: false, source });
      }
    }
  }

  for (const el of Array.from(document.querySelectorAll<HTMLElement>('[style*="var("]'))) {
    for (const [prop, value] of declarations(el.style.cssText)) {
      read(prop, value, { el, inState: false, viaProp: true });
    }
  }

  // A use of a local variable is a use of the tokens it reads; a value set
  // inline by a prop marks those tokens as chosen by the prop.
  for (const { name, hit } of pending) {
    const viaProp = hit.viaProp || localFromInline.has(name);
    for (const token of resolveLocal(name, localDefs)) add(token, { ...hit, viaProp });
  }

  return Array.from(found, ([token, hits]) => {
    const live = hits.find((hit) => !hit.inState) ?? hits[0];
    return {
      token: token as `--squonk-${string}`,
      value: getComputedStyle(live.el).getPropertyValue(token).trim(),
      inState: hits.every((hit) => hit.inState),
      viaProp: hits.every((hit) => hit.viaProp),
      sources: Array.from(new Set(hits.map((hit) => hit.source).filter((s): s is string => Boolean(s)))).sort(),
    };
  }).sort((a, b) => a.token.localeCompare(b.token));
}

/**
 * Re-scan whenever the page changes (debounced) and report each new result.
 * Returns a function that stops watching.
 */
export function watchTokenUse(report: (uses: TokenUse[]) => void): () => void {
  let timer: number | undefined;
  let last = "";
  const run = () => {
    timer = undefined;
    const uses = scanTokenUse();
    const key = JSON.stringify(uses);
    if (key === last) return;
    last = key;
    report(uses);
  };
  const schedule = () => {
    if (timer === undefined) timer = window.setTimeout(run, 300);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "style"] });
  schedule();
  return () => {
    observer.disconnect();
    if (timer !== undefined) window.clearTimeout(timer);
  };
}

/** Force the next scan to report even if nothing changed (a newly opened panel asks). */
export const rescanTokenUse = (report: (uses: TokenUse[]) => void) => report(scanTokenUse());
