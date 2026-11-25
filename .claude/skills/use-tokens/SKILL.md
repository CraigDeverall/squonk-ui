---
name: use-tokens
description: Lint and refactor @squonkstack/ui components to consume purpose tokens (--squonk-roles-*, --squonk-components-*) instead of raw scale steps or hardcoded literals (hex colors, px/rem values, raw z-indexes, magic durations). Use before commits that touch component CSS modules in src/components/, after running the scaffold-component skill, or whenever the user asks to "use the theme", "use tokens", "remove magic values", or "make this themeable".
---

# Use Tokens

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonkstack/ui` library only. It enforces the contract that components consume **purpose tokens**: never primitives, never literals, and never a raw scale step.

## The rule

The theme has three layers (see "Purpose tokens" in `DESIGN_SYSTEM.md`):

| Layer | Examples | May a component read it? |
|---|---|---|
| **Primitives** (`spacingPx: 8`, `colors.primary: "#94d500"`) | The `const primitives` block in [src/theme/theme.ts](../../../src/theme/theme.ts) | **No.** |
| **Raw tokens**: the scales and palette (`--squonk-spacing-sm`, `--squonk-typography-sizes-xs`, `--squonk-colors-text-secondary`, derived colours such as `--squonk-colors-primary-hover`) | `themeCssVariables()` / `derivedColorTokens()` in [src/theme/theme-css-vars.ts](../../../src/theme/theme-css-vars.ts) | **No**, except status tones (`--squonk-colors-tone-*`, `--squonk-colors-status-text-*`) chosen by a `tone` prop, and files marked `purpose-tokens: scale-api` whose props hand the scale to the consumer (`gap="md"`). |
| **Purpose tokens** (`--squonk-roles-space-field-gap`, `--squonk-roles-color-hint`, `--squonk-roles-radius-control`) | `rolePurposes` in [src/theme/purpose.ts](../../../src/theme/purpose.ts), plus `roles.radius.*` / `roles.elevation.*` in `theme.ts` | **Yes.** Shared by every component with that purpose. |
| **Component tokens** (`--squonk-components-button-padding-inline-default`) | `componentPurposes` in `purpose.ts` | **Yes**, by that component only. |
| **Presentation tokens** (`--squonk-presentation-control-height-default`) | `presentation` in `theme.ts` | **Yes.** Register-aware purposes. |

Every name and default value is listed in [src/theme/tokens.css](../../../src/theme/tokens.css). In TypeScript, read a purpose with `purposeValue(theme, "roles.color.surface")` from `src/theme/use-theme-css-vars.ts`, never `theme.colors.*`.

**Pick by purpose, not by value.** `--squonk-roles-space-choice-gap` and `--squonk-roles-space-item-gap` both default to 8px, but they mean different things and a theme may move them apart. Read the `why` of each candidate in `purpose.ts` and choose the one that describes this use. If two uses share a value but not a reason, they need two tokens.

**When nothing fits:** add a token with the `add-token` skill.
- A shared purpose (`roles.*`) when two or more components do the same job a theme might tune together.
- A component token (`components.<name>.*`) for a decision only that component makes. Bind it to a role when it should follow one (`roles.color.accent`), so re-pointing the role reaches it too.

A component's CSS module reads tokens like this:
```css
@layer dt.components {
  .root {
    display: grid;
    gap: var(--squonk-roles-space-field-gap);
    font-size: var(--squonk-roles-type-label);
  }
  .input {
    padding-inline: var(--squonk-roles-control-padding-inline-default);
    border: var(--squonk-roles-border-width) solid var(--squonk-roles-color-field-border);
    border-radius: var(--squonk-roles-radius-control);
  }
  .input[data-hovered] { border-color: var(--squonk-roles-color-field-border-hover); }
}
```

**The checker.** `node scripts/check-purpose-tokens.mjs` (also part of `npm run lint`) lists every raw token in component CSS and every raw `theme.*` read in component code, as `file:line token`. It must pass before a commit.

See "Styling with CSS Modules" in `DESIGN_SYSTEM.md` for the full component pattern (`useThemeCssVars`, `data-*` attributes, component custom properties).

## What to scan for

Run against `src/components/**/*.module.css` and any style values in `src/components/**/*.tsx` (skip `*.stories.tsx`, `*.test.tsx`, `*.mdx`, and `src/theme/**`).

**Smells, in priority order:**

1. **Raw tokens** — anything `node scripts/check-purpose-tokens.mjs` reports (`var(--squonk-spacing-*)`, `var(--squonk-colors-text-*)`, `theme.spacing.*` …)
   → the purpose or component token for that use
2. **Hex colors** — `/#[0-9a-fA-F]{3,8}\b/` in a CSS module → a colour purpose (`--squonk-roles-color-*`)
3. **`rgb(...)` / `rgba(...)` / `hsl(...)`** literals → same; shadows use `var(--squonk-roles-elevation-*)`
4. **Computed colours in TypeScript** — `themeHelpers.darken|lighten|getMinContrastTextColor|readableTint`, `surfaceForeground` or `Color(...)` inside a component
   → a derived token in `derivedColorTokens` plus a purpose bound to it (`add-token`)
5. **Pixel, `em`/`rem` literals** outside `theme.ts` → a space, type, border or size purpose. Fixed component geometry (an 18px box) becomes a component or `roles.size.*` token bound to the literal, with its reason.
   Exception: `@media (min-width: …)` uses the default breakpoint values, guarded by a unit test.
6. **Raw `z-index` numbers** → `var(--squonk-roles-layer-*)`
7. **Transition durations** → `var(--squonk-roles-motion-*)`
8. **Magic font sizes / weights** → `var(--squonk-roles-type-*)`
9. **`primitives.*`** referenced from outside `theme.ts` — always a violation

## Build the mapping live, don't memorize it

The purposes change whenever someone adds one. A static table in this skill would go stale. Each run:

1. **Read `src/theme/purpose.ts`.** Each token has a `why` and a default binding. That is the mapping: from a use to a purpose.
2. **Read `src/theme/tokens.css`** for resolved values (run `npm run tokens:generate` first if `theme.ts` or `purpose.ts` changed). Use values only to confirm a swap keeps the rendering identical, never to choose the token.
3. **For each raw use, ask what it is for** (the gap between a label and its input? a panel's inset? hint text?) and find the purpose whose `why` says so.

**Keep the rendering identical.** The token you choose should resolve to the value used now, so snapshots don't change. If the right purpose has a different default, don't change the look silently: bind a component token to the current value, and report the inconsistency so the user can decide whether the component should follow the shared purpose.

**If no purpose fits**, don't invent a mapping — report it and recommend the `add-token` skill.

## Run modes

Ask the user (default to `report` if no signal):

- **report** — list every violation as `file:line — literal → suggested-token` and stop. No edits.
- **interactive** — for each violation, show the suggested replacement and ask before applying.
- **autofix** — apply only the **unambiguous** mappings from the tables above. Anything ambiguous (no match in table, multiple candidates) falls back to a report entry.

After any edits:
1. `npx tsc --noEmit`
2. `npx eslint --fix <touched files>`
3. `npm test` — token swaps must not change any snapshot unless the change is intended
3. Surface remaining ambiguous cases with file:line refs.

## What not to do

- **Never replace literals in `src/theme/theme.ts`** itself — that's where they're allowed.
- **Never edit `*.stories.tsx`** — story args may intentionally include literals for control demos.
- **Never edit `*.mdx`** — example code in docs is illustrative.
- **Don't rewrite the file structure** — only swap literals for tokens. Keep diffs minimal.
- **Don't read the theme in TypeScript to style something.** Put the value in the CSS module as a purpose variable; if it's a computed colour, add a derived token and a purpose. For values that can't be CSS (SVG attributes, SemanticSurface backgrounds), use `purposeValue(theme, path)`.
- **Don't hard-code a `var()` fallback** (`var(--squonk-roles-space-field-gap, 4px)`); `tokens.css` always defines the default.
- **Don't add a `purpose-tokens: scale-api` marker to silence the checker.** It is only for files whose props hand the raw scale to the consumer.

## When to recommend extending the theme instead

If a use has no purpose that describes it, or a component computes a colour, that's a missing token. Stop autofixing and recommend the `add-token` skill: a shared purpose when several components do that job, a component token when only one does.
