---
name: pick-base-element
description: Pick the semantically correct HTML base element for a new @squonkstack/ui component from the Yeoman generator's allow-list (div, span, header, footer, section, article, nav, main, aside, p, ul, ol, li, form, button, input, hr, img, br). Use as step 2 of the new-component pipeline, after determine-component-intent and before scaffold-component runs.
---

# Pick Base Element

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonkstack/ui` library only. The Yeoman generator (`npm run generate`) asks for `baseElement` and only accepts values from a fixed allow-list. Picking lazily (defaulting to `div`/`span`) loses semantic and accessibility value that downstream apps inherit for free.

## The allow-list

The generator at [generators/component/index.js](../../../generators/component/index.js) accepts exactly:

`div`, `span`, `header`, `footer`, `section`, `article`, `nav`, `main`, `aside`, `p`, `ul`, `ol`, `li`, `form`, `button`, `input`, `hr`, `img`, `br`

If the right element is **not** on this list (e.g. `dialog`, `details`, `summary`, `table`, `figure`), the generator will reject it. Two options:
1. Pick the closest legal element and use `as` (polymorphic) at consumption time to override.
2. Extend the generator's allow-list — a separate scaffolding task; flag it for the user, don't silently work around it.

## Decision tree

Walk these in order; the first match wins.

### 1. Is it interactive (the user clicks/taps/presses it)?
→ `button` (always — even if it looks like a link, use `<a>` via the polymorphic `as` prop in usage, but base on `button`).
**Implication:** the component should not be a Layout; it's Functional. Default `acceptsChildren: true` (label).

### 2. Is it a form input element?
- Text/number/checkbox/radio/etc. → `input` (void element — `acceptsChildren: false` forced).
- Form wrapper containing inputs → `form` (accepts children).

### 3. Is it a landmark (top-level page region)?
- Page banner / brand area → `header`
- Page footer → `footer`
- Primary navigation → `nav`
- Main page content → `main`
- Complementary side content → `aside`
- Self-contained syndicated content (article, blog post, comment) → `article`
- Thematic grouping with a heading → `section`

### 4. Is it a list-shaped thing?
- Unordered (bulleted) → `ul` (the component owns the list semantics)
- Ordered (numbered) → `ol`
- A single list item meant to live inside `ul`/`ol` → `li`

### 5. Is it a void / atomic element?
- Image → `img` (void; `acceptsChildren: false`)
- Horizontal rule / thematic divider → `hr` (void)
- Forced line break (rare in component libraries) → `br` (void)

### 6. Is it a single paragraph of text?
→ `p`. Note: a component that renders **multiple** paragraphs should not be a `<p>` — paragraphs can't nest. Use `div` or `article` and let the consumer place `<p>` children.

### 7. None of the above — it's a generic container

- Inline (flows with surrounding text) → `span`
- Block (its own line/box) → `div`

These are the **escape hatches**. If you reach for `div` or `span`, sanity-check: was there a more specific landmark or text element that fit? Most "I'll just use a div" cases are actually `section`, `article`, or `aside`.

## Worked examples from the existing library

| Component | Base element | Why |
|---|---|---|
| `Button` | `button` | Interactive, click target. |
| `TextField` | `input` | Void form input. `acceptsChildren: false`. |
| `Card` | `section` | Self-contained thematic grouping. (Layout, polymorphic, so consumers can `as="article"` if appropriate.) |
| `Page` | `main` | Top-level page content region. |
| `QrCode` | `div` (wrapping an `<img>` or `<svg>`) | Generic visual block; the meaningful element is nested. |

## Worked examples for plausible new components

| Component | Likely base | Reasoning |
|---|---|---|
| `UserBadge` (display-only inline) | `span` | Inline grouping; not a landmark, not a list, not interactive. |
| `UserBadge` (clickable, opens menu) | `button` | Interactivity wins over inline-vs-block. |
| `StatusPill` | `span` | Inline label-like grouping. |
| `NotificationBanner` (page-level) | `section` | Self-contained, thematic. |
| `Toast` (transient overlay) | `div` | No good semantic match; flag to extend the allow-list with `[role="status"]` patterns later. |
| `Avatar` (image-backed) | `img` | Void; the image is the component. |
| `Avatar` (initials fallback, no image) | `span` | Inline glyph. |
| `Divider` | `hr` | Thematic break — exactly what `hr` is for. |
| `Sidebar` | `aside` | Complementary content region. |
| `BreadcrumbList` | `nav` | The wrapping landmark; the items go in nested `ol`. |

## Polymorphism interaction

LayoutPrimitive components are **always polymorphic** (the generator forces it). Layout, FunctionalPrimitive and Functional components opt in with `--polymorphic`. For polymorphic components, consumers can override a default such as `section` via `as="article"`. **The base is the default**, not a hard constraint.

For Functional components, polymorphism is optional. Pick the most specific element you can; let polymorphism unlock the escape hatch when needed.

## When the element should be void

Void HTML elements (`input`, `img`, `hr`, `br`, plus the ones not on the generator's list: `area`, `base`, `col`, `embed`, `link`, `meta`, `param`, `source`, `track`, `wbr`) cannot have children. The generator enforces `acceptsChildren: false` for these.

**Implication for prop design**: a void-based component must convey its content through props, not children. `Avatar` (img-based) needs `src` + `alt` props, not `children`.

## Accessibility flags worth raising

The base-element choice IS the foundation of accessibility — a native `<button>` is keyboard-focusable, Enter/Space-activatable, and announced as a button without ARIA. See `accessibility-conventions` for the full guidance; the items below are flags to surface in the spec block (not changes to the pick itself):

- `button` → ensure `type="button"` unless inside a `<form>`; default browser behavior is `submit`.
- `nav` → consider an `aria-label` to disambiguate when there are multiple nav landmarks.
- `section`/`article` → consider whether the component requires a heading inside (screen readers expect one for `article`).
- `input` → label association is the consumer's problem unless the component is a labeled-input pair.

Raise these in the spec block produced by `determine-component-intent`, not at base-element pick time.

## Handoff

Once you've picked, feed the choice into `scaffold-component`'s generator prompt (`baseElement` field). If the element you wanted isn't on the allow-list, stop and tell the user — don't silently substitute.
