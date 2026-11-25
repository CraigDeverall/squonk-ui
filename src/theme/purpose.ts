/**
 * Purpose tokens: the layer a theme makes its decisions in.
 *
 * The raw scales (`spacing.*`, `typography.sizes.*`, `colors.text.*`…) say
 * how much. These say what for: "the gap between a field's label and its
 * input", "the inset of a dialog". Components bind only to purpose tokens
 * (`roles.*`, shared by every component with that purpose) and component
 * tokens (`components.*`, one component's own decision), never to a raw
 * step. A theme changes what a purpose means with `roleBindings`, without
 * touching the scales or any other purpose.
 *
 * Each token's default binding points at a raw token path (resolved
 * against the theme's own variables, so it follows the scales and any
 * nested scope) or is a literal CSS value. `why` is the reason the token
 * exists; it is shown in the docs.
 */

export type Register = "compact" | "default" | "large" | "hero";

/** One purpose: its default binding and why it exists. */
export interface PurposeToken {
  bind: string;
  why: string;
}

/** A purpose that steps with the presentation register. */
export interface RegisterPurposeToken {
  registers: Record<Register, string>;
  why: string;
}

type PurposeTree = { [key: string]: PurposeToken | RegisterPurposeToken | PurposeTree };

const t = (bind: string, why: string): PurposeToken => ({ bind, why });
const r = (compact: string, def: string, large: string, hero: string, why: string): RegisterPurposeToken => ({
  registers: { compact, default: def, large, hero },
  why,
});

/** Shared purposes. Emitted as `--squonk-roles-*`. */
export const rolePurposes = {
  space: {
    // The proximity ladder: how close things sit, by how related they are.
    // The gaps below bind to these, so a theme can tighten or open one kind
    // of relationship everywhere at once, or re-point a single gap.
    adjoining: t("spacing.xxs", "Parts that read as one thing: a title and the line under it, joined segments, the rows of a list."),
    related: t("spacing.xs", "Closely related things: a label and its field, an icon and its text."),
    grouped: t("spacing.sm", "Members of one group: choices, buttons in a bar, blocks in a panel."),
    separated: t("spacing.md", "Neighbouring blocks that stand apart: tabs and their panel, the sections of a dialog."),
    distinct: t("spacing.lg", "Separate items in a sequence: one question and the next."),
    fieldGap: t("roles.space.related", "Between a field's label, its control and its hint or error."),
    questionGap: t("roles.space.distinct", "Between one question and the next in a form."),
    groupGap: t("roles.space.related", "Between a group's legend and its help or error text."),
    groupOptionsOffset: t("roles.space.grouped", "Above the first option of a checkbox or radio group, under its legend."),
    invalidIndent: t("spacing.md", "Inset of an invalid group's options from the error rule beside them."),
    choiceGap: t("roles.space.grouped", "Between a checkbox, radio or switch and its label."),
    choiceHintGap: t("roles.space.adjoining", "Between a choice's label and the hint under it."),
    choiceListGap: t("roles.space.grouped", "Between choices stacked in a group."),
    choiceListGapInline: t("roles.space.distinct", "Between choices laid out in a row."),
    iconGap: t("roles.space.related", "Between an icon and the text beside it inside a control."),
    itemGap: t("roles.space.grouped", "Between the parts of a menu item or list option."),
    textGap: t("roles.space.adjoining", "Between a title and the line of text under it."),
    actionGap: t("roles.space.grouped", "Between buttons side by side in a footer or bar."),
    controlGroupGap: t("roles.space.related", "Between neighbouring tabs, tags or breadcrumbs."),
    segmentGap: t("roles.space.adjoining", "Between the segments of a joined control, and its inner inset."),
    surfaceInset: t("spacing.md", "Padding inside a panel: popovers, alerts, sidebars, code blocks."),
    surfaceGap: t("roles.space.grouped", "Between blocks of content inside a panel."),
    overlayInset: t("spacing.lg", "Padding inside a dialog or drawer."),
    overlayGap: t("roles.space.separated", "Between blocks of content inside a dialog or drawer."),
    viewportMargin: t("spacing.md", "The least space between a dialog or notification and the edge of the screen."),
    titleRowGap: t("roles.space.grouped", "Between a panel's title and the close button beside it."),
    listInset: t("spacing.xs", "Padding around the rows of a menu or listbox."),
    listGap: t("roles.space.adjoining", "Between the rows of a menu or listbox."),
    listItemInsetBlock: t("spacing.sm", "Top and bottom padding of a menu item or option."),
    listItemInsetInline: t("spacing.md", "Side padding of a menu item or option."),
    panelGap: t("roles.space.separated", "Between a set of tabs and the panel they show."),
    pageGutter: t("spacing.containerPadding", "Padding between page content and the edge of the screen."),
    closeInset: t("spacing.xxs", "Padding of a close or dismiss button, so its target is larger than its icon."),
  },
  type: {
    // The text-size ladder. The sizes below bind to these, so a theme can
    // make all the small print larger, say, in one place.
    body: t("typography.sizes.base", "Running text and the values people type."),
    small: t("typography.sizes.sm", "Smaller text beside the body: labels, meta, list items, short notes in a panel."),
    fine: t("typography.sizes.xs", "The finest print: hints, descriptions under options, tooltips."),
    large: t("typography.sizes.lg", "Text a step above the body: titles of panels and dialogs."),
    bodyLineHeight: t("typography.lineHeights.base", "Line height of running text."),
    label: t("roles.type.small", "Field labels, legends and table headers."),
    buttonCase: t("switches.buttonCase", "Letter case of button labels (a text-transform): none, or uppercase for a technical voice. Set by the uppercaseControls switch."),
    buttonTracking: t("switches.buttonTracking", "Letter spacing of button labels: normal, or a little open (0.04em) for uppercase labels. Set by the uppercaseControls switch."),
    linkDecoration: t("switches.linkDecoration", "Whether links in text are underlined at rest (underline) or only when pointed at (none). Set by the underlineLinks switch."),
    hint: t("roles.type.fine", "Help and error text under a field."),
    legend: t("roles.type.body", "A group's legend: the question its options answer."),
    groupHint: t("roles.type.small", "Help and error text under a group's legend."),
    meta: t("roles.type.small", "Secondary text: table cells, breadcrumbs, captions, menu items."),
    title: t("roles.type.large", "The title of a panel or dialog, and of the error summary."),
    calloutTitle: t("roles.type.body", "The title of a message inside the content: alerts, toasts, inline notices. Just above its message, so it doesn't compete with the page's headings."),
    listItem: t("roles.type.small", "Menu items and listbox options."),
    supporting: t("roles.type.fine", "A description under a list option."),
    tightLineHeight: t("typography.lineHeights.tight", "Line height of single-line labels and controls."),
    strong: t("typography.weights.bold", "Weight of labels, titles and emphasis."),
    selected: t("roles.type.strong", "Weight of the chosen option in a list or menu, so the choice reads without colour."),
    regular: t("typography.weights.regular", "Weight of running text."),
    font: t("typography.fonts.base", "The interface typeface."),
    codeFont: t("typography.fonts.code", "Code, keys and figures that must align."),
    headingFont: t("typography.fonts.heading", "The typeface for page and section headings."),
  },
  color: {
    // Edges: every hairline binds to one of these, so a theme can soften or
    // ink all of them at once.
    edge: t("colors.border.default", "Hairline edges: dividers, outlines, field borders, the rim of a floating panel."),
    edgeStrong: t("colors.border.strong", "A firmer edge: a hovered outline, an axis line."),
    text: t("colors.text.primary", "Body text and the values people type."),
    textSupporting: t("colors.text.secondary", "Secondary text: descriptions, captions, meta."),
    hint: t("roles.color.textSupporting", "Help text under a field."),
    placeholder: t("colors.onBackground.defaultSecondary", "Placeholder text in an empty field or select."),
    label: t("roles.color.text", "Field labels and group legends."),
    fieldText: t("colors.onBackground.default", "The value typed or chosen in a field, readable on its background."),
    invalid: t("colors.error", "Errors: the message, the field border and the group rule."),
    invalidText: t("colors.onBackground.defaultError", "Error text in a group or error summary, kept readable on the panel."),
    onInvalid: t("colors.contrastError", "Text and icons on an error fill, such as an invalid ticked box."),
    link: t("colors.link", "Links in text."),
    accent: t("colors.primaryFill", "The selected state: a ticked box, the active tab, progress. The primary, deepened for light text as lightTextBalance decides."),
    accentHover: t("colors.primaryHover", "The accent while pointed at."),
    onAccent: t("colors.contrastPrimaryFill", "Text and icons on the accent: ticked boxes, the active tab, the current page."),
    fieldBackground: t("switches.fieldBackground", "Inside a text field, select or choice control. The filledFields switch fills it with the well colour."),
    fieldBorder: t("roles.color.edge", "The border of a field or choice control at rest."),
    fieldBorderHover: t("colors.text.secondary", "The border of a field when pointed at."),
    fieldBorderFocus: t("colors.border.focus", "The border and halo of a field while it has focus."),
    fieldBackgroundDisabled: t("roles.color.well", "Inside a disabled field."),
    page: t("colors.background.surface", "The page behind content."),
    onPage: t("colors.onBackground.surface", "Text straight on the page colour, kept readable on any theme."),
    onPageSupporting: t("colors.onBackground.surfaceSecondary", "Secondary text straight on the page colour."),
    outline: t("roles.color.edge", "The edge of an outlined card, block, key or code sample."),
    heading: t("roles.color.text", "The text colour of headings."),
    surface: t("colors.background.default", "Panels on or over the page: cards, menus, popovers, dialogs."),
    onSurface: t("colors.onBackground.default", "Text on a panel, kept readable on any theme."),
    onSurfaceSupporting: t("colors.onBackground.defaultSecondary", "Secondary text on a panel."),
    well: t("colors.background.subtle", "Recessed areas: tracks, code, the enclosed-tabs strip, skeletons."),
    onWell: t("colors.onBackground.subtle", "Text in a recessed area."),
    floatingBorder: t("roles.color.edge", "The edge of a panel floating over the page: menus, listboxes, popovers, dialogs."),
    hover: t("roles.color.well", "A row, item or quiet button while pointed at."),
    onHover: t("colors.onBackground.subtle", "Text and icons on a row, item or quiet button while pointed at."),
    onHoverSupporting: t("colors.onBackground.subtleSecondary", "Secondary text on a row while pointed at."),
    fieldIcon: t("roles.color.textSupporting", "Chevrons and small buttons inside a field: open, clear."),
    selectedMark: t("roles.color.link", "The tick beside the chosen option in a list."),
    danger: t("colors.onBackground.defaultError", "A destructive action, such as Delete in a menu."),
    dangerOnHover: t("colors.onBackground.subtleError", "A destructive action while pointed at."),
    dismiss: t("roles.color.textSupporting", "A close or dismiss button's icon at rest."),
    dismissHover: t("roles.color.text", "A close or dismiss button's icon while pointed at."),
    selected: t("colors.tone.primary.subtle", "A selected row or option."),
    onSelected: t("colors.tone.primary.onSubtle", "Text and icons on a selected row or option, kept readable on its fill."),
    textSelection: t("colors.tone.primary.subtle", "The highlight behind text the user selects on the page."),
    onTextSelection: t("colors.tone.primary.onSubtle", "Text the user has selected, readable on its highlight."),
    divider: t("roles.color.edge", "Lines between rows and sections."),
    focusRing: t("colors.border.focus", "The keyboard focus ring."),
    backdrop: t("colors.background.overlay", "The dimmed page behind a dialog or drawer."),
    inverseSurface: t("colors.text.primary", "Dark-on-light flips: tooltips, the featured card."),
    onInverseSurface: t("colors.onInk", "Text on an inverse surface."),
    textQuiet: t("colors.text.muted", "The quietest text: breadcrumb separators, an end-of-list note, a muted link."),
    onWellSupporting: t("colors.onBackground.subtleSecondary", "Secondary text in a recessed area, such as an unselected enclosed tab."),
    destructive: t("colors.error", "The fill of a destructive button and the colour of a destructive link."),
    stripe: t("roles.color.well", "Every other row of a striped list or table."),
    dataSeries1: t("colors.data.series1", "The first data series in a chart: its line, bars, slice or dots."),
    dataSeries2: t("colors.data.series2", "The second data series in a chart."),
    dataSeries3: t("colors.data.series3", "The third data series in a chart."),
    dataSeries4: t("colors.data.series4", "The fourth data series in a chart."),
    dataSeries5: t("colors.data.series5", "The fifth data series in a chart."),
    dataSeries6: t("colors.data.series6", "The sixth data series in a chart."),
    dataSeries7: t("colors.data.series7", "The seventh data series in a chart."),
    dataSeries8: t("colors.data.series8", "The eighth and last data series in a chart; more series fold into an Other series."),
  },
  border: {
    width: t("borders.width", "Borders of fields, panels and dividers."),
    ruleWidth: t("borders.focusWidth", "The error rule beside an invalid group."),
    focusWidth: t("borders.focusWidth", "Thickness of the keyboard focus ring."),
    focusOffset: t("borders.focusOffset", "Gap between a control and its focus ring."),
  },
  radius: {
    pill: t("borders.radius.full", "Fully rounded ends: switches, avatars, counts."),
    mark: t("borders.radius.sm", "Small marks: checkbox boxes, keys, inline code."),
  },
  elevation: {
    lift: t("shadows.pop", "A control lifted on hover."),
    soft: t("shadows.soft", "A gentle shadow under raised content at rest."),
    field: t("0 0 #0000", "A shadow under a text field, select or text area at rest, kept while it has focus: none by default; an inset for a recessed field, or a hard offset for a printed look."),
  },
  motion: {
    feedbackIn: t("transitions.instant", "Entering hover, press, focus or a selected state: the response appears the moment it's touched."),
    feedback: t("transitions.quick", "Returning to rest after hover, press, focus or selection: a short fade so the change doesn't flicker."),
    overlay: t("motion.durations.fast", "Overlays opening and closing: menus, popovers, dialogs."),
    arrive: t("motion.durations.normal", "Dialogs, drawers and notifications arriving: slower than they leave, so the eye follows them in."),
    panel: t("motion.durations.normal", "Panels expanding: accordions."),
    quick: t("motion.durations.fast", "Small changes within the page: a colour shift, a chevron turning, a panel closing."),
    enter: t("motion.easings.enter", "Easing for things arriving."),
    exit: t("motion.easings.exit", "Easing for things leaving."),
    standard: t("motion.easings.standard", "Easing for things moving within the page."),
    spin: t("800ms", "One turn of a spinner: quick enough to read as working."),
    spinReduced: t("1800ms", "One turn of a spinner with reduced motion: still turning, so work is visibly happening, but calmly."),
    loop: t("1.4s", "One pass of a loading shimmer or an indeterminate progress bar."),
    loopReduced: t("3s", "One pass of an indeterminate progress bar with reduced motion."),
    pulse: t("2.4s", "One breath of a live status dot: slow, so it never competes with content."),
    reveal: t("550ms", "Content arriving as it scrolls into view: long enough to notice, over before it's read."),
    revealEasing: t("cubic-bezier(0.16, 1, 0.3, 1)", "Easing for content arriving as it scrolls into view: quick to start, settling gently."),
    spring: t("motion.easings.spring", "Easing for things that arrive and settle: popovers, menus, toasts, content appearing. It overshoots a little when the theme has bounce."),
    popScale: t("motion.scales.pop", "The size an overlay grows from as it opens, and shrinks to as it closes: 1 for a plain fade."),
    nudge: t("motion.distances.md", "How far content rises as it appears, swaps in or leaves."),
    revealOffset: t("motion.distances.lg", "How far below its place content starts as it scrolls into view."),
    stagger: t("motion.stagger", "The gap between items arriving one after another, so a group reads as a sequence."),
    swap: t("motion.durations.normal", "Content swapping in: a tab's panel, loaded content replacing its placeholder."),
    layout: t("motion.durations.normal", "Items gliding to their new place when a list is sorted, filtered or changes."),
    count: t("motion.durations.slow", "A figure counting to its new value."),
    highlight: t("1600ms", "A change drawing the eye: how long its highlight takes to fade."),
    highlightColor: t("color-mix(in srgb, var(--squonk-colors-primary) 16%, transparent)", "The highlight on something that just changed, fading back to its own background: a faint tint of the brand colour."),
  },
  // How navigation marks where you are and what's under the pointer: the
  // current page in a nav list, and the item being pointed at. Components
  // draw the mark themselves from these parts, so any combination works: a
  // bar along the start edge, an underline, a ring standing off a filled
  // centre by a gap, or a plain fill. Zero widths draw nothing. The
  // indicatorStyle primitive sets them in one go.
  indicator: {
    current: {
      background: t("roles.color.well", "Behind the current item: the page you're on in a nav list."),
      text: t("roles.color.onWell", "The current item's text and icon."),
      weight: t("roles.type.strong", "The weight of the current item's label."),
      color: t("roles.color.accent", "The colour of the current item's mark: its bar, underline or ring."),
      bar: t("3px", "The width of a bar along the current item's start edge. 0px for none."),
      underline: t("0px", "The height of an underline under the current item. 0px for none."),
      ring: t("0px", "The width of a ring around the current item. 0px for none."),
      gap: t("0px", "The gap between the current item's ring and its filled centre, so the ring stands off it."),
    },
    hover: {
      background: t("roles.color.hover", "Behind an item while pointed at."),
      text: t("roles.color.onHover", "An item's text and icon while pointed at."),
      color: t("roles.color.edgeStrong", "The colour of an item's mark while pointed at."),
      bar: t("0px", "The width of a bar along an item's start edge while pointed at. 0px for none."),
      underline: t("0px", "The height of an underline under an item while pointed at. 0px for none."),
      ring: t("0px", "The width of a ring around an item while pointed at. 0px for none."),
      gap: t("0px", "The gap between a pointed-at item's ring and its filled centre."),
    },
    radius: t("roles.radius.item", "The corners of a nav item and its mark."),
  },
  state: {
    disabledOpacity: t("states.disabledOpacity", "How faint a disabled control is."),
  },
  size: {
    closeIcon: t("roles.type.large", "The close icon of a dialog or drawer."),
    choice: t("18px", "The box of a checkbox and the ring of a radio: one line of body text tall."),
    choiceOffset: t("2px", "Nudges a checkbox box or radio ring down onto its label's first line."),
  },
  layer: {
    menu: t(
      "zIndices.popover",
      "Menus and listboxes. They open from a control, so they sit over sticky and fixed headers and over dialogs, as popovers do.",
    ),
    sticky: t("zIndices.sticky", "Sticky headers."),
    fixed: t("zIndices.fixed", "Headers fixed to the top of the screen, over sticky ones."),
    dialog: t("zIndices.modal", "Dialogs and drawers."),
    popover: t("zIndices.popover", "Popovers, including over dialogs."),
    tooltip: t("zIndices.tooltip", "Tooltips, over everything."),
    toast: t("zIndices.tooltip", "Notifications, over everything."),
  },
  control: {
    paddingInline: r("spacing.sm", "spacing.md", "spacing.md", "spacing.lg", "Side padding inside a text field or select, per register."),
    fontSize: r("typography.sizes.sm", "typography.sizes.base", "typography.sizes.lg", "typography.sizes.lg", "Size of the value inside a text field or select, per register."),
    fieldBorder: t("borders.width", "Border widths of a text field, select or text area, as a border-width list: one value boxes it, \"0 0 1px\" underlines it."),
  },
  interaction: {
    hoverLift: t("-2px", "How far a lifted button (the primary, by default) rises under the pointer. 0px keeps buttons flat."),
    pressScale: t("1", "How much a button shrinks while pressed: 1 for none, 0.96 for a soft squeeze."),
    focusGlow: t("0 0 #0000", "A glow around a focused button, beside its focus ring, as a box-shadow. The default draws nothing."),
    fieldFocusHalo: t("2px", "How far a focused field's halo spreads around it, in its accent colour (the error colour when invalid). 0px for none."),
    fieldFocusStrength: t("20%", "How strong a focused field's halo is: the share of the accent colour in it."),
    fieldFocusUnderline: t("0px", "A bar of the accent along a focused field's bottom edge, as a negative inset (-2px). 0px for none; pairs with underlined fields."),
  },
  // Fills drawn as a background-image over an accent-coloured control. `none`
  // (the solid accent shows) unless the theme turns on primaryGradient.
  fill: {
    accent: t("colors.primaryGradient", "An image over the accent on a filled control: the primary gradient, or none."),
    accentHover: t("colors.primaryGradientHover", "The accent's image while pointed at."),
    accentPressed: t("colors.primaryGradientActive", "The accent's image while pressed."),
  },
  // Surface relief: a fill (background-image over the component's colour)
  // and an edge (inset strokes) per posture. Flat unless the theme sets
  // reliefDepth or reliefSheen. Re-point a posture at a per-profile token
  // (`relief.glass.raised.fill`) to give it its own profile.
  relief: {
    surface: {
      fill: t("relief.raisedSubtle.fill", "The relief across a panel on the page: cards. A gradient over its colour, or none."),
      edge: t("relief.raisedSubtle.edge", "The highlight and shade along a panel's edges, as inset shadows."),
    },
    control: {
      fill: t("relief.raised.fill", "The relief across a control at rest: buttons, select triggers, switch thumbs, the selected segment."),
      edge: t("relief.raised.edge", "The highlight and shade along a control's edges, as inset shadows."),
    },
    chrome: {
      fill: t("relief.raisedSubtle.fill", "The relief across the app's chrome: the header."),
      edge: t("relief.raisedSubtle.edge", "The highlight and shade along the chrome's edges, as inset shadows."),
    },
    well: {
      fill: t("relief.recessed.fill", "The relief inside a well: text fields, text areas, switch and segmented tracks, filled cards."),
      edge: t("relief.recessed.edge", "The inner shadow and far-lip highlight inside a well, as inset shadows."),
    },
    pressed: {
      fill: t("relief.recessed.fill", "The relief across a control while pressed or open, pushed into the page."),
      edge: t("relief.recessed.edge", "The inner shadow along a pressed control's edges, as inset shadows."),
    },
    blend: t("relief.blend", "How relief fills combine with the colour beneath them, as a background-blend-mode."),
  },
  // Printing. When the page prints, the colour purposes are re-pointed at
  // these, and shadows, relief and motion are switched off. The
  // printBackgrounds switch keeps the theme's colours; off, it prints ink on
  // plain paper.
  print: {
    paper: t("switches.print.paper", "The page colour on paper: white, or the theme's page with printBackgrounds."),
    surface: t("switches.print.surface", "Panels on paper: cards, tables, dialogs."),
    well: t("switches.print.well", "Recessed areas on paper: fields, tracks, code."),
    ink: t("switches.print.ink", "Text and icons on paper."),
    inkSupporting: t("switches.print.inkSupporting", "Secondary text on paper: hints, captions, meta."),
    line: t("switches.print.line", "Borders, dividers and outlines on paper."),
    colorAdjust: t("switches.print.colorAdjust", "Whether the browser keeps backgrounds and colours when printing (exact) or may drop them (economy), as print-color-adjust."),
    linkUrls: t("switches.print.linkUrls", "Whether a printed link shows its address after its text (inline) or not (none), as a display value. Set by the printLinkUrls switch."),
  },
} satisfies PurposeTree;

/** One component's own decisions. Emitted as `--squonk-components-*`. */
export const componentPurposes = {
  page: {
    background: t("roles.color.surface", "Behind a full-screen Page layout."),
    text: t("colors.onBackground.default", "Text on a Page layout."),
    backgroundImage: t("none", "An image over the page colour, fixed to the screen: a gradient or wash behind the whole page. none paints only the colour."),
  },
  header: {
    background: t("roles.color.surface", "The app bar across the top of the page."),
    text: t("colors.onBackground.default", "Text in the app bar."),
    translucentBackground: t("colors.backgroundDefaultTranslucent", "The app bar when it lets content show through, frosted."),
  },
  footer: {
    paddingBlock: t("spacing.lg", "Top and bottom padding of the page footer."),
  },
  card: {
    featuredElevation: t("shadows.pop", "The shadow that makes the featured card stand forward of its siblings."),
    hoverElevation: t("roles.elevation.soft", "The shadow a clickable card gains when pointed at."),
    hoverBorder: t("roles.color.edgeStrong", "The edge of a clickable outlined card when pointed at."),
    outlinedElevation: t("0 0 #0000", "A shadow under an outlined card, beside its border, as a box-shadow. The default draws nothing."),
  },
  sectionHeading: {
    gap: t("roles.space.grouped", "Between a section's eyebrow, heading and lead paragraph."),
  },
  heading: {
    accent: t("roles.color.accent", "The coloured fragment (an <em>) inside a heading."),
    weight: {
      level1: t("roles.type.strong", "The weight of a level 1 heading with no weight prop."),
      level2: t("roles.type.strong", "The weight of a level 2 heading with no weight prop."),
      level3: t("roles.type.strong", "The weight of a level 3 heading with no weight prop."),
      level4: t("roles.type.strong", "The weight of a level 4 heading with no weight prop."),
      level5: t("roles.type.strong", "The weight of a level 5 heading with no weight prop."),
      level6: t("roles.type.strong", "The weight of a level 6 heading with no weight prop."),
    },
    tracking: {
      default: t("-0.01em", "Letter spacing of a heading in the default register: a hair tighter than running text."),
      large: t("-0.025em", "Letter spacing of a heading in the large register, where display type wants to sit closer."),
      hero: t("-0.035em", "Letter spacing of a hero heading: the largest type, set tightest."),
    },
  },
  text: {
    muted: t("roles.color.textQuiet", "Text with tone=\"muted\": quieter than secondary."),
    inverse: t("colors.text.inverse", "Text with tone=\"inverse\", for dark backgrounds."),
    eyebrowSize: t("roles.type.fine", "Text size of an eyebrow: the small capitals label above a heading."),
    eyebrowTracking: t("0.06em", "Letter spacing of an eyebrow: capitals need a little air, the same as an all-caps badge."),
  },
  illustration: {
    ink: t("roles.color.text", "The outlines of an illustration, and its darkest marks."),
    paper: t("roles.color.surface", "The lightest fill of an illustration: pages, windows, cards."),
    accent: t("roles.color.accent", "The one brand touch in an illustration: a dot, a sparkle, a highlight."),
    onAccent: t("roles.color.onAccent", "A mark drawn on the accent inside an illustration."),
    tintStrength: t("32%", "How much of the accent is in an illustration's tint fill, mixed into its paper."),
    stroke: t("1.75", "The outline width of an illustration, in units of its 48-unit drawing."),
    size: {
      sm: t("48px", "An illustration with size=\"sm\": beside a short message or in a list."),
      md: t("64px", "An illustration with size=\"md\": a card or a feature list."),
      lg: t("96px", "An illustration with size=\"lg\": an empty state or a step."),
      xl: t("128px", "An illustration with size=\"xl\": the centre of an empty page or a confirmation."),
    },
  },
  icon: {
    small: t("roles.type.small", "An icon with size=\"sm\": matches small text."),
    medium: t("roles.type.body", "An icon with size=\"md\": matches body text."),
    large: t("roles.type.large", "An icon with size=\"lg\": matches large text."),
  },
  kbd: {
    paddingInline: t("spacing.xs", "Side padding of a key cap."),
    bevel: t("colors.backgroundSubtleShade", "The inner shadow along the bottom of a key cap."),
  },
  code: {
    insetBlock: t("spacing.xxs", "Top and bottom padding of inline code."),
    insetInline: t("spacing.xs", "Side padding of inline code."),
    blockSize: t("roles.type.small", "Text size of a code block."),
  },
  button: {
    paddingInline: r("spacing.md", "spacing.lg", "spacing.xl", "spacing.xxl", "Side padding of a button, per register."),
    fontSize: r("typography.sizes.sm", "typography.sizes.base", "typography.sizes.base", "typography.sizes.lg", "Label size of a button, per register."),
    primary: {
      background: t("roles.color.accent", "The primary button: the one action a screen most wants."),
      text: t("colors.contrastPrimary", "The primary button's label, readable on its fill or across its gradient."),
      shadow: t("shadows.pop", "Lifts the primary button forward of the others."),
      hoverBackground: t("roles.color.accentHover", "The primary button while pointed at."),
      hoverText: t("colors.onPrimaryHover", "The primary button's label while pointed at."),
      pressedBackground: t("colors.primaryActive", "The primary button while pressed."),
      pressedText: t("colors.onPrimaryActive", "The primary button's label while pressed."),
      image: t("roles.fill.accent", "An image over the primary button's colour, under its relief: the primary gradient, or none."),
      hoverImage: t("roles.fill.accentHover", "The primary button's image while pointed at."),
      pressedImage: t("roles.fill.accentPressed", "The primary button's image while pressed."),
    },
    secondary: {
      background: t("roles.color.page", "A secondary button: alternatives beside the primary action."),
      text: t("colors.onBackground.surface", "A secondary button's label."),
      border: t("roles.color.edge", "A secondary button's edge."),
      hoverBackground: t("colors.background.default", "A secondary button while pointed at."),
      hoverText: t("colors.onBackground.default", "A secondary button's label while pointed at."),
      shadow: t("0 0 #0000", "A shadow under a secondary button at rest: none by default, so it sits behind the primary."),
      hoverBorder: t("roles.color.edgeStrong", "A secondary button's edge while pointed at."),
      pressedBackground: t("colors.background.subtle", "A secondary button while pressed."),
      pressedText: t("colors.onBackground.subtle", "A secondary button's label while pressed."),
    },
    solid: {
      background: t("colors.text.primary", "A solid button: strong but not the brand colour."),
      text: t("colors.onInk", "A solid button's label."),
      hoverBackground: t("roles.color.accent", "A solid button while pointed at: it takes the accent."),
      hoverText: t("colors.onPrimary", "A solid button's label while pointed at."),
      pressedBackground: t("roles.color.accentHover", "A solid button while pressed."),
      pressedText: t("colors.onPrimaryHover", "A solid button's label while pressed."),
    },
    ghost: {
      text: t("roles.color.text", "A ghost button: a quiet action with no fill at rest."),
      hoverBackground: t("roles.color.hover", "A ghost button while pointed at."),
      hoverText: t("roles.color.onHover", "A ghost button's label while pointed at."),
      pressedBackground: t("roles.color.page", "A ghost button while pressed."),
      pressedText: t("colors.onBackground.surface", "A ghost button's label while pressed."),
    },
    danger: {
      background: t("roles.color.destructive", "A danger button: an action that destroys something."),
      text: t("colors.contrastError", "A danger button's label."),
      hoverBackground: t("colors.errorHover", "A danger button while pointed at."),
      hoverText: t("colors.onErrorHover", "A danger button's label while pointed at."),
      pressedBackground: t("colors.errorActive", "A danger button while pressed."),
      pressedText: t("colors.onErrorActive", "A danger button's label while pressed."),
    },
  },
  link: {
    focusRadius: t("roles.radius.mark", "Rounds the focus ring hugging a link."),
    muted: t("roles.color.textQuiet", "A muted link: present but out of the way."),
    danger: t("roles.color.destructive", "A link that destroys something."),
  },
  breadcrumb: {
    rowGap: t("roles.space.adjoining", "Between lines when a long trail wraps."),
    expandInsetInline: t("spacing.xs", "Side padding of the button that reveals hidden steps."),
  },
  tag: {
    paddingBlock: r("0", "spacing.xxs", "spacing.xs", "spacing.xs", "Top and bottom padding of a tag, per register."),
    paddingInline: r("spacing.xs", "spacing.sm", "spacing.sm", "spacing.sm", "Side padding of a tag, per register."),
    fontSize: r("typography.sizes.xs", "typography.sizes.sm", "typography.sizes.base", "typography.sizes.base", "Text size of a tag, per register."),
    removeOffsetStart: t("spacing.xxs", "Pulls a tag's remove button towards its text."),
    removeOffsetEnd: t("spacing.xs", "Pulls a tag's remove button into the tag's end padding."),
  },
  badge: {
    gap: t("roles.space.adjoining", "Between a badge's icon and its text: tighter than a control's."),
    paddingBlock: r("spacing.xxs", "spacing.xs", "spacing.xs", "spacing.sm", "Top and bottom padding of a badge, per register."),
    paddingInline: r("spacing.xs", "spacing.sm", "spacing.md", "spacing.lg", "Side padding of a badge, per register."),
    fontSize: r("typography.sizes.xs", "typography.sizes.sm", "typography.sizes.base", "typography.sizes.base", "Text size of a badge, per register."),
    capsFontSize: t("roles.type.fine", "Text size of an all-caps eyebrow badge."),
  },
  alert: {
    textSize: t("roles.type.small", "Text size of an alert's message."),
    dismissSize: t("roles.size.closeIcon", "Size of an alert's dismiss icon."),
  },
  tabs: {
    paddingInline: t("spacing.md", "Side padding of a tab."),
    fontSize: r("typography.sizes.sm", "typography.sizes.sm", "typography.sizes.sm", "typography.sizes.base", "Text size of a tab, per register."),
    indicatorDuration: t("roles.motion.quick", "How long the active-tab indicator takes to slide."),
  },
  pagination: {
    rowGap: t("roles.space.grouped", "Between the page status and the controls when they wrap."),
    columnGap: t("roles.space.separated", "Between the page status and the controls."),
    iconGap: t("roles.space.adjoining", "Between a page button's arrow and its text."),
    buttonInsetInline: t("spacing.xs", "Side padding of a page-number button."),
    stepInsetInline: t("spacing.sm", "Side padding of the Previous and Next buttons."),
    statusInsetInline: t("spacing.sm", "Side padding of the compact \"Page 1 of 5\" status."),
  },
  chart: {
    plotHeight: r("160px", "240px", "320px", "400px", "Height of a chart's plotting area, per register: tall enough to read the slope, short enough to sit beside other content."),
    gridline: t("roles.color.edge", "Hairline gridlines behind a chart's marks: recessive, one step off the surface."),
    axisLine: t("roles.color.edgeStrong", "A chart's baseline and axis lines, a step stronger than the gridlines."),
    axisText: t("roles.color.textSupporting", "Tick labels on a chart's axes."),
    markGap: t("roles.color.surface", "The surface-coloured gap between touching marks and the ring around dots, so neighbours read apart without an outline."),
    areaOpacity: t("0.12", "Opacity of the wash under a line in an area chart: a tint of the series colour, never a solid block."),
    cursor: t("roles.color.well", "The band or line that follows the pointer across a chart."),
    legendGap: t("roles.space.separated", "Between the items of a chart legend."),
    swatchSize: t("10px", "The colour key beside each legend item and tooltip row."),
    headerGap: t("roles.space.grouped", "Between a chart's title block and the table toggle beside it."),
  },
  sparkline: {
    height: r("20px", "28px", "36px", "44px", "Height of an inline trend line, per register: about the line height of the text beside it, with room for the end dot."),
  },
  networkGraph: {
    canvas: t("roles.color.surface", "The area a network graph is drawn on, and the halo that keeps its labels readable where links pass behind them."),
    link: t("roles.color.edgeStrong", "A link between two nodes whose kind has no colour of its own: firm enough to follow, quieter than the nodes."),
    linkLabel: t("roles.color.textSupporting", "The words on a link, shown while the link or a node at either end is in use."),
    dimOpacity: t("0.25", "Opacity of the nodes and links outside a selected node's neighbourhood: still there for context, clearly set back."),
    minHeight: t("160px", "The least height of a network graph when its container sets none, so it never collapses to nothing."),
    controlsInset: t("roles.space.grouped", "Between the zoom controls and the corner of the graph they sit in."),
    legendGap: t("roles.space.separated", "Between the kinds listed in a network graph's legend."),
    overlayGap: t("roles.space.separated", "In full screen, between the toolbar or aside and the nodes a fit places, and between the toolbar and the aside."),
    controlsRoom: t("48px", "In full screen, the height kept clear above the bottom edge for the zoom controls, so the aside never covers them."),
    asideWidth: t("22rem", "In full screen, the most width the aside card takes at the inline end."),
  },
  stat: {
    valueSize: r("typography.sizes.xl", "typography.sizes.xxl", "typography.sizes.h1", "48px", "The headline figure of a Stat, per register."),
    gap: t("roles.space.related", "Between a Stat's label, figure, change and trend."),
  },
  meter: {
    labelGap: t("roles.space.grouped", "Between a meter's label and its value."),
  },
  progressBar: {
    labelGap: t("roles.space.grouped", "Between a progress bar's label and its value."),
    fillTransition: t("motion.durations.normal", "How long the filled part takes to move when the value changes."),
  },
  spinner: {
    inverseArc: t("roles.color.surface", "The moving arc of a spinner on a dark fill."),
  },
  skeleton: {
    radius: t("borders.radius.base", "Corners of a skeleton block."),
    textRadius: t("roles.radius.mark", "Corners of a skeleton text line."),
    highlight: t("colors.backgroundSubtleHighlight", "The shimmer passing over a skeleton."),
    lineGap: t("roles.space.related", "Between the lines of a skeleton paragraph."),
  },
  infiniteList: {
    footerGap: t("roles.space.grouped", "Between the spinner, message and retry button at a feed's end."),
    footerInset: t("spacing.md", "Space above and below a feed's loading or end message."),
    edgeInsetBlock: t("spacing.xxs", "Top and bottom padding of the skip-to-end link."),
    edgeInsetInline: t("spacing.xs", "Side padding of the skip-to-end link."),
  },
  qrCode: {
    gap: t("roles.space.grouped", "Between a QR code and its caption."),
    padding: t("spacing.md", "The quiet zone around a QR code image."),
  },
  avatar: {
    roundedRadius: t("borders.radius.base", "Corners of a rounded (not circular) avatar."),
  },
  textarea: {
    paddingBlock: r("spacing.xs", "spacing.sm", "spacing.sm", "spacing.md", "Top and bottom padding of a textarea, per register."),
  },
  table: {
    cellPaddingBlock: r("spacing.xs", "spacing.sm", "spacing.md", "spacing.md", "Top and bottom padding of a table cell, per register."),
    cellPaddingInline: r("spacing.sm", "spacing.md", "spacing.md", "spacing.lg", "Side padding of a table cell, per register."),
    pagerGap: t("spacing.sm", "Between a table and its page controls."),
  },
  accordion: {
    inset: r("spacing.sm", "spacing.md", "spacing.lg", "spacing.lg", "Padding of an accordion's headers and panels, per register."),
    triggerGap: t("roles.space.separated", "Between an accordion section's title and its chevron."),
    titleSize: t("roles.type.body", "Text size of an accordion section's title."),
    hoverBackground: t("roles.color.page", "An accordion header while pointed at, in a contained accordion or with hover=\"fill\"."),
  },
  select: {
    indicatorRoom: t("spacing.xl", "Space kept at the end of a list Select's trigger for its chevron."),
    indicatorInset: t("spacing.md", "Distance of a list Select's chevron from the trigger's end."),
    clearSize: t("spacing.lg", "Width and height of a list Select's clear button."),
    actionsInset: t("spacing.xs", "Distance of a searchable Select's clear and open buttons from the input's end."),
  },
  popover: {
    viewportMargin: t("spacing.sm", "The least space between a popover and the edge of the screen."),
    textSize: t("roles.type.small", "Text size inside a popover: lighter than the page it sits on."),
    titleSize: t("roles.type.body", "A popover's title: smaller than a dialog's."),
    closeIcon: t("roles.type.body", "A popover's close icon, smaller than a dialog's."),
    closeOffset: t("spacing.xs", "Pulls the close button into the corner, so its icon lines up with the padding."),
    footerOffset: t("spacing.xs", "Extra space above a popover's footer actions."),
  },
  drawer: {
    viewportMargin: t("spacing.xl", "The least page width left visible beside an open side drawer."),
    footerInsetBlock: t("roles.space.surfaceInset", "Top and bottom padding of a drawer's footer bar."),
    footerBackground: t("roles.color.page", "The drawer's footer bar, set apart from the content above it."),
  },
  toast: {
    gap: t("roles.space.grouped", "Between notifications stacked in a corner."),
    width: t("368px", "A notification's width: a short message on one or two lines."),
    actionGap: t("roles.space.related", "Between a notification's message and the action under it."),
    actionInsetBlock: t("spacing.xxs", "Top and bottom padding of a notification's action button."),
    actionInsetInline: t("spacing.sm", "Side padding of a notification's action button."),
  },
  tooltip: {
    textSize: t("roles.type.fine", "Text size of a tooltip: short, secondary to what it describes."),
    insetBlock: t("spacing.xs", "Top and bottom padding of a tooltip."),
    insetInline: t("spacing.sm", "Side padding of a tooltip."),
  },
  radio: {
    dotSize: t("8px", "The dot inside a selected radio."),
  },
  switch: {
    trackWidth: r("28px", "36px", "44px", "52px", "Length of a switch's track, per register."),
    trackHeight: r("16px", "20px", "24px", "28px", "Height of a switch's track, per register."),
    thumbSize: r("12px", "16px", "20px", "24px", "Diameter of a switch's thumb, per register."),
    thumbInset: t("2px", "Space between the thumb and the edge of the track."),
    trackOff: t("roles.color.edge", "The track of a switch that is off."),
    thumb: t("roles.color.surface", "The switch's thumb."),
  },
  form: {
    summaryInsetBlock: t("roles.space.surfaceInset", "Top and bottom padding of the error summary."),
    summaryInsetInline: t("spacing.lg", "Side padding of the error summary."),
    summaryIndent: t("spacing.lg", "Indent of the error summary's list of problems."),
    summaryGap: t("roles.space.related", "Between the problems listed in the error summary."),
  },
  resizable: {
    gutter: t("roles.border.width", "Space a resize handle takes between two panels. The line sits in it; a bar or grip overhangs it."),
    hitArea: t("24px", "Width of the invisible grab target across a resize handle: 24px meets the WCAG 2.5.8 target size even when the line is a hairline."),
    hitLayer: t("1", "Lifts a resize handle's grab target over the edges of the panels beside it."),
    transition: t("roles.motion.quick", "How long a resize handle takes to change as it's pointed at, dragged or let go."),
    hoverDelay: t("0ms", "How long the pointer rests on a resize handle before it lights up. 0ms answers at once; 300ms stops a pointer sweeping past from flashing it."),
    lineWidth: t("roles.border.width", "Thickness of a resize handle's line at rest: a hairline like a divider."),
    lineWidthHover: t("3px", "Thickness of a resize handle's line while pointed at, so it reads as something to grab."),
    lineWidthActive: t("3px", "Thickness of a resize handle's line while dragged."),
    lineColor: t("roles.color.divider", "A resize handle's line at rest: the same as a divider, so a layout reads calm."),
    lineColorHover: t("roles.color.edgeStrong", "A resize handle's line, bar or grip edge while pointed at."),
    lineColorActive: t("roles.color.accent", "A resize handle's line, bar or grip edge while dragged: the accent, as the thing in hand."),
    glow: t("0 0 #0000", "A glow around a resize handle's line while pointed at or dragged, as a box-shadow. None by default."),
    focusColor: t("roles.color.focusRing", "A resize handle's line and thumb when focused from the keyboard."),
    focusWidth: t("roles.border.focusWidth", "Thickness of a resize handle's line when focused from the keyboard."),
    barLength: t("32px", "Length of the bar on a handle with appearance=\"bar\": long enough to read as a grab point."),
    barThickness: t("4px", "Thickness of the bar on a handle with appearance=\"bar\"."),
    barColor: t("roles.color.edgeStrong", "The bar on a handle with appearance=\"bar\" at rest: firmer than the line, so it reads as the grab point."),
    barRadius: t("roles.radius.pill", "Corners of the bar on a handle with appearance=\"bar\"."),
    gripBackground: t("roles.color.surface", "The chip behind the dots on a handle with appearance=\"grip\"."),
    gripBorder: t("roles.color.edge", "The edge of the chip on a handle with appearance=\"grip\"."),
    gripRadius: t("roles.radius.pill", "Corners of the chip on a handle with appearance=\"grip\"."),
    gripPadding: t("spacing.xxs", "Space between the dots and the edge of the grip chip."),
    gripDotColor: t("roles.color.textSupporting", "The dots on a handle with appearance=\"grip\"."),
    gripDotSize: t("3px", "Diameter of each dot on a handle with appearance=\"grip\"."),
    gripDotGap: t("2px", "Space between the dots on a handle with appearance=\"grip\"."),
  },
} satisfies PurposeTree;

const isLeaf = (node: unknown): node is PurposeToken | RegisterPurposeToken =>
  typeof node === "object" && node !== null && ("bind" in node || "registers" in node);

/** Every purpose path (dotted, under `roles.` or `components.`) with its default binding. */
export function defaultPurposeBindings(): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (node: PurposeTree, path: string[]) => {
    for (const [key, value] of Object.entries(node)) {
      if (isLeaf(value)) {
        if ("bind" in value) out[[...path, key].join(".")] = value.bind;
        else for (const [reg, bind] of Object.entries(value.registers)) out[[...path, key, reg].join(".")] = bind;
      } else walk(value, [...path, key]);
    }
  };
  walk(rolePurposes, ["roles"]);
  walk(componentPurposes, ["components"]);
  return out;
}

/** Every purpose path with the reason it exists, for docs. */
export function purposeReasons(): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (node: PurposeTree, path: string[]) => {
    for (const [key, value] of Object.entries(node)) {
      if (isLeaf(value)) out[[...path, key].join(".")] = value.why;
      else walk(value, [...path, key]);
    }
  };
  walk(rolePurposes, ["roles"]);
  walk(componentPurposes, ["components"]);
  return out;
}

/**
 * Whether a binding value is safe to write into a stylesheet: a token path
 * or an ordinary CSS value, never something that could close the
 * declaration or the rule it sits in.
 */
export const isSafeBindingValue = (value: string): boolean =>
  value.trim().length > 0 && value.length <= 200 && !/[;{}<>\\]|\/\*/.test(value);

/**
 * What a purpose is re-pointed at: a raw token path (`spacing.md`), another
 * purpose (`roles.color.link`) or a literal CSS value (`12px`). One string
 * serves both colour modes; `{ light, dark }` gives each mode its own.
 */
export type RoleBinding = string | { light: string; dark: string };

/**
 * Re-point purposes: keys are purpose paths (`roles.space.fieldGap`,
 * `components.button.paddingInline.default`), values a raw token path
 * (`spacing.md`) or a literal CSS value (`12px`), or one of those per
 * colour mode (`{ light: "#1d3557", dark: "#f1faee" }`).
 */
export type RoleBindingsOverride = Partial<Record<string, RoleBinding>>;

/** Role bindings with the colour mode already chosen: one value each. */
export type ResolvedRoleBindings = Partial<Record<string, string>>;

/** Whether a value is a per-mode binding: exactly a `light` and a `dark` string. */
export const isModeRoleBinding = (value: unknown): value is { light: string; dark: string } => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  const pair = value as Record<string, unknown>;
  return keys.length === 2 && typeof pair.light === "string" && typeof pair.dark === "string";
};

/** A binding's value in a colour mode. `undefined` when it is neither a string nor a `{ light, dark }` pair. */
export function resolveRoleBinding(value: unknown, mode: "light" | "dark"): string | undefined {
  if (typeof value === "string") return value;
  return isModeRoleBinding(value) ? value[mode] : undefined;
}

/** Every binding's value in a colour mode; malformed bindings are dropped. */
export function resolveRoleBindings(bindings: RoleBindingsOverride, mode: "light" | "dark"): ResolvedRoleBindings {
  const out: ResolvedRoleBindings = {};
  for (const [path, value] of Object.entries(bindings)) {
    const bind = resolveRoleBinding(value, mode);
    if (bind !== undefined) out[path] = bind;
  }
  return out;
}

/**
 * Reasons for the radius and elevation roles the theme computes itself
 * (from `controlRadiusPx`, `borderRadiusPx` and the depth primitives).
 */
export const computedRoleReasons: Record<string, string> = {
  "roles.radius.control": "Corners of buttons, fields, selects, pagination and enclosed tabs.",
  "roles.radius.surface": "Corners of panels on or over the page: popovers, cards, alerts.",
  "roles.radius.overlay": "Corners of dialogs and drawers.",
  "roles.radius.item": "Corners of small buttons and rows inside a panel: close buttons, tabs, feed items.",
  "roles.radius.chip": "Corners of compact labels: tags.",
  "roles.radius.list": "Corners of a panel of rows: menus and listboxes. The surface radius, limited so its rows can follow the curve.",
  "roles.radius.listItem": "Corners of a row in a panel of rows: menu items and options, concentric with the panel's corners.",
  "roles.elevation.raised": "Shadow of content raised a little off the page: tooltips.",
  "roles.elevation.floating": "Shadow of panels floating over the page: menus, listboxes, popovers.",
  "roles.elevation.overlay": "Shadow of dialogs and drawers above a backdrop.",
};
