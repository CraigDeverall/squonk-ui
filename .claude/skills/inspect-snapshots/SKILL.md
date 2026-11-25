---
name: inspect-snapshots
description: Read existing Playwright CT snapshot PNGs from @squonkstack/ui to actually SEE what current components look like before changing them. The Read tool can display these PNGs as images. Use during determine-component-intent step 4 (identify reference components — read what they look like, not just their source), before modifying an existing component (capture the current visual state), and during visual-regression triage (compare expected vs actual diffs).
---

# Inspect Snapshots

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonkstack/ui` library only. The Playwright CT tests save PNG snapshots next to each test file. **The Read tool renders PNGs visually** — meaning I can literally see what the existing components look like instead of imagining them from styled-component source.

Skipping this step is how I end up redesigning a component without realizing it already looks fine, or writing styling that contradicts a sibling component's visual language.

## Where snapshots live

Each component's snapshots live in a folder next to the test file:

```
src/components/{type}/{kebab}/{kebab}.test.tsx-snapshots/
  ├── *.png      # one per `expect(...).toMatchSnapshot()` call
```

To list every snapshot in the library:

```bash
# Run from the repository root
find src/components -name "*.png" -path "*-snapshots/*"
```

Typical filenames are derived from the test title (Playwright's default). Format: `<test-title>-chromium-linux.png` or `<test-title>-1-chromium-linux.png`.

## When to use this skill

### 1. During `determine-component-intent` step 4 (identify references)

When the spec block calls out an "in-library analog" (e.g. "shape similar to Card"), don't just read `card.tsx` — read the snapshot PNG. The source tells me the prop signature; the image tells me the visual identity. Both inform the new component.

### 2. Before modifying an existing component

If the user asks "change Button's hover state" or "make Card's padding tighter," the first thing I do is read the current snapshot. Without it, I'm guessing what "current" looks like — and guessing wrong is how regressions ship.

### 3. During `visual-regression` triage

When a test fails, Playwright produces three images: expected, actual, diff. All three are PNGs the Read tool can display. The triage workflow becomes: read the expected → read the actual → read the diff → classify intentional vs regression with my own eyes, not just by reading the source diff.

### 4. When the user asks "what does X look like?"

Same skill — read the snapshot, describe what I see.

## How to read a snapshot

The Read tool accepts a PNG file path; the result is displayed as an image:

```
Read(file_path="src/components/functional/button/button.test.tsx-snapshots/Renders-the-button-1-chromium-linux.png")
```

This shows me the rendered Button. From it I can describe:
- Color, shape, size proportions
- Spacing, padding
- Text content and weight
- Border, shadow, focus ring (if captured)
- Hover/active state (if the test mounted that state)

**Limit**: snapshots are static. Animations, transitions, hover-only states aren't captured unless the test explicitly triggered them.

## Quick patterns

### Reading all snapshots for a component

```bash
find src/components/functional/button -name "*.png"
```

Then `Read` each one. Three or four images max is the right batch size; reading 20 at once burns context.

### Comparing two components visually

When the spec says "shape similar to Card," read **both** the new-component's analog PNG **and** the closest existing components in the same category:

```bash
find src/components/functional -name "*.png" | head
find src/components/layout -name "*.png" | head
```

Read the 2–3 most relevant ones. The goal is to understand the library's visual vocabulary so a new component fits in.

### During visual-regression triage

Playwright stores diff artifacts in `test-results/` after a failed run. The HTML report at `playwright-report/` references them. To find the diffs:

```bash
find test-results -name "*-diff.png" -o -name "*-actual.png" -o -name "*-expected.png"
```

Read each triple (expected, actual, diff) for one failing test before moving on.

## What I learn from reading vs. what I learn from source

| From source (`*.tsx`) | From PNG (`.png`) |
|---|---|
| Prop signature | Visual identity (color, shape) |
| Variant logic | Real spacing proportions |
| Theme tokens consumed | Actual rendered size |
| Polymorphic constraints | Border, shadow, glow |
| Event handlers | Text style, weight, alignment |

These are complementary. **Read both** before significant changes. Reading only the source skips half the information.

## Limitations to acknowledge

- **Chromium-linux only.** Snapshots are generated in Docker; what I see is what CI sees, not necessarily what Chrome on macOS renders in dev. For cross-browser concerns, this skill doesn't help.
- **Static.** Hover states, transitions, animations, focus rings, error states — only captured if the test explicitly mounts them. Most current tests only capture the default state.
- **One-state per snapshot.** A Button's `Primary` and `Cool` variants are separate test runs, separate PNGs. Read both.
- **Drift.** If snapshots haven't been updated since a deliberate visual change, the PNG is out of date. Cross-check with the source and git log if something looks wrong.
- **No layout context.** Snapshots are tight-cropped around the mounted component. They don't show how the component behaves inside a parent layout — that's where `prototype-live` Path A/C earns its keep.

## Self-discipline

**Default to reading the snapshot before making any change to an existing component's visual styling.** The cost is low (one image read); the cost of redesigning something that already looked correct is high.

If a snapshot doesn't exist (a brand-new component, or a stale baseline), use `prototype-live` to generate one first — then read it.

## What this skill does NOT do

- **Doesn't update snapshots.** That's `visual-regression`'s `test:update` workflow.
- **Doesn't run the tests.** It just reads the PNG artifacts produced by previous runs.
- **Doesn't replace `prototype-live`.** Snapshots show static state; live prototyping shows interaction.
- **Doesn't infer current behavior from a missing snapshot.** No baseline = use `prototype-live` to make one.

## Cross-references

- `determine-component-intent` step 4 — read analog component snapshots when identifying references.
- `visual-regression` — uses this skill during triage; the two are paired.
- `prototype-live` — complementary, for cases where the static snapshot isn't enough.
- `non-breaking-refactor` — when classifying a change as "behavior change (visual)," read the before-snapshot to be sure.
