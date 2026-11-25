---
name: naming-conventions
description: Apply @squonk/ui's naming conventions for component names, folders, files, props, event handlers, and Storybook Meta paths. Use before scaffolding a new component, before renaming an existing one, or when reviewing a component for inconsistency with the rest of the library.
---

# Naming Conventions

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonk/ui` library only. Naming is a convention, not a constraint enforced by tooling — which means it's the first thing to drift. Get it right at scaffold time; renaming later is a public API break (see `non-breaking-refactor`).

## The naming table

| Surface | Case | Example |
|---|---|---|
| Component name (exported symbol) | PascalCase | `UserBadge`, `TextField`, `QrCode` |
| Folder under `src/components/{type}/` | kebab-case | `user-badge/`, `text-field/`, `qr-code/` |
| File names inside folder | kebab-case, matches folder | `user-badge.tsx`, `user-badge.stories.tsx`, `user-badge.test.tsx`, `user-badge.mdx` |
| Storybook Meta title | `"<Category>/<ReadableName>"` | `"Functional/User Badge"` |
| Prop names | camelCase | `avatarUrl`, `onSelect`, `isLoading` |
| Boolean props | affirmative; prefer `variant` over `is*` for >2 states | `disabled`, `loading`; **avoid** `isDisabled`, `isCool` |
| Event handler props | `on<Event>` | `onClick`, `onSelect`, `onValueChange` |
| Type/interface exports | PascalCase, suffix with `Props` or descriptive noun | `ButtonProps`, `CardVariant` |
| Polymorphic `as` prop | always literally `as` | `as="section"` |
| CSS class hooks (if any) | kebab-case | `data-variant="primary"`, or React Aria's own `data-selected` (use data attrs, not classnames) |

## Component name choice

1. **PascalCase, no abbreviations.** `UserBadge`, not `UsrBdg`. `QrCode`, not `QRCode` (the existing component uses `QrCode` — follow suit unless renaming intentionally; standard JS naming favors PascalCase even for acronyms in this codebase).
2. **Noun, not verb.** Components are things, not actions. `Selector` not `Select` (when the verb conflicts with the HTML element name, like `<select>`).
3. **Concrete over abstract.** `UserBadge` is better than `Chip` — the chip story is told by the prop set.
4. **Avoid colliding with HTML element names** — `Button` is fine (the component wraps a `<button>`), but `Header`, `Footer`, `Nav` should describe a specific use (`PageHeader`, `SiteFooter`) when scope creep is likely.

## Prop name patterns to copy

From the existing library:

- **Variant unions** drive visual style: `variant: 'default' | 'special'` (Button, Card pattern). Don't pile up booleans — three+ booleans for state is the smell that you want a union.
- **Optional callbacks** use `on<Event>`: `onClick`, `onChange`. The callback receives the typed event or the changed value, not both — pick one and document.
- **Controlled state** uses `value` + `onValueChange` (or `value` + `onChange`). Don't invent `currentValue`, `selectedValue`.
- **Children prop** is `children: React.ReactNode` — always lowercase, never `Children` or `content`.

## Prop name anti-patterns

| Avoid | Why | Use instead |
|---|---|---|
| `isCool: boolean` (and similar adjective booleans) | Boolean explosion; doesn't extend to 3+ states | `variant: 'default' \| 'cool' \| ...` |
| `clickHandler: () => void` | Inconsistent with React convention | `onClick: () => void` |
| `style: 'small' \| 'medium'` (conflicts with HTML `style` attr) | Shadows DOM prop | `size: 'sm' \| 'md'` |
| `data: any` | Untyped grab bag | A concrete typed prop per concern |
| `hidden: boolean` (conflicts with HTML `hidden` attr) | Confusing precedence | Pick a scoped name (`isCollapsed`, etc.) |
| Required `className` / required `style` | Library should own styling; consumer should not need to override to get base look | Optional only, and only as escape hatches |

## File naming

A canonical component folder has exactly four files, all sharing the kebab-cased base name:

```
src/components/functional/user-badge/
├── user-badge.tsx           # implementation
├── user-badge.stories.tsx   # Storybook stories
├── user-badge.test.tsx      # Playwright CT snapshot test
└── user-badge.mdx           # Storybook docs page
```

**Strict invariants:**
- The folder name and file base name must match exactly.
- The exported component name must be the PascalCase of the folder name (`user-badge` → `UserBadge`).
- The Meta title should identify the exported component; readable spaces are supported. Preserve existing titles and story IDs.

**Catches:** if a file is named `UserBadge.tsx` (PascalCase) instead of `user-badge.tsx`, that's an off-pattern artifact. Assess compatibility before renaming it; do not overwrite the existing implementation with a scaffold.

## Storybook Meta title — three rules

1. **Use existing categories**: `Functional/`, `Functional/Primitives/`, `Layout/`, `Layout/Primitives/`, `Style/`, `Animation/`.
2. **Keep the name recognizable**: existing titles may use spaces, such as `Functional/Text Field`.
3. **Preserve IDs**: a title change alters links and artifact references. Align a new scaffold with the existing category without renaming unrelated stories.

## Renaming an existing component

Any rename is a public API change. Before doing it, run `non-breaking-refactor` to classify whether the rename can be done additively (re-export with deprecated alias) or requires a breaking change. Don't rename and rely on the build to surface consumers — internal apps may break silently.

## Quick check before scaffolding

When you've decided on a name, validate it:

```bash
# Run from the repository root

# 1. Convert PascalCase to kebab-case mentally: UserBadge → user-badge
# 2. Confirm the folder doesn't already exist:
ls src/components/functional src/components/layout 2>/dev/null | grep -i "user-badge"

# 3. Confirm the export doesn't already exist:
grep -i "UserBadge" src/components/index.ts
```

If either match returns a result, stop — either you're re-scaffolding an existing component (don't) or there's a name collision (rename).

## ARIA prop naming

ARIA attributes follow React's DOM-prop conventions (camelCased and prefixed `aria-`): `aria-label`, `aria-describedby`, `aria-controls`, `aria-modal`. Don't re-export these as renamed props (e.g. don't expose `label` that secretly sets `aria-label` — pass through `aria-label` directly). See `accessibility-conventions` for which ARIA props each component shape needs.

## Cross-references

- `accessibility-conventions` — ARIA prop conventions, focus-related prop names, label association patterns.
- `determine-component-intent` — function intent decides whether `on<Event>` callbacks are needed.

## Handoff

This skill is advisory — it doesn't run a tool, it informs decisions made by `determine-component-intent`, `scaffold-component`, and `non-breaking-refactor`. After validating names, return to whichever skill called you.
