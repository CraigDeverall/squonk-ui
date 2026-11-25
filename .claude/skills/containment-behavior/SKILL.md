---
name: containment-behavior
description: Decide how a @squonkstack/ui component behaves inside its parent — display mode (inline/block/flex), sizing posture (fit-content vs full-width vs deferred), overflow handling (truncate, scroll, clip), and whitespace/wrapping. Use during component implementation (between scaffold and use-tokens), when reviewing a component for composability issues, or when the user asks about "should this stretch to fit", "block vs inline", "what about overflow", "truncate the text", "minWidth/maxWidth", or names a prop like `fullWidth`, `truncate`, `noWrap`, `hasOverflow`.
---

# Containment Behavior

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonkstack/ui` library only. It covers a category of decisions every component makes — usually implicitly — that determine whether the component plays well inside arbitrary parent layouts. Get these wrong and the component will look fine in Storybook and break the first time a consumer drops it into a Flex row, a narrow column, or a long-string scenario.

## The taxonomy

Containment behavior splits into two orthogonal enums. **Posture** applies to every component; **Contract** applies only to Layout components (the ones whose job is arranging children).

### Group A — Posture toward parent (every component)

Five dimensions. Pick one value per dimension, consciously.

| Dimension | Values |
|---|---|
| **1. Display flow** | `inline` · `inline-block` · `block` · `inline-flex` / `flex` · `inline-grid` / `grid` · `contents` (no box) · `none` (prop-controlled) |
| **2. Width posture** *(height has the same options on the other axis)* | **Hug** (`fit-content`) · **Fill** (`100%`) · **Fixed** (`<token>`) · **Constrained** (`min-width` / `max-width`) · **Deferred** (unset) |
| **3. Positioning in parent's flow** | **In-flow** · **Sticky** · **Absolute / fixed** · **Self-aligned** (opts out of parent's alignment) |
| **4. Overflow at own boundary** | **Visible** · **Clip** (`overflow: hidden`) · **Scroll** (`overflow: auto`) · **Truncate** (ellipsis pattern — text only) |
| **5. Whitespace / wrap (own text content)** | **Wrap** · **No-wrap** · **Pre / pre-wrap** · **Break-word** |

### Group B — Contract toward children (Layout components only)

Six dimensions. Layout components must pick deliberately on at least 1, 2, and 3.

| Dimension | Values |
|---|---|
| **1. Layout mode applied to children** | **None** (children flow naturally) · **Stack** (vertical flex with gap) · **Row / Cluster** (horizontal flex, optionally wrapping) · **Grid** (fixed tracks) · **Inline** (text-like wrapping) |
| **2. Spacing between children** | **None** (children own spacing) · **Uniform gap** (one token) · **Axial gap** (separate `row-gap` / `column-gap`) |
| **3. Cross-axis alignment** | `start` · `center` · `end` · `stretch` · `baseline` · **per-child** (`align-self`) |
| **4. Main-axis distribution** | `start` · `center` · `end` · `space-between` · `space-around` · `space-evenly` |
| **5. Sizing imposed on children** | **Free** (intrinsic) · **Stretched** (default flex cross-axis) · **Equal** (`flex: 1 1 0`) · **Tracked** (grid) |
| **6. Direction & wrapping** | Direction: `row` / `column` / `row-reverse` / `column-reverse` — Wrap: `nowrap` / `wrap` / `wrap-reverse` |

Non-Layout components (Button, UserBadge, TextField) skip Group B entirely — they have no contract to impose on children.

Most "looks fine in isolation, breaks in real layouts" bugs trace to an unconscious choice on a Group A dimension. Most "Storybook is fine but the app looks weird" bugs trace to a sloppy choice on a Group B dimension. Walk both groups when writing the styled-component.

## Default postures by component shape

Pick one as the starting point; deviate consciously.

### Inline (badge, chip, tag, pill, inline icon, status dot)
```ts
display: 'inline-flex',   // inline so it flows with text; flex so children align
alignItems: 'center',
width: 'fit-content',     // owns its size — never stretches to fill
whiteSpace: 'nowrap',     // content stays on one line; overflow visible by default
```
Rationale: inline things are tokens that get embedded in larger content. They must not steal width or break layout.

### Block content (card, banner, panel, section)
```ts
display: 'block',          // or 'flex' if it lays out children in a row/column
width: '100%',             // claims the parent's content-width — common expectation for cards
boxSizing: 'border-box',   // padding doesn't push width over 100%
```
Rationale: blocks fill the column they're in. The consumer constrains width by sizing the parent, not by passing `width` to the card.

### Form input (text field, select, textarea)
```ts
display: 'inline-block',   // or 'block' if the design always shows it full-width
width: '100%',             // most form fields fill their column; opt-out via prop
boxSizing: 'border-box',
```
Rationale: form fields are expected to fill their cell in a form grid; opt-out is rarer than opt-in.

### Wrapping utility (Stack, Cluster, Center, Truncate, Scrollable)
```ts
display: 'flex',           // or whatever the utility's job dictates
width: '100%',             // utilities almost always claim full width — they exist to lay out children
minWidth: 0,               // CRITICAL for flex containers — see "the flex gotcha" below
```
Rationale: utility wrappers exist to organize children. They should not constrain themselves; they constrain their children.

### Decorative / atomic (Divider, Spacer)
```ts
display: 'block',
width: '100%',
flexShrink: 0,             // when placed in flex layouts, don't get squished
```

## The flex gotcha — always set `min-width: 0` on flex children

By default, a flex item's `min-width` is `auto`, which means it won't shrink below its content size. For a component that contains long text, this is the most common cause of "my container is overflowing horizontally."

**Rule:** any component that is **likely to be placed inside a flex container** AND **contains text** should set `min-width: 0` on its outer element:

```css
.root {
  display: inline-flex;
  align-items: center;
  min-width: 0;            /* allows the badge to shrink inside flex parents */
}
```

Skip this only when you're certain the component shouldn't shrink (e.g. an icon button with fixed dimensions).

## Overflow handling — pick a strategy

When content might exceed the box, decide what visual happens:

| Strategy | CSS | When to use |
|---|---|---|
| **Default (visible)** | (no `overflow`) | Inline text that should reflow into the parent. Default for most things. |
| **Truncate (ellipsis)** | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` | Single-line text in a constrained-width context (badges, table cells, breadcrumbs). |
| **Clip** | `overflow: hidden` | Cutting off content without ellipsis (avatars, image crops). |
| **Scroll** | `overflow: auto` or `overflow-y: auto` | Long content in a sized container (modals, sidebars, code blocks). |
| **Wrap** | `white-space: normal; overflow-wrap: break-word;` | Long unbroken strings (URLs, hashes) that need to break onto multiple lines. |

**The truncate pattern needs all three** — `overflow: hidden`, `text-overflow: ellipsis`, AND `white-space: nowrap`. Missing one and the pattern silently doesn't work.

```css
/* Truncate pattern */
.label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;            /* for flex parents */
  max-width: 100%;         /* so truncation has a constraint to act against */
}
```

## When to expose a prop vs. bake the behavior in

If the component has **one obviously correct behavior** for its shape, bake it in:
- A Badge is always inline → don't expose `inline: boolean`.
- A Card always fills its column → don't expose `block: boolean`.

Expose a prop when the behavior is genuinely ambiguous or context-dependent:

| Prop | Used when | Type |
|---|---|---|
| `fullWidth` | Form inputs that sometimes need to opt out of full-width (inline next to a button) | `boolean` |
| `truncate` | Text-bearing components where overflow strategy varies by usage | `boolean` |
| `noWrap` | Inline components that sometimes need to override default wrapping | `boolean` |
| `maxWidth` | Components placed in variable-width contexts where caller needs a hard cap | `CSSProperties['maxWidth']` |

**Anti-patterns:**
- `width: string` — too low-level; expose `fullWidth` / `maxWidth` instead.
- `inline: boolean` — usually a sign the component has two shapes that should be two components.
- `align: 'left' | 'center' | 'right'` for the **outermost** element — alignment is the parent's job; don't expose a self-aligning prop unless the design genuinely requires it.

## What NEVER to do on the outermost element

These break composability:

1. **`margin`** — couples the component to its parent's expected spacing. Let the parent (or a utility wrapper like `<Stack>`) handle spacing between siblings.
2. **Hardcoded `width` or `height` in `px`** — except for fixed-size atomic elements like icons or status dots. Use `fit-content`, `100%`, or a token-derived `maxWidth`.
3. **`position: absolute` / `fixed` without a documented portal pattern** — components that take themselves out of flow surprise consumers. If you need this (tooltip, popover), make it explicit in the prop API.
4. **`z-index` literals** — always use `var(--squonk-z-indices-*)` (see `use-tokens`).
5. **`float`** — banned in modern layouts. Use flex/grid.

## Decision-tree checklist

When you sit down to write the component's CSS module, answer in order.

**Group A — every component:**
1. Is the component **inline** (flows with text) or **block** (gets its own row)? — Group A dim 1
2. Does it **Hug** (own width), **Fill** (claim parent's), **Constrain** (min/max bound), or **Defer** (rare)? — Group A dim 2
3. Will it ever be placed in a **flex container**? → Set `min-width: 0` if so.
4. Can its content **overflow** in real-world use? → Pick a strategy: visible / truncate / clip / scroll. — Group A dim 4
5. Is there a Group A behavior the caller might want to **opt out of**? → Expose a single, well-named prop (`fullWidth`, `truncate`, `noWrap`, `maxWidth`). Skip if not.

**Group B — Layout components only:**
6. What **layout mode** do you apply to children? — Stack / Row / Cluster / Grid / None.
7. What is the **spacing** between children? — `gap` token, or none.
8. What is the **cross-axis alignment** of children? — Bake it in if obvious; expose `align` prop if variable.
9. Do children need a **sizing posture** from the container? — Free / Stretched / Equal / Tracked.
10. Are **direction** or **wrap** ever variable? → Expose props only if they're genuinely needed.

Group A: five answers. Group B (Layout only): five more. If you can't justify one of them, the decision needs more thought.

## Worked examples

### UserBadge (inline chip with avatar + name)
```css
.root {
  display: inline-flex;
  align-items: center;
  gap: var(--squonk-spacing-xs);
  width: fit-content;
  min-width: 0;
  max-width: 100%;
  /* The name child gets the truncate pattern, not the badge itself */
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
```
Choices: inline-flex (own size, align children), fit-content (don't stretch), min-width 0 (survive flex parent), truncate the inner name (the bit that actually overflows).

### Card (block panel)
```css
.root {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: var(--squonk-spacing-container-padding);
  /* No margin — consumer / Stack handles spacing. */
}
```

### Toast (transient overlay, fixed width)
```css
.root {
  display: flex;
  align-items: center;
  max-width: 24rem;      /* capped — see `add-token` if 24rem should be a token */
  width: 100%;           /* claims up to max-width */
  /* position handled separately by the portal/overlay layer */
}
```

## Applying Group B — children-contract patterns (Layout components only)

When the component IS a Layout (its job is to arrange children), pick deliberately on dimensions 1–3 from Group B, and pick on 4–6 only when the design needs them.

### Common layout-mode shapes

| Shape | When | CSS skeleton |
|---|---|---|
| **None (raw container)** | The component is just padding + background; children lay themselves out. | `display: block` (or `flex` only if you need a sane baseline) |
| **Stack** (vertical) | Children should sit one above the next with uniform gap. | `display: flex; flex-direction: column; gap: <token>;` |
| **Row** | Children sit horizontally; same line. | `display: flex; flex-direction: row; gap: <token>;` |
| **Cluster** | Like Row but wraps to multiple lines when out of room. | `display: flex; flex-wrap: wrap; gap: <token>;` |
| **Grid** | Defined column/row tracks, repeating or named. | `display: grid; grid-template-columns: ...; gap: <token>;` |
| **Inline** | Children flow like words in a paragraph. | `display: block;` (no flex/grid — let children flow) |

### Spacing — `gap` over `margin`

Always use `gap` on the layout container, never `margin` on children. `gap` is composable; child margins couple children to their position in the list (first-child / last-child hacks rot fast).

```css
/* Good — container owns spacing */
.root {
  display: flex;
  flex-direction: column;
  gap: var(--squonk-spacing-md);
}

/* Bad — children own spacing relative to siblings
   (forces every child to know its layout context) */
```

For axial gap (different row vs column spacing — common in wrapping clusters):
```css
row-gap: var(--squonk-spacing-sm);
column-gap: var(--squonk-spacing-md);
```

### Alignment — when to expose props vs bake it in

The same rule from Group A applies: bake the obvious case in, expose a prop only when it's genuinely variable.

- A `Toolbar` whose children should always center-align vertically → bake `align-items: center` in. Don't expose `align`.
- A `Stack` that callers will use in many contexts → expose `align?: 'start' | 'center' | 'end' | 'stretch'`.
- The `justify` (main-axis) prop is usually worth exposing on Row/Cluster, since distribution is highly context-dependent.

An exposed alignment maps 1:1 to a CSS value, so pass it as a component custom property:

```css
.root {
  display: flex;
  flex-direction: column;
  gap: var(--squonk-spacing-md);
  align-items: var(--stack-align);
}
```

```tsx
<Component className={styles.root} style={{ "--stack-align": stackAlignMap[align] }} />
```

### Sizing children — the four postures

Decide which posture the layout applies to children:

| Posture | CSS on container | Effect on children |
|---|---|---|
| **Free** | No constraint | Children keep intrinsic size; container fits content. |
| **Stretched** | `align-items: stretch` (default for flex) | Children fill the cross axis. |
| **Equal** | `flex: 1 1 0` on each child via `> *` selector | All children get equal share of main axis. |
| **Tracked** | `grid-template-columns: repeat(N, 1fr)` (or named tracks) | Children snap to track widths. |

Choosing **Equal** through a child selector is the one place it's acceptable to style children from the container — it's a layout contract, not a styling concern. Document it:

```css
.root {
  display: flex;
  gap: var(--squonk-spacing-md);
}

.root > * { flex: 1 1 0; }   /* equal-width children */
```

### Direction & wrapping

Direction is usually fixed by the component's identity (Stack = column, Row = row). When exposed as a prop, prefer `direction: 'row' | 'column'` over `vertical: boolean` — the reversed forms (`row-reverse`, `column-reverse`) are rare enough to omit unless explicitly needed.

Wrapping defaults:
- Stack — `nowrap` (children stay in one column; overflow handled at posture level).
- Row — `nowrap` (one line; overflow handled at posture level).
- Cluster — `wrap` (the whole point of Cluster).

### Anti-patterns specific to Group B

- **`children` passed through a container with no layout mode** — easy to ship a Layout component that does nothing layout-y. If it's Layout, it should pick a layout mode.
- **Margin on container's children via `> * + *` selector** — the `gap` property does this better and composes through nested layouts.
- **Exposing every Group B dimension as a prop** — most layouts have one or two genuinely variable dimensions. Don't ship 12 alignment/distribution/direction/wrap/gap props "just in case."
- **Mixing `gap` and child margins** — they compound and the result is unintuitive. Pick one.

## Utility wrapper components

`<Stack>`, `<Cluster>`, `<Truncate>`, `<Scrollable>` etc. are **just regular components** built through the standard new-component pipeline (`determine-component-intent` → `scaffold-component` → ...). They are not a special category and don't need a separate skill.

What makes them different is intent: they exist to apply containment behavior **to their children** rather than to themselves. Their props are usually:
- `as` (polymorphic — almost always)
- Behavior knobs (`gap`, `direction`, `align`, `wrap`)
- Slot for `children`

If you're building one, the containment-behavior decisions above still apply — and the component itself should almost always be `width: 100%; min-width: 0`.

## What this skill does NOT do

- **Doesn't handle responsive breakpoints.** Mobile-first responsive behavior is a separate concern; if/when needed, `theme.breakpoints.*` is the lever. Don't fold this in here — it's a different decision tree.
- **Doesn't pick the base element.** That's `pick-base-element`.
- **Doesn't decide whether the component should exist.** That's `determine-component-intent`.
- **Doesn't audit existing components.** If reviewing an existing component for containment issues, walk the decision tree against the source manually — there's no automated linter for this (yet).

## Cross-references

- `accessibility-conventions` — focus rings, `:focus-visible` styling, focus management for modals/menus, scroll regions that need `role="region"` + `aria-label`.
- `pick-base-element` — display defaults (`block` vs `inline`) often follow from the chosen element.
- `use-tokens` — any literal spacing/sizing values should come from the theme.
- `prototype-live` — when uncertain whether a containment decision works in a real layout, prototype before committing.
- `responsive-conventions` — containment is the non-responsive baseline; responsive layering goes on top (mobile-first, `theme.breakpoints.*`).

## Handoff

Runs during pipeline step 5 (implementation), between `scaffold-component` and `use-tokens`. If the component has multi-breakpoint behavior, continue with `responsive-conventions` (step 5a) before `use-tokens`.
