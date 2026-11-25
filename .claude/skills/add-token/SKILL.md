---
name: add-token
description: Extend the @squonkstack/ui theme with a new design token — most often a purpose token (roles.*) or component token (components.*) in src/theme/purpose.ts, occasionally a raw scale step or primitive — keeping the primitives → raw → purpose → CSS-vars structure intact. Use when the user asks to "add a token", "add a color", "add a spacing value", "extend the theme", or when the use-tokens skill finds a use no purpose describes.
---

# Add Token

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonkstack/ui` library only. The theme has a deliberate layered architecture — extending it the wrong way creates the exact magic-value problem `use-tokens` is supposed to prevent.

**Most new tokens are purposes, not scale steps.** Components never read the raw scales; they read purpose tokens (`roles.*`) and component tokens (`components.*`) defined in [src/theme/purpose.ts](../../../src/theme/purpose.ts). If you are adding a token because a component needs a value, you almost certainly want Pattern 0 below. Add a raw step (Patterns A–D) only when no existing step or palette value can express the value at all.

## The structure to preserve

[src/theme/theme.ts](../../../src/theme/theme.ts) has three rings. Don't trust line numbers — they shift; locate each ring by its identifier:

1. **Primitives** — the `const primitives = { ... }` block. Raw, unit-suffixed integers (`spacingPx: 8`, `fontPx: 16`, `colors: { blue: "#007bff", ... }`). Internal only.
2. **Computed getters** — the exported `theme` object. Every value is a `get foo() { return <expression involving primitives> }`. Public.
3. **CSS variables** — `themeCssVariables(theme)` in [src/theme/theme-css-vars.ts](../../../src/theme/theme-css-vars.ts) emits every getter as `--squonk-<path>` automatically. Components' CSS modules read these. You never edit this layer for a getter-backed token; you regenerate `src/theme/tokens.css` (`npm run tokens:generate`).

Also present:
- **`themeHelpers`** — a separate exported object with `lighten`, `darken`, `readableTint` and `getMinContrastTextColor`. Use these for derived colors before reaching for a new primitive.
- **`derivedColorTokens(theme)`** — in `theme-css-vars.ts`. Colours a component would otherwise compute while styling (hover/active shades, readable text on a surface, per-tone palettes) live here and are published as `--squonk-colors-*` variables. CSS can't run the colour maths, so this is where it happens, once per theme scope.

**Rule:** new tokens must follow this same pattern. Never add a value directly to a getter without a primitive backing it (unless it's a multiple of an existing primitive, which is the common case).

Always grep the file before editing — `grep -n "^const primitives" src/theme/theme.ts` and `grep -n "^export const theme" src/theme/theme.ts` will pin the structure.

## Pattern 0 — a purpose or component token (most common)

A **purpose** says what a value is for. Add one to `rolePurposes` when two or more components do the same job and a theme might tune them together (`roles.space.fieldGap`, `roles.color.hint`). Add a **component token** to `componentPurposes.<component>` for a decision only that component makes (`components.button.paddingInline`). Check the existing `why`s first: share a purpose when the reason is the same, even if a different component already uses it.

1. **Name it for the use**, not the size: `questionGap`, not `gapLarge`.
2. **Write its `why`**: one sentence saying what it is for. It appears in the docs and the Storybook Theme panel; a test fails if it is too short.
3. **Bind its default** with `t(bind, why)`, or `r(compact, default, large, hero, why)` for a value that steps with the presentation register. A binding is one of:
   - a raw token path: `"spacing.xs"`, `"typography.sizes.sm"`, `"colors.text.secondary"`, `"colors.tone.primary.subtle"` (derived colours work too);
   - another purpose: `"roles.color.accent"`, so the component token follows the role when a theme re-points it;
   - a literal CSS value for fixed geometry: `"18px"`.
4. **Reproduce today's value exactly.** The default must resolve to what the component renders now, so the snapshots prove nothing moved. If the component is replacing a value that differs from a shared purpose's default, keep the current value in a component token and tell the user about the inconsistency.
5. **Regenerate and test:**
   ```bash
   npm run tokens:generate
   npx vitest run src/theme/purpose.test.ts
   ```
   `purpose.test.ts` checks that every default binds to a token that exists (or a literal) and that every purpose has a reason.
6. **Use it** in the component CSS as `var(--squonk-roles-<group>-<name>)` or `var(--squonk-components-<component>-<name>)` (kebab case of the path), and run `node scripts/check-purpose-tokens.mjs`.

Theme authors re-point purposes with `roleBindings` (`SquonkThemeProvider`, or `ThemeModifier override={{ roleBindings }}`); you never need a new primitive just so one purpose can differ. Binding values that contain `;`, braces, angle brackets, backslashes or comments are ignored.

## Decide where a new raw token belongs (Patterns A–D)

Only when Pattern 0 can't express the value with existing raw tokens.

Ask the user (or infer from request):

1. **What kind of token?**
   - Color (semantic or background or text or border)
   - Spacing (scale step or semantic — gutter, padding, etc.)
   - Typography (size, weight, line-height, font family)
   - Border (width, radius)
   - Shadow
   - **Purpose** — not here: use Pattern 0. (`roles.radius.*` and
     `roles.elevation.*` are computed in `theme.ts` from their own primitives,
     such as `controlRadiusPx`, but are re-pointed with `roleBindings` like
     every other purpose.)
   - Breakpoint
   - Transition (duration/easing)
   - Z-index (semantic layer)

2. **Semantic name?** Use the existing vocabulary where it fits:
   - Scale: `xxs`, `xs`, `sm`, `base`/`md`, `lg`, `xl`, `xxl`
   - Headings: `h1`–`h6`
   - Semantic colors: `primary`, `secondary`, `accent`, `success`, `warning`, `error`, `info`
   - Z-index layers: `base`, `dropdown`, `sticky`, `fixed`, `modal`, `popover`, `tooltip`

3. **Value?** Always express as a multiple of an existing primitive when possible.

## Patterns for extending the raw layer

### Pattern A — new step on an existing scale (the usual raw extension)

Example: user wants a `theme.spacing.huge` of 64px.
- 64 = `primitives.spacingPx * 8` ✓ — no new primitive needed
- Add to the `spacing` object in scale order, between `xxl` and any larger value:

```ts
spacing: {
  // ...existing entries...
  get xxl() { return `${primitives.spacingPx * 6}px`; },
  get huge() { return `${primitives.spacingPx * 8}px`; },  // NEW
  // semantic entries below
},
```

### Pattern B — new semantic alias on an existing primitive

Example: user wants `theme.spacing.cardPadding` (= 16px, the `md` value).
- Add semantic getter at the bottom of the relevant object:

```ts
spacing: {
  // ...scale entries...
  // Semantic
  get gutter() { return `${primitives.spacingPx}px`; },
  get containerPadding() { return `${primitives.spacingPx * 2}px`; },
  get cardPadding() { return `${primitives.spacingPx * 2}px`; },  // NEW
},
```

### Pattern C — new primitive (rare; needs justification)

Only when no existing primitive can derive the value. Example: the user needs `theme.colors.brand.deepBlue` = `#001f4d` — not a tint/shade of `primitives.colors.blue`.

1. Add to `primitives` (lines 94–108 area):
   ```ts
   colors: {
     blue: "#007bff",
     // ...
     deepBlue: "#001f4d",  // NEW
   },
   ```
2. Then add the semantic getter:
   ```ts
   colors: {
     // ...
     get primary() { return primitives.colors.blue; },
     get brand() { return primitives.colors.deepBlue; },  // NEW
   },
   ```

If the value is a tint/shade of an existing primitive, use the helpers `themeHelpers.lighten` / `darken` (defined at the top of theme.ts) instead of adding a new primitive.

### Pattern D — derived colour token (common during component work)

When a component needs a colour computed from the theme — a hover shade, readable text on a coloured surface, a tinted chip — add it to `derivedColorTokens`, not to the component and not as a primitive:

```ts
// src/theme/theme-css-vars.ts, inside derivedColorTokens
const states = (color: string) => {
  const hover = themeHelpers.darken(color, 0.15);
  return { hover, onHover: on(hover), /* … */ };
};
return {
  primaryHover: primary.hover,          // → --squonk-colors-primary-hover
  onPrimaryHover: primary.onHover,      // → --squonk-colors-on-primary-hover
  // …
};
```

Name it for its role, document the naming in the function's comment, and prefer extending an existing family (`states`, `onBackground`, `tone`) over a one-off. Per-tone values belong in the `tone` palette so every tone gets them. Then run `npm run tokens:generate` and add an assertion to `src/theme/theme-css-vars.test.ts` that the token equals the helper call it replaces.

## Before editing theme.ts — pre-validate the value

If the new token is a **color** (or any visual value), run `theme-scratchpad` first to render existing components with the proposed value. This catches "this primary clashes with our success green" or "fails AA contrast on text.primary" before the value is committed. The scratchpad workflow is fast (one decorator + a screenshot) and saves the rework of adding a token, seeing it everywhere, then removing it.

For non-visual tokens (spacing, transitions, z-indexes) skip the scratchpad — the value's effect is harder to eyeball in isolation; the assertion test plus type-check is sufficient.

## After editing theme.ts

1. **Document in `theme.mdx`** — add an entry/swatch to [src/theme/theme.mdx](../../../src/theme/theme.mdx) so the new token appears in Storybook docs.

2. **Add a quick assertion test.** Vitest is installed. Create or extend a `src/theme/theme.test.ts`:
   ```ts
   import { describe, it, expect } from 'vitest';
   import { theme } from './theme';

   describe('theme', () => {
     it('spacing.cardPadding derives from primitives.spacingPx', () => {
       expect(theme.spacing.cardPadding).toBe('16px');
     });
   });
   ```
   This catches a future primitive change that would silently shift the token.

3. **Type-check** — `npx tsc --noEmit`.

4. **Lint** — `npx eslint --fix src/theme/theme.ts`.

5. **Regenerate the variables** — `npm run tokens:generate`, then commit `src/theme/tokens.css`. `npm run tokens:check` (in CI and `prebuild`) fails if you forget. Check the new `--squonk-*` line has the value you expect.

## What NOT to do

- **Don't add static values without `get`.** Every token is a getter so primitive changes propagate. `spacing.huge: "64px"` is wrong; `get huge() { return ... }` is right.
- **Don't reference other getters from inside a getter** unless deliberate — they create implicit ordering and harder-to-debug values. Derive from `primitives` directly.
- **Don't add a token a single component asked for.** Two+ consumers (or 3+ flagged literals from `use-tokens`) is the bar — otherwise it's just noise in the theme. The exception is a derived colour (Pattern D): a component must never compute colours, so even one consumer justifies it.
- **Don't add a `brand`-flavored color without checking accessibility.** Run `themeHelpers.getMinContrastTextColor(newColor)` mentally — if no readable foreground exists, the token is half-baked. See `accessibility-conventions` for the contrast requirements (WCAG AA: 4.5:1 normal text, 3:1 large text).

## Cross-references

- `theme-scratchpad` — pre-validate visual tokens before committing the change.
- `accessibility-conventions` — contrast requirements and the `getMinContrastTextColor` helper for color tokens.
- `use-tokens` — the consumer side; this skill exists in part to satisfy the "3+ unmapped literals" trigger.
- `commit-and-release` — hand off here for the actual commit.

## Commit message

A new token is a public-API addition, so:
```
feat(theme): add spacing.cardPadding semantic token

Derives from primitives.spacingPx (=16px). Used by Card and any future
container components needing a consistent inner padding.
```
This bumps the minor version. Hand off to the `commit-and-release` skill.
