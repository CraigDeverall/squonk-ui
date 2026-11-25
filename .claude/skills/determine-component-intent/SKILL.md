---
name: determine-component-intent
description: Triage any component-shaped request against the @squonkstack/ui library — figure out (a) what action the request maps to (new build, modify existing, wrap 3rd-party, canonicalise off-pattern, reject as app-specific), then (b) the design intent (visual shape, structure) and (c) the function intent (state, callbacks, role) — and route to the correct downstream skill. Use as step 1 of any component-related request, especially when the user gives 1–5 words ("Add a User Badge", "Make Button do X", "We need a Toast", "Fix DogTester") without a clear path forward. Replaces the older interpret-design-intent skill.
---

# Determine Component Intent

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonkstack/ui` library only. It runs **first** for any component-shaped request. The downstream pipeline (`scaffold-component`, `wrap-third-party-component`, `non-breaking-refactor`, etc.) is only correct if the upstream triage was right. Skipping this step ships components that didn't need to exist, scaffolds duplicates, or wraps a library when the right move was to extend an existing component.

## The three questions this skill answers, in order

1. **What action does this request map to?** (Triage) — new build, modify existing, wrap, canonicalise, reject, or non-component work.
2. **What is the design intent?** (Visual / structural) — shape, role, slot.
3. **What is the function intent?** (Behavioral) — state, callbacks, control mode, single vs. compound.

After all three, the skill produces a spec block + a named downstream skill to hand off to.

## Step 1 — Triage the request

Match the user's wording (and the current state of the repo) against this table. The first row that fits wins.

| Signal | Action | Downstream |
|---|---|---|
| User names a new component that **doesn't exist** in `src/components/**` | **Build new** | Continue this skill → `scaffold-component` pipeline |
| User asks to change a prop, variant, default, or behavior of an **existing** component | **Modify existing** | `non-breaking-refactor` first (classify), then implement → `commit-and-release` |
| User asks for something like "build X on React Aria" / "use TanStack Table" / "use react-XYZ here" | **Wrap 3rd-party** | `research-component-patterns` → `wrap-third-party-component` |
| User points at an off-pattern existing component (PascalCase folder, missing siblings, no kebab-case — compare `src/components/DogTester/`) | **Canonicalise** | `scaffold-component`'s off-pattern path (don't re-scaffold over it) |
| User wants an app-specific composition ("a SignupFormForBetaUsers") that mixes business logic with UI | **Reject (out of library scope)** | Suggest the consumer app builds it from existing `@squonkstack/ui` primitives |
| User wants a new theme value (color, spacing, etc.) | **Theme work** | `add-token` |
| User wants a util / hook / pure function | **Non-component code** | Scaffold ad-hoc (no generator); use `write-unit-tests` |
| User wants a Storybook story added to an existing component | **Story-only** | `write-stories` directly |

Verify with quick filesystem checks before committing:

```bash
# Run from the repository root

# Does the name already exist? (case-insensitive)
ls src/components/functional src/components/layout 2>/dev/null | grep -i "<kebab-name>"

# Is the name reachable from the public API?
grep -i "<PascalName>" src/components/index.ts src/index.ts
```

If a similarly-named component exists, **stop and ask** — the user may mean "extend it" rather than "add a new one." Don't silently scaffold a duplicate.

### Reject criteria — when to push back

A request belongs in the library only if it is:
- **Reusable** across multiple consumer apps (or could be).
- **Generic** — not tied to specific business logic, copy, or domain entities.
- **Theme-able** — its visual identity can be expressed in current or future theme tokens.

If the request fails any of those, surface the concern to the user — once, with a one-sentence reason — and offer the alternative ("this looks app-specific; the consumer can compose `<Card>` + `<TextField>` to build it"). Don't refuse silently; the user may have context the rules don't capture.

## Step 2 — Determine design intent

Restate the visual concept in one sentence. Include:

- **Shape** — chip/pill, card, banner, badge dot, full-width strip, modal, popover, etc.
- **Size class** — inline (sits in a sentence), block (own row), or floating (overlay/portal).
- **Primary slot** — text label, icon + text, avatar + text, multi-line, child component, etc.

Example for "User Badge":
> Inline chip showing an avatar + display name, optionally with a role/status indicator — like the chip next to a comment author. Not a full profile card.

If the request comes with a Figma link, screenshot, or existing reference component, **anchor to that** — don't reinvent the design from first principles.

## Step 3 — Determine function intent

This is the new piece (relative to the older `interpret-design-intent`). Function intent decides the prop signature shape and which downstream skills apply.

Walk these questions in order:

### 3a — Interactive or display-only?
- **Interactive** (click, type, focus, hover-triggered behavior) → base element typically `button` / `input`; expose `on<Event>` callbacks; consider disabled/loading states.
- **Display-only** → no callbacks; props are pure data.

### 3b — Stateful or stateless?
- **Stateless** (controlled fully by props) — preferred. The library has no business owning state that the consumer can't observe.
- **Stateful internally** — only when the state is genuinely UI-local (e.g. a collapsible's open/close that the consumer doesn't need to control). Even then, expose a `defaultX` prop + an optional `onXChange` so it can become controlled.

### 3c — Controlled vs. uncontrolled (if stateful)?
Follow React convention: `value` + `onValueChange` for controlled; `defaultValue` (uncontrolled) optional alongside. Don't force the consumer to pick one; support both.

### 3d — Single component or compound family?
- **Single** — one exported component, one prop bag. Default.
- **Compound** — multiple related exports (`Tabs.Root` / `Tabs.List` / `Tabs.Trigger`). Use when the parts have meaningful slot semantics and the consumer benefits from controlling composition. Compound components are heavier to maintain — only adopt when the prop surface of a single component would be unwieldy (8+ slots, deep config).

### 3e — Standalone or compositional?
- **Standalone** — useful with default props alone (Button, Badge).
- **Compositional** — only useful when wrapping children (Card, Stack, Modal). Plan for the children's containment behavior (see `containment-behavior`).

Output: a 2–4 line function-intent paragraph.

Example for User Badge:
> Display-only, stateless, single component, standalone. No callbacks; all props are pure data (name, avatarUrl, role, status). Consumer fully controls what's shown.

## Step 4 — Identify references in the library and ecosystem

Quick check:

```bash
# Run from the repository root
ls src/components/functional src/components/layout
```

Two things to surface:
- **Closest in-library analog** — name 1–2 existing components that share shape/structure. Useful for the implementation phase.
- **Worth researching externally?** — if the component type is well-known (Avatar, Combobox, Toast, Tabs), recommend running `research-component-patterns` next. Otherwise skip.

## Step 5 — Surface critical ambiguities (one round, max)

After steps 1–4, you may have residual ambiguity that gates the scaffold. Ask questions that materially change the result, including missing accessibility, compatibility, density or state constraints. For scaffolding, prioritize **structural** decisions (primitive vs composition, functional vs layout, base element, polymorphic, compound vs single). Infer routine colors and spacing from existing tokens; clarify a requested global theme change when its impact or scope is unclear.

**Bundle ambiguities into one prompt.** Don't drip-feed.

## Step 6 — Produce the spec block + named handoff

The spec block is what every downstream skill consumes. Format:

```
Action:     <Build new | Modify existing | Wrap 3rd-party | Canonicalise | Reject>
Component:  UserBadge
Category:   Functional   (LayoutPrimitive | Layout | FunctionalPrimitive | Functional; Style/Animation require a manual implementation)
Base elem:  span         (pick-base-element)
Polymorphic: No
Children:   No
Design intent:
  Inline chip with avatar + display name, optional role/status indicator.
Function intent:
  Display-only, stateless, single component. No callbacks.
Props:
  name: string                                    (required)
  avatarUrl?: string                              (initials fallback)
  role?: string
  status?: "online" | "offline" | "away"
  size?: "sm" | "md"
In-library analog: src/components/layout/card/card.tsx (composition style)
Research recommended: Yes — React Aria has no Avatar; check the WAI-ARIA image guidance and other libraries' prop shapes.
Next skill: research-component-patterns
```

The **`Next skill:`** line is non-optional. Every spec must name the next concrete step.

## Action → next-skill mapping

| Action | Next skill |
|---|---|
| Build new | `research-component-patterns` if external research is recommended; otherwise jump to `naming-conventions` → `pick-base-element` → `scaffold-component` |
| Modify existing | `non-breaking-refactor` (classify change), then implement, then `commit-and-release` |
| Wrap 3rd-party | `research-component-patterns` (if not already done), then `wrap-third-party-component` |
| Canonicalise | `scaffold-component` (off-pattern path), then `use-tokens` audit |
| Reject | None — communicate the rejection rationale to the user |
| Theme work | `add-token` |
| Story-only | `write-stories` |
| Non-component | Ad-hoc; usually `write-unit-tests` for coverage |

## Anti-patterns

- **Skipping triage** — going straight to "the user said 'add a Badge,' run the scaffolder." A request that names an existing component is a modify, not a new build.
- **Inventing function intent the user didn't ask for** — if the user said "show user info," don't decide unilaterally that it needs an `onClick`. State the assumption explicitly.
- **Asking >3 questions** — every question is friction. Bundle, prioritize, commit.
- **Producing a spec block without a `Next skill:`** — the handoff line is the whole point of triage. Without it, the next step has to re-decide downstream.
- **Treating "Reject" as a failure mode** — sometimes the correct action is to push back. Done politely with reasoning, it's high-value.

## What this skill does NOT do

- **Doesn't scaffold.** That's `scaffold-component`.
- **Doesn't pick the base element formally.** It records a tentative pick in the spec block; `pick-base-element` validates.
- **Doesn't classify breaking-vs-additive changes.** That's `non-breaking-refactor` (called from the Modify action).
- **Doesn't decide visual styling.** Implementation phase, not triage.
- **Doesn't research external libraries.** It only recommends whether to. `research-component-patterns` does the actual reading.

## When to revisit

If during implementation you discover the spec was wrong (e.g. function intent turned out to be interactive, not display-only), **return to this skill** with the new information rather than improvising downstream. A wrong spec produces compounding wrong decisions.

## Cross-references

- `inspect-snapshots` — when step 4 identifies an in-library analog, READ the analog's PNG snapshot (not just its source) to see the actual visual identity. Source tells you the API; the image tells you what the library looks like.
- `accessibility-conventions` — step 3 (function intent) decides interactivity; interactive components inherit a checklist of keyboard, focus, and ARIA requirements. Surface those obligations in the spec block so they aren't forgotten downstream.
- `research-component-patterns` — recommended via the `Research recommended:` line in the spec block.
- All downstream skills — the `Next skill:` line in the spec block names exactly one.
