---
name: research-component-patterns
description: Research open-source component libraries for design and prop-shape inspiration BEFORE scaffolding a new @squonkstack/ui component. Reads docs/source for prop signatures, accessibility patterns, variants, and edge cases — does NOT add a dependency or copy code. Use during the determine-component-intent step when you want a benchmarked reference for a component the library doesn't have yet (e.g. "what does an Avatar prop signature typically look like?").
---

# Research Component Patterns

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonkstack/ui` library only. It is a **reference-gathering** skill — no code is copied, no dependency is added. The output is a brief that feeds back into `determine-component-intent` or the implementation phase. If after researching you decide the right move is to actually depend on or copy code from a library, switch to the `wrap-third-party-component` skill.

## When to use this skill

- A new component type you haven't built before (Avatar, Toast, Combobox, etc.) — the established libraries have spent years figuring out the edge cases.
- An accessibility-sensitive component (anything keyboard-navigable, anything with ARIA semantics) — Radix and React Aria are particularly worth checking.
- The user asks "how does X library handle this?" or "what's the convention for prop Y?"

Skip this skill when:
- The component is straightforward (a `Divider`, a `PageTitle`) — research overhead exceeds value.
- The user has already provided a spec or design.
- You're refactoring an existing component, not adding a new one.

## The curated library list (by paradigm)

Use this as the starting set. All listed are MIT or Apache 2.0 (free open-source), actively maintained as of 2026. **For pattern research only — license still applies to any code you might later copy.**

### Behaviour (the library's defaults)

| Library | URL | License | Why look here |
|---|---|---|---|
| **React Aria Components** (Adobe) | `https://react-spectrum.adobe.com/react-aria/` | Apache 2.0 | **Our behaviour base** (`react-aria-components` is a dependency). Check here first: if React Aria has the component, ours builds on it, even for simple parts like Button and Link. Its component names, slots and `data-*` state attributes become our structure and CSS selectors. Its docs also explain the interaction, i18n and screen-reader decisions behind each one. |
| **TanStack Table** | `https://tanstack.com/table` | MIT | **Our table logic** (`@tanstack/react-table`): sorting, filtering and pagination. React Aria's Table renders the interactive grid. |
| **TanStack Form** | `https://tanstack.com/form` | MIT | **Our form state** (`@tanstack/react-form`, with Zod), behind `@squonkstack/ui/form`. |

### Styling references

| Library | URL | License | Why look here |
|---|---|---|---|
| **React Aria starter kits** | `https://react-spectrum.adobe.com/react-aria/` (each component's "Styling" section and the CSS starter kit) | Apache 2.0 | Unstyled-to-styled examples written against React Aria's own `data-*` attributes. Translate to CSS Modules and our tokens. |

### Accessibility reasoning (not dependencies)

| Library | URL | License | Why look here |
|---|---|---|---|
| **WAI-ARIA APG** | `https://www.w3.org/WAI/ARIA/apg/` | W3C | The keyboard and ARIA contract for each pattern. |
| **Radix Primitives** | `https://www.radix-ui.com/primitives` | MIT | Prop-signature and composition precedent. Do not add it as a dependency. |

### Copy-paste / template

| Library | URL | License | Why look here |
|---|---|---|---|
| **React Aria starter kits** | See above | Apache 2.0 | The preferred copy source because it targets React Aria. |
| **Tremor** | `https://tremor.so/` | Apache 2.0 | Dashboard/data-viz patterns specifically. |

## Picking 1–3 references per research session

Don't read everything. Pick:

1. **React Aria Components** for the behaviour and structure (or TanStack Table for table data).
2. **React Aria's styling examples** for how each part is styled and which state attributes to target.
3. *(Optional)* **WAI-ARIA APG** when the keyboard or focus contract is subtle.

When React Aria has no equivalent (Avatar, Badge, Skeleton, a feed, page-range
logic for Pagination), build on plain HTML and use the APG and other libraries'
prop shapes as reference.

Examples:
- Avatar → no React Aria part; APG image guidance + Radix Avatar prop shape.
- Combobox → React Aria ComboBox + APG combobox.
- Toast → React Aria Toast (`UNSTABLE_ToastRegion`) + APG alert.
- Tabs → React Aria Tabs + APG tabs.
- Data table → TanStack Table + React Aria Table + APG grid/table.

## The research procedure

For each picked reference, capture **only** the answers to these questions:

1. **Prop signature** — what props does it expose? Which are required?
2. **Variants** — what discriminated-union props exist (`variant`, `size`, `tone`)? What are the values?
3. **State props** — controlled state pattern (`value` + `onValueChange`), uncontrolled defaults (`defaultValue`), or both?
4. **Accessibility** — what ARIA attributes are applied? What keyboard interactions are supported?
5. **Composition** — is it a single component, or a compound (`Tabs.Root`, `Tabs.List`, `Tabs.Trigger`)? Why?
6. **Edge cases handled** — anything subtle (focus trap, escape-to-close, screen-reader announcements, RTL)?

Use `WebFetch` to read documentation pages. Use `WebSearch` to find the canonical docs URL if not in the list above. **Don't paste raw source code into your output** — synthesize.

## The output format

Produce a tight brief (≤30 lines), like:

```
Research: UserBadge
References: Radix Avatar, APG image guidance (React Aria has no Avatar)

Converged conventions:
- Required: src OR name (for initials fallback) — never both required
- variant: nothing universal; consider 'circular' | 'rounded' | 'square'
- size: 'sm' | 'md' | 'lg' is near-universal
- Status indicator: none ship one; compose with Badge
- Image error: all three fall back to initials/icon on broken src

Notable divergences:
- Radix: compound parts (Avatar.Root / Avatar.Image / Avatar.Fallback), behaviour only
- Others add a group and a colour palette

Accessibility:
- alt is universally required when an image is present
- role="img" applied when initials/icon shown
- Status indicator typically gets aria-label

Recommendation for our UserBadge:
- Expose one component; a small onLoad/onError fallback, no dependency
- Required: name (always); avatarUrl optional with initials fallback
- size: 'sm' | 'md' (skip 'lg' until needed)
- Defer status indicator to a future iteration
```

That brief is what `determine-component-intent` consumes for step 5 (spec block).

## License notes

All libraries on the curated list are MIT or Apache 2.0 — both compatible with re-distribution under our own license. **Reading documentation is not a license event.** Becoming an issue only when:
- You copy non-trivial source code → see `wrap-third-party-component` for the rules.
- You're researching for a closed-source consumer that has stricter compatibility rules — not our case here.

If you stumble on a library not on the list (newer, less mainstream), verify the license is MIT / Apache 2.0 / BSD before using it as a reference for code-shape (purely conceptual research is fine regardless of license).

## What this skill does NOT do

- **Doesn't add a dependency.** That's `wrap-third-party-component`.
- **Doesn't copy source code.** That's `wrap-third-party-component`.
- **Doesn't run benchmarks or compare bundle sizes.** Reference research is conceptual.
- **Doesn't make the design decision for the user.** It surfaces options; the user picks.

## Handoff

- If the research informs the spec: feed the brief back into `determine-component-intent` step 5.
- If the research concludes "we should wrap an existing library, not build from scratch": switch to `wrap-third-party-component`.
- If the research concludes "we should copy a specific component's source (shadcn-style)": also switch to `wrap-third-party-component` — copy-and-style is in scope for that skill.
