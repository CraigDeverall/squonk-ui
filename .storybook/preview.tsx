import previewStyles from "./preview.module.css";
import React from "react";
import { AnchorMdx, DocsContainer } from "@storybook/addon-docs/blocks";
import type { Preview } from "@storybook/react";
import { Decorator } from "@storybook/react";
import "../src/fonts.css";
import "../src/theme/tokens.css";
import { buildDocsTheme } from "./theme";
import { EXAMPLE_THEMES } from "../src/design-system/themes/themes";
import { modeStore } from "./addons/theme-controller/mode-store";
import { PanelThemeProvider, themeControllerDecorator } from "./addons/theme-controller/preview";
import { ThemeSwitcher } from "./addons/theme-controller/theme-switcher";
import { recoverFromExpiredSession } from "./pages-session";

// If a story fails to load because the Pages sign-in expired, sign in again.
recoverFromExpiredSession();

// Hook used by docs container + story decorator to re-render their
// ThemeProvider when the global mode store changes.
const useMode = () => {
  const [mode, setMode] = React.useState(modeStore.get());
  React.useEffect(() => modeStore.subscribe(setMode), []);
  return mode;
};

// Mirror the current mode onto the preview iframe's <html data-mode>.
// The CSS rules below key off this attribute. Without this the
// preview iframe never gets data-mode set (manager.ts does it for the
// manager iframe, but iframes are separate documents).
if (typeof document !== "undefined") {
  const applyMode = (mode: "light" | "dark") => {
    document.documentElement.setAttribute("data-mode", mode);
  };
  applyMode(modeStore.get());
  modeStore.subscribe(applyMode);
}

// Inter for the docs chrome. Preview iframe is a separate document so it
// needs its own font link (the manager loads it too, but iframes don't
// share <head>).
const fontsPreconnectGoogle = document.createElement("link");
fontsPreconnectGoogle.setAttribute("rel", "preconnect");
fontsPreconnectGoogle.setAttribute("href", "https://fonts.googleapis.com");
document.head.appendChild(fontsPreconnectGoogle);

const fontsPreconnectGstatic = document.createElement("link");
fontsPreconnectGstatic.setAttribute("rel", "preconnect");
fontsPreconnectGstatic.setAttribute("href", "https://fonts.gstatic.com");
fontsPreconnectGstatic.setAttribute("crossorigin", "");
document.head.appendChild(fontsPreconnectGstatic);

const fontsLink = document.createElement("link");
fontsLink.setAttribute("rel", "stylesheet");
fontsLink.setAttribute(
  "href",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
);
document.head.appendChild(fontsLink);

// Mode-aware docs surface. The preview iframe is a separate document from
// the manager iframe, so the --sb-* vars from manager.ts don't reach here —
// we define our own locally, bound to the active theme's colour roles.
//
// Covers: page surface, prose, headings, inline code, code blocks, args
// table (chrome + tbody bg + code chips + description/type cells + required
// marker), Controls column (input/select/textarea/button + hover +
// placeholder), tables, horizontal rules. Mirrors the iteration that lived
// here pre-revert.
const style = document.createElement("style");
// Docs prose rules must not reach library components in live examples,
// which set their own colours. Component classes start with squonk_ (see
// main.ts); stories render inside .sb-story / .docs-story.
const prose = (tags: string) =>
  tags
    .split(",")
    .map(
      (tag) =>
        `.sbdocs ${tag.trim()}:not(.sb-story *, .docs-story *, [class*="squonk_"], [class*="squonk_"] *)`,
    )
    .join(",\n  ");

style.innerHTML = `
  /* The docs surface is the active theme's: its page colour, surfaces, text,
     borders and links, in the current mode. PanelThemeProvider (the docs
     container) writes that theme's --squonk-* values on :root for every docs
     page. Only the Storybook frame around the docs stays neutral. */
  html {
    --sb-docs-bg:        var(--squonk-roles-color-page);
    --sb-docs-bg-raised: var(--squonk-roles-color-surface);
    --sb-docs-bg-subtle: var(--squonk-roles-color-well);
    --sb-docs-fg:        var(--squonk-roles-color-text);
    --sb-docs-fg-muted:  var(--squonk-roles-color-text-supporting);
    --sb-docs-border:    var(--squonk-roles-color-divider);
    --sb-docs-border-strong: var(--squonk-roles-color-outline);
    --sb-docs-accent:    var(--squonk-roles-color-link);
    --sb-control-bg:        var(--squonk-roles-color-field-background);
    --sb-control-bg-hover:  var(--squonk-roles-color-hover);
    --sb-control-fg:        var(--squonk-roles-color-field-text);
    --sb-control-fg-muted:  var(--squonk-roles-color-placeholder);
    --sb-control-border:    var(--squonk-roles-color-field-border);
    /* Inline code: prose chips lift off the page; chips in the args table's
       raised cells recess. */
    --sb-chip-bg-prose: var(--squonk-roles-color-well);
    --sb-chip-bg: var(--squonk-roles-color-page);
    --sb-chip-border: var(--squonk-roles-color-divider);
  }
  html[data-mode="light"] {
    /* One Light by Hoon Wei Ting (based on Atom's One Light Syntax). */
    --code-bg: #fafafa;
    --code-fg: #383a42;
    --code-comment: #a0a1a7;
    --code-punctuation: #383a42;
    --code-keyword: #a626a4;
    --code-string: #50a14f;
    --code-number: #986801;
    --code-function: #4078f2;
    --code-class: #c18401;
    --code-tag: #e45649;
    --code-attr-name: #986801;
    --code-operator: #0184bc;
  }
  html[data-mode="dark"] {
    /* One Dark by Hoon Wei Ting (based on Atom's One Dark Syntax). */
    --code-bg: #282c34;
    --code-fg: #abb2bf;
    --code-comment: #5c6370;
    --code-punctuation: #abb2bf;
    --code-keyword: #c678dd;
    --code-string: #98c379;
    --code-number: #d19a66;
    --code-function: #61afef;
    --code-class: #e5c07b;
    --code-tag: #e06c75;
    --code-attr-name: #d19a66;
    --code-operator: #56b6c2;
  }

  /* ============================================================
     Page surface
     ============================================================ */
  /* html + body get the surface bg so the iframe never paints
     browser-default white between page navigations — matches
     preview-head.html's inline early-paint. */
  html, body {
    background-color: var(--sb-docs-bg) !important;
    color: var(--sb-docs-fg) !important;
  }
  .sbdocs-wrapper,
  .sbdocs.sbdocs-preview,
  .docs-story {
    background-color: var(--sb-docs-bg) !important;
    color: var(--sb-docs-fg) !important;
  }
  /* keep the inline story container neutral so it doesn't fight a
     wrapper like ResizableCanvas when used */
  .sbdocs .docs-story > div:first-child {
    background: transparent !important;
  }

  /* ============================================================
     Prose
     ============================================================ */
  .sbdocs.sbdocs-content,
  ${prose("p, li, td, th, strong, em")} {
    color: var(--sb-docs-fg) !important;
  }
  ${prose("h1, h2, h3, h4, h5, h6")},
  .sbdocs-h1, .sbdocs-h2, .sbdocs-h3 {
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--sb-docs-fg) !important;
  }
  /* Storybook MDX puts a thin border-bottom under h1/h2 in docs pages.
     Its default colour is barely visible in dark mode — promote to the
     stronger border tone so it reads in both modes. */
  ${prose("h1, h2")},
  .sbdocs-h1,
  .sbdocs-h2 {
    border-bottom-color: var(--sb-docs-border-strong) !important;
  }

  /* ============================================================
     Code — inline chips + block <pre>
     ============================================================ */
  ${prose("code")} {
    background: var(--sb-chip-bg-prose) !important;
    color: var(--sb-docs-fg) !important;
    border: 1px solid var(--sb-chip-border) !important;
    box-shadow: none !important;
  }
  .sbdocs pre {
    background: var(--code-bg) !important;
    color: var(--code-fg) !important;
    border: 1px solid var(--sb-docs-border);
  }

  /* ============================================================
     Prism token theming — One Light / One Dark by Hoon Wei Ting
     (based on Atom's One Light / One Dark Syntax). Storybook ships
     its own light-mode Prism palette; these rules override it for
     both modes via CSS vars set above.
     ============================================================ */
  .sbdocs .token.comment,
  .sbdocs .token.prolog,
  .sbdocs .token.doctype,
  .sbdocs .token.cdata {
    color: var(--code-comment) !important;
    font-style: italic;
  }
  .sbdocs .token.punctuation,
  .sbdocs .token.attr-equals {
    color: var(--code-punctuation) !important;
  }
  .sbdocs .token.property,
  .sbdocs .token.boolean,
  .sbdocs .token.number,
  .sbdocs .token.constant,
  .sbdocs .token.symbol,
  .sbdocs .token.deleted {
    color: var(--code-number) !important;
  }
  .sbdocs .token.tag,
  .sbdocs .token.selector,
  .sbdocs .token.variable,
  .sbdocs .token.url {
    color: var(--code-tag) !important;
  }
  .sbdocs .token.attr-name {
    color: var(--code-attr-name) !important;
  }
  .sbdocs .token.string,
  .sbdocs .token.char,
  .sbdocs .token.attr-value,
  .sbdocs .token.inserted {
    color: var(--code-string) !important;
  }
  .sbdocs .token.operator,
  .sbdocs .token.entity,
  .sbdocs .token.regex,
  .sbdocs .token.atrule {
    color: var(--code-operator) !important;
  }
  .sbdocs .token.keyword,
  .sbdocs .token.important {
    color: var(--code-keyword) !important;
  }
  .sbdocs .token.function {
    color: var(--code-function) !important;
  }
  .sbdocs .token.class-name,
  .sbdocs .token.builtin {
    color: var(--code-class) !important;
  }

  /* ============================================================
     Tables + horizontal rules
     ============================================================ */
  ${prose("hr")} {
    border-color: var(--sb-docs-border) !important;
  }
  /* Long inline code in a sentence wraps rather than widening the page;
     code blocks keep scrolling. */
  ${prose(":not(pre) > code")} {
    white-space: normal !important;
    overflow-wrap: anywhere !important;
  }
  /* Markdown tables scroll sideways on narrow screens rather than widening
     the page. The args table keeps its own layout. */
  ${prose("table:not(.docblock-argstable)")} {
    display: block;
    max-width: 100%;
    overflow-x: auto;
  }
  ${prose("table th, table td")} {
    border-color: var(--sb-docs-border) !important;
  }

  /* ============================================================
     Args / Props table chrome
     ============================================================ */
  .sbdocs .docblock-argstable,
  .sbdocs table.docblock-argstable {
    color: var(--sb-docs-fg) !important;
    border-collapse: separate;
    border-spacing: 0;
  }
  .sbdocs .docblock-argstable thead th,
  .sbdocs .docblock-argstable-head th {
    background: transparent !important;
    color: var(--sb-docs-fg-muted) !important;
    border-bottom: none !important;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    font-size: 0.72rem;
  }
  .sbdocs .docblock-argstable tbody td,
  .sbdocs .docblock-argstable-body td {
    background: var(--sb-docs-bg-raised) !important;
    color: var(--sb-docs-fg) !important;
  }
  /* Storybook adds a drop-shadow filter to the tbody to "lift" it off
     the page — in dark mode that reads as a black halo. Drop it. */
  .sbdocs .docblock-argstable tbody,
  .sbdocs table.docblock-argstable tbody {
    filter: none !important;
  }
  /* Type chips + arg-name chips inside cells. Storybook 8 renders these
     as emotion-styled <span class="css-…">, not <code>, so we target the
     spans directly. The selector is scoped to argstable cells to avoid
     touching prose spans elsewhere on the page. */
  .sbdocs .docblock-argstable code,
  .sbdocs .docblock-argstable .docblock-argstable-body code,
  .sbdocs .docblock-argstable td span[class^="css-"] {
    background: var(--sb-chip-bg) !important;
    color: var(--sb-docs-fg) !important;
    border: 1px solid transparent !important;
    box-shadow: none !important;
  }
  /* Description / type-with-jsdoc / label cells — muted */
  .sbdocs .docblock-argstable [class*="Description"],
  .sbdocs .docblock-argstable [class*="TypeWithJsDoc"],
  .sbdocs .docblock-argstable [class*="StyledLabelCell"] + td {
    color: var(--sb-docs-fg-muted) !important;
  }
  /* Boolean toggles draw the unselected option at 50% opacity, below AA.
     Use the solid muted tone instead; the selected option keeps its colour. */
  .sbdocs .docblock-argstable label > input[role="switch"]:checked + span,
  .sbdocs .docblock-argstable label > input[role="switch"]:not(:checked) + span + span {
    color: var(--sb-docs-fg-muted) !important;
  }
  /* Required asterisk: the link green, which has contrast in both modes */
  .sbdocs .docblock-argstable [class*="Required"] {
    color: var(--sb-docs-accent) !important;
  }

  /* Browsers give form controls their own font (Arial), so the docs'
     buttons and fields take the page's instead. */
  ${prose("button, input, select, textarea")} {
    font-family: inherit;
  }

  /* ============================================================
     Controls column — Set string / Set boolean / Set object inputs,
     selects, textareas, BooleanControl pill, reset button. Storybook
     ships these hardcoded for light; recolor for dark mode.
     ============================================================ */
  .sbdocs .docblock-argstable button,
  .sbdocs .docblock-argstable input[type="text"],
  .sbdocs .docblock-argstable input[type="number"],
  .sbdocs .docblock-argstable input[type="search"],
  .sbdocs .docblock-argstable input:not([type]),
  .sbdocs .docblock-argstable textarea,
  .sbdocs .docblock-argstable select {
    background: var(--sb-control-bg) !important;
    color: var(--sb-control-fg) !important;
    border: 1px solid var(--sb-control-border) !important;
    box-shadow: none !important;
  }
  .sbdocs .docblock-argstable button:hover,
  .sbdocs .docblock-argstable input[type="text"]:hover,
  .sbdocs .docblock-argstable input[type="number"]:hover,
  .sbdocs .docblock-argstable input[type="search"]:hover,
  .sbdocs .docblock-argstable input:not([type]):hover,
  .sbdocs .docblock-argstable textarea:hover,
  .sbdocs .docblock-argstable select:hover {
    background: var(--sb-control-bg-hover) !important;
    color: var(--sb-control-fg) !important;
  }
  .sbdocs .docblock-argstable input::placeholder,
  .sbdocs .docblock-argstable textarea::placeholder {
    color: var(--sb-control-fg-muted) !important;
    opacity: 1;
  }

  /* ============================================================
     Scrollbars — fully transparent track, inset thumb. Mirrors the
     manager-side rule in .storybook/manager.ts; the preview iframe
     is a separate document and inherits nothing from the manager,
     so without this it falls back to the browser default grey.
     ============================================================ */
  html, body, * {
    scrollbar-width: thin;
    scrollbar-color: var(--sb-docs-fg-muted) transparent;
  }
  html::-webkit-scrollbar,
  body::-webkit-scrollbar,
  *::-webkit-scrollbar {
    width: 12px;
    height: 12px;
    background: transparent;
  }
  html::-webkit-scrollbar-track,
  body::-webkit-scrollbar-track,
  *::-webkit-scrollbar-track {
    background: transparent;
  }
  html::-webkit-scrollbar-thumb,
  body::-webkit-scrollbar-thumb,
  *::-webkit-scrollbar-thumb {
    background: var(--sb-docs-fg-muted);
    background-clip: padding-box;
    border: 3px solid transparent;
    border-radius: 9999px;
  }
  html::-webkit-scrollbar-thumb:hover,
  body::-webkit-scrollbar-thumb:hover,
  *::-webkit-scrollbar-thumb:hover {
    background: var(--sb-docs-fg);
    background-clip: padding-box;
  }
  html::-webkit-scrollbar-corner,
  body::-webkit-scrollbar-corner,
  *::-webkit-scrollbar-corner {
    background: transparent;
  }
`;
document.head.appendChild(style);

// Flex items default to min-width: auto, which lets a wide story (a table, for
// example) stretch the page instead of scrolling inside its own container.

// Links to other sites open in a new tab, so the docs stay open; links within
// the docs (?path=…, #anchors) keep Storybook's in-place navigation.
const isExternal = (href?: string) => {
  if (!href || !/^https?:\/\//.test(href)) return false;
  try {
    return new URL(href).origin !== window.location.origin;
  } catch {
    return false;
  }
};

const DocsLink: React.FC<React.ComponentProps<typeof AnchorMdx>> = (props) =>
  isExternal(props.href) ? (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ) : (
    <AnchorMdx {...props} />
  );

const ThemedDocsContainer: React.FC<
  React.ComponentProps<typeof DocsContainer>
> = ({ children, context }) => {
  const mode = useMode();
  return (
    <DocsContainer context={context} theme={buildDocsTheme(mode)}>
      {/* The panel's theme, so re-pointed purposes and changed primitives reach
          what a docs page draws itself (the introduction, foundations), not only
          its embedded stories. */}
      <PanelThemeProvider>{children}</PanelThemeProvider>
    </DocsContainer>
  );
};

// Keep `parameters` as an object literal on the default export: Storybook reads
// storySort statically and cannot resolve spreads or separate exports.
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          "Get started",
          ["Introduction", "Getting started", "Working with your agent"],
          "Foundations",
          ["Overview", "Colour", "Typography", "Space and layout", "Shape and elevation", "Motion", "Icons", "Accessibility", "Theme", "Purpose tokens", "*"],
          "Patterns",
          [
            "Overview",
            "Choosing components",
            "Page layouts and app shells",
            "Writing for the interface",
            "Density and registers",
            "Forms",
            ["Overview", "The basics", "Validation", "Server errors", "Conditional and repeating fields", "Multi-step forms", "Custom fields", "Examples"],
            "Labels, help and validation",
            "Switches, checkboxes and saving",
            "Choosing a selection control",
            "Settings and preferences",
            "Labels: Badge or Tag",
            "Cards and landing sections",
            "Illustrations, icons and images",
            "Toasts, alerts and dialogs",
            "Loading and progress",
            "Empty and error states",
            "Onboarding and first run",
            "Destructive actions",
            "Overlays and disclosures",
            "Menus and commands",
            "Focus management",
            "App navigation",
            "QR handoff",
            "Printing",
            "Lists, tables and cards",
            "Search, filtering and sorting",
            "Tables and grids",
            "Dashboards and summaries",
            "Data visualization",
            "*",
          ],
          "Components",
          ["Overview", "Actions", "Inputs", "Feedback", "Overlays", "Navigation", "Data display", "Text and icons", "Layout", ["Page structure", "Surfaces", "Stacks and grids"], "Theme and motion", "*"],
          "Examples",
          "Contributing",
          ["Developing the library", "Change log", "*"],
        ],
      },
    },
    docs: {
      container: ThemedDocsContainer,
      components: { a: DocsLink },
    },
    previewTabs: {
      "storybook/docs/panel": {
        hidden: true,
      },
    },
  },

  globalTypes: {
    theme: {
      description: "Example theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: EXAMPLE_THEMES.map((theme) => ({ value: theme.id, title: theme.name, right: theme.description.split(":")[0] })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "squonk" },
};

// Decorator order: outermost first. The story wrapper supplies the flex
// centering container; themeControllerDecorator (inner) provides the
// ThemeProvider that picks up live overrides from the side panel plus
// the ModeBackground div that paints the mode-aware backdrop.
export const decorators: Decorator[] = [
  // The examples are a showcase: each gets a bar to switch between the
  // example themes, outside the theme so the bar itself never changes.
  (Story, context) =>
    context.title.startsWith("Examples/") ? (
      <>
        <ThemeSwitcher />
        <Story />
      </>
    ) : (
      <Story />
    ),
  (Story, context) => (
    <div className={previewStyles.storyWrapper} data-fullscreen={context.parameters.layout === "fullscreen" || undefined}>
      <Story />
    </div>
  ),
  themeControllerDecorator,
];

export default preview;
