---
name: responsive-conventions
description: Apply @squonk/ui's mobile-first responsive conventions — use the theme's breakpoint values, write min-width media queries (never max-width by default), choose between fluid CSS and explicit breakpoint props, and decide when a responsive concern belongs in the component vs the consumer's layout. Use when a component needs to behave differently across mobile/tablet/desktop/wide, when the user says "make it responsive", "mobile", "tablet", "breakpoint", or when picking between fluid vs stepped sizing.
---

# Responsive Conventions

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonk/ui` library only. The theme provides breakpoint tokens (`theme.breakpoints.mobile`, `tablet`, `desktop`, `wide`). What's not codified is *how* to use them — this skill closes that gap so a component's responsive behavior matches the library's mental model instead of each component inventing its own.

## The mental model: mobile-first, fluid-by-default

Two principles, in order:

1. **Mobile-first.** Write the base styling for the smallest screen. Use `min-width` media queries to scale UP. Don't write desktop styles and then walk back via `max-width`.
2. **Fluid where possible, stepped where necessary.** A `width: 100%` card needs no media queries — it fluidly fills any container. Reach for breakpoints only when the change is *discrete* (a font-size jump, a layout switch from stacked to side-by-side, a hidden/shown element).

If you can solve the responsive problem with fluid CSS (percentages, `fit-content`, `min()`/`max()`/`clamp()`, flex/grid `auto-fit`), prefer that. Media queries are the escape hatch.

## The breakpoint tokens

From `src/theme/theme.ts` (find via `grep -n "breakpoints:" src/theme/theme.ts`):

| Token | Typical value | Used for |
|---|---|---|
| `theme.breakpoints.mobile` | 480px | Above-mobile threshold (small phones below) |
| `theme.breakpoints.tablet` | 768px | Tablets and up |
| `theme.breakpoints.desktop` | 1024px | Desktops and up |
| `theme.breakpoints.wide` | 1280px | Wide screens |

**CSS media queries can't read `var()`.** In a CSS module, write the default breakpoint value as a literal, comment which token it is, and add a unit test that reads the module and compares its `@media` values with `theme.breakpoints` (see `src/components/layout-primitive/grid/grid.test.ts`). Breakpoint primitives overridden at runtime therefore don't move CSS-module media queries; if a component must follow its own width rather than the viewport, use a container query. Never invent a breakpoint value that isn't one of the four.

## Pattern 1 — min-width media query (the default)

```css
@layer dt.components {
  .root {
    padding: var(--squonk-spacing-md);              /* mobile default */
  }

  @media (min-width: 768px) {                   /* theme.breakpoints.tablet */
    .root { padding: var(--squonk-spacing-lg); }
  }

  @media (min-width: 1024px) {                  /* theme.breakpoints.desktop */
    .root { padding: var(--squonk-spacing-xl); }
  }
}
```

**Rules:**
- Mobile styles outside the media query — they apply everywhere by default.
- Each `min-width` query adds overrides for that breakpoint and up.
- Don't mix `min-width` and `max-width` queries — pick one direction and stick with it. `min-width` is the library's default.

## Pattern 2 — fluid sizing (no media query)

For sizing that scales smoothly, use modern CSS instead of breakpoints:

```css
.root {
  font-size: clamp(1.5rem, 4vw, 3rem);          /* 24px → 48px fluidly */
  padding: clamp(var(--squonk-spacing-md), 5vw, var(--squonk-spacing-xxl));
  width: min(100%, 60ch);                       /* never wider than 60 characters */
}
```

Use fluid CSS when:
- The change is continuous (font sizes, paddings, max-widths).
- The "right value at any width" is a smooth interpolation.

Use breakpoints when:
- The change is discrete (column layout switches, an element appears/disappears, a different visual treatment).
- You need a deliberate cutoff (e.g. menu becomes a hamburger below tablet).

## Pattern 3 — layout switch via flex/grid

The most common discrete change: stacked-on-mobile, side-by-side-on-tablet.

```css
.row {
  display: flex;
  flex-direction: column;                       /* stacked on mobile */
  gap: var(--squonk-spacing-md);
}

@media (min-width: 768px) {                     /* theme.breakpoints.tablet */
  .row { flex-direction: row; }                 /* side-by-side on tablet+ */
}
```

For grids that wrap automatically without a media query, use `repeat(auto-fit, minmax(...))`:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: var(--squonk-spacing-md);
}
```

No breakpoint needed — the grid recalculates columns based on available space.

## Pattern 4 — responsive props (rare; use sparingly)

Some libraries expose responsive props like `size={{ mobile: 'sm', desktop: 'lg' }}`. **Don't reach for this pattern by default** in `@squonk/ui`. Reasons:

- It adds prop-surface complexity that most consumers don't need.
- The same effect is usually achievable via CSS without bleeding into the prop API.
- It couples the component to specific breakpoints rather than letting the consumer's layout decide.

Use responsive props only when **the component's internal layout** genuinely changes — not just its size:

```ts
// LIKELY OK — internal layout actually differs
type NavMenuProps = {
  orientation?: 'horizontal' | 'vertical' | { mobile: 'vertical'; desktop: 'horizontal' };
};

// NOT OK — just sizing
type ButtonProps = {
  size?: { mobile: 'sm'; desktop: 'md' };       // expose `size` once; let CSS handle the rest
};
```

If you find yourself wanting responsive props, first try: (a) fluid CSS, (b) media queries inside the component's CSS module, (c) letting the consumer constrain the parent. Responsive props are the last resort.

## Pattern 5 — hide/show by breakpoint

Sometimes content must disappear below or above a breakpoint:

```css
.desktopOnly { display: none; }

@media (min-width: 768px) {                     /* theme.breakpoints.tablet */
  .mobileOnly { display: none; }
  .desktopOnly { display: block; }
}
```

**Accessibility note**: `display: none` hides from screen readers too. If the content should be accessible but visually hidden, use a "sr-only" class pattern instead (visually-hidden but not `display: none`). See `accessibility-conventions`.

## What belongs in the component vs the consumer's layout

This is the most-asked architectural question. Rule of thumb:

| Concern | Lives in component | Lives in consumer's layout |
|---|---|---|
| Internal stacking direction (form row, navigation orientation) | ✓ | |
| Element visibility based on screen size (mobile menu vs desktop bar) | ✓ | |
| Font-size adjustment for readability | ✓ (fluid CSS) | |
| Spacing inside the component | ✓ | |
| Whether two cards sit side-by-side or stacked | | ✓ (it's a layout decision) |
| Page-level grid columns | | ✓ |
| When to show/hide an entire section | | ✓ (composition) |

When in doubt: if you can defer the decision to the consumer's parent layout, do. The component should be agnostic about how wide its container is.

## What to test

Component responsive behavior needs visual verification at each breakpoint:

1. **Snapshot test the component at each breakpoint** — Playwright CT lets you set viewport in the test:
   ```tsx
   test("Card at tablet width", async ({ mount, page }) => {
     await page.setViewportSize({ width: 768, height: 1024 });
     const component = await mount(<Card>Tablet view</Card>);
     await expect(await component.screenshot()).toMatchSnapshot();
   });
   ```
   This is part of `test-strategy` — pick which breakpoints are worth snapshotting (rarely all four; usually mobile + desktop).

2. **Verify fluid behavior in `prototype-live`** — manually resize the browser via `mcp__playwright__browser_resize` to see continuous behavior. Don't only test at breakpoint boundaries.

## Anti-patterns

| Anti-pattern | Why | Do instead |
|---|---|---|
| A breakpoint value that isn't one of the four defaults, or no unit test guarding it | Drifts from the theme silently | The default value, commented, plus a test comparing it with `theme.breakpoints` |
| `@media (max-width: 767px)` | Mixes directions; off-by-one bugs at 768px | Use `min-width` and let the desktop styles override |
| Many small breakpoint queries (`min-width: 800px`, `820px`, `840px`) | Indicates fluid CSS would work better | Use `clamp()` / fluid units |
| Responsive props (`size={{ mobile, desktop }}`) for sizing | Bloats prop API | CSS-only |
| `display: none` to hide content the screen reader should still know about | A11y regression | Visually-hidden helper class |
| Letting Mobile Safari's address bar mess up `100vh` | iOS bug | Use `100dvh` (dynamic viewport height) or a fallback |

## Cross-references

- `containment-behavior` — the **non-responsive** sizing decisions (what's the default width, how does it overflow). Responsive is the next layer up.
- `add-token` — extending breakpoints if the four steps don't cover the use case (rare).
- `accessibility-conventions` — hide/show interacts with screen readers.
- `test-strategy` — which breakpoints to snapshot.
- `theme-scratchpad` — preview a breakpoint change across multiple components.

## Handoff

Runs during pipeline step 5 (alongside `containment-behavior`), or anywhere a viewport-aware change is being made. After applying, continue with `use-tokens` to lint any literals (especially `px` values that should be tokens).
