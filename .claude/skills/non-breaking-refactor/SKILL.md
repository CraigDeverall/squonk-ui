---
name: non-breaking-refactor
description: Classify changes to the @squonk/ui public API surface as additive, behavior-changing, or breaking — then either guide the refactor along a non-breaking deprecation path, or, when a break is the right call, draft the BREAKING CHANGE notice and migration notes. Use before pushing any refactor that touches exports from src/index.ts, removes/renames props or types, or changes component default behavior.
---

# Non-Breaking Refactor

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonk/ui` library only. The library publishes to a private npm registry and downstream Squonk apps depend on its surface — every change needs a deliberate compatibility decision.

## The public API surface

The public surface includes every entry in `package.json` exports: root components/theme, per-component subpaths, theme providers, `@squonk/ui/docs`, styles and their declarations. `src/index.ts` exports components and theme, not documentation helpers. Compare all published declarations and runtime behavior; root `dist/index.d.ts` alone is insufficient.

## Decide what kind of change you have

Diff the working branch against `main`:
```bash
# Run from the repository root
git fetch origin main
git diff --stat origin/main...HEAD -- src/index.ts 'src/components/**' 'src/theme/**' 'src/utils/**'
```

Then for each touched symbol, classify:

### Additive (minor — `feat:`)
- New exported component, hook, utility, or type
- New **optional** prop on an existing component (default preserves prior behavior)
- New optional field on an exported type
- New theme token (covered by `add-token` skill)
- New variant value on a union prop, when the default stays the same

### Behavior change (classify compatibility before selecting a version)
- Changing an established default or accepted meaning can break consumers and requires a major release; a bug-fix label does not waive compatibility
- Making an existing optional prop a no-op or changing its meaning is normally breaking
- Visual change to a component that consumers may snapshot against (call this out — `visual-regression` skill helps)
- Required→optional (downgrades are tolerated, but document)

### Breaking (`feat!:` / `fix!:` / `BREAKING CHANGE:` footer — major)
- Exported symbol removed or renamed
- Required prop added to an existing component
- Prop renamed
- Type narrowed (e.g. `string` → `'a' | 'b'`)
- Polymorphic constraint tightened (e.g. previously allowed any `E`, now constrained)
- A documented/exported subpath is removed or changed; published subpaths are supported API
- Theme token removed or renamed (downstream apps reading `theme.x.y` or `var(--squonk-x-y)` in their own styles break silently — major). `src/theme/tokens.css` shows every published variable; diff it against `main`

## The non-breaking deprecation path

When you **can** avoid a break, prefer it. Patterns:

**Rename a prop** without breaking:
```ts
export interface ButtonProps {
  /** @deprecated use `variant` instead. Will be removed in v2.0.0. */
  isCool?: boolean;
  variant?: 'default' | 'cool' | 'special';
}
// in the component:
const effectiveVariant = variant ?? (isCool ? 'cool' : 'default');
```
- Mark old prop `@deprecated` with the target removal version
- Add a console.warn in development only (NODE_ENV check) on first use per session
- Describe the migration in the `BREAKING CHANGE:` footer of the commit that removes it, so it lands in `CHANGELOG.md`

**Rename an export** without breaking:
```ts
export { NewName } from './new-name/new-name';
/** @deprecated alias for `NewName`. Will be removed in v2.0.0. */
export { NewName as OldName } from './new-name/new-name';
```

**Tighten a type** without breaking:
- Add the narrower type as a new export alongside the old one. Migrate consumers in a follow-up major.

**Change default behavior** without breaking:
- Introduce a new prop that opts into the new behavior. Flip the default in the next major.

## When breaking *is* the right call

Don't deprecate forever. Greenlight a break when:
- The deprecation surface would be larger than the break itself
- The old behavior is actively wrong (security, accessibility, broken contrast — see `getMinContrastTextColor` helpers)
- No known downstream consumers depend on it (check internal repos before claiming this)
- A single-major-version cleanup is overdue and several smalls can be batched

When breaking, do all of:

1. **Commit with `!`** — `feat(button)!: rename isCool to variant` or `refactor(theme)!: remove primitives export`
2. **Include `BREAKING CHANGE:` footer** in the commit body:
   ```
   BREAKING CHANGE: `isCool` prop on <Button> is removed. Replace with
   `variant="cool"`. Codemod: `s/isCool/variant="cool"/`.
   ```
3. **Update CHANGELOG-adjacent docs** — semantic-release builds the entry, but if there's a `MIGRATIONS.md` or `UPGRADING.md`, append a section there too.
4. **Search internal consumers first** — authorized repository search or `rg` in available linked checkouts for the old symbol before merging.
5. **Group breaks together** — if you're going to publish 2.0.0, bundle every pending break into the same release rather than dribbling them out across majors.

## How to run this skill

1. Read the diff: `git diff origin/main...HEAD -- src/`
2. For each exported symbol that changed, classify it (additive / behavior / breaking) using the rules above.
3. Output a table:

   | Symbol | File | Classification | Recommendation |
   |---|---|---|---|
   | `Button.isCool` | `src/components/functional/button/button.tsx` | Breaking (prop removed) | Deprecate via alias; bundle into v2.0 |
   | `Card` (new) | `src/components/layout/card/card.tsx` | Additive | Commit as `feat(card): add Card layout component` |

4. If any breaking changes are unavoidable or chosen, draft the commit message body and recommended `MIGRATIONS.md` entry.
5. Hand off to the `commit-and-release` skill for the actual commit/push.

## What this skill does NOT do

- Does not run `semantic-release --dry-run` (that's `commit-and-release`)
- Does not edit code on its own — it's advisory + drafts text
- Does not delete deprecated symbols on a schedule — that's a manual call when the user opens the next major
