---
name: write-unit-tests
description: Write Vitest unit tests for non-rendering logic in the @squonk/ui library — theme getters, utility functions, type-level helpers, and other pure code. Use when the user asks to "add a unit test", "test the theme", "test this util", or whenever a non-rendering change wants regression coverage. Do NOT use this skill for component behavior — that's covered by Playwright CT (the `*.test.tsx` files run via `npm run test`).
---

# Write Unit Tests

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonk/ui` library only. The repo has **two distinct test surfaces** and choosing the wrong one is the most common mistake.

## The two surfaces

| Surface | File pattern | Runner | What it tests |
|---|---|---|---|
| **Vitest** | `*.test.ts` (no JSX) | `npx vitest run` | Pure logic: theme getters, utils, type helpers, anything that doesn't need a DOM. **This is what this skill covers.** |
| **Playwright CT** | `*.test.tsx` (inside `src/components/**`) | `npm run test` (Docker) | Component renders + visual snapshot. Covered by the `visual-regression` skill. |

If the thing you're testing imports React or renders JSX, you almost certainly want Playwright CT, not Vitest. The single exception is testing a type-level utility — a `.test-d.ts` style assertion — but the repo doesn't currently do that.

**Rule of thumb:** if `mount()` would appear in the test, it's Playwright CT. If `expect(...).toBe(...)` against a plain value is enough, it's Vitest.

## Where Vitest tests live

Co-located with the source, mirroring [src/theme/theme.test.ts](../../../src/theme/theme.test.ts). For a utility at `src/utils/format-date.ts`, the test goes at `src/utils/format-date.test.ts`.

## How to run Vitest

```bash
# Run from the repository root

# Run once, exit (use this in CI / pre-commit checks)
npm run test:unit

# Watch mode (during iteration)
npm run test:unit:watch

# Run a single file
npx vitest run src/theme/theme.test.ts

# With coverage
npx vitest run --coverage
```

`test:unit` is wired to Vitest via [vitest.config.ts](../../../vitest.config.ts), which limits the test glob to `src/**/*.test.ts` (no `.tsx`) — that ensures Playwright CT files (which also match `*.test.tsx`) don't run under Vitest. **Don't change the glob to include `.tsx`** without also updating Playwright config; the two runners can't both own the same files.

## The canonical shape

Follow the pattern in `src/theme/theme.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { thingUnderTest } from "./thing";

describe("thingUnderTest", () => {
  it("does the obvious case", () => {
    expect(thingUnderTest("input")).toBe("expected");
  });

  it("handles the edge case", () => {
    expect(() => thingUnderTest(null)).toThrow();
  });
});
```

Conventions enforced by the existing example:
- `describe` blocks group related assertions; one `describe` per export under test is fine.
- `it` blocks state the *behavior*, not the implementation (`"derives from primitives.spacingPx"`, not `"calls multiplyByEight"`).
- One assertion per `it` where possible. Multiple are acceptable when they're describing the same invariant from different angles.
- No mocks for pure code. If you find yourself needing a mock, you're probably testing the wrong layer — push the test up to Playwright CT or down to a smaller pure function.

## What to test in this library

| Code | Test it in Vitest? | Why |
|---|---|---|
| Theme getter values | **Yes** | Catches a primitive change that silently shifts a downstream token. See `theme.test.ts` for the established pattern — assert against the resolved string (`"16px"`), not the primitive arithmetic. |
| `themeHelpers.lighten` / `darken` / `getMinContrastTextColor` | **Yes** | Pure functions over a color string. Easy targets. |
| `themeToCssVars` output shape | **Yes** | Already tested — extend when the CSS-var emission rules change. |
| Anything in `src/utils/**` not involving JSX | **Yes** | Default home for utility tests. |
| A component's rendered output | **No** | Use Playwright CT. |
| A component's prop forwarding / polymorphic typing | **No (Vitest)** | Compile-time correctness is enforced by `tsc --noEmit`; runtime forwarding is exercised by Playwright CT. |
| Storybook stories or args | **No** | Stories are demos, not tested artifacts. |

## When you add a new test file

1. Mirror the path of the source: `src/foo/bar.ts` → `src/foo/bar.test.ts`.
2. Import from a **relative** path (`./bar`) — Vitest in this repo doesn't go through the `@src/*` alias by default unless you've configured `vite-tsconfig-paths` for the test runner. The existing `theme.test.ts` uses `./theme`. Follow suit.
3. After writing, run once before committing:
   ```bash
   # Run from the repository root
   npx vitest run src/foo/bar.test.ts
   ```
4. If the file is the first Vitest test in a new directory, sanity-check that `tsc --noEmit` still passes (Vitest types from `@types/node` + `vitest` should resolve, but a missing `tsconfig` include can bite).

## What this skill does NOT cover

- **Component rendering / snapshots** → `visual-regression` skill.
- **Adding a new token, then testing it** → `add-token` already writes the assertion. Don't double-up.
- **API endpoint tests** → out of scope for this library (there are no endpoints).
- **E2E tests** → not present in this repo.

## Coverage stance

Aim for behavior coverage over line coverage. The library's value is in (a) the theme contract holding under primitive changes and (b) utility functions being correct at the boundaries. Don't chase 100% — chase the cases where a future change would silently break something a consumer relies on.

If you're testing a theme token, the test that earns its keep is the one that asserts the **resolved value** (`expect(theme.spacing.cardPadding).toBe("16px")`), not the arithmetic. The arithmetic is in the source; the resolved string is the contract.

## Handoff

Vitest tests are non-public, non-shipping code. The commit type is `test:` (no release impact). Hand off to `commit-and-release` for the actual commit message.

## Cross-references

- `test-strategy` — the meta-decision skill that picks Vitest vs Playwright CT vs E2E. If you're not sure which surface applies, start there.
- `visual-regression` — the rendering surface. If the change touches JSX, go there instead.
