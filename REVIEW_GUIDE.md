# Review Guide — @squonkstack/ui

Reviewers apply this file to every pull request. It is the
source of truth for what counts as a `must-fix` violation in this
repo. Update it whenever a new library-level rule emerges.

## Hard rules — must-fix on violation

1. **Theme-controlled values use tokens.** Colors, scalable spacing/type/radii,
   z-indexes and timing use `var(--squonk-*)` in CSS modules (`theme.*` in code
   not yet migrated). Colours are never computed in a component; derived
   colours come from `derivedColorTokens`. CSS keywords, zero and percentages are
   allowed. Named fixed geometry and optical ratios are allowed only when
   documented and governed under `DESIGN_SYSTEM.md`; new arbitrary literals are
   must-fix. Register dimensions intended to scale derive from theme primitives.

2. **No outer margin or fixed width** on a component's outermost element.
   Parent-owned spacing and containment must remain predictable. Documented
   fixed geometry, viewport-shell contracts and compatible native `style`/`ref`
   escape hatches are governed exceptions, not grounds for silently removing APIs. See
   Parent patterns in `DESIGN_SYSTEM.md`.

3. **New components must ship the canonical four-file unit:**
   - `<name>.tsx`
   - `<name>.stories.tsx`
   - `<name>.test.tsx`
   - `<name>.mdx`

   plus `<name>.module.css` when the component renders its own styles. New
   styles use CSS Modules, not styled-components; see "Styling with CSS
   Modules" in `DESIGN_SYSTEM.md`.

   If any is missing, must-fix, except renderless Style components may omit a
   standalone snapshot file when composition/behavior is covered. Animation is
   not exempt; Motion components require runtime and reduced-motion regressions.

4. **Rendered components need visual and functional regression coverage.**
   Cover at least the default appearance with a CT screenshot (subject only to
   the renderless Style exception). Interactive or animated components also
   need assertions for their behavior, state transitions and accessibility
   contracts; screenshots alone cannot establish correctness.

5. **Dark mode parity.** Every new color decision must work in both light
   and dark mode. If the snapshot in one mode is visibly broken (missing
   contrast, invisible text, wrong color role), must-fix. New components
   must have stories or snapshots covering both modes.

6. **Compatibility breaks require major-release metadata and migration notes.**
   Removed/renamed exports or props, type narrowing, changed established defaults,
   and raised supported dependency/runtime floors require `BREAKING CHANGE:`
   (or Conventional Commit `!`). Additive exports, optional props and tokens
   normally warrant a minor release, not a breaking footer. Inspect every public
   entry point, not just `src/index.ts`; automated surface classification is
   evidence and does not replace behavioral compatibility review.

7. **MDX must not be stub-quality.** If a new component's `.mdx` is just
   the generator output (one paragraph + a bare `<Canvas>`), must-fix
   and point to Documentation expectations in `DESIGN_SYSTEM.md`.

8. **Theme tokens are added through the primitives → computed-getter →
   CSS-vars chain.** Direct additions to a single layer that bypass the
   chain are must-fix. See Token vocabulary in `DESIGN_SYSTEM.md`.

9. **Accessibility regressions are must-fix.** Check semantic HTML, accessible
   names and descriptions, keyboard activation/dismissal, focus management,
   disabled/loading behavior, reduced motion and label association as applicable.
   Test default text roles on supported light/dark surfaces against WCAG AA;
   custom colors and transparent/image composites require explicit consumer
   verification. A screenshot or automated audit alone is insufficient.

## Encouraged checks — nit-level

- Naming follows the repository conventions (folders kebab-case, components
  PascalCase, event handlers `onFoo`, boolean props without `is` prefix
  unless ambiguous).
- Mobile-first CSS — min-width queries at the default `theme.breakpoints.*`
  values, guarded by a unit test, never max-width by default.
- CSS modules wrap rules in `@layer dt.components`, style React Aria state through
  its `data-*` attributes, and merge the consumer's `className` and `style`.
- Stories cover all variants, sizes, and significant states (loading,
  disabled, error, empty).
- One responsibility per component — if a component grows props that
  fundamentally change what it is, suggest splitting.

## Questions worth asking

- New utility added in `src/`? Could this live alongside an existing
  utility module? Is it generic enough to expose, or app-specific?
- A new prop is added — is it discoverable from the type signature,
  or does it require reading the implementation?
- A test was removed — what was it covering, and is that coverage
  preserved elsewhere?

## Out of scope — do not comment on

- Code style, import order, line length, trailing whitespace —
  Prettier and ESLint handle these. CI will block the pull request if they fail.
- Test naming conventions (Vitest vs Playwright CT idioms).
- Comment density — the project preference is minimal comments. Do not
  ask for more comments unless a non-obvious invariant is at risk of
  being misread.
- TODO comments left in code unless they touch the diff and lack a
  tracking link.

## Always-load context

Read these from the checked-out repo before reviewing:

- `DESIGN_SYSTEM.md` — full library philosophy.
- `package.json` — to know which deps exist before suggesting new ones.
- Any file in the diff plus its sibling `.stories.tsx`, `.test.tsx`,
  `.mdx` if it lives under `src/components/**`.

## Outcome

Finish each review with one of:

- `approve` — no open `must-fix`, and all earlier findings are resolved
  or acknowledged by the author as `wontfix`.
- `blocked: N must-fix` — at least one open `must-fix`.
- `awaiting-author` — the author needs to answer open questions.
