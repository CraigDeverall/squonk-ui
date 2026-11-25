---
name: use-squonk-ui
description: Build application UI with the @squonk/ui React component library (SquonkUI). Use when a project depends on @squonk/ui and you are adding or changing screens, forms, layouts, theming or dark mode. Covers setup, finding components, composition rules, theme scoping, accessibility and what the library does not provide.
---

# Use @squonk/ui

This skill ships inside the `@squonk/ui` package, so it describes the version
installed in this project. Read the installed copy, not a copy from elsewhere:

```sh
node -p "require.resolve('@squonk/ui/skill')"
```

The component catalog for the same version is `@squonk/ui/catalog.json`
(`node -p "require.resolve('@squonk/ui/catalog.json')"`). Use it to find
components; this skill explains how to use them well.

## Set up once

`npx @squonk/ui` does all of this interactively: install, the
`squonk-ui` MCP server for each coding agent (it asks first; `--no-mcp` skips
it), and these instructions in `AGENTS.md`. Run it in the app's folder; running
it again changes nothing. `--yes` accepts every default without asking.

The packages are public on the npm registry and need no sign-in. If installs
fail with `401`, `403` or `404`, look for an old `@squonk:registry` line in the
app's `.npmrc` or `~/.npmrc` that sends npm to another registry, and remove it.

If the agent reports the `squonk-ui` server as "Connection closed" at the
start of a session, its command couldn't run on the machine the agent runs
on. Run `npx @squonk/ui-mcp check` in the app's folder: it starts each
configured server the way the agent does and says why one fails. The usual
case is a Windows agent (such as the Claude desktop app's Code tab opening a
`\\wsl.localhost\…` folder) with the checkout in WSL: Windows runs `npx`
and has no Node. Run `npx @squonk/ui-mcp init --windows-client` inside WSL.
It adds a launcher to the folder's local scope in the Windows user's
`.claude.json` that starts the server inside WSL, and doesn't change `.mcp.json`.

Peers are React and React DOM 19.2+. At the app root,
load the font and component styles and mount one provider:

```tsx
import "@squonk/ui/fonts.css";
import "@squonk/ui/styles.css";
import { SquonkThemeProvider } from "@squonk/ui/theme-provider";

export function Root({ children }: { children: React.ReactNode }) {
  return (
    <SquonkThemeProvider mode="light" withGlobalStyles>
      {children}
    </SquonkThemeProvider>
  );
}
```

- `fonts.css` self-hosts Inter (text) and Space Grotesk (headings). Without
  it, text falls back to Helvetica Neue or Arial.
- `styles.css` holds the styles of components built with CSS Modules and
  declares every `--squonk-*` theme variable. Without it, those components render
  unstyled.
- `mode="dark"` gives a dark app. `primitives` customises the base theme (spacing,
  font size, colours); prefer it over overriding individual components.
- Surfaces are flat by default. For subtly raised controls and recessed fields,
  set the `reliefDepth` and `reliefSheen` primitives (0–1; keep them low) and
  optionally `reliefProfile` (`soft`, `bevel`, `glass`, `pillow`, `print`).
  `lightAngle` (degrees from above) turns the relief and every computed shadow
  together. Don't hand-write gradients on library components; re-point a
  posture's `roles.relief.*` purpose instead.
- Server rendering needs no style collection: the styles are static CSS.
  Interactive components keep their `"use client"` boundaries.

## Find the right component

If the `squonk-ui` MCP server is connected, use its `find_components` and
`get_component` tools; they read this same catalog. Otherwise, before writing
any UI, look it up in the catalog. Each entry has the import path,
exported names and types, its purpose, the UX patterns it belongs to, and
guidance sections such as accessibility and common pitfalls:

```sh
node -e "const c=require(require.resolve('@squonk/ui/catalog.json')); for (const x of c.components) console.log(x.importPath, '-', x.purpose.slice(0, 90))"
```

## Follow the design guides

The design system's rules ship with the package as guides: Foundations
(colour, type, space, shape, motion, icons, accessibility, theme, purpose
tokens), Patterns (navigation, overlays, menus, destructive actions, empty and
error states, tables, data visualization, labels such as Badge or Tag) and Forms. Read the one that
applies before designing a screen, a form, or anything with status, labels or
overlays, and follow it.

With the MCP server, use `find_guidance` (e.g. "badge or tag", "confirm
delete", "form errors") and `get_guide`; they are also resources at
`squonk-ui://guides/{id}`.

- Not sure which component fits a job (show a status, modal or drawer, list,
  table or cards, lay out a page)? Read `patterns-choosing-components` first:
  it maps each job to components, with when to use and when not to.
- For the shape of a screen (app shell, reading page, landing page, resizable
  workspace, phone to desktop) read `patterns-page-layouts-and-app-shells`.

Without the MCP server, read them from the package:

```sh
node -e "const {guides}=require(require.resolve('@squonk/ui/guides.json')); for (const g of guides) console.log(g.id, '-', g.summary.slice(0, 90))"
node -e "const {guides}=require(require.resolve('@squonk/ui/guides.json')); console.log(guides.find(g => g.id === process.argv[1]).text)" patterns-labels-badge-or-tag
```

- Import each component from its own entry point, such as `@squonk/ui/button`.
  The root `@squonk/ui` barrel works but pulls in more.
- Never import from `dist/` paths or `@squonk/ui/docs`. The docs entry is for
  Storybook and breaks in application runtime and server rendering.
- Provided for these jobs: `Tabs` (parallel panels; `stickyTop` keeps the tab
  list in view over long panels), `Accordion` (sections that
  open and close; `hover="fill"` when they read as rows of a list), `Tooltip` (a hover/focus hint), `Popover` (an anchored panel
  with links or a small form), `Modal` and `Drawer` (blocking tasks), `Select`
  (one choice; `searchable` for long lists), `MultiSelect` from the same
  import (several choices from a long or server-searched list, such as people
  to invite, with an array `value` shown as removable tags), `CheckboxGroup` and `RadioGroup`,
  `Fieldset`, `Textarea`, `Tag` (removable labels), `IconButton` (icon-only
  actions, named by `label`), `Breadcrumb`, `Pagination` and `NavList` (an
  app's or section's page navigation: `label`, `items` with `id`, `label`,
  `href` and optional `icon`/`end`, and `current`; the theme decides how the
  current page is marked, so don't restyle it. An item with `disabled` is a
  page that can't be opened yet: it shows dimmed and isn't a link, and
  `title` says why, such as "Coming later").
- Money: `CurrencyField` (`@squonk/ui/currency-field`) to enter an amount and
  `Currency` (`@squonk/ui/currency`) to show one. Both take `currency` (ISO
  4217, default `"NZD"`) and `locale`; set `locale` in a single-country app.
  `CurrencyField`'s value is a number in dollars or `null` when empty, rounded
  to the currency's decimal places, and `onChange` fires on blur, not per
  keystroke. Use `formatCurrency` from `@squonk/ui/currency` for amounts in
  strings. Never format money with `toFixed` or add amounts as floats: add
  integer cents (`toMinorUnits`) and show them with `<Currency minorUnits>`.
- Build forms with `@squonk/ui/form`: `useAppForm` (TanStack Form) with a
  Standard Schema validator such as Zod, `form.AppField` with the bound
  `field.TextField`, `field.CurrencyField`, `field.Select` and so on, `form.ErrorSummary` and
  `form.SubmitButton`. Don't wire `value`/`onChange`/`error` by hand or add
  another form library.
- Charts and figures (read the Data visualization pattern guide first,
  `patterns-data-visualization`): `LineChart` (change over time),
  `AreaChart` (volume over time; `stacked` for parts of a total), `BarChart`
  (compare categories; `orientation="horizontal"` for ranked lists or long
  names), `DonutChart` (two to five parts of a whole), `ScatterChart` (two
  measures, one dot per item), `Sparkline` (a word-sized trend), `Stat` (a
  headline figure with its change and trend; put it in a `Card`) and `Meter`
  (an amount in a known range). Charts take `data` rows, an `xKey`, and
  `series` of `{ key, label }`; give every chart a `title` (use `hideTitle`
  when a card heading already says it) and format values with `formatValue`.
  Colours come from a fixed eight-slot palette in series order; pass `slot` to
  keep a series' colour when others are filtered out. Never draw two value
  axes, colour text with a series colour, or pass colours to a chart. Every
  chart has a table view and a keyboard-readable tooltip built in. Don't add
  another chart library.
- Relationships between things (who owns what, what depends on what, what
  refers to what): `NetworkGraph` from `@squonk/ui/network-graph`, a
  force-directed node-link graph with pan, zoom and single selection. Use it
  when the links are the point and things link many-to-many, for up to about
  150 things; to look an item up, compare or sort, use a `Table`, and for a
  strict parent-child structure a nested list. Pass `nodes`
  (`{ id, label, kind }`), `links` (`{ source, target, label?, kind? }`), a
  `label` that says what the graph shows, and `nodeKinds` / `linkKinds`
  describing each kind (`{ label, shape?, tone?, slot? }`; give each node kind
  its own `shape`). Kinds take data series colours in order; set `tone` only
  when the kind is a status, and never pass a colour. `variant: "dashed"`
  de-emphasises a node or link; say why in the node's `description`. It fills
  its container, so give the parent a width and a height. Hold `selectedId`
  and `onSelectionChange` to show the selected node's details beside it. Add
  `NetworkGraphLegend` with the same kinds, and share one `hiddenKinds` state
  (`{ nodes: [], links: [] }`) through `onHiddenKindsChange` to let people
  hide a kind. Keep node ids stable: when data updates, nodes that stay keep
  their place and only new ones are placed. When a search or filter narrows
  the graph, pass `autoFit`, `settleOnChange` and `maxFitZoom` (about 1.75)
  so what is left draws together and fills the view. `allowFullscreen` adds a Full screen button. Pass the page's
  search and filters as `fullscreenToolbar` and the selected node's details
  as `fullscreenAside` so they stay usable in full screen. A node or kind can
  carry an `icon` (a library icon), a node an `image` URL and a `size`
  (0.5–3) for a measure; `renderNode` draws a node's inside as SVG for
  anything else. A link or link kind takes `thickness` (px) for a measure and
  `animation` (`flow`, `particles`, `pulse`) with `animationDuration` to show
  that something moves along it; motion stops under reduced motion, so say it
  in the label too. `hoverHighlight` (`neighbours`, `outgoing`, `incoming`,
  `downstream`, `upstream` or a function returning node ids) lights a
  structure around the node pointed at. `layout="force"` makes the layout live:
  dragging a node pulls its neighbours, and double-click or P pins a node
  (`pinnedIds` / `onPinnedChange` to hold pins). Don't add another graph
  library.
- Not provided: DatePicker, NumberInput, Slider, FileUpload and tree views.
  Compose an alternative from existing components or tell the user it is
  missing. Do not invent an import.
- Icons come from `@squonk/ui/icon` as semantic names (`AddIcon`, `CloseIcon`,
  `SearchIcon`...). The set (about 230) covers actions and editing (`UndoIcon`,
  `AttachIcon`, `ExportIcon`), text formatting (`BoldIcon`, `BulletListIcon`),
  layout (`SidebarOpenIcon`, `GridViewIcon`, `ExpandAllIcon`, `FirstPageIcon`),
  status (`CriticalIcon`, `BlockedIcon`, `PendingIcon`, `VerifiedIcon`),
  communication (`ChatIcon`, `SendIcon`, `MentionIcon`), people and access
  (`AddUserIcon`, `KeyIcon`, `LogInIcon`, `UnlockIcon`), money (`WalletIcon`,
  `InvoiceIcon`, `BankIcon`, `CartIcon`, `DiscountIcon`), time (`HistoryIcon`,
  `DateRangeIcon`, `ReminderIcon`), files and data (`FolderOpenIcon`,
  `DatabaseIcon`, `CloudUploadIcon`, `SpreadsheetIcon`), media and devices
  (`PlayIcon`, `MobileIcon`, `QrCodeIcon`) and more (`AiIcon`, `LikeIcon`,
  `IdeaIcon`); check the gallery before assuming one is missing. Do not import
  `react-icons` or another icon package in the app; if a needed icon is
  missing, ask for it to be added to the curated set.
  Icons are decorative by default; pass `label` only for a standalone icon that
  carries meaning, and name icon-only buttons on the button itself.
- Spot illustrations come from `@squonk/ui/illustration`, also as semantic
  names, grouped by moment: empty (`InboxIllustration`, `SearchIllustration`,
  `FilterIllustration`, `MessagesIllustration`, `ArchiveIllustration`),
  success (`SuccessIllustration`, `EmailSentIllustration`,
  `AchievementIllustration`), errors and blockers (`WarningIllustration`,
  `OfflineIllustration`, `ServerErrorIllustration`, `MaintenanceIllustration`,
  `NotFoundIllustration`, `AccessDeniedIllustration`,
  `SessionExpiredIllustration`, `LockIllustration`), money
  (`PaymentIllustration`, `CartIllustration`, `ReceiptIllustration`,
  `BankIllustration`, `TransferIllustration`, `SavingsIllustration`,
  `RefundIllustration`, `CalculatorIllustration`), people
  (`InviteIllustration`, `IdentityIllustration`, `FeedbackIllustration`,
  `SupportIllustration`, `NotificationIllustration`), files and data
  (`DocumentIllustration`, `SignatureIllustration`, `UploadIllustration`,
  `DownloadIllustration`, `CloudSyncIllustration`, `DataImportIllustration`,
  `ChartIllustration`), time and place (`CalendarIllustration`,
  `ScheduleIllustration`, `LocationIllustration`) and onboarding
  (`WelcomeIllustration`, `ChecklistIllustration`, `MobileIllustration`,
  `SettingsIllustration` and more). Use one in an `EmptyState`, a confirmation or a feature list, sized
  with `size` (`sm`, `md`, `lg`, `xl`); never inside controls (use icons) and
  never as the only place a status is said. They take their colours from the
  theme (`components.illustration.*`), so don't recolour them with CSS or draw
  your own SVGs for these moments. Decorative by default; `label` only when the
  picture carries meaning the text beside it doesn't.

## Compose; don't restyle

The library has four kinds of component, and they divide the work:

| Kind | Examples | Takes |
| --- | --- | --- |
| Layout primitives | `HStack`, `VStack`, `Grid`, `Block`, `Container`, `Spacer`, `Divider` | Layout props: `gap`, `justify`, `align`, `padding`, `columns`, `width` |
| Layouts | `Card`, `Split`, `Cluster`, `Section`, `SectionHeading`, `Page`, `Header`, `Sidebar`, `Footer`, `EmptyState`, `ResizablePanels` | Intent props such as `variant` and `tone` |
| Functional primitives | `Text`, `Heading`, `Code`, `Kbd`, `Currency` | Meaning: `tone`, `weight`, `level` |
| Functional | `Button`, `Link`, `TextField`, `CurrencyField`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Alert`, `Modal`, `Table`, `Toast`, `Badge`, `LineChart`, `BarChart`, `Stat` | Variants and state |

Rules that keep screens consistent:

- Arrange with layout primitives and put spacing on the parent (`gap`), never as
  margins on children. Components have no outer margin by design.
- Spacing tokens are `none`, `xxs`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl`. Do not
  use pixel values for layout.
- Reach for a named layout when the shape has a name: a title with a trailing
  action is `Split`; a wrapping row of tags is `Cluster`; "nothing here yet" is
  `EmptyState`.
- Regions the user resizes (a sidebar they widen, an editor over a terminal)
  are `ResizablePanels` with `ResizablePanel`s and a `ResizableHandle` between
  each pair. Sizes are percentages, or pixels as `"240px"`
  (`minSize="200px" maxSize={40}`); `collapsible` panels snap to a rail. Name
  each handle (`label="Resize sidebar"`), give the group's container a height,
  and save the layout yourself with `onLayout` and `defaultLayout`. Theme the
  handle with the `components.resizable.*` tokens.
- Do not wrap library components in your own styled versions to change colours,
  sizes or spacing. Use the props, the register, or a theme scope (below).
- A theme's own colours are tones. Add them once on `SquonkThemeProvider`
  (`addedColorPrimitives={{ violet: { light: "#7c3aed", dark: "#a78bfa" } }}`)
  and pass the key as `tone` on `Badge`, `Tag`, `Alert`, `Text` or
  `ProgressBar` (`<Badge tone="violet">`). Use them to tell categories apart;
  status stays on the built-in tones, and a built-in name always means the
  built-in tone. Don't colour these components with your own CSS.
- `Badge variant="dot"` is a dot and bold text with no pill: a quiet status in
  a dense list, table row or card, where a pill on every row is too heavy.
  Keep `subtle` or `solid` for the status a page is about.
- `Alert variant="tinted"` is the tone's wash with no accent edge or border,
  for a notice inside a card or beside other bordered panels. The default
  (`accent`) suits a notice at the top of a page or form.
- A toast can carry one `action` (`toast.show({ message, action: { label:
  "Undo", onAction } })`); it runs `onAction` and dismisses the toast. A toast
  can be missed, so the same action must also exist on the page.
- A small capitals label above a heading is `<Text variant="eyebrow">`, with
  `tone` for its colour. Don't build one from `Text` and your own CSS. In a
  pill it is `Badge caps`; a section's intro block is `SectionHeading`.
- If you write your own CSS, read theme values as `var(--squonk-*)` variables
  (`var(--squonk-colors-text-primary)`, `var(--squonk-spacing-md)`; all are declared by
  `styles.css`), or use `useSquonkTheme()` in TypeScript, rather than hard-coding
  them, so dark mode and theme changes keep working. The root
  `SquonkThemeProvider` writes its theme onto `:root`; values changed by a nested
  `ThemeModifier` or `ThemeStyleBlock` reach only library components.
- For your own panel of rows (a custom menu or picker), give the panel
  `var(--squonk-roles-radius-list)` and each row
  `var(--squonk-roles-radius-list-item)`, with the list's inset, row padding
  and `line-height: var(--squonk-roles-type-tight-line-height)`. The pair is
  worked out so the first and last rows follow the panel's curve in any theme;
  don't put `--squonk-roles-radius-surface` on a panel of rows.
- Library components already move. Don't write `transition`, `animation` or
  `@keyframes` for them. For your own element that moves, wrap it
  in a `Motion` component from `@squonk/ui/motion` (`Motion.Feedback` for
  hover and press, `Motion.Pop` for a menu or popover, `Motion.Dim` and
  `Motion.Slide` for a backdrop and side panel, `Motion.Collapse` for a
  disclosure panel, `Motion.Shift` for a small change, `Motion.Spin` and
  friends for loops, `Motion.Reveal` for a section arriving on scroll,
  `Motion.Presence show={…}` for an element that joins and leaves (keep it
  mounted and turn `show` off so it can play its exit), `Motion.Swap
  watch={…}` for content replaced in place, `Motion.Highlight watch={…}` for
  a value someone else changed (`playOnMount` for something that has just
  arrived), `Motion.Layout` around a list whose items reorder, and
  `Motion.Count value={…}` for a figure that changes). An `InfiniteList`
  that gains items while people read, such as live updates, takes
  `animateArrivals` instead of wrapping its items yourself. Wrap
  several arrivals in `Motion.Stagger` to play them in sequence. Each wraps
  exactly one element and adds no markup (Count renders the figure), they
  nest, and every one follows the theme's motion and the motion level.
- Motion has two dials. The theme sets how it feels with primitives
  (`transitionDurationMs`, `motionTravelPx`, `motionStaggerMs`,
  `motionBounce`, `motionEaseEnter`/`Exit`/`Standard`) and the
  `roles.motion.*` purposes. The app sets how much there is with
  `<SquonkThemeProvider motion="system" | "reduced" | "none">`: `system` follows
  the device's reduced-motion setting, `reduced` suits an in-app "Reduce
  motion" setting, `none` is for screenshots and tests.

```tsx
import { Button } from "@squonk/ui/button";
import { Card } from "@squonk/ui/card";
import { Heading } from "@squonk/ui/heading";
import { HStack } from "@squonk/ui/hstack";
import { Text } from "@squonk/ui/text";
import { TextField } from "@squonk/ui/text-field";
import { VStack } from "@squonk/ui/vstack";

export function ContactDetails() {
  return (
    <Card variant="outlined">
      <VStack gap="md">
        <Heading level={2}>Contact details</Heading>
        <Text tone="secondary">We use these to send correspondence.</Text>
        <TextField label="Email" type="email" fullWidth required />
        <HStack justify="end" gap="sm">
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary" type="submit">Save</Button>
        </HStack>
      </VStack>
    </Card>
  );
}
```

## Size and theme by area

Change how a whole region looks with a scope component instead of per-component
props:

- `Presentation` (`@squonk/ui/presentation`) sets the visual register for
  everything inside: `compact`, `default`, `large` or `hero`. Use `compact` for
  dense panels, tables and sidebars, and `hero` for landing sections.
- `ThemeStyleBlock` (`@squonk/ui/theme-style-block`) rebuilds the theme for a
  subtree: `register="compact"` or `"display"` rescales it, and `invertMode`
  flips light and dark (for example, a dark band on a light page).
- `ThemeModifier` (`@squonk/ui/theme-modifier`) overrides part of the theme,
  such as `override={{ colors: { primary: "#..." } }}` for a co-branded panel.

A theme's own primitives also carry a `neutralTint` (0–1: the greys lean
towards the primary's hue, keeping their lightness), a `softToneStrength`
(0–1, default 0: above 0, a tone's soft fills become a quiet tint of the tone
over the surface colour, in both modes), a `lightTextBalance`
(0–100, default 50: higher turns text on coloured fills light sooner and
deepens the fill more), a `textOnFillStrength` (0–100, default 50: pure
white or black text on fills at 100, a quiet tint of the fill at 0; every
pairing still meets AA) and yes-or-no switches:
`deriveFromPrimary` (link, focus ring and accent computed from the primary,
kept readable), `primaryGradient` (the primary button filled with a gradient
from `colors.primaryGradientStart` to the primary at `primaryGradientAngle`,
its label readable on both ends: use it for a gradient brand instead of
styling buttons yourself), `uppercaseControls`, `underlineLinks`, `filledFields`,
`underlinedFields`, `pillControls`, `brandHeadings`, `outlinedSecondary`,
`liftOnHover` (on by default), `squeezeOnPress`, `inkShadows`, `strongFocus`,
`printBackgrounds` and `printLinkUrls`, plus `indicatorStyle` (`bar`, `fill`,
`underline`, `ring`, `quiet` or `tint`: how navigation marks the current page and
hover, through `roles.indicator.*`). Set them on `SquonkThemeProvider`'s
`primitives` instead of restyling components; each sets purpose tokens the
components already read, and a theme's `roleBindings` still win over a switch.

Purposes bind through a middle tier, so re-point the shared decision rather
than each purpose: the proximity ladder `roles.space.adjoining`, `related`,
`grouped`, `separated`, `distinct`; the text-size ladder `roles.type.fine`,
`small`, `body`, `large`; and the edges `roles.color.edge` and `edgeStrong`.

Three more theme decisions, each off until the theme sets it:

- **A purpose that differs by colour mode** takes `{ light, dark }` in
  `roleBindings` instead of one value, such as
  `"roles.color.heading": { light: "#1d3557", dark: "#f1faee" }`. Use it
  instead of reading the mode and swapping styles or providers yourself. Token
  paths already follow the mode, so most bindings stay a single value.
- **A gradient or wash behind the whole page** is the purpose
  `components.page.backgroundImage` (default `none`). Bind it instead of
  styling `body` or `Page`: `Page` paints it, and so does the body with
  `withGlobalStyles`, held to the screen while the page scrolls. Give it a
  value for each mode and keep it close to the page colour, because text is
  still chosen to read on that colour.
- **A soft "you are here" in navigation** is `indicatorStyle: "tint"`: the
  current item sits on a tint of the primary with text to match, and no bar,
  underline or ring. Don't colour the current nav item in app CSS.

## Printing

Every page prints well without work: ink on white, no shadows or motion, no
buttons, pagination, toasts or tooltips, tables in full with repeating headers,
and web links followed by their address. For a page people print on purpose
(a statement, receipt or plan), mark what belongs on paper with
`@squonk/ui/printable`:

- `Printable` around the record: while one is on the page, only `Printable`
  areas print, and the layout around them is flattened. `breakBefore` starts it
  on a new page; `keepTogether` keeps it on one page.
- `NotPrintable` around screen-only parts (navigation, filters, actions, help).
- `PrintOnly` for what only paper needs (a letterhead, a reference, the date
  printed). It's hidden on screen from everyone, screen readers included.

All three take `inline` for a mark inside a sentence. Don't add `@media print`
CSS of your own for these jobs; the theme's `printBackgrounds` and
`printLinkUrls` switches cover colours and link addresses.

## Accessibility and states

- Use `Button` for actions and `Link` for navigation. Give icon-only controls an
  accessible name.
- Form fields take a visible `label`; show problems with the field's `error` prop
  and, for longer forms, a summary `Alert` at the top.
- Use `Modal` only when the user must respond before continuing. It handles focus
  and Escape; always give it a `title`.
- Prefer `Text` tones (`secondary`, `muted`) to custom greys; they meet contrast
  requirements in light and dark mode. Check custom colours in both modes.
- Design the loading, empty and error states, not just the populated one:
  `Skeleton`, `Spinner` or `ProgressBar` while loading, `EmptyState` when there is
  nothing to show, `Alert` for failures.

## Check your work

- Run the app's typecheck; every import above must resolve against the installed
  version.
- Run the linter. `@squonk/ui/eslint` (`...squonkUi.configs.recommended` in
  `eslint.config.js`) flags native controls the library replaces, imports from
  internals and colour literals in inline styles.
- Look at the screen in the running app, in light and dark mode and at a narrow
  (mobile) width, with the browser access you have: a Playwright or browser MCP
  server, your built-in browser, or the user opening the dev server's URL.
- To show the user a library component or example screen, or to compare
  variants before you build, use the `squonk-ui` MCP server: `list_stories`
  finds a story, and `preview_story` shows it with a Controls panel the user can
  change (`screenshot: true` lets you see it yourself).
- When a component's catalog entry lists accessibility or pitfall guidance, follow
  it.
