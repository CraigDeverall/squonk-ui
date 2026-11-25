---
name: visual-regression
description: Run @squonk/ui's Playwright component snapshot tests, triage failures by separating intentional visual changes from regressions, and selectively update snapshots only for intentional ones. Use after changing any component CSS module, React Aria component or theme token, before committing visual changes, or when the user asks to "run the snapshots", "update snapshots", or "check for visual regressions".
---

# Visual Regression

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonk/ui` library only. Visual regressions are caught by Playwright Component Tests; the workflow is deliberately Docker-isolated so the snapshots are reproducible across machines.

## How the tests are wired

See [playwright.config.ts](../../../playwright.config.ts) and [test-setup/storybook-test.sh](../../../test-setup/storybook-test.sh).

- **Test files**: `src/**/*.test.tsx` — each component has a companion `.test.tsx` that mounts the component and asserts a screenshot match.
- **Runner**: `@playwright/experimental-ct-react`, Chromium only, single worker.
- **Snapshots**: stored alongside test files (Playwright default). Diffs go to `test-results/` and `playwright-report/`.
- **Docker isolation**: `test-setup/storybook-test.sh` runs everything in a container via `docker-compose` so OS-level font rendering is consistent.

## Commands

```bash
# Run from the repository root

# Run all snapshot tests. Fails if any pixel diff > threshold.
npm run test

# Update snapshots after intentional visual changes (DANGER — see triage below first).
npm run test:update

# Open the HTML report from the most recent run.
npm run show-report
```

## The new-component baseline path

A brand-new component (just scaffolded by `scaffold-component`) has no snapshot PNG yet. The first run will fail with a "snapshot not found" / "missing baseline" error — that's normal, not a regression. **For a new component, skip the triage workflow entirely** and establish the baseline in one go:

```bash
# Run from the repository root
npm run test:update
```

After the baseline run:

1. **Inspect the generated PNG.** Path: `src/components/{type}/{kebab}/{kebab}.test.tsx-snapshots/<name>-chromium-linux.png`. Open it. If it looks wrong (wrong colors, mis-sized, missing styles), the baseline you just generated is the bug — delete the PNG, fix the component, re-run `npm run test:update`.
2. **Commit the snapshot alongside the component** in the same `feat(<scope>): add <ComponentName>` commit. New components are one of the few cases where the snapshot and source belong together — there's no prior baseline to migrate from.
3. **Don't run the triage workflow for a new component.** The "intentional vs regression" framing assumes a prior baseline exists; for a new component there is no prior state to regress against.

The triage workflow below applies to **existing** components whose snapshots already exist on `main`.

## The triage workflow

When `npm run test` fails, **never blindly run `npm run test:update`**. That's how regressions get baked in.

### Step 1 — list which tests failed and SEE the diffs

The Playwright HTML report (`playwright-report/index.html`) shows each failed test with an expected/actual/diff image triple. From the CLI, parse the run output:

```bash
# Run from the repository root
npm run test 2>&1 | grep -E "(✘|×|FAIL|failed)"
```

Map each failed test back to its component:
- `src/components/functional/button/button.test.tsx` → Button
- `src/components/functional/text-field/text-field.test.tsx` → TextField
- etc.

Then **actually see each diff** — use `inspect-snapshots` to read the expected, actual, and diff PNGs for each failing test (they're under `test-results/` after a failed run). Triaging from filenames alone is guessing; reading the images is seeing. The classification in step 2 is much more reliable when you can compare visually.

### Step 2 — cross-reference with the diff

For each failed test, check whether the component (or a token it consumes) was actually edited on this branch:

```bash
# Run from the repository root
git diff --name-only origin/main...HEAD
```

Two classifications:

- **Intentional**: the failing test's component file changed, OR a theme token it visibly depends on changed (e.g. `theme.colors.primary` and Button's CSS reads `var(--squonk-colors-primary)`, or a derived token such as `--squonk-colors-primary-hover`). Snapshot update is appropriate.
- **Regression**: the failing test's component did NOT change AND no consumed token changed. Something is leaking — investigate the actual diff before touching snapshots. Common causes:
  - A `*.stories.tsx` change re-exported a shared style
  - A `theme.ts` primitive change rippled further than expected (this is where the architecture earns its keep — and where it can bite)
  - A `playwright.config.ts` or `test-setup/` change altered rendering
  - A dependency bump (`react-aria-components`, `react`, `lightningcss`) changed default rendering

### Step 3 — surface the triage to the user

Don't update silently. Show:

```
Visual regression report
========================
Intentional (will update on confirmation):
  • Button — primary variant — `theme.colors.primary` changed in this branch
  • Button — hover state    — same root cause

Regression (do NOT update; needs investigation):
  • TextField — focus state — no relevant changes on this branch
```

Use existing authorization for intentional visual changes. If accepting a changed baseline would expand the agreed behavior, present the actual diff and obtain that decision before accepting it. Fix unexpected regressions.

### Step 4 — update only the intentional snapshots

The current `test-setup/storybook-test.sh` does not forward positional arguments, so adding `--grep` does not target a test. Do not advertise a filtered run or delete baselines as a workaround. Use the runner's supported full update only when every changed baseline is intentional and reviewed, or first implement and verify explicit runner filtering within the authorized task.

```bash
# Full Docker-backed update; review all changed PNGs.
npm run test:update
```

### Step 5 — commit the snapshot change with a meaningful message

Snapshot updates should travel with the change that caused them. If the same branch already has `feat(button): ...`, amend the snapshots into that commit? **No** — create a separate follow-up commit so reviewers can see exactly what changed visually:

```
chore(snapshots): update Button snapshots for new variant prop

Verified against commit <sha> (feat(button): add variant prop).
Intentional changes: primary variant color, hover state spacing.
```

`chore` so it doesn't trigger a release on its own — the `feat:` commit is what releases.

## What NOT to do

- **Don't `npm run test:update` reflexively after every failure.** That defeats the entire system.
- **Don't update snapshots on `main`** without the originating change. Snapshots that drift from the code that produced them are landmines.
- **Don't ignore "regression" classifications** even if the diff looks small — visual regressions are exactly the bugs this suite exists to catch.
- **Don't disable a flaky test** to make CI green. If a test is flaky, fix the source of the flake (rendering timing, animation, font loading) — flakiness compounds.

## When tests pass but the change *should* have moved something

If you changed a component and the snapshot test passes, that's also a signal — either:
- The change was style-neutral (legitimately no pixel impact), or
- The test isn't actually exercising the changed path

Skim the test file to confirm the right variant/state is being snapshotted. If not, that's a test-coverage bug — extend the test before committing.

## Cross-references

- `test-strategy` — picks WHEN visual-regression applies (rendering changes) vs `write-unit-tests` (pure logic) vs E2E. Run that first if uncertain.
- `inspect-snapshots` — read the expected/actual/diff PNGs to triage with eyes, not file names.
- `prototype-live` — render a change before snapshotting so you know what you're baking in.
- `theme-scratchpad` — a theme change ripples; expect intentional diffs and use this to predict them.
