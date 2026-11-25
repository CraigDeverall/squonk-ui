---
name: write-mdx-docs
description: Fill out a comprehensive user-facing @squonk/ui component .mdx documentation page — real examples with mock data, all variants and states demonstrated, composition with other components when it makes sense, accessibility notes, and common pitfalls. Replaces the thin generator-stub MDX (which is usually a paragraph and a Canvas) with documentation a downstream consumer can actually learn from. Use after scaffold-component (when the .mdx is still a stub), or when reviewing an existing component whose .mdx is sparse.
---

# Write MDX Docs

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonk/ui` library only. The Yeoman generator produces a four-file unit including an `.mdx` doc page that's typically a heading + `<Canvas />` + a sentence. That's not user-facing documentation; it's a placeholder. This skill describes what *good* MDX content looks like for this library.

The audience is **downstream consumers** — engineers in other apps who land on a Storybook page and need to:
1. Understand what the component does and when to use it.
2. See it in action with realistic content.
3. Know which props matter and what the variants look like.
4. See it composed with related components (so they don't reinvent compositions).
5. Avoid the common pitfalls.

## The canonical MDX structure

Follow the pattern from `button.mdx` and improve where it falls thin. Sections in order:

```mdx
import { ArgTypes, Controls, Meta, Story } from "@storybook/blocks";
import { HideSbBar } from "../../../documentation-imports/index.ts";
import { InlineCodeExample } from "../../../utils/blocks.tsx";
import { ResizableCanvas } from "../../../utils/resizable-canvas.tsx";
import * as ComponentStories from "./component-name.stories.tsx";
import meta from "./component-name.stories.tsx";
import { ComponentName } from "./component-name.tsx";
// + imports of any companion components shown in composition examples

<Meta of={meta} />

<HideSbBar />

# ComponentName

<ResizableCanvas of={ComponentStories.Primary} defaultRecipe="block" />

[1-2 paragraph intro: what it is, what role it plays, when to reach for it.]

<Controls />

## [Section: each variant or state, with a live example]

[Prose explaining when to use this variant.]

<InlineCodeExample>
  <ComponentName variant="..." prop="...">Realistic example content</ComponentName>
</InlineCodeExample>

## [Section: compositions — only when meaningful]

[Prose explaining the composition.]

<InlineCodeExample>
  <Card>
    <ComponentName />
    <SomeOtherComponent />
  </Card>
</InlineCodeExample>

## Accessibility

[Component-specific a11y notes — what props are required for a11y, what keyboard interactions, etc.]

## Common pitfalls

[Bullet list of "don't do this" with corrections.]
```

## Section-by-section guidance

### Frontmatter imports

- `@storybook/blocks` — always imports `Meta`, `Canvas`, `Controls` (and optionally `ArgTypes`, `Story`).
- `documentation-imports/index.ts` — `HideSbBar` is required (hides the Storybook toolbar in the docs view). Other helpers (`ThemeViewer`, `IFrame`, `HomePageIntroBlock`, `NotStyleDoc`, `WhiteBox`) are situational.
- `utils/blocks.tsx` — `InlineCodeExample` is the standard wrapper for live examples; it wraps children in `ThemeProvider` so theme tokens resolve.

### `<Meta of={meta} />`

Always points to the local `.stories.tsx` meta default export. This binds the docs page to the stories so `<Canvas />` and `<Controls />` know what to render.

### Title (`# ComponentName`)

Just the PascalCase component name. No subtitle, no badge.

### `<ResizableCanvas>`

Replaces Storybook's `<Canvas />` with a resizable preview area that lets the docs reader stress-test the component inside different *parent patterns*. Import from `../../../utils/resizable-canvas.tsx` and pass:

- `of` — required. The story to render (e.g. `ComponentStories.Primary`).
- `defaultRecipe` — optional. Which parent pattern to start in (default `"block"`). The reader's pick is persisted to `sessionStorage` per docs page.
- `defaultHeight` — optional. Starting Frame height in px. Defaults to auto (content height). Use this for stories where the auto height looks visually thin — typically pair with `defaultRecipe="centered"` to give the component breathing room.
- `defaultWidth` — optional. Starting Frame width in px. Defaults to wrapper width minus gutters.

The preview area is user-resizable from every edge and corner. A row of recipe buttons above it lets the reader snap the Stage's `display / overflow / justify-content / align-items / text-align / vertical-align` to one of nine pre-baked configurations. Below the preview, "Show Code" reveals the source.

#### Choosing a `defaultRecipe`

Pick the recipe that matches the *most natural parent* this component lives in. The audience will start there; they can switch to others to explore behavior.

| Recipe | Use as default when the component is normally rendered in… | Example components |
|---|---|---|
| `block` | A document/section in normal flow | `Card`, `Section`, `Page` |
| `stack-down` | A vertical Stack with siblings | `TextField`, `Checkbox`, `Radio` |
| `stack-right` | A horizontal Stack (no wrap) — toolbar/header | `Button` in a toolbar, `Header` items |
| `cluster` | A wrapping row of small items | `Badge`, `Avatar` (in a list of avatars) |
| `centered` | A centered slot (e.g. EmptyState) | `Spinner`, `EmptyState`, hero `Button` |
| `inline` | Inside a paragraph of text | `Link`, inline `Badge`, inline `Code` |
| `scroll-box` | A fixed-size scrollable container | Lists, scrollable bodies |
| `squeezed` (stress) | Never the default — opt-in stress test | — |
| `zero` (stress) | Never the default — opt-in stress test | — |

If the component lives equally in multiple parents, default to `block`.

#### Don't add per-variant `<ResizableCanvas>` blocks

Use `<ResizableCanvas>` once at the top of the file (replacing `<Canvas />`). Per-variant examples continue to use `<InlineCodeExample>` blocks — those are static and intentional. The recipe-switching UI is for the *primary* preview, not for every variant section.

#### The "raw CSS" escape hatch

The recipe bar includes a `⚙ raw` button that swaps the recipe picker for individual CSS-property dropdowns (display, position, overflow, justify-content, align-items, text-align, vertical-align). This is for advanced users who need a configuration the recipes don't cover. Don't reference it in component prose — it's a power-user escape hatch.

### Intro paragraph(s)

This is where most MDX docs in the repo currently fall short. The intro should answer:
- **What is this component?** (One sentence.)
- **What role does it play?** (When in a UI would you use it?)
- **What does it not do?** (Bound the scope — saves the reader from misusing.)

Bad (current state of card.mdx): *"Ah, the humble Card. This is a great component. Please enjoy using it."*

Better: *"Card is a block container for grouping related content with a consistent visual treatment. Use it to set off a self-contained unit — a profile summary, a settings panel, an article preview — from the surrounding layout. Card owns its padding and visual identity but does not manage spacing between itself and siblings; for that, use a layout primitive or set spacing on the parent."*

### `<Controls />`

Auto-generated table from the stories' `argTypes`. No prose needed; it lives below the intro.

### Per-variant / per-state sections

For each notable variant or state, a `## SubSection` with:
1. A prose paragraph: "Use this when…".
2. An `<InlineCodeExample>` block with the component rendered at that variant.

Realistic content matters. `<Button>Click Me</Button>` is fine for the first example; `<Button>Click Me</Button>` for every variant is filler. Use:
- Buttons → "Save changes", "Delete account", "Continue to checkout"
- Cards → snippet of a real-looking user profile or article
- UserBadge → realistic name + role pair
- TextField → realistic label + placeholder ("Email address", "you@example.com")

### Composition examples (when it makes sense)

If the component is commonly composed with others (Card-containing-UserBadge-and-Button is a real pattern), show that. Show what's *intended* and *works well*. Show one or two compositions, not every possibility.

Skip composition examples when the component is genuinely standalone (Divider, Page).

### Accessibility section

Per-component a11y notes the user needs to know:
- Required props for a11y (`aria-label` on icon-only buttons, `alt` on images).
- Keyboard interactions supported (or expected — e.g. for a Modal: "Esc closes; focus returns to opener").
- Color/contrast considerations specific to the component.

Don't repeat the generic library-level a11y rules — link to (or reference) `accessibility-conventions` for those.

### Common pitfalls section

Bullets of "the things consumers do wrong with this component," and the correction. Each pitfall should be something seen in the wild, not a hypothetical. For Button, examples:

- **Pitfall: using `<Button>` as a link.** If clicking navigates, use `as="a" href="..."` (polymorphic) or just an `<a>`. Buttons activate; links navigate.
- **Pitfall: relying on color to indicate destructive intent.** Pair the danger color with an icon or explicit "Delete".
- **Pitfall: nesting interactive content.** Don't put a `<Button>` inside a `<Card>` that is itself clickable — screen readers and keyboard users get confused.

## Mock data conventions

When showing realistic content, use stable mock data, not random strings:

```mdx
<InlineCodeExample>
  <Card>
    <UserBadge name="Avery Chen" role="Maintainer" />
    <p>Updated the authentication flow to use OAuth.</p>
    <Button>View changes</Button>
  </Card>
</InlineCodeExample>
```

For datasets (lists, table rows), keep them tiny — 2-4 rows is enough. Real-looking but obviously synthetic (avoid using names of real public figures or current events). Acceptable patterns:
- Names: alternating between common first names + simple surnames ("Avery Chen", "Marcus Olu", "Priya Singh").
- Emails: `name@example.com`.
- Dates: relative ("3 days ago") or recent (`2026-04-12`).
- Prices: round numbers ($24.00).

If a component genuinely needs domain-specific mock data (e.g. a `<MoleculeViewer>`), use it but include a comment explaining where it came from.

## When to show compositions

Show a composition when:
- **The component is rarely used alone** (a `Card` almost always wraps something).
- **The composition is non-obvious** (e.g. a `Tooltip` next to a `TextField` for inline help).
- **The composition demonstrates a recurring pattern** in real apps (e.g. avatar + name + role together).

Don't show a composition just to fill space. If `Divider` only does one thing, the docs can be short.

## Anti-patterns

| Anti-pattern | Problem |
|---|---|
| Filler intro ("This is a great component. Use it!") | Wastes the reader's most attentive scroll |
| Repeating the props table in prose | The `<Controls />` block already shows it |
| Code blocks without `<InlineCodeExample>` | Looks like a code snippet, doesn't render; consumers can't see what it looks like |
| Showing every prop combination | Pick the meaningful variants; the controls let users explore the rest |
| Inventing edge cases just for the docs (`<Button disabled loading variant="destructive">`) | If a real consumer wouldn't use it, don't document it |
| Component-specific a11y notes that contradict `accessibility-conventions` | Reference the global rule; don't restate |
| Hardcoded styles or color in examples (`<Button style={{ background: '#f00' }}>`) | Sets a bad example for theme adherence |

## Process

1. **Look at the stories file** — it already has variants; reuse their args in the MDX examples.
2. **Check the snapshot PNGs via `inspect-snapshots`** — make sure the examples you describe match what's actually rendered.
3. **Draft each section in this order**: imports → Meta + Canvas → intro → Controls → variants → compositions → a11y → pitfalls.
4. **Read the MDX in Storybook** via `prototype-live` Path A — `npm run dev`, navigate to the docs page, screenshot, verify it renders.
5. **Compare to button.mdx as the floor** and aim for noticeably more depth (the current button.mdx is shorter than this skill recommends — the goal is to exceed it, not match it).

## What this skill does NOT do

- **Doesn't write the stories file.** That's `write-stories`. Stories provide the live examples; MDX documents them.
- **Doesn't write the README or top-level library docs.** Those live in the repo root.
- **Doesn't write API reference text.** The `<Controls />` block + JSDoc-style comments on the props provide that automatically.

## Cross-references

- `write-stories` — produces the meta + variant args that the MDX page uses.
- `accessibility-conventions` — reference for the a11y section.
- `prototype-live` Path A — verify the rendered MDX page.
- `containment-behavior` / `responsive-conventions` — when composition examples show how the component fits in different layouts.

## Handoff

Runs as pipeline step 7a (after `write-stories`). After the MDX is filled out, continue with `test-strategy` (step 8) → `visual-regression` (step 8a) → `commit-and-release` (step 9).
