---
name: test-strategy
description: Decide which kind of test a @squonk/ui change needs — Vitest unit, Playwright CT visual snapshot, or browser-level Playwright (E2E) — and ensure every prop, variant, and significant state is covered by the appropriate one. Use as pipeline step 8 (after write-stories), when adding or modifying any test, when reviewing a component's test coverage, or when the user asks "is this tested", "how should I test this", "what kind of test".
---

# Test Strategy

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonk/ui` library only. The library has three testing surfaces; each catches a different class of bug. Picking the wrong surface either misses real regressions or wastes effort on tests that won't catch the bugs that matter.

## The three surfaces

| Surface | Tool | What it catches | What it doesn't |
|---|---|---|---|
| **Unit (Vitest)** | `npx vitest run`<br>`*.test.ts` (no JSX) | Pure-logic bugs: theme getter math, util-fn correctness, type-helper correctness | Anything visual; anything requiring a DOM |
| **Component behavior + visual (Playwright CT)** | `npm run test`<br>`*.test.tsx` in `src/components/**` | Rendered states, keyboard/focus, labels, callbacks, disabled/loading behavior and screenshots | Complete application routing and manual assistive-technology acceptance |
| **Browser E2E (Playwright)** | Not currently wired up (would be `*.e2e.ts` outside `src/components/`) | Cross-component flows; interaction sequences; routing; real keyboard | Single-component rendering details (overlap with CT) |

The library has Vitest theme/util tests and Playwright component behavior and visual tests. Surface 3 isn't wired up — invoke only if a real cross-component flow needs verification.

## The decision tree

For any change, walk these in order:

```
1. Does the change touch only pure logic (no JSX, no rendering)?
   ├─ YES → Vitest unit test (Surface 1)
   └─ NO ↓

2. Does the change render a component or alter its appearance?
   ├─ YES → Playwright CT snapshot (Surface 2)
   │        └─ Update or add a snapshot per affected variant/state
   └─ NO ↓

3. Does the change involve multiple components interacting (a user flow)?
   ├─ YES → Browser E2E (Surface 3) — only if no single-component test would catch it
   └─ NO   → Probably not testable at the component-library level; the consumer tests it
```

Most changes hit Surface 2. Surface 1 is for theme/util work. Surface 3 is rare and currently not wired up.

## Coverage targets per component

For a component to be considered fully tested, it needs:

| Coverage | Required? | Surface | Notes |
|---|---|---|---|
| **Default render** | Always | Surface 2 | The "happy path" — what the component looks like with default props. |
| **Each variant** | Always | Surface 2 | One snapshot per value of each `variant` union prop. |
| **Each significant state** | Always | Surface 2 | `disabled`, `loading`, `error`, `selected` — anything that changes the rendered output. |
| **Polymorphic `as` prop** | When polymorphic | Surface 2 | One snapshot showing `as="..."` rendering correctly (e.g. `<Button as="a">`). |
| **Keyboard / focus state** | If interactive | Surface 2 (or 3) | Assert Tab/Enter/Space/Escape behavior, focus placement/return and meaningful names; supplement with focus-ring screenshots. |
| **Pure logic helpers** | If the component owns them | Surface 1 | E.g. a `formatLabel` util living next to the component. |
| **Cross-component composition** | If the component is rarely standalone | Surface 2 or 3 | Test library composition in CT; application routing belongs to a consumer flow test. |

The default state is the minimum. Variants and states scale the test count.

## Writing a Playwright CT test (Surface 2)

The pattern, from existing tests like `button.test.tsx`:

```tsx
import { expect, test } from "@playwright/experimental-ct-react";
import { Button } from "./button";

test("Renders the default button", async ({ mount }) => {
  const component = await mount(<Button>Click me</Button>);
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders the primary variant", async ({ mount }) => {
  const component = await mount(<Button variant="primary">Primary</Button>);
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders the disabled state", async ({ mount }) => {
  const component = await mount(<Button disabled>Disabled</Button>);
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("Renders with focus", async ({ mount }) => {
  const component = await mount(<Button>Focused</Button>);
  await component.focus();
  await expect(await component.screenshot()).toMatchSnapshot();
});
```

**Conventions:**
- Group assertions that verify one coherent behavior. Screenshots complement functional assertions.
- Test names should describe the state (`"Renders the primary variant"`, not `"Test 1"`).
- Use `await component.focus()` / `await component.hover()` for interaction states.
- The Docker runner produces stable cross-machine snapshots — local rendering differences are normal.

## Writing a Vitest unit test (Surface 1)

For pure logic — no `mount`, no JSX, no DOM. Pattern from `theme.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatLabel } from "./format-label";

describe("formatLabel", () => {
  it("returns the input unchanged for short strings", () => {
    expect(formatLabel("short")).toBe("short");
  });

  it("truncates long strings to the max length with ellipsis", () => {
    expect(formatLabel("a".repeat(50), { maxLength: 10 })).toBe("aaaaaaaaa…");
  });
});
```

Run with `npm run test:unit`. Imports are relative; Vitest picks up the `vite-tsconfig-paths` plugin for `@src/*` aliases if configured.

## Browser E2E (Surface 3) — only when justified

A browser E2E is justified when:
- The test exercises **multiple components** interacting (e.g. typing in a `TextField` triggers a `Toast`).
- The test exercises **keyboard or screen-reader behavior** the CT snapshot can't capture.
- The test exercises **routing or page state** outside the component library's scope.

If you're testing a single component's rendered output, CT is sufficient — don't escalate to E2E.

The library doesn't currently have an E2E suite. Adding one would mean:
- A new test glob (e.g. `**/*.e2e.ts`) outside `src/components/`.
- A separate Playwright config (`playwright.e2e.config.ts`).
- A separate npm script (e.g. `test:e2e`).
- A storybook-based or test-app-based harness for the components to live in during the test.

Flag the need to the user; don't add E2E infra silently.

## Avoiding test waste

A few rules of thumb to avoid bloat:

1. **Don't snapshot what the user can't see.** Internal state (`isOpen`, `currentValue`) doesn't need a snapshot — its *effect* on the rendered output does.
2. **Don't unit-test what the type system already enforces.** TypeScript catches prop misuse; a Vitest test that just asserts "the type is correct" is redundant.
3. **Don't write E2E for single-component coverage.** CT is faster and more focused.
4. **Don't add tests that depend on timing or animations.** Snapshot tests must be deterministic. If a component animates, snapshot the *post-animation* state, not the in-flight frames.
5. **Don't test internal implementation.** Test the public contract — what the consumer sees and interacts with. Internal helpers can be unit-tested separately.

## Coverage audit — what to check for an existing component

When reviewing a component's tests:

```bash
# Run from the repository root
# List all snapshots for the component:
ls src/components/functional/<kebab>/<kebab>.test.tsx-snapshots/

# Compare against its prop signature:
grep -A 20 "interface .*Props" src/components/functional/<kebab>/<kebab>.tsx
```

Map meaningful variants and states to functional or visual evidence. Avoid a Cartesian product of snapshots; test interactions and boundary cases that could break the public contract.

Use `inspect-snapshots` to **read** the existing PNGs — sometimes a snapshot exists but captures the wrong state.

## Tests must pass in CI

CI runs both test surfaces before a release:

- **Unit tests** — `npm run test:unit` (Vitest, no Docker, fast).
- **Component tests** — the Playwright CT suite (Docker-isolated locally through `npm run test`, slow).

A failure in either blocks `semantic-release`. Implications:

- **Don't commit a component without snapshots.** The first test run on CI generates an unfamiliar baseline failure.
- **Don't commit `test:update` output without checking.** If the update was wrong, you've baked a regression into CI.
- **Don't disable a flaky test.** Fix the flake — animations, font loading, deterministic seeds.
- **Run `npm run test` locally** before committing significant changes; doing so catches the issues without a CI round-trip.

## Anti-patterns

| Anti-pattern | What goes wrong | Fix |
|---|---|---|
| One mega-test with multiple assertions | Hard to read failures; can't see which state regressed | One `test()` per snapshot |
| `test.skip` or `test.fixme` left in the suite | Skipped tests pile up and rot | Fix and re-enable, or remove |
| Snapshot tests for trivial wrapping (a `<div>` that does nothing) | Tests churn without catching anything | Don't snapshot until there's real visual logic |
| Hardcoded delays (`await new Promise(r => setTimeout(r, 500))`) | Flaky; slow | Use Playwright's auto-waiting (`waitForSelector`, `expect(...).toBeVisible()`) |
| Snapshots with timestamps or random IDs in them | Snapshot drifts every run | Mock the data; use stable IDs |
| Testing CSS-module class names (`squonk_root_sYCFLq`) | Hashed names change with the file path and build tool | Test rendered output, roles and `data-*` state attributes, not class names |

## Cross-references

- `visual-regression` — the runner / triage flow for Surface 2. This skill picks WHEN to use it; that skill handles HOW.
- `write-unit-tests` — Surface 1 conventions. This skill picks WHEN to use Vitest; that skill handles HOW.
- `inspect-snapshots` — read existing PNGs to audit current coverage.
- `prototype-live` — for verifying a change visually before committing it as a snapshot.
- `accessibility-conventions` — a11y verification is partially manual (keyboard sweep, screen reader); supplements automated coverage.

## Handoff

Runs as pipeline step 8 (after `write-mdx-docs`). Decides which of the three surfaces apply. Each picked surface then routes to its dedicated skill (`visual-regression` for CT, `write-unit-tests` for Vitest, ad-hoc for E2E).
