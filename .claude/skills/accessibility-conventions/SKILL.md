---
name: accessibility-conventions
description: Apply WCAG-aligned accessibility patterns to @squonkstack/ui components — semantic HTML, ARIA, keyboard interaction, focus management, color contrast, reduced motion, and label association. Use during component implementation, when reviewing an existing component for a11y, or when picking a base element / naming props that affect screen-reader or keyboard behavior. Referenced from pick-base-element, naming-conventions, containment-behavior, and determine-component-intent.
---

# Accessibility Conventions

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonkstack/ui` library only. Accessibility is not a separate phase — it's baked into base-element choice, prop naming, focus styling, and keyboard interaction. This skill is the single source for those decisions; other skills reference it.

## The five accessibility surfaces a component must address

Most components touch most of these. Skipping any of them is how libraries ship a11y bugs that only surface in audits or — worse — in front of users.

| Surface | Question | Where it lives |
|---|---|---|
| **Semantic HTML** | Am I using the right element for the job? | `pick-base-element` + this skill |
| **ARIA & labeling** | If the element can't speak for itself, what attributes give it a name and role? | This skill |
| **Keyboard interaction** | Can I do everything with a keyboard alone? | This skill |
| **Focus management** | Is the focus indicator visible and the focus order logical? | This skill |
| **Color & motion** | Does color contrast meet WCAG AA? Does motion respect `prefers-reduced-motion`? | This skill + `add-token` |

## Surface 1 — Semantic HTML beats ARIA, always

**Rule:** if a native HTML element provides the behavior you need, use it. ARIA is a fallback when no element fits.

| If you want… | Use the native element | NOT |
|---|---|---|
| Clickable thing | `<button>` | `<div role="button" tabindex="0">` |
| Form control | `<input>` / `<select>` / `<textarea>` | `<div contenteditable>` |
| Navigation region | `<nav>` | `<div role="navigation">` |
| Heading | `<h1>`–`<h6>` | `<div role="heading" aria-level="2">` |
| Image | `<img alt="…">` | `<div role="img" aria-label="…">` |
| Link | `<a href="…">` | `<button onClick={navigate}>` |

This is also why `pick-base-element` prefers `button` over `div` even when the visual is identical — a native `<button>` is keyboard-focusable, Enter/Space-activatable, and announced as a button to screen readers without any ARIA.

## Surface 2 — ARIA & labeling

ARIA's job is to fill gaps that semantic HTML can't. Use sparingly.

### Names — every interactive control needs one

A "name" is what a screen reader announces. For most elements the visible label is the name (a button's text content, an input's `<label>`). If there is no visible text, supply one explicitly:

```tsx
<button aria-label="Close dialog">×</button>
<input aria-label="Search" placeholder="Search…" />
```

**Anti-pattern**: relying on `placeholder` alone as a label. Placeholder is not an accessible name in most screen readers and disappears once the user types.

### Label association for form inputs

Two valid patterns:

```tsx
// Pattern A — wrap (no id needed)
<label>
  Email
  <input type="email" />
</label>

// Pattern B — htmlFor (explicit id)
<label htmlFor="email-input">Email</label>
<input id="email-input" type="email" />
```

For library components that own both the label and the input (e.g. `TextField`), use Pattern A internally — no consumer-managed ID required.

### Descriptions, error messages, help text

Use `aria-describedby` to attach supplementary text:

```tsx
<input
  aria-describedby="password-help password-error"
  aria-invalid={hasError}
/>
<span id="password-help">Must be 8+ characters.</span>
{hasError && <span id="password-error">Password too short.</span>}
```

### Roles — only when there's no native equivalent

Common legitimate roles in component libraries:
- `role="status"` / `role="alert"` — toasts, live announcements (with `aria-live="polite"` or `"assertive"`)
- `role="dialog"` / `role="alertdialog"` — modal windows (paired with `aria-modal="true"` and a `aria-labelledby`)
- `role="tablist"` / `role="tab"` / `role="tabpanel"` — only if you're building tabs from scratch (Radix and friends already do this)
- `role="combobox"` — for typeahead/autocomplete (genuinely needs ARIA)

**Don't add roles to elements that already have them**: `<button role="button">` is wrong.

## Surface 3 — Keyboard interaction

Every interactive element must be operable by keyboard. The defaults:

| Element | Activation | Notes |
|---|---|---|
| `<button>` | Enter, Space | Free with native button |
| `<a href>` | Enter only | NOT Space — that's button behavior |
| `<input>` / `<textarea>` | typing | Free |
| `<select>` | Enter/Space + arrows | Free |
| Custom widgets | depends | You implement keydown handlers |

### Required keyboard support by component shape

- **Modal / dialog**: Esc closes; focus trapped inside; focus returns to opener on close.
- **Menu / dropdown**: Arrow keys navigate; Enter selects; Esc closes; Tab moves to next focusable.
- **Tabs**: Arrow keys move between tabs; Home/End jump to first/last; Enter/Space activates.
- **Combobox**: Arrow keys traverse options; Enter selects; Esc closes the list; type filters.
- **Toast**: not focusable by default (transient), but contains a focusable close button.

When in doubt, copy the pattern from Radix or React Aria — they've worked out the edge cases. (`research-component-patterns` is the right route.)

### Don't suppress native keyboard behavior

- Don't intercept Tab with `event.preventDefault()` unless you're trapping focus inside a modal.
- Don't capture Space inside a form-control container — it's the activation key for buttons and form elements.
- Don't add `tabindex="-1"` to interactive elements unless they're inside a roving-tabindex pattern.

## Surface 4 — Focus management

### Focus must be visible

Default browser focus rings are removable. They must not be removed without a replacement. The library uses theme tokens for focus styling:

```css
.root:focus-visible {
  outline: var(--squonk-borders-focus-width) solid var(--squonk-colors-border-focus);
  outline-offset: var(--squonk-borders-focus-offset);
}
```

`:focus-visible` is the modern selector — only shows the ring for keyboard focus, not mouse. Don't use plain `:focus` for the ring or mouse users see flicker.

React Aria components set `data-focus-visible` on the element that owns focus (or, for checkboxes, radios and switches, on the label that wraps a visually hidden native input). Style the ring through that attribute: `.button[data-focus-visible] .control { … }`. React Aria computes it with its own modality tracker; `:focus-visible` on the visible control never matches. The attribute's value is `"true"`, so tests assert its presence, not `""`.

### Focus order follows DOM order

If you use `flex-direction: row-reverse` or `order:` to rearrange children visually, screen reader and keyboard users still see the DOM order. Keep DOM order matching visual order whenever possible; if you must diverge, document it loudly.

### Focus management for compound components

- **Modal opens** → focus the first focusable element inside, or the modal container itself with `tabindex="-1"`.
- **Modal closes** → return focus to the element that opened it (store the previous `document.activeElement`).
- **Menu opens** → focus the menu container; let arrow keys handle item movement (roving tabindex).
- **Toast appears** → don't steal focus; use `aria-live` to announce.

## Surface 5 — Color, contrast, motion

### Contrast

Text against its background must meet WCAG AA: **4.5:1** for normal text, **3:1** for large text (18pt+ or 14pt+ bold).

Readable foregrounds are computed once per theme and published as derived tokens, so a component picks the token that matches its background instead of computing one:

```css
.root[data-variant="primary"] {
  background-color: var(--squonk-colors-primary);
  color: var(--squonk-colors-contrast-primary);       /* min-contrast text on primary */
}
.root[data-tone="warning"] {
  background-color: var(--squonk-colors-tone-warning-subtle);
  color: var(--squonk-colors-tone-warning-on-subtle);
}
```

If no token pairs with your background, add one to `derivedColorTokens` using `themeHelpers.getMinContrastTextColor` or `surfaceForeground` (see `add-token`). Don't pair `--squonk-colors-warning` (yellow) with `--squonk-colors-text-inverse` (white) — fails contrast.

### Don't communicate state with color alone

A red border alone doesn't tell colorblind users a field is invalid. Pair color with:
- An icon (warning triangle, error X)
- Text ("Required")
- An ARIA attribute (`aria-invalid="true"`)

### Reduced motion

Don't write `@media (prefers-reduced-motion)` rules in a component. Wrap the
element that moves in a Motion component (`src/components/animation/motion`):
the recipes read the motion level (`--squonk-motion-level-*`), which the device's
reduced-motion setting and `SquonkThemeProvider`'s `motion` prop both set. With
motion reduced nothing travels or grows (overlays and content fade in place,
list items and figures change at once), decorative loops stop and loops that
show work slow down. Colour fades stay.

React Aria overlays wait for a running CSS animation before unmounting, and a
zero-length one (`motion="none"`) finishes at once.

For components with significant animation (slide-in, fade, scale), using a Motion component is mandatory.

## Per-component-shape checklists

Quick lookup. Pair with the relevant `research-component-patterns` call for deeper patterns.

### Button
- [x] Base element is `<button>` with `type="button"` (default `submit` only inside forms)
- [x] Has visible text OR `aria-label`
- [x] `:focus-visible` outline
- [x] `disabled` state communicated visually AND via the `disabled` attribute

### Text input / form field
- [x] Associated `<label>` (Pattern A or B above)
- [x] Errors linked via `aria-describedby` and `aria-invalid`
- [x] Required state via `required` attribute (native validation) AND visual indicator
- [x] Placeholder is supplementary, not the label

### Modal / dialog
- [x] `role="dialog"` + `aria-modal="true"`
- [x] `aria-labelledby` referencing the title
- [x] Focus trapped inside while open
- [x] Esc closes
- [x] Focus returns to opener on close
- [x] Background scroll locked

### Avatar / Badge / Tag (display-only)
- [x] If image-backed: `alt` is required (use `alt=""` for decorative, never omit the attribute)
- [x] If text-based: text content provides the name; no extra ARIA needed
- [x] If clickable: see Button checklist

### Toast / notification
- [x] `role="status"` (for polite) or `role="alert"` (for assertive)
- [x] `aria-live` attribute matches role
- [x] Auto-dismiss respects `prefers-reduced-motion` for animations
- [x] Contains a focusable close button if persistent

### Tooltip
- [x] Tooltip content linked via `aria-describedby` on the trigger
- [x] Triggered on focus AND hover (not hover alone)
- [x] Esc dismisses
- [x] Don't put interactive content inside a tooltip — use a popover instead

### Tabs
- [x] `role="tablist"` on the container, `role="tab"` on each, `role="tabpanel"` on each panel
- [x] `aria-selected` on the active tab
- [x] `aria-controls` linking tab to panel; `aria-labelledby` linking panel to tab
- [x] Arrow keys + Home/End for tab navigation
- [x] Only the active tab is in the tab order; others have `tabindex="-1"`

## How to verify accessibility

Three levels of verification, in increasing rigor:

1. **Keyboard sweep** — without touching the mouse, can you focus, activate, and dismiss every part of the component? Does focus stay visible?
2. **Screen reader smoke test** — VoiceOver (Cmd+F5 on macOS) or NVDA (Windows). Does the component announce its role and name?
3. **Automated tools** — `axe-core` / Playwright's accessibility tree snapshot. Useful but not a substitute for the manual sweep.

This library doesn't currently have an automated a11y test step (worth adding to the pipeline). For now, do the keyboard sweep before considering a component done.

## What this skill does NOT do

- **Doesn't certify WCAG conformance.** That requires audit and testing this skill can't perform.
- **Doesn't handle internationalization** (RTL, locale-specific labels). Related but distinct.
- **Doesn't define the visual focus-ring style** — that's a theme decision (`theme.colors.border.focus` + `theme.borders.width`).

## Cross-references

- `pick-base-element` — semantic HTML is the foundation; this skill builds on the element choice.
- `naming-conventions` — ARIA-related props (`aria-label`, `aria-describedby`) follow the same camelCase / passthrough conventions as everything else.
- `containment-behavior` — focus and scroll containers interact (a `overflow: auto` container is focusable by default; if it's a scrolling region, mark it with `role="region"` + `aria-label`).
- `determine-component-intent` step 3 (function intent) — interactivity drives accessibility scope.
- `add-token` — when adding a color token, check contrast against text colors via `themeHelpers.getMinContrastTextColor`.
- `theme-scratchpad` — use it to test contrast across components when changing theme colors.

## Compact controls and hit areas

Check pointer targets separately from visible icon size. WCAG 2.2 AA SC 2.5.8 uses a 24-by-24 CSS-pixel minimum with specified spacing and other exceptions; larger targets can improve usability. Do not treat a small compact register as automatic compliance. For form validation, preserve inline errors and provide a focusable summary with field links when multiple errors need navigation.

Sources: [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [form notifications](https://www.w3.org/WAI/tutorials/forms/notifications/).
