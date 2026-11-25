# @squonk/ui Design System

Reference for the library's design principles, conventions, and structural decisions.

## Philosophy

`@squonk/ui` is a **small, deliberately opinionated** component library. The opinions:

1. **Theme tokens are the only style currency.** Scalable dimensions and colors derive from the theme; governed fixed geometry and optical ratios are named exceptions. The theme is the contract between components and the apps that consume them.
2. **Every value a component uses has a purpose.** Components bind to purpose tokens (`--squonk-roles-*`, shared by every component with that purpose) and component tokens (`--squonk-components-*`, one component's own decision), never to a raw scale step. A theme makes its decisions by re-pointing purposes (`roleBindings`), so it can be roomy in forms and dense in tables, or pill-shaped in controls and square in cards, without touching the scales. See [Purpose tokens](#purpose-tokens).
3. **Sizing is intent, not scale.** New component APIs use a shared visual register rather than unrelated `size="xs|sm|md|lg|xl"` scales. Instead, a parent **`Presentation` register** (`compact`, `default`, `large`, `hero` — names picked for *meaning*, not position on a scale) sets the visual register for everything inside it. To select another register for a subtree, nest `<Presentation register="...">`. Existing native integration props remain compatible escape hatches.
4. **Composability over flexibility.** A component does one thing well and composes; it does not expose 30 props trying to be everything.
5. **Native HTML first.** Reach for ARIA, role, and custom widgets only when no native element fits. Accessibility comes from the elements, not the attributes.
6. **Mobile-first, fluid where possible.** The base styling targets the smallest screen; breakpoints scale up. Fluid CSS beats stepped breakpoints when continuous behavior is possible.
7. **Docs teach intent, not types.** Every prop and every meaningful value in an `.mdx` page explains *when* and *why* a consumer would reach for it, not just *what* it does. The type signature already shows "what"; the docs' job is to encode the design decision.
8. **Tests establish appearance and behavior.** Playwright Component Tests cover visual regressions plus interaction, focus, accessible naming, state and reduced motion. Snapshot updates require review; they cannot prove functional or accessibility correctness.

## Theme architecture

The theme has three rings (see `src/theme/theme.ts`):

1. **Primitives** — `const primitives = { spacingPx: 8, fontPx: 16, ... }`. Internal raw values.
2. **Computed getters** — the exported `theme` object. Every value is a `get foo() { return <expression> }`. This is the public surface.
3. **CSS variables** — every getter as a `--squonk-*` custom property, named after its path (`theme.colors.text.primary` → `--squonk-colors-text-primary`). `themeCssVariables(theme)` (`src/theme/theme-css-vars.ts`) produces them; the theme providers set them on each scope. Derived automatically.

**Rule:** components consume **purpose tokens** (`var(--squonk-roles-*)`), **component tokens** (`var(--squonk-components-*)`) and the register-aware **presentation tokens** (`var(--squonk-presentation-*)`). They never reference primitives, and never a raw scale step such as `var(--squonk-spacing-md)` or `var(--squonk-colors-text-secondary)`. The theme can evolve (a primitive change re-derives all dependents, a re-pointed purpose reaches every component with that purpose) without touching component source. The older `themeToCssVars(theme)` in `src/theme/theme.ts` is a separate serializer (`--colors---primary`, `--spacing---md`, …) kept only for the public `cssVariables` export.

### Token vocabulary

- **Spacing scale:** `xxs`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl` (multiples of `spacingPx`)
- **Semantic spacing:** `gutter`, `containerPadding`, `cardPadding` (aliases of scale values)
- **Typography sizes:** `xs`–`xxl`, plus `h1`–`h6` (multiples of `fontPx`)
- **Colors:** semantic only — `primary`, `secondary`, `accent`, `success`, `warning`, `error`, `info`; plus `background.*`, `text.*`, `border.*`
- **Borders:** `width`, `radius.sm`–`radius.full` (the raw scale)
- **Purpose and component tokens:** see [Purpose tokens](#purpose-tokens). Components read these, not the raw scales above.
- **Z-indexes:** semantic layers — `base`, `dropdown`, `sticky`, `fixed`, `modal`, `popover`, `tooltip`
- **Transitions:** `fast`, `normal`, `slow`
- **Breakpoints:** `mobile`, `tablet`, `desktop`, `wide`

The scales above are the **raw** layer: they say how much, not what for. To add a raw step, follow the primitives → computed getter → CSS variable chain above; a new raw token must derive from a primitive (existing or new). Most new tokens are purposes instead (below).

### Purpose tokens

The theme has three layers:

| Layer | Says | Examples | Who reads it |
| --- | --- | --- | --- |
| **Raw** | How much | `spacing.md`, `typography.sizes.sm`, `colors.text.secondary` | Purpose tokens, and layout props such as `gap="md"` |
| **Purpose** (`roles.*`) | What for | `roles.space.fieldGap`, `roles.color.hint`, `roles.radius.control` | Every component with that purpose |
| **Component** (`components.*`) | One component's own decision | `components.button.paddingInline.default`, `components.tooltip.insetBlock` | That component only |

Purposes and component tokens are defined in `src/theme/purpose.ts`, each with a default binding and a `why`. A binding is a raw token path (`spacing.xs`), another purpose (`roles.color.accent`, so a component token follows the shared role when that is re-pointed), or a literal CSS value (`18px`). Register-stepped tokens have one binding per register (`.compact`, `.default`, `.large`, `.hero`). The radius and elevation roles (`roles.radius.*`, `roles.elevation.*`) are computed in `theme.ts` from their own primitives and are re-pointed the same way. The relief roles (`roles.relief.<posture>.fill` and `.edge`, for the `surface`, `control`, `chrome`, `well` and `pressed` postures) bind to the raw `relief.*` tokens, which `theme.ts` computes from `reliefDepth`, `reliefSheen`, `reliefProfile`, `reliefBlend` and `lightAngle`; a theme gives one posture its own profile by re-pointing it at a per-profile token such as `relief.glass.raised.fill`. Shared purposes form a middle tier that other purposes bind through rather than to a raw step: the proximity ladder (`roles.space.adjoining` to `distinct`), the text-size ladder (`roles.type.fine`, `small`, `body`, `large`) and the edges (`roles.color.edge`, `edgeStrong`); a new purpose binds to the tier step that matches its meaning. The theme switches (`deriveFromPrimary`, `uppercaseControls`, `underlineLinks`, `filledFields`, `printBackgrounds`, `printLinkUrls`) are boolean primitives that purposes bind to through the raw `switches.*` tokens; the binding switches in `src/theme/switches.ts` (`pillControls`, `underlinedFields`, `brandHeadings`, `outlinedSecondary`, `liftOnHover`, `squeezeOnPress`, `inkShadows`, `strongFocus`) instead apply a set of purpose bindings when turned away from their default, beneath the theme's own `roleBindings`. `indicatorStyle` chooses one of the `INDICATOR_STYLES` presets the same way, setting `roles.indicator.*`: the current and hovered navigation item's fill, text and mark colour, and the widths of its bar, underline and ring and the ring's gap, which components compose themselves so nested scopes still work. `lightTextBalance` (0–100) sets when text on a coloured fill turns light and how far the fill (including the accent, `colors.primaryFill`) deepens for it, and `textOnFillStrength` (0–100) how strongly that text stands apart, from a tint of the fill at 4.5:1 to pure white or black, never below AA; components read the purposes, never a switch, so a theme can still re-point any purpose a switch sets. `neutralTint` (0–1) leans the neutral colour primitives towards the primary's hue in `theme.ts`, keeping their lightness; `deriveFromPrimary` computes the `link`, `borderFocus` and `accent` primitives from the primary there too, moved in lightness only as far as their contrast on the theme's backgrounds needs. When the page prints, the colour, elevation and relief purposes are re-pointed at `roles.print.*` and transparent shadows (in the Printable stylesheet, shipped in `styles.css`), and components add their own `@media print` rules.

`purposeCssVariables` (`src/theme/theme-css-vars.ts`) resolves every purpose against the theme's raw and derived variables when the theme's variables are built, so a nested scope that changes a raw value re-emits the purposes bound to it. Purposes are emitted as `--squonk-roles-*` and `--squonk-components-*` and listed in `tokens.css`.

**Re-pointing purposes.** Pass `roleBindings` to `SquonkThemeProvider`, or `override={{ roleBindings: { … } }}` to a `ThemeModifier` for part of a page:

```tsx
<SquonkThemeProvider roleBindings={{
  "roles.space.questionGap": "spacing.xxl",
  "roles.radius.control": "borders.radius.full",
  "components.table.cellPaddingBlock.default": "spacing.xxs",
}}>
```

A binding value must be a token path or an ordinary CSS value. Anything containing `;`, `{`, `}`, `<`, `>`, a backslash or a comment is ignored (and rejected on theme import), because the values are written into a stylesheet. Theme documents (`ThemeDocument`) carry `roleBindings` alongside primitives and colour bindings.

**Reading a purpose in code.** Library code that styles from TypeScript (SemanticSurface backgrounds, QrCode colours) uses `purposeValue(theme, "roles.color.surface")` from `src/theme/use-theme-css-vars.ts`, never `theme.colors.*` directly.

**The rule is enforced.** `npm run lint` runs `scripts/check-purpose-tokens.mjs`, which fails on a raw `--squonk-spacing-*`, `--squonk-typography-*`, `--squonk-borders-*`, `--squonk-shadows-*`, `--squonk-relief-*`, `--squonk-switches-*`, `--squonk-transitions-*`, `--squonk-motion-*` (except the `--squonk-motion-level-*` properties the Motion components read), `--squonk-states-*`, `--squonk-z-indices-*` or `--squonk-colors-*` variable in component CSS, or a raw `theme.*` read in component code. Two exceptions:
- **Status tones** (`--squonk-colors-tone-*`, `--squonk-colors-status-text-*`) are chosen by a consumer's `tone` prop.
- **Scale APIs.** Files whose props hand the raw scale to the consumer (`VStack gap`, `Block padding`, `Text size`) carry a `purpose-tokens: scale-api — <why>` comment; the consumer supplies the purpose.

**Adding a token.** Pick by purpose, not value: if two uses share a value but not a reason, they get two tokens. Share an existing purpose where the reason is the same; add a shared `roles.*` purpose when two or more components share a purpose a theme might tune together; add a `components.*` token for a decision only one component makes. Add it to `purpose.ts` with its `why`, and bind its default so it reproduces today's value exactly (the snapshots then prove nothing moved). Run `npm run tokens:generate`. See the `add-token` skill.

The [Purpose tokens](?path=/docs/foundations-purpose-tokens--docs) docs page lists every purpose with its reason, binding and value, and the Storybook Theme panel shows the tokens each story actually reads.

## Component taxonomy

`@squonk/ui` organises components into **four kinds**, on two axes — *primitive vs composed* × *layout vs functional*. Each kind has a different shape and a different set of allowed concerns.

| Kind | Examples | Takes style/layout props? | Role |
|---|---|---|---|
| **`LayoutPrimitive`** | `HStack`, `VStack`, `Grid`, `Container`, `Block`, `Spacer`, `Divider` | **Yes** — this is where layout knobs live | Atomic layout building block. Configurable. |
| **`Layout`** | `Card`, `Cluster`, `EmptyState`, `Footer`, `Header`, `MediaObject`, `Section`, `SectionHeading`, `Split`, `Page` | **No** — composes `LayoutPrimitive`s internally | Named composition with a specific shape. Adds semantic meaning + visual identity, not layout flexibility. |
| **`FunctionalPrimitive`** | `Text`, `Heading`, `Kbd` | **No** — visual size derives from the ambient `Presentation` register | Atomic content / typography unit. |
| **`Functional`** | `Button`, `Link`, `Badge`, `Avatar`, `Alert`, `TextField`, `Checkbox`, `Radio`, `Switch`, `ProgressBar`, `Spinner` | **No** — accepts only variants + state, never layout/style knobs; visual register flows from `Presentation` | Named interactive element. Specific purpose. |

**The rule**: only `LayoutPrimitive`s carry layout/style props (`direction`, `gap`, `justify`, `align`, `padding`, `width`, etc.). Every other kind composes `LayoutPrimitive`s internally to get its layout — its public API exposes **intent variants** (`variant="featured"`, `tone="primary"`, `register="hero"`), not raw layout knobs.

This is guidance for new intent APIs, not a ban on existing compatible native `style`, `className`, `ref`, or documented layout props. Preserve those escape hatches; consumers may use native styles for parent sizing and application integration. Removing or narrowing them is a compatibility change.

When a `Layout` or `Functional` component needs a new layout shape, the answer is **add a new component** for that shape, not add a prop to the existing one. (e.g. instead of `<Footer columns={3}>`, add `<MultiColumnFooter>` as a separate Layout component.)

### Spotting a new `Layout` component

A specific `HStack` / `VStack` / `Grid` / `Block` invocation that recurs across the app is the strongest signal you should name it. If you find yourself writing the same `<HStack justify="between">` in five places, that's `<Split>`. Wrapping rows of tags? `<Cluster>`. Avatar-beside-content? `<MediaObject>`. Centered "nothing here yet" block? `<EmptyState>`. The named component encodes the *intent*; the primitive describes the *flex/grid mechanic*. Naming lifts the consumer's eye one level — from "this is a flex row with space-between" to "this is a leading/trailing split".

A `Layout` is worth extracting when:

- The shape is **named** in product/design language ("the header row", "the empty state").
- It appears in **3+ consumers** (in the library, in the consumer apps, or strongly anticipated).
- Its **prop API is narrower** than the primitive's — fewer knobs, more intent.

### Other component categories

Beyond the four kinds above, two cross-cutting categories exist:

- **`Animation`** — the `Motion` components (`src/components/animation/motion/`): every animation and transition in the library, from hover feedback to overlays, loops, `Reveal`, `Presence`, `Swap`, `Highlight`, `Layout`, `Count` and `Stagger` for choreography. Each wraps one element and adds no markup; components never declare motion in their own CSS, and consumers use these instead of writing `framer-motion` directly. Motion has three layers: the theme's character (motion primitives and `roles.motion.*`), the Motion components' vocabulary, and the motion level (the device's reduced-motion setting or `SquonkThemeProvider`'s `motion` prop, published as `--squonk-motion-level-*`).
- **`Style`** — `Presentation`, `ThemeModifier`, `ThemeStyleBlock`. Render-less context providers that scope state for a subtree — `Presentation` scopes the visual register, `ThemeModifier` deep-merges a partial theme override, `ThemeStyleBlock` retunes size register and/or flips light/dark mode. Live at `src/components/style/`. *No visual output of their own* — they only re-thread state down through their children.

## Component file structure

Every component lives in `src/components/{layout-primitive|layout|functional-primitive|functional|animation|style}/{kebab-name}/` as a four-file unit, plus a `.module.css` when it renders its own styles:

```
src/components/layout-primitive/hstack/
├── hstack.tsx           # implementation
├── hstack.module.css    # styles (see Styling with CSS Modules)
├── hstack.stories.tsx   # Storybook stories
├── hstack.test.tsx      # Playwright CT snapshot tests
└── hstack.mdx           # user-facing docs
```

- **Polymorphic components** use `PolymorphicComponentProps<E>` from `@src/types/polymorphic-types`. The `as` prop is the universal escape hatch. `LayoutPrimitive`s are always polymorphic; others opt in.
- **Void HTML elements** (`input`, `img`, `hr`, `br`) cannot have children — the generator enforces this.

The source already uses all four taxonomy folders plus `animation/` and `style/`. Folder moves alone do not justify removing an existing public import path.

## Styling with CSS Modules

Components are styled with CSS Modules: a `<name>.module.css` next to `<name>.tsx`, compiled by Lightning CSS into `@squonk/ui/styles.css`. Storybook and the Playwright component tests use Vite's built-in support.

A complete component looks like this:

```css
/* button.module.css */
@layer dt.components {
  .root {
    gap: var(--squonk-spacing-xs);
    padding: var(--squonk-spacing-sm) var(--squonk-spacing-lg);
    border-radius: var(--squonk-roles-radius-control);
    transition: var(--squonk-transitions-fast);
  }
  .root[data-shape="pill"] { border-radius: var(--squonk-borders-radius-full); }
  .root[data-variant="primary"] {
    background-color: var(--squonk-colors-primary);
    color: var(--squonk-colors-contrast-primary);
  }
  .root[data-variant="primary"]:hover:not(:disabled) {
    background-color: var(--squonk-colors-primary-hover);
  }
  .fullWidth { width: 100%; }
}
```

```tsx
// button.tsx
const themeVars = useThemeCssVars();
return (
  <Component
    className={clsx(styles.root, fullWidth && styles.fullWidth, className)}
    style={{ ...themeVars.style, ...style }}
    data-variant={variant}
    data-shape={shape}
    {...otherProps}
  >
    {themeVars.provide(children)}
  </Component>
);
```

**Tokens.** Read theme values as `var(--squonk-*)`, and in component CSS only purpose, component and presentation tokens: `var(--squonk-roles-space-field-gap)`, `var(--squonk-components-button-padding-inline-default)`, `var(--squonk-presentation-control-height-default)` (see [Purpose tokens](#purpose-tokens)). The name mirrors the path in kebab case: `roles.color.focusRing` → `var(--squonk-roles-color-focus-ring)`. Every variable, with its default value, is listed in `src/theme/tokens.css` (generated by `npm run tokens:generate`, checked by `npm run tokens:check`).

**Derived colours.** CSS can't run the theme's colour maths, so colours a component would compute (hover and active shades, readable text on a surface, tinted chips and panels) are computed once per theme in `derivedColorTokens` (`src/theme/theme-css-vars.ts`) and published as tokens:
- `--squonk-colors-primary-hover`, `-active`, `--squonk-colors-contrast-primary` (text on a solid fill), `--squonk-colors-on-primary-hover` and the same set for `error`.
- `--squonk-colors-on-background-{default,surface,subtle}` and their `-secondary` variants: readable text on each background.
- `--squonk-colors-tone-{neutral,primary,success,warning,error,info}-{solid,contrast,subtle,on-subtle,outline-text,wash,on-wash,wash-border}`: one palette per tone. A component points local variables at a palette (`.root[data-tone="success"] { --tone-solid: var(--squonk-colors-tone-success-solid); … }`) and writes its variant rules once against `--tone-*`. Badge and Alert work this way.

When a component needs a new computed colour, add it to `derivedColorTokens` (see `add-token`) and give it a purpose that binds to it; never compute colours in a component. Status tones are read directly; the other derived colours reach components through purposes such as `roles.color.accentHover` or `roles.color.onSurface`.

**Applying the active theme.** `tokens.css` declares the default theme on `:root`, and the outermost `SquonkThemeProvider` writes its own theme there when it differs (for example `mode="dark"`). `useSquonkTheme()` reads the resolved theme in TypeScript for the rare value that can't be CSS. Each component calls `useThemeCssVars()`, spreads `style` onto its root element and wraps the children it renders inside that element with `provide(...)`. The hook sets only the variables whose value differs from what the nearest styled ancestor already applied, so an app on the default theme renders no inline variables, and inside a `ThemeModifier`, `ThemeStyleBlock` or `SemanticSurface` only the outermost component carries the changes. Content rendered through a portal wraps itself in `ThemeCssVarsPortal`, because its DOM parent is `<body>`. Consumer CSS that reads `var(--squonk-*)` sees the root theme, not a nested scope's values.

**Prop conventions.**
- Visual variants and modes (variant, tone, shape, register, background, side) → `data-*` attributes, matched with `.root[data-variant="primary"]`.
- Boolean flags → classes joined with `clsx` (`fullWidth && styles.fullWidth`). Apply a class only when its custom property is set on the same element.
- Values that map 1:1 to a token or CSS value (gap, alignment, padding step, free-form widths) → a component-scoped custom property set inline and read by a class: `style={{ "--hstack-gap": `var(--squonk-spacing-${gap})` }}`. Prefix it with the component name; custom properties inherit. A prop that maps onto the raw scale makes the file a scale API: mark it with a `purpose-tokens: scale-api` comment (see [Purpose tokens](#purpose-tokens)).
- Always merge the consumer's `className` and `style`. Polymorphic components render `as || "<default>"` directly.
- React Aria components carry their own state attributes (`data-selected`, `data-disabled`, `data-focus-visible`, `data-hovered`, `data-pressed`, `data-open`, `data-expanded`, `data-entering`/`data-exiting`, `data-placement`, `data-invalid`); style those instead of adding props, and prefer them over React Aria's `className` functions. React Aria sets them to `"true"`, so tests assert presence. Name classes after the React Aria component or slot they style (`.root`, `.button`, `.control`, `.popover`, `.item`).

**Layers and specificity.** Every module wraps its rules in `@layer dt.components` (tokens are in `dt.tokens`), so a consumer's unlayered CSS always wins without specificity fights. Within the library, a rule that must beat a variant rule from another module raises its own specificity (for example `.root[data-variant="outlined"]:hover`) instead of relying on stylesheet order.

**Motion.** Every keyframe and transition lives in `src/components/animation/motion/motion.module.css`; components wrap the element that moves in a Motion component. Durations and delays there are multiplied by `--squonk-motion-level-time` and distances by `1 − --squonk-motion-level-reduced`, so reduced motion and the app's motion level are handled once, for every recipe. Motion run from JavaScript (Layout, Count) reads the same values with `motionTiming`.

**Breakpoints.** `var()` does not work in media queries. Write mobile-first `@media (min-width: …)` queries with the default breakpoint values (`768px` tablet, `1024px` desktop, `1280px` wide) and add a unit test that compares them with `theme.breakpoints`, as `grid.test.ts` does. Breakpoint primitives overridden at runtime therefore do not move CSS-module media queries; prefer fluid CSS or container queries where a component should follow its own width.

### The governed four-file exception

Only **renderless Style components** (`Presentation`, `ThemeModifier`, `ThemeStyleBlock`) may omit a standalone `*.test.tsx` snapshot file. They still require stories, MDX and meaningful unit or composition coverage of their behavior. The Motion components are not exempt: test rendered states, runtime behavior, lifecycle cleanup and reduced-motion support.

Every other component — anything with its own rendered appearance — requires the full four-file unit. This is a narrow, named exception, not a general excuse to skip tests.

## Sizing: the `Presentation` register

A library full of `size="xs|sm|md|lg|xl"` props turns every component into its own five-point scale and tells the consumer nothing about *intent*. `@squonk/ui` instead exposes a single Style component, `<Presentation>`, that sets the **visual register** for everything inside it:

| Register | Intent |
|---|---|
| `compact` | Dense surfaces — sidebars, toolbars, tables, settings panels |
| `default` | The general-purpose register; what most pages use |
| `large` | Display sections — landing slabs that need more weight than `default` without going full hero |
| `hero` | The page's headline moment — top-of-page marketing |

```tsx
<Presentation register="hero">
  <Heading level={1}>Big headline</Heading>
  <Button variant="primary">Primary CTA</Button>
</Presentation>
```

Every register-aware component (`Button`, `Text`, `Heading`, `Badge`, `Spinner`, `Avatar`, `TextField`, `Switch`, `ProgressBar`, `Card`, `InteractiveCard`, ...) reads the ambient register and sizes itself accordingly. **The presentation contract uses shared registers, not separate component size scales.** To scope a subtree to a different register — e.g. a default-padded card inside a hero section — nest another `<Presentation register="...">`.

`Section` and `Header` are themselves registers: their `register` prop sets both their own padding AND wraps their descendants in a `Presentation` context. So `<Section register="hero">` is the typical hero pattern — no inner `Presentation` needed.

**Why not a per-component override?** Picking the register per component invites scattered inconsistencies ("why is this button `lg` and that button `md`?"). Forcing the choice up the tree, into the `Presentation` (or section) wrapping a coherent visual block, keeps the "voice" of each block intentional. The escape hatch is nesting another `Presentation`, which still makes the override explicit at the boundary.

This sits alongside `ThemeModifier` and `ThemeStyleBlock` (theme tokens scoped per subtree — see "Style components" below) as the library's Style components — all render-less context providers, all opt-in by nesting.

### Scalable values and governed fixed geometry

`theme.presentation.cardPadding`, `headerPaddingBlock`, `sectionPadding`, and `headingSizes` derive their scalable lengths from `spacingPx` and `fontPx`. `ThemeStyleBlock` rebuilds these from root primitives, preserving ordered explicit overrides; nesting the same register does not compound the scale. `Presentation` selects intent-specific values without rebuilding the theme.

Some dimensions are intentionally fixed per register: Avatar diameters, Switch track/thumb geometry, Spinner diameter/stroke, and ProgressBar track height. Unitless line heights, em tracking and icon/optical ratios also retain their geometry. These named exceptions are not uniformly scaled by `ThemeStyleBlock`. Document each exception's purpose, register behavior and constrained-parent tests; do not add unexplained constants. New scalable presentation dimensions belong in derived tokens. Native consumer `style`/`ref` props remain supported escape hatches, not the library's token implementation strategy.

## Mobile-first responsive design

Mobile is the default; everything else is an enhancement.

```css
.root {
  padding: var(--squonk-spacing-md);            /* mobile default */
}

@media (min-width: 768px) {                 /* theme.breakpoints.tablet */
  .root { padding: var(--squonk-spacing-lg); }
}

@media (min-width: 1024px) {                /* theme.breakpoints.desktop */
  .root { padding: var(--squonk-spacing-xl); }
}
```

**Rules:**
- Base styles are mobile.
- Use `min-width` media queries only — no mixing with `max-width`.
- Use the default `theme.breakpoints.*` values and guard them with a unit test (media queries can't read `var()`).
- Prefer fluid CSS (`clamp()`, `min()`, `max()`, percentage widths, `auto-fit` grids) over stepped breakpoints when behavior is continuous.
- Responsive props (`size={{ mobile, desktop }}`) are a last resort — try CSS-only solutions first.

## Composability rules

A component must be droppable into any parent layout without surprises. The outermost element of every component obeys:

- **No `margin`.** Spacing between siblings is the parent's concern (typically an `<HStack>` or `<VStack>` or the consumer's layout).
- **No arbitrary fixed outer dimensions.** Use `fit-content`, `100%`, or a token-derived `maxWidth`. Named geometry above and documented viewport contracts such as Page are exceptions; test constrained parents and document overrides.
- **Positioned components document their containment.** Portals, overlays, FixedHeader and StickyHeader must explain positioning, reserved space and stacking.
- **No `z-index` literals** — always `theme.zIndices.*`.
- **No `float`** — use flex/grid.

A component's outermost element also picks one of these sizing postures **explicitly**:

| Posture | When | Example |
|---|---|---|
| **fit-content** | The component owns its size (inline tokens like Badge, Chip) | `width: fit-content` |
| **100% / stretch** | The component claims the parent's width (Card, Banner, form input) | `width: 100%` |
| **defer** | The component stays silent and lets the parent decide (rare; utility wrappers) | (no width) |

See [Parent patterns](#parent-patterns) for the containers each component is checked against.

## Parent patterns

> *Terminology note*: this library calls a recurring kind of container a **"parent pattern"**. Alternates considered: "parent slot" (more web-component-ish), "host context" (more abstract), "layout pattern" (clashes with `Layout` component register). "Parent pattern" wins because it names the shape and its relationship to the child without overlapping existing vocab.

Components in this library don't exist in isolation — they render inside other components. There's a finite set of recurring container shapes they show up in, and every component must behave reasonably inside any of them. This is the flip side of "Composability rules": composability rules describe what a component must DO; parent patterns describe what it must SURVIVE.

The set is **seven main patterns** plus **two stress tests**. The `<ResizableCanvas>` preview block uses these as its recipe set so docs readers can flip a component through each pattern and see how it adapts.

### The seven main patterns

#### `block` — normal document flow

**Real parents**: `Card` body, `Section` content area, `Page` body, MDX prose between headings.

**CSS shape**: `display: block; overflow: visible`.

**Expected child behavior**:
- A block-level child fills 100% of available width by default.
- Children stack vertically following document flow.
- Inline-level children flow within text lines.

**What to test**: Does the component render correctly when its parent makes *no* flex/grid promises? This is the most permissive parent — if your component breaks here, it's broken.

#### `stack-down` — vertical Stack

**Real parents**: `<VStack />`, `Sidebar`, `Page` body, form field lists.

**CSS shape**: `display: flex; flex-direction: column; align-items: stretch`.

**Expected child behavior**:
- Children stack vertically with consistent gap (when the real parent sets one).
- Each child stretches to the cross-axis width by default — a child without explicit `width` becomes 100%-wide.
- A child with `fullWidth` prop fits this naturally. A `fit-content`-posture child stays its intrinsic size but is left-aligned.

**What to test**: Does the component look right as one of many siblings in a vertical list?

#### `stack-right` — horizontal Stack (no wrap)

**Real parents**: `<HStack />`, `Header` toolbar, action button row, `MediaObject`'s row half.

**CSS shape**: `display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center`.

**Expected child behavior**:
- Children flow horizontally on a single line.
- Each child takes its intrinsic width.
- If children's total width exceeds the parent's, they overflow (or shrink if they have `flex-shrink`).

**What to test**: Does the component look right next to other inline-level peers? Does it have a reasonable intrinsic width, or does it stretch unexpectedly?

#### `cluster` — wrapping horizontal row

**Real parents**: `<Cluster />` (= `<HStack wrap />`), `Footer` link row, tag/chip groups.

**CSS shape**: `display: flex; flex-direction: row; flex-wrap: wrap; align-items: center`.

**Expected child behavior**:
- Children flow horizontally and **wrap** to the next line when there's no horizontal room.
- Vertical gap appears between wrapped lines.
- Children retain their intrinsic widths.

**What to test**: Does the component remain a discrete unit when wrapping? It should never visually merge with neighbors when on the same line.

#### `centered` — center-center slot

**Real parents**: `EmptyState`, hero CTA region, modal dialog body, "no content" placeholder.

**CSS shape**: `display: flex; justify-content: center; align-items: center; text-align: center`.

**Expected child behavior**:
- A single child is centered both horizontally and vertically.
- Text content within the child inherits `text-align: center` unless the child overrides.

**What to test**: Does the component look right when it's the focal point of an otherwise empty area? Often the most flattering test for hero CTAs and EmptyState illustrations.

#### `inline` — inline text run

**Real parents**: A paragraph (`<p>`), descriptive prose, a sentence with linked words, breadcrumb text, status messages with embedded badges.

**CSS shape**: `display: block; align-items: baseline` (the *real* test is the inline-level surrounding text).

**Expected child behavior**:
- The component sits in the text baseline alongside surrounding words.
- It wraps with the text when the line breaks.
- It does NOT introduce its own block-level break.

**What to test**: Does the component cooperate as an inline-level participant in a sentence? Components like `Link`, inline `Badge`, and `Code` must work here; components like `Card` or `Page` are pathological in this slot and that's fine to confirm.

#### `scroll-box` — fixed-size scrollable container

**Real parents**: Modal body, fixed-height scrollable list, viewport-bounded sidebar.

**CSS shape**: `overflow-y: auto`, with a fixed parent size (~400×200 in the preview).

**Expected child behavior**:
- The component renders at its natural size.
- If it exceeds the container, the container scrolls — the component does NOT clip or shrink to fit.
- The component does not introduce its own scroll container (unless that's its job).

**What to test**: Does the component play nicely inside a viewport that may be smaller than it would like?

### Stress-test patterns

These aren't realistic parents — they're stress tests for edge behavior.

#### `squeezed` — 200px narrow parent

**What to test**: Does the component overflow, wrap, truncate, or scroll? Any of those can be correct depending on the component's `containment-behavior` posture — but it must do *something* deliberate, not break the page.

#### `zero` — 0×0 parent

**What to test**: What happens when the parent has collapsed entirely? Components must remain renderable (no crashes) but visual misbehavior here is acceptable — this is the "what if everything goes wrong" stress test.

### How to use this list

- **Designing a new component**: walk through each of the seven main patterns mentally. Test the applicable patterns and document incompatible semantic placements; a Page or Card is not valid paragraph content. The `inline` pattern is the most-skipped check — many components secretly assume block-level placement.
- **Reviewing a PR**: open the docs page, flip through the recipes in `<ResizableCanvas>`. Each pattern should produce a reasonable visual.
- **Documenting a component**: set the `defaultRecipe` on `<ResizableCanvas>` to whichever pattern the component most naturally lives in — that's what the reader will see first.

## Accessibility baseline

Every component must:

- Use the most semantic native HTML element available before reaching for ARIA.
- Be operable by keyboard alone (Tab to focus, Enter/Space to activate, Esc to dismiss where applicable).
- Show a visible focus indicator (`:focus-visible` outline using `theme.colors.border.focus`).
- Meet WCAG AA contrast on supported defaults (4.5:1 normal text, 3:1 large text). Regressions cover default primary/secondary/muted text roles on default/surface/subtle light and dark surfaces, plus supported composed surfaces. Semantic surface boundaries adjust inherited foregrounds while self-painted controls retain their own contrast pairing. Custom colors, explicit tones, CSS expressions and translucent/image composites require consumer verification; defaults are not a blanket accessibility certification.
- Respect `prefers-reduced-motion` for transitions longer than ~200ms or movements > 50px.

Keyboard behavior, labels, focus, disabled states and reduced motion are mandatory review requirements. Test them with functional assertions; automated audits and screenshots are complementary evidence.

Build every component on React Aria Components wherever it has a primitive, even simple ones like Button and Link; never hand-roll focus, keyboard, overlay or selection behaviour. Keep our public prop names (`disabled`, `checked`, `onChange`, `error`, `helperText`, `label`) and map them onto React Aria's (`isDisabled`, `isSelected`, …); never re-export React Aria components or types. Fields use React Aria's field parts (`Label`, `Input`, `Text slot="description"`, `FieldError`) with `validationBehavior="aria"`. Plain HTML only where React Aria has nothing (badge, skeleton, alert, fieldset, avatar fallback, feed). Tables use TanStack Table for data; React Aria's `Table` renders the interactive grid (selectable or `interactive`), and a read-only table stays a semantic `<table>`. Forms use TanStack Form and Zod through `@squonk/ui/form`; see the Forms section in Storybook.

## Documentation expectations

Each component's `.mdx` page must include:

1. **Intro paragraph** — what the component is, what role it plays, what it's NOT.
2. **`<ResizableCanvas>`** — the primary preview area (replaces Storybook's `<Canvas />`). See "The preview area" below.
3. **`<Controls />`** — auto-generated prop reference.
4. **Per-variant sections** — each notable variant or state with a live `<InlineCodeExample>` and a prose note on when to use it.
5. **Composition examples** — when the component is commonly used with others, show the realistic composition.
6. **Accessibility notes** — component-specific a11y rules (required props, keyboard interactions).
7. **Common pitfalls** — bullet list of "don't do this" with corrections.

Use realistic mock data in examples (real-looking names, emails, prices) — not "Lorem ipsum" or "Test 1, Test 2".

**Dogfood the library in its own examples.** Stories and MDX examples for layout components (Grid, HStack, VStack, Split, Card, Sidebar, …) should fill themselves with other `@squonk/ui` components — usually `<Card>` for cells, `<Text>` for prose, `<Badge>` for chips — *not* hand-rolled `<div style={{ background: "#e9ecef", border: "1px solid #dee2e6" }}>` placeholders. Two reasons: (1) library components read `theme.colors.*`, so they swap with dark mode automatically while a hardcoded `#e9ecef` looks broken; (2) a downstream consumer is going to compose `<Grid><Card/><Card/></Grid>`, so the docs should mirror that. The same rule applies to decorator "frames" around stories — use a themed wrapper or no wrapper, never `border: "1px dashed #adb5bd"`.

**Docs teach intent, not types.** A prop documented as "`variant: 'primary' | 'secondary'` — sets the variant" is restating the TypeScript signature. Useful prop docs answer *when* a consumer would reach for each value and *what mistake* picking it prevents — e.g., "use `secondary` for actions that aren't the page's primary CTA; if two `primary` buttons are on screen at once, one is probably miscategorised." See Philosophy #7.

If a component exposes CSS variables for override (Philosophy #2), the `.mdx` page **must enumerate them**: variable name, what it controls, and the theme-token default it resolves to.

### The preview area

The primary preview block in each MDX page is `<ResizableCanvas of={...} defaultRecipe="..." />`, imported from [`src/utils/resizable-canvas.tsx`](src/utils/resizable-canvas.tsx). It replaces Storybook's `<Canvas />` with three things readers can do:

1. **Resize** the preview area from any edge or corner (horizontally centered, vertically anchored to flow). A warning-red marching-ants border lights up if the component overflows its parent in `overflow: visible` mode.
2. **Pick a parent pattern** — a centered row of buttons that snap the Stage to one of the [parent patterns](#parent-patterns) above. The user's pick is remembered in `sessionStorage` per docs page, so reloading the page keeps the last view.
3. **Reveal raw CSS** — a `⚙ raw` escape hatch swaps the pattern row for individual CSS-property dropdowns. For when the patterns don't quite fit.

In code the patterns are called **recipes** — each one is a pre-baked record of `display / overflow / justify-content / align-items / text-align / vertical-align` plus an optional initial frame size (used by `scroll-box`, `squeezed`, `zero`). The `defaultRecipe` prop tells `ResizableCanvas` which pattern to start in for a given component.

## Testing strategy

Three surfaces; each catches a different class of bug:

| Surface | Tool | Coverage target |
|---|---|---|
| **Unit** | Vitest (`*.test.ts` outside `src/components/**`) | Theme getters, util functions, pure logic |
| **Component behavior + visual** | Playwright CT (`*.test.tsx` in `src/components/**`) | Rendered states, keyboard/focus/labels, callbacks, disabled/loading behavior, reduced motion, and visual baselines |
| **Browser E2E** | Not currently wired up | Full application flows and assistive-technology scenarios; CT already exercises browser keyboard behavior |

CI (`.github/workflows/ci.yml`) runs the Playwright component tests in the same container image as `npm run test`. A failing test blocks the release workflow.

## What does NOT belong in this library

Some asks should be rejected, not built:

- **App-specific compositions.** A `<SignupFormForBetaUsers>` mixes business logic with UI. The consumer composes primitives (`Card` + `TextField` + `Button`); the library does not.
- **Domain-coupled components.** A `<MolarMassDisplay>` belongs in the consumer app.
- **Components with hardcoded copy or content.** A library component has no opinions about what text it shows.

If in doubt: a library component is **reusable**, **generic**, and **theme-able**. Anything failing any of those three should be rebuilt as a consumer-side composition.

## Dark mode

Dark mode is **first-class** in `@squonk/ui` — every component that consumes color tokens automatically adapts when the active mode is `dark`. There is no per-component dark variant; the mechanism is the theme.

The library exports two themes from `src/theme/theme.ts`:

- **`theme`** — light (default).
- **`darkTheme`** — dark variant, sharing every non-color token (spacing, radius, shadows, typography) with the light theme. Only `theme.colors.*` and the surface relief (`theme.relief.*`, whose highlights are toned down and shading strengthened on dark surfaces) resolve differently.

Three ways to use dark mode, using the library's real Style components (`src/components/style/`):

```tsx
// 1. Whole-app dark — set mode="dark" on the root provider.
<SquonkThemeProvider mode="dark">
  <App />
</SquonkThemeProvider>

// 2. Subtree dark — flip mode for one branch with ThemeStyleBlock, without
//    touching the rest of the tree. invertMode flips relative to whatever
//    mode the subtree inherited.
<ThemeStyleBlock invertMode>
  <HeroOnLightPageButDarkPanelInside />
</ThemeStyleBlock>

// 3. Brand dark — start from dark mode and deep-merge a primary-colour
//    override with ThemeModifier. Useful when the library's default dark
//    palette is the right base but the brand colour needs to change.
<SquonkThemeProvider mode="dark">
  <ThemeModifier override={{ colors: { primary: brand.accent } }}>
    <App />
  </ThemeModifier>
</SquonkThemeProvider>
```

Non-color tokens (spacing, radius, shadows) are mode-agnostic and stay single-valued. The one notable edge case is **shadows**, which often need different opacity in dark mode (a glow rather than a drop shadow). The library's `shadows.soft` and `shadows.pop` use `rgba(0, 0, 0, ...)` which renders subtly differently against a dark background; if a brand needs tuned dark shadows, override them via `ThemeModifier`.

The `mode` field is present on every theme (`"light" | "dark"`) so components can branch on it where strictly necessary — but the strong preference is to let token resolution do the work and avoid `if (theme.mode === 'dark')` branches in component code.

## Style components

The library ships three render-less Style components (`src/components/style/`), each scoping a different piece of state to a subtree via React context — none produce their own DOM:

- **`Presentation`** (`src/components/style/presentation/`) — `<Presentation register="compact" | "default" | "large" | "hero">`. Sets the visual register read by every register-aware component (see "Sizing: the `Presentation` register" above). Does not touch theme tokens.
- **`ThemeModifier`** (`src/components/style/theme-modifier/`) — `<ThemeModifier override={/* deep-partial theme */}>`. Deep-merges a partial theme object onto whatever theme the subtree inherited (via `SquonkThemeContext`) and re-provides it. This is the canonical mechanism for:
  - **Per-section brand**: a partner's brand colour applied to a co-branded panel without affecting siblings.
  - **Component-level overrides**: scoping a single component's primary colour without forking the component or writing CSS.
  - **Brand-dark composition**: layering a colour tweak on top of `mode="dark"` (see Dark mode example 3 above).
- **`ThemeStyleBlock`** (`src/components/style/theme-style-block/`) — `<ThemeStyleBlock register?="normal" | "compact" | "display" invertMode?={boolean}>`. Retunes the theme derived from the root `SquonkThemeProvider`'s primitives: `register` scales spacing/font/border-radius up or down (`compact*Ratio` / `display*Ratio` primitives), `invertMode` flips light↔dark. The two axes are orthogonal — combine them for e.g. "compact + dark". This is the canonical subtree dark-mode mechanism (Dark mode example 2 above).

```tsx
<ThemeModifier override={{ colors: { primary: "#ef4237" } }}>
  <Button>Brand-overridden CTA</Button>
</ThemeModifier>
```

Ordered modifier transforms and semantic surface transforms are recorded in shared metadata and reapplied after `ThemeStyleBlock` rebuilds. Later mode boundaries select the mode; explicit resolved overrides remain explicit. Root primitives keep register scaling from compounding.

Both `ThemeModifier` and `ThemeStyleBlock` are "efficient": they re-provide the resolved theme through `SquonkThemeContext` — no remounting, just a context value change — and CSS-module components pick up the changed `--squonk-*` variables through `useThemeCssVars` (see "Styling with CSS Modules").

## When the library and the consumer disagree

Downstream apps will eventually want behavior the library doesn't offer (different colors, custom slots, app-specific variants). The library's response:

1. If the request is **generally useful** — extend the library (new prop, new variant, new token).
2. If the request is **app-specific** — the consumer wraps the library component or composes around it. The library does not bend to fit every app.

The escape hatches the library does provide:
- **Polymorphic `as` prop** — change the rendered element without changing the component.
- **Theme overrides** — root primitives via `SquonkThemeProvider`; ordered subtree overrides via `ThemeModifier` and `ThemeStyleBlock`. Providing a resolved theme through `SquonkThemeContext` directly does not update the library metadata used for nested rebuilds.
- **Native props** — existing supported `style`, `className`, `ref`, native events and attributes enable application integration; preserve their compatibility.
- **Composition** — combine primitives instead of asking for a bespoke component.

## Versioning and release

The library uses Conventional Commits + semantic-release:

- `feat:` → minor bump (new component, new optional prop, new token)
- `fix:` → patch bump
- `feat!:` / `fix!:` / `BREAKING CHANGE:` footer → major bump

Every published entry point and declaration is public API, not only `dist/index.d.ts`. Additive exports, optional props and tokens normally warrant a minor release. Removing/renaming exports or props, narrowing accepted types, changing established defaults, or raising supported runtime/dependency floors requires a major release and migration notes. A bug fix can still be a breaking change. Reviewers classify behavioural and accessibility compatibility; automated checks cannot prove it.

## References

- [COMPONENT_LIST.md](./COMPONENT_LIST.md) — implementation status of each component.
- [skills/use-squonk-ui/SKILL.md](./skills/use-squonk-ui/SKILL.md) — guidance for agents building apps with the library, published in the package.
- `src/theme/theme.ts` — the source of truth for tokens.
- [REVIEW_GUIDE.md](./REVIEW_GUIDE.md) — what reviewers check on every pull request.
