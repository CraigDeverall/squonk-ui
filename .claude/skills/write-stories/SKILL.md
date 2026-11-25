---
name: write-stories
description: Fill out a Storybook stories file for a @squonk/ui component using the library's conventions (Meta title path, commonArgTypes spread, one story per variant/state, control configuration). Use after scaffold-component generates the empty stories file, or whenever a component's stories are missing/thin and need a proper variant matrix.
---

# Write Stories

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonk/ui` library only. The Yeoman generator creates Default and Dark stories; this skill fills it out with the right shape, variants, and controls.

## The canonical stories file shape

Pattern, derived from existing files like [src/components/functional/button/button.stories.tsx](../../../src/components/functional/button/button.stories.tsx) and [src/components/layout/card/card.stories.tsx](../../../src/components/layout/card/card.stories.tsx):

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { commonArgTypes } from "@src/utils";
import { MyComponent } from "./my-component";

const meta: Meta<typeof MyComponent> = {
  title: "Functional/MyComponent",
  component: MyComponent,
  argTypes: {
    ...commonArgTypes,
    // Component-specific argTypes here
    variant: {
      control: "radio",
      options: ["default", "special"],
      description: "Visual style of the component.",
    },
    ref: {
      description: "Ref to the DOM element",
      control: false,
      table: {
        type: { summary: "React.RefObject<HTMLElement>" },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  args: {
    variant: "default",
    children: "Sample content",
  },
};

export const Special: Story = {
  args: {
    variant: "special",
    children: "Sample content",
  },
};
```

## The non-negotiables

1. **Meta title path**: use `Functional/`, `Functional/Primitives/`, `Layout/`, `Layout/Primitives/`, `Style/` or `Animation/` matching the existing category. Preserve existing titles because they determine story IDs. The path drives Storybook's sidebar grouping — get it wrong and the component lands in the wrong section.
2. **Always spread `commonArgTypes`**: `argTypes: { ...commonArgTypes, ... }`. This brings in `as` and `ref` controls so polymorphic components work properly in the docs.
3. **`commonArgTypes` import path**: always `@src/utils` (not a relative path).
4. **Component import**: relative — `./my-component`.
5. **Default export is the `meta`**, named exports are the stories.
6. **Type `Meta<typeof Component>` and `StoryObj<typeof Component>`** — never hand-roll the type.

## What stories to write

Don't ship a stories file with only `Default`. Cover the prop variants and significant states:

| Prop pattern | What to add |
|---|---|
| Union variant (`variant: 'a' \| 'b' \| 'c'`) | One story per value. Name the story after the variant (`Primary`, `Outlined`, etc.). |
| Boolean toggle (`disabled`, `loading`) | One story for the on state. Don't double-up by writing both `Enabled` and `Disabled` if `Disabled` is the only interesting one. |
| Size scale (`size: 'sm' \| 'md' \| 'lg'`) | One story per size. |
| State the user can't set via props (focus, hover) | Skip in stories — covered by Playwright CT. Don't fake these with CSS class overrides. |
| Polymorphic `as` prop | Don't add a story; the `as` control comes free from `commonArgTypes`. |

For Card, the pattern was three variant stories (Outlined / Elevated / Filled) plus a shared `sampleContent` constant. For Button, it was Primary / Secondary / Cool. Mirror that level of coverage.

## Meta-level `args` defaults — the "no Set boolean / Set object" rule

The docs args table renders a real control widget (False/True toggle, slider, picker) only when the arg has a defined value. If the arg is `undefined`, Storybook shows a placeholder button labelled **"Set boolean"** / **"Set object"** / **"Set string"** instead — clicking it materialises the default control. That placeholder looks broken next to rows that show their proper widget, so don't ship a docs page with mixed states.

**Rule:** every prop that has an `argTypes` entry with a defined `control` must also have a value in the meta-level `args` so its control renders in toggle/slider/picker form on first paint.

```ts
const meta: Meta<typeof Button> = {
  component: Button,
  args: {
    // Defaults that drive the controls — chosen to match the component's
    // own runtime defaults so the docs page paints in the most common
    // resting state.
    variant: "secondary",
    shape: "pill",
    fullWidth: false,
    disabled: false,
    lift: false,        // ← include even if the prop's runtime default
                        //   is `undefined` (and resolves dynamically),
                        //   otherwise the row reads "Set boolean".
  },
  argTypes: { /* ... */ },
};
```

Edge cases:
- **Dynamic / variant-dependent defaults** (e.g. `lift` defaults to `true` for `variant="primary"`, `false` otherwise): pick the most-common resting value and put it in `args` anyway. Setting it explicitly suppresses the component's auto-detect, but the alternative (a "Set boolean" row sitting next to working toggles) is worse for the docs reader. Note the tradeoff in a prose comment if the suppressed behaviour is load-bearing.
- **Props you genuinely want hidden** (deprecated, internal): don't put them in `args` and don't show them in the controls table at all — add `table: { disable: true }` to the argType.
- **Object / array props** with no sensible default literal: prefer `control: false` so the row is read-only ("Edit object" doesn't make sense for ref-shaped props anyway).

## argTypes — when to add explicit entries

Storybook auto-infers controls from TypeScript prop types. Add an **explicit `argTypes` entry** when:

1. **The control type is wrong by default** — e.g. a union should be `radio` or `select`, not the default text input:
   ```ts
   variant: {
     control: "radio",
     options: ["default", "special"],
     description: "Visual style.",
   },
   ```
2. **You want a description in the docs** — autodocs surfaces it.
3. **You need to disable a control** — e.g. `ref`:
   ```ts
   ref: {
     description: "Ref to the DOM element",
     control: false,
     table: { type: { summary: "React.RefObject<HTMLElement>" } },
   },
   ```
4. **A prop should be hidden** — `table: { disable: true }`.

Don't add an `argTypes` entry just to restate the type — Storybook already has it.

## Dogfood: filler content should use library components, not hand-rolled divs

When a story for a **layout** component needs filler children (cells in a Grid, items in an HStack, panes in a Split, content in a Card), reach for an existing `@squonk/ui` component — usually `<Card>`, sometimes `<Text>`, `<Heading>`, `<Badge>`, or another primitive — instead of a `<div style={{ background: "#e9ecef", border: "1px solid #dee2e6", padding: 16 }}>`.

Two reasons:

1. **Dark mode comes free.** A `<Card>` reads `theme.colors.background.*` and `theme.colors.border.*`, so it swaps with the global mode toggle. A hardcoded `#e9ecef` div looks broken in dark mode.
2. **It mirrors how a consumer will actually compose.** A real app will fill a Grid with Cards, not anonymous divs. The story should look like the code a downstream user will write — that's the whole point of having a component library.

The canonical bad pattern (do NOT do this):

```tsx
const cells = (count = 6) =>
  Array.from({ length: count }).map((_, i) => (
    <div key={i} style={{ background: "#e9ecef", border: "1px solid #dee2e6", borderRadius: 4, padding: 16, textAlign: "center" }}>
      Cell {i + 1}
    </div>
  ));
```

The dogfood replacement:

```tsx
const cells = (count = 6) =>
  Array.from({ length: count }).map((_, i) => (
    <Card key={i}>Cell {i + 1}</Card>
  ));
```

For wrapper decorators that need to *frame* the story to make the layout visible (e.g. a dashed box around a Centered demo), don't reach for `border: "1px dashed #adb5bd"`. Either:
- Use a themed wrapper whose inline style reads the token, e.g. `style={{ border: "1px dashed var(--squonk-colors-border-default)" }}`, or
- Drop the wrapper altogether — the `ResizableCanvas` already provides the frame in the docs view.

When you genuinely need a non-card filler (e.g. demonstrating Inline within prose), use `<Text>` for prose and `<Kbd>` for inline accents — both swap with mode and match the library's typography.

**Exception:** when the story exists specifically to demonstrate the component's behavior with unstyled children (e.g. a Grid story called "Raw children"), a div is fine — but use theme tokens, not literals.

## Shared content for repeating args

If multiple stories use the same `children` value, extract it to a const:

```ts
const sampleContent = "A simple Card. Use the variant control to switch styles.";

export const Outlined: Story = { args: { variant: "outlined", children: sampleContent } };
export const Elevated: Story = { args: { variant: "elevated", children: sampleContent } };
```

This is the Card pattern. Don't introduce factories or render functions just to avoid repetition across 3 stories — flat data is more readable.

## What NOT to do

- **Don't use `render` functions** unless you genuinely need to compose the component with siblings (e.g. a Form with multiple inputs). Plain `args` is the default — Storybook will render the component for you.
- **Don't import from `@storybook/test`** unless you're writing a `play` function. The default stories in this repo don't use them.
- **Don't write `parameters: { docs: { ... } }`** boilerplate — `autodocs` handles that.
- **Don't add a `<title>`-clobbering Meta** — `title: "MyComponent"` (no path) lands in the root and breaks the sidebar.
- **Don't use literals in `args` that should reference theme tokens** — `args` is allowed to be literal-y (color="#ff0000" for a demo control is fine), but don't sneak in defaults that contradict the theme.

## After writing

1. **Run Storybook** locally: `npm run dev` and visit `http://localhost:6006`. Confirm the stories appear under the correct sidebar group and each renders without console errors.
2. **Check the MDX doc** (`{kebab}.mdx`) was filled out by the generator; if it points to stories that don't exist yet, update it.
3. **No commit needed by itself** — story-only changes ride along with the `feat(<component>): add <ComponentName>` commit. If you're updating stories on an existing component, that's `docs(<scope>): ...` (no release impact).

## Handoff

Stories live alongside the source. After writing the stories, continue with `write-mdx-docs` (pipeline step 7a) — the stories supply the variant args that the MDX page documents. Then `test-strategy` → `visual-regression` → `commit-and-release`.
