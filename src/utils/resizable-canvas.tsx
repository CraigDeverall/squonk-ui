import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Source, Story } from "@storybook/addon-docs/blocks";
import { clsx } from "clsx";
import styles from "./resizable-canvas.module.css";

// Storybook treats a CSF module export as an opaque value (ModuleExport is any).
// This wrapper only passes that reference through; keep Storybook's renderer
// generics out of the published helper props and let Story resolve it at runtime.
type StoryRef = unknown;

type CodeTab = "source" | "rendered" | "a11y";

/*
 * The actual rendered component lives 4 wrappers deep inside Stage —
 * Storybook outer (.sb-story), Storybook inner ([data-name]),
 * StoryWrapper decorator, ModeBackground decorator. Skip those four
 * and return the real component element.
 */
function findRenderedRoot(stage: HTMLElement | null): Element | null {
  if (!stage) return null;
  return stage.querySelector(
    ":scope > .sb-story > [data-name] > div > div > *",
  );
}

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/*
 * Pretty-print an Element subtree as HTML — indented by depth, with
 * attributes preserved (so CSS module class names show through).
 * Void elements are self-closed; text-only children stay inline with
 * their parent tag.
 */
function formatElement(el: Element, depth = 0): string {
  const indent = "  ".repeat(depth);
  const tag = el.tagName.toLowerCase();
  const attrs = Array.from(el.attributes)
    .map((a) => ` ${a.name}="${a.value}"`)
    .join("");

  if (VOID_TAGS.has(tag)) {
    return `${indent}<${tag}${attrs} />`;
  }
  const children = Array.from(el.childNodes);
  const onlyText =
    children.length > 0 && children.every((n) => n.nodeType === Node.TEXT_NODE);
  if (children.length === 0) {
    return `${indent}<${tag}${attrs}></${tag}>`;
  }
  if (onlyText) {
    const text = (el.textContent || "").trim();
    return `${indent}<${tag}${attrs}>${text}</${tag}>`;
  }
  const inner = children
    .map((n) => {
      if (n.nodeType === Node.ELEMENT_NODE) {
        return formatElement(n as Element, depth + 1);
      }
      if (n.nodeType === Node.TEXT_NODE) {
        const t = (n.textContent || "").trim();
        return t ? `${"  ".repeat(depth + 1)}${t}` : "";
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
  return `${indent}<${tag}${attrs}>\n${inner}\n${indent}</${tag}>`;
}

function getRenderedHtml(stage: HTMLElement | null): string {
  const root = findRenderedRoot(stage);
  if (!root) return "";
  return formatElement(root);
}

function collectClasses(el: Element, out: Set<string>): void {
  el.classList.forEach((c) => out.add(c));
  for (const child of Array.from(el.children)) collectClasses(child, out);
}

/*
 * Pretty-print a CSSOM rule from its single-line `.cssText` into
 *   selector {
 *     prop: value;
 *     prop: value;
 *   }
 * Returns the rule unchanged if it's not the expected shape.
 */
function prettifyCssRule(cssText: string): string {
  const open = cssText.indexOf("{");
  const close = cssText.lastIndexOf("}");
  if (open === -1 || close === -1) return cssText;
  const selector = cssText.slice(0, open).trim();
  const body = cssText.slice(open + 1, close).trim();
  if (!body) return `${selector} {}`;
  const declarations = body
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => `  ${d};`)
    .join("\n");
  return `${selector} {\n${declarations}\n}`;
}

/*
 * Walk every stylesheet attached to the document and collect rules whose
 * selector references at least one of the classes present in the rendered
 * subtree. Includes pseudo-class variants (`.foo:hover`, `.foo:disabled`)
 * and `@media` blocks. Cross-origin stylesheets throw on `.cssRules`
 * access — skip those silently.
 */
function getRenderedCss(stage: HTMLElement | null): string {
  const root = findRenderedRoot(stage);
  if (!root) return "";
  const classes = new Set<string>();
  collectClasses(root, classes);
  if (classes.size === 0) return "";

  const out: string[] = [];
  const seen = new Set<string>();

  const matchesAny = (selector: string): boolean => {
    for (const c of classes) {
      if (selector.includes(`.${c}`)) return true;
    }
    return false;
  };

  const pushRule = (rule: CSSStyleRule, mediaText?: string): void => {
    if (!matchesAny(rule.selectorText)) return;
    const formatted = prettifyCssRule(rule.cssText);
    const wrapped = mediaText
      ? `@media ${mediaText} {\n${formatted
          .split("\n")
          .map((l) => `  ${l}`)
          .join("\n")}\n}`
      : formatted;
    if (seen.has(wrapped)) return;
    seen.add(wrapped);
    out.push(wrapped);
  };

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        pushRule(rule);
      } else if (rule instanceof CSSMediaRule) {
        for (const inner of Array.from(rule.cssRules)) {
          if (inner instanceof CSSStyleRule) pushRule(inner, rule.conditionText);
        }
      }
    }
  }

  return out.join("\n\n");
}

/*
 * Implicit-role mapping for common host elements. Mirrors the HTML AAM
 * spec, simplified — enough to be useful in a docs preview, not
 * exhaustive. Explicit `role` attributes override these.
 */
const IMPLICIT_ROLE: Record<string, string> = {
  button: "button",
  nav: "navigation",
  main: "main",
  header: "banner",
  footer: "contentinfo",
  aside: "complementary",
  article: "article",
  section: "region",
  form: "form",
  search: "search",
  img: "img",
  ul: "list",
  ol: "list",
  li: "listitem",
  table: "table",
  thead: "rowgroup",
  tbody: "rowgroup",
  tfoot: "rowgroup",
  tr: "row",
  th: "columnheader",
  td: "cell",
  select: "combobox",
  textarea: "textbox",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  p: "paragraph",
  dialog: "dialog",
  fieldset: "group",
};

function computeRole(el: Element): string | null {
  const explicit = el.getAttribute("role");
  if (explicit) return explicit.split(/\s+/)[0];
  const tag = el.tagName.toLowerCase();
  if (tag === "a") return el.hasAttribute("href") ? "link" : null;
  if (tag === "input") {
    const type = ((el as HTMLInputElement).type || "text").toLowerCase();
    if (type === "button" || type === "submit" || type === "reset")
      return "button";
    if (type === "checkbox") return "checkbox";
    if (type === "radio") return "radio";
    if (type === "range") return "slider";
    if (type === "search") return "searchbox";
    if (type === "hidden") return null;
    return "textbox";
  }
  return IMPLICIT_ROLE[tag] || null;
}

function computeAccessibleName(el: Element): string {
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => el.ownerDocument?.getElementById(id)?.textContent?.trim() || "")
      .filter(Boolean)
      .join(" ");
    if (text) return text;
  }
  const label = el.getAttribute("aria-label");
  if (label) return label;
  const tag = el.tagName.toLowerCase();
  if (tag === "img") return el.getAttribute("alt") || "";
  if (
    tag === "button" ||
    tag === "a" ||
    /^h[1-6]$/.test(tag) ||
    tag === "label" ||
    tag === "li"
  ) {
    return (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120);
  }
  const title = el.getAttribute("title");
  return title || "";
}

function computeStates(el: Element): string[] {
  const states: string[] = [];
  if (
    el.getAttribute("aria-disabled") === "true" ||
    (el as HTMLButtonElement).disabled
  )
    states.push("disabled");
  const pressed = el.getAttribute("aria-pressed");
  if (pressed) states.push(`pressed=${pressed}`);
  const checked = el.getAttribute("aria-checked");
  if (checked) states.push(`checked=${checked}`);
  const expanded = el.getAttribute("aria-expanded");
  if (expanded) states.push(`expanded=${expanded}`);
  if (el.getAttribute("aria-selected") === "true") states.push("selected");
  if (el.getAttribute("aria-current")) states.push("current");
  if (el.getAttribute("aria-hidden") === "true") states.push("hidden");
  return states;
}

type A11yLine = {
  depth: number;
  role: string;
  name: string;
  states: string[];
};

function walkA11y(el: Element, depth: number, out: A11yLine[]): void {
  const role = computeRole(el);
  const isShown = role !== null;
  if (isShown) {
    out.push({
      depth,
      role,
      name: computeAccessibleName(el),
      states: computeStates(el),
    });
  }
  for (const child of Array.from(el.children)) {
    walkA11y(child, isShown ? depth + 1 : depth, out);
  }
}

function getA11yTree(stage: HTMLElement | null): A11yLine[] {
  const root = findRenderedRoot(stage);
  if (!root) return [];
  const out: A11yLine[] = [];
  walkA11y(root, 0, out);
  return out;
}

type DisplayMode =
  | "flex-row"
  | "flex-row-wrap"
  | "flex-column"
  | "block";
type PositionMode = "relative" | "static";
type OverflowMode =
  | "visible"
  | "scroll-y"
  | "scroll-x"
  | "scroll-both"
  | "hidden";
type JustifyContent =
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around"
  | "space-evenly";
type AlignItems =
  | "stretch"
  | "flex-start"
  | "center"
  | "flex-end"
  | "baseline";
type TextAlign = "start" | "center" | "end" | "justify";
type VerticalAlign = "baseline" | "top" | "middle" | "bottom";

/*
 * Parent recipes — pre-baked Stage configurations that match the parent
 * contexts components actually live in throughout @squonkstack/ui. Picking a
 * recipe snaps display + flex direction + wrap + alignment + overflow,
 * and optionally an initial Frame size. Users who need something
 * off-recipe can toggle the raw-CSS escape hatch.
 */
export type RecipeKey =
  | "block"
  | "stack-down"
  | "stack-right"
  | "cluster"
  | "centered"
  | "inline";

type Recipe = {
  label: string;
  description: string;
  display: DisplayMode;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
  /** Wraps the Story in inline-flow text so inline-level behavior is testable. */
  inlineContext?: boolean;
  /** Snaps the Frame to this size when the recipe is selected. */
  frameSize?: { width?: number; height?: number };
};

const RECIPES: Record<RecipeKey, Recipe> = {
  block: {
    label: "Block",
    description: "Normal document flow",
    display: "block",
    justifyContent: "flex-start",
    alignItems: "stretch",
    textAlign: "start",
    verticalAlign: "baseline",
  },
  "stack-down": {
    label: "VStack",
    description: "VStack — flex column",
    display: "flex-column",
    justifyContent: "flex-start",
    alignItems: "stretch",
    textAlign: "start",
    verticalAlign: "baseline",
  },
  "stack-right": {
    label: "HStack",
    description: "HStack — flex row, no wrap",
    display: "flex-row",
    justifyContent: "flex-start",
    alignItems: "center",
    textAlign: "start",
    verticalAlign: "baseline",
  },
  cluster: {
    label: "Cluster",
    description: "Wrapping horizontal row",
    display: "flex-row-wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    textAlign: "start",
    verticalAlign: "baseline",
  },
  centered: {
    label: "Centered",
    description: "Center-center alignment in a flex parent",
    display: "flex-row",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    verticalAlign: "middle",
  },
  inline: {
    label: "Inline",
    description: "Wraps the story in surrounding inline text",
    display: "block",
    justifyContent: "flex-start",
    alignItems: "baseline",
    textAlign: "start",
    verticalAlign: "baseline",
    inlineContext: true,
  },
};

const RECIPE_KEYS = Object.keys(RECIPES) as RecipeKey[];

/*
 * Overflow choices — a separate axis from the display recipes above.
 * Display (Block / VStack / etc) and overflow (Visible / Clip / Scroll)
 * compose independently: a VStack can scroll, a Block can clip, a Cluster
 * can spill. The raw-CSS escape hatch still exposes fine-grained
 * overflow-x / overflow-y; the recipe bar surfaces the three common cases.
 */
export type OverflowChoice = "visible" | "clip" | "scroll";

const OVERFLOW_CHOICES: Array<{
  key: OverflowChoice;
  label: string;
  description: string;
  mode: OverflowMode;
}> = [
  {
    key: "visible",
    label: "Visible",
    description: "overflow: visible — content can spill past the frame",
  mode: "visible",
  },
  {
    key: "clip",
    label: "Clip",
    description: "overflow: hidden — content is clipped at the frame",
    mode: "hidden",
  },
  {
    key: "scroll",
    label: "Scroll",
    description: "overflow: auto — content scrolls inside the frame",
    mode: "scroll-both",
  },
];

const overflowChoiceFromMode = (mode: OverflowMode): OverflowChoice | null => {
  if (mode === "visible") return "visible";
  if (mode === "hidden") return "clip";
  if (mode === "scroll-y" || mode === "scroll-x" || mode === "scroll-both")
    return "scroll";
  return null;
};

/* Stage padding presets, in px. The canvas's default padding joins them
   when it is not one of these, so reset always lands on a button. */
const PADDING_PRESETS = [0, 8, 16, 24, 32];

type ResizableCanvasProps = {
  of: StoryRef;
  minHeight?: number;
  minWidth?: number;
  gutter?: number;
  /** Initial parent-pattern for this story. Defaults to "block". */
  defaultRecipe?: RecipeKey;
  /** Initial position mode (raw CSS escape hatch). */
  defaultPosition?: PositionMode;
  /**
   * Starting Frame width in px. If omitted, the Frame spans the full
   * wrapper width (100%).
   */
  defaultWidth?: number;
  /**
   * Starting Frame height in px. If omitted, the Frame's height is auto
   * (sized to content).
   */
  defaultHeight?: number;
  /**
   * Starting padding between the Frame's dashed edge and the story, in px.
   * Defaults to `gutter`. Set 0 to see how the component meets its container.
   */
  defaultPadding?: number;
};

function displayProps(mode: DisplayMode): React.CSSProperties {
  switch (mode) {
    case "flex-row":
      return { display: "flex", flexDirection: "row", flexWrap: "nowrap" };
    case "flex-row-wrap":
      return { display: "flex", flexDirection: "row", flexWrap: "wrap" };
    case "flex-column":
      return { display: "flex", flexDirection: "column", flexWrap: "nowrap" };
    case "block":
      return { display: "block" };
  }
}

function overflowProps(mode: OverflowMode): React.CSSProperties {
  switch (mode) {
    case "visible":
      return { overflow: "visible" };
    case "scroll-x":
      return { overflowX: "auto", overflowY: "visible" };
    case "scroll-y":
      return { overflowX: "visible", overflowY: "auto" };
    case "scroll-both":
      return { overflow: "auto" };
    case "hidden":
      return { overflow: "hidden" };
  }
}

type HandleKey =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "tl"
  | "tr"
  | "bl"
  | "br";
type CornerKey = "tl" | "tr" | "bl" | "br";

const handleCornerMap: Record<HandleKey, CornerKey[]> = {
  top: ["tl", "tr"],
  bottom: ["bl", "br"],
  left: ["tl", "bl"],
  right: ["tr", "br"],
  tl: ["tl"],
  tr: ["tr"],
  bl: ["bl"],
  br: ["br"],
};

type Box = { width: number; height: number };

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

/*
 * Horizontal resize is centered (both edges move dx each, cursor matches
 * the edge being dragged). Vertical resize is anchored-top (top stays in
 * flow, bottom carries the whole change at 1x rate so the cursor matches
 * the bottom edge). No variable marginTop — gap to the controls above is
 * always Controls.margin-bottom.
 */
function computeBox(
  key: HandleKey,
  start: Box,
  dx: number,
  dy: number,
  bounds: {
    minWidth: number;
    minHeight: number;
    maxHeight: number;
    wrapperWidth: number;
  },
): Box {
  const { minWidth, minHeight, maxHeight, wrapperWidth } = bounds;
  let { width, height } = start;

  if (key === "right" || key === "tr" || key === "br") {
    width = clamp(start.width + 2 * dx, minWidth, wrapperWidth);
  } else if (key === "left" || key === "tl" || key === "bl") {
    width = clamp(start.width - 2 * dx, minWidth, wrapperWidth);
  }

  if (key === "bottom" || key === "br" || key === "bl") {
    height = clamp(start.height + dy, minHeight, maxHeight);
  } else if (key === "top" || key === "tl" || key === "tr") {
    height = clamp(start.height - dy, minHeight, maxHeight);
  }

  return { width, height };
}

const ALL_HANDLES: HandleKey[] = [
  "top",
  "right",
  "bottom",
  "left",
  "tl",
  "tr",
  "bl",
  "br",
];
const ALL_CORNERS: CornerKey[] = ["tl", "tr", "bl", "br"];

export const ResizableCanvas: React.FC<ResizableCanvasProps> = ({
  of,
  minHeight = 0,
  minWidth = 0,
  gutter = 20,
  defaultRecipe = "block",
  defaultPosition = "relative",
  defaultWidth,
  defaultHeight,
  defaultPadding = gutter,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [codeTab, setCodeTab] = useState<CodeTab | null>(null);
  const [renderedHtml, setRenderedHtml] = useState("");
  const [renderedCss, setRenderedCss] = useState("");
  const [a11yLines, setA11yLines] = useState<A11yLine[]>([]);
  const [hovered, setHovered] = useState<HandleKey | null>(null);
  const [dragging, setDragging] = useState<HandleKey | null>(null);
  const [rawMode, setRawMode] = useState(false);

  /*
   * Per-docs-page sessionStorage key. The path identifies the story,
   * so each component's docs page remembers its own last-picked recipe
   * for the current browser session (cleared when the tab closes).
   */
  const storageKey =
    typeof window !== "undefined"
      ? `resizable-canvas:recipe:${window.location.pathname}${window.location.search}`
      : null;

  const initialRecipeKey: RecipeKey = (() => {
    if (!storageKey) return defaultRecipe;
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored && stored in RECIPES) return stored as RecipeKey;
    } catch {
      /* sessionStorage may be unavailable (privacy mode) — fall through */
    }
    return defaultRecipe;
  })();
  const initialRecipe = RECIPES[initialRecipeKey];

  /*
   * Overflow choice lives in its own sessionStorage slot so that picking a
   * recipe (which is now purely about display + alignment) doesn't reset the
   * reader's last overflow pick, and vice versa.
   */
  const overflowStorageKey =
    typeof window !== "undefined"
      ? `resizable-canvas:overflow:${window.location.pathname}${window.location.search}`
      : null;

  const initialOverflowMode: OverflowMode = (() => {
    if (!overflowStorageKey) return "visible";
    try {
      const stored = sessionStorage.getItem(overflowStorageKey);
      const valid: OverflowMode[] = [
        "visible",
        "scroll-y",
        "scroll-x",
        "scroll-both",
        "hidden",
      ];
      if (stored && (valid as string[]).includes(stored))
        return stored as OverflowMode;
    } catch {
      /* sessionStorage may be unavailable — fall through */
    }
    return "visible";
  })();

  /* Padding has its own slot too, so recipes and overflow leave it alone. */
  const paddingStorageKey =
    typeof window !== "undefined"
      ? `resizable-canvas:padding:${window.location.pathname}${window.location.search}`
      : null;

  const labelId = useId();
  const [padding, setPadding] = useState<number>(() => {
    if (!paddingStorageKey) return defaultPadding;
    try {
      const stored = Number(sessionStorage.getItem(paddingStorageKey) ?? NaN);
      if (Number.isFinite(stored) && stored >= 0) return stored;
    } catch {
      /* sessionStorage may be unavailable — fall through */
    }
    return defaultPadding;
  });
  const paddingChoices = PADDING_PRESETS.includes(defaultPadding)
    ? PADDING_PRESETS
    : [...PADDING_PRESETS, defaultPadding].sort((a, b) => a - b);

  const applyPadding = useCallback(
    (px: number) => {
      setPadding(px);
      if (paddingStorageKey) {
        try {
          sessionStorage.setItem(paddingStorageKey, String(px));
        } catch {
          /* sessionStorage may be unavailable — fail silently */
        }
      }
    },
    [paddingStorageKey],
  );

  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    initialRecipe.display,
  );
  const [positionMode, setPositionMode] =
    useState<PositionMode>(defaultPosition);
  const [overflowMode, setOverflowMode] = useState<OverflowMode>(
    initialOverflowMode,
  );
  const [justifyContent, setJustifyContent] = useState<JustifyContent>(
    initialRecipe.justifyContent,
  );
  const [alignItems, setAlignItems] = useState<AlignItems>(
    initialRecipe.alignItems,
  );
  const [textAlign, setTextAlign] = useState<TextAlign>(
    initialRecipe.textAlign,
  );
  const [verticalAlign, setVerticalAlign] = useState<VerticalAlign>(
    initialRecipe.verticalAlign,
  );

  /*
   * Pick a recipe: snap all Stage CSS state at once, and if the recipe
   * carries a frameSize, snap the Frame too. Persists the chosen recipe
   * key to sessionStorage so reloading the docs page keeps the reader's
   * last pick.
   */
  const applyRecipe = useCallback(
    (key: RecipeKey) => {
      const r = RECIPES[key];
      setDisplayMode(r.display);
      setJustifyContent(r.justifyContent);
      setAlignItems(r.alignItems);
      setTextAlign(r.textAlign);
      setVerticalAlign(r.verticalAlign);
      if (r.frameSize) {
        setBox((prev) => ({
          width:
            r.frameSize?.width !== undefined
              ? r.frameSize.width
              : (prev?.width ?? 0),
          height:
            r.frameSize?.height !== undefined
              ? r.frameSize.height
              : (prev?.height ?? 0),
        }));
      }
      if (storageKey) {
        try {
          sessionStorage.setItem(storageKey, key);
        } catch {
          /* sessionStorage may be unavailable — fail silently */
        }
      }
    },
    [storageKey],
  );

  /*
   * Reset everything to the component author's defaults: snap back to
   * the `defaultRecipe`, drop any frame size override the user dragged
   * out, restore the default position mode, and leave raw mode. Clears
   * the sessionStorage entry so a future reload truly starts fresh
   * rather than re-applying whatever the user last picked.
   */
  const resetToDefaults = useCallback(() => {
    setBox(null);
    setPositionMode(defaultPosition);
    setRawMode(false);
    if (storageKey) {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* sessionStorage may be unavailable — fail silently */
      }
    }
    if (overflowStorageKey) {
      try {
        sessionStorage.removeItem(overflowStorageKey);
      } catch {
        /* sessionStorage may be unavailable — fail silently */
      }
    }
    if (paddingStorageKey) {
      try {
        sessionStorage.removeItem(paddingStorageKey);
      } catch {
        /* sessionStorage may be unavailable — fail silently */
      }
    }
    setPadding(defaultPadding);
    const r = RECIPES[defaultRecipe];
    setDisplayMode(r.display);
    setOverflowMode("visible");
    setJustifyContent(r.justifyContent);
    setAlignItems(r.alignItems);
    setTextAlign(r.textAlign);
    setVerticalAlign(r.verticalAlign);
  }, [defaultPadding, defaultPosition, defaultRecipe, overflowStorageKey, paddingStorageKey, storageKey]);

  /*
   * Apply one of the three overflow choices. Maps to the underlying
   * OverflowMode (which retains finer grain for raw mode), and persists
   * the pick in sessionStorage independently of the recipe.
   */
  const applyOverflowChoice = useCallback(
    (choice: OverflowChoice) => {
      const entry = OVERFLOW_CHOICES.find((c) => c.key === choice);
      if (!entry) return;
      setOverflowMode(entry.mode);
      if (overflowStorageKey) {
        try {
          sessionStorage.setItem(overflowStorageKey, entry.mode);
        } catch {
          /* sessionStorage may be unavailable — fail silently */
        }
      }
    },
    [overflowStorageKey],
  );

  /*
   * Which (if any) recipe matches the current Stage state? Used to
   * highlight the selected recipe button. When raw-mode tweaks diverge
   * from every recipe, this returns null and no recipe is highlighted.
   */
  const selectedRecipeKey = (Object.keys(RECIPES) as RecipeKey[]).find(
    (k) => {
      const r = RECIPES[k];
      return (
        r.display === displayMode &&
        r.justifyContent === justifyContent &&
        r.alignItems === alignItems &&
        r.textAlign === textAlign &&
        r.verticalAlign === verticalAlign
      );
    },
  );
  const selectedOverflowChoice = overflowChoiceFromMode(overflowMode);
  const inlineContext =
    selectedRecipeKey === "inline" && RECIPES.inline.inlineContext;
  const [overflows, setOverflows] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const startDrag = useCallback(
    (key: HandleKey) => (e: React.MouseEvent) => {
      e.preventDefault();
      const frame = frameRef.current;
      const wrapper = wrapperRef.current;
      if (!frame || !wrapper) return;

      const start: Box = {
        width: frame.offsetWidth,
        height: frame.offsetHeight,
      };
      const startX = e.clientX;
      const startY = e.clientY;
      const wrapperWidth = wrapper.offsetWidth;
      const maxHeight = window.innerHeight;

      setDragging(key);

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        setBox(
          computeBox(key, start, dx, dy, {
            minWidth,
            minHeight,
            maxHeight,
            wrapperWidth,
          }),
        );
      };
      const onUp = () => {
        setDragging(null);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [minHeight, minWidth],
  );

  useEffect(() => {
    if (!dragging) return;
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = prev;
    };
  }, [dragging]);

  /*
   * Watch the Stage for size or content changes, and flag whenever the
   * rendered story spills past Stage's content box. Used to turn the
   * Frame's edges + corner brackets warning-red when overflow: visible.
   * Throttled to one rAF per burst of mutations.
   */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let rafId: number | null = null;
    const check = () => {
      rafId = null;
      const overflowsH = stage.scrollWidth > stage.clientWidth + 0.5;
      const overflowsV = stage.scrollHeight > stage.clientHeight + 0.5;
      setOverflows(overflowsH || overflowsV);
    };
    const schedule = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(check);
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(stage);
    const mo = new MutationObserver(schedule);
    mo.observe(stage, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });

    return () => {
      ro.disconnect();
      mo.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);

  /*
   * Refresh the Rendered / Accessibility-Tree pane content whenever the
   * Story output mutates while one of those tabs is active. Source uses
   * Storybook's <Source of={of} /> directly so doesn't need this hook.
   */
  useEffect(() => {
    if (codeTab !== "rendered" && codeTab !== "a11y") return;
    const stage = stageRef.current;
    if (!stage) return;

    const refresh = () => {
      if (codeTab === "rendered") {
        setRenderedHtml(getRenderedHtml(stage));
        setRenderedCss(getRenderedCss(stage));
      } else if (codeTab === "a11y") {
        setA11yLines(getA11yTree(stage));
      }
    };

    refresh();
    const mo = new MutationObserver(refresh);
    mo.observe(stage, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
    return () => mo.disconnect();
  }, [codeTab]);

  const showWarning = overflowMode === "visible" && overflows;

  const activeHandle = dragging ?? hovered;
  const highlightedCorners = new Set<CornerKey>(
    activeHandle ? handleCornerMap[activeHandle] : [],
  );

  const frameStyle: React.CSSProperties = box
    ? {
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: 32,
        width: box.width,
        height: box.height,
      }
    : {
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: 32,
        width: defaultWidth !== undefined ? defaultWidth : "100%",
        ...(defaultHeight !== undefined ? { height: defaultHeight } : {}),
      };

  return (
    <div className={clsx("sb-unstyled", styles.outer)}>
      <div className={styles.wrapper} ref={wrapperRef}>
        {rawMode ? (
          <div
            className={styles.controls}
            style={{ "--gutter": `${gutter}px` }}
          >
            <select
              className={styles.pill}
              aria-label="Stage display mode"
              value={displayMode}
              onChange={(e) =>
                setDisplayMode(e.target.value as DisplayMode)
              }
            >
              <option value="flex-row">display: flex (row)</option>
              <option value="flex-row-wrap">
                display: flex (row, wrap)
              </option>
              <option value="flex-column">display: flex (column)</option>
              <option value="block">display: block</option>
            </select>
            <select
              className={styles.pill}
              aria-label="Stage position mode"
              value={positionMode}
              onChange={(e) =>
                setPositionMode(e.target.value as PositionMode)
              }
            >
              <option value="relative">position: relative</option>
              <option value="static">position: static</option>
            </select>
            <select
              className={styles.pill}
              aria-label="Stage overflow mode"
              value={overflowMode}
              onChange={(e) =>
                setOverflowMode(e.target.value as OverflowMode)
              }
            >
              <option value="visible">overflow: visible</option>
              <option value="scroll-y">overflow-y: auto</option>
              <option value="scroll-x">overflow-x: auto</option>
              <option value="scroll-both">overflow: auto</option>
              <option value="hidden">overflow: hidden</option>
            </select>
            <select
              className={styles.pill}
              aria-label="Stage justify-content"
              value={justifyContent}
              onChange={(e) =>
                setJustifyContent(e.target.value as JustifyContent)
              }
            >
              <option value="flex-start">justify-content: flex-start</option>
              <option value="center">justify-content: center</option>
              <option value="flex-end">justify-content: flex-end</option>
              <option value="space-between">
                justify-content: space-between
              </option>
              <option value="space-around">
                justify-content: space-around
              </option>
              <option value="space-evenly">
                justify-content: space-evenly
              </option>
            </select>
            <select
              className={styles.pill}
              aria-label="Stage align-items"
              value={alignItems}
              onChange={(e) =>
                setAlignItems(e.target.value as AlignItems)
              }
            >
              <option value="stretch">align-items: stretch</option>
              <option value="flex-start">align-items: flex-start</option>
              <option value="center">align-items: center</option>
              <option value="flex-end">align-items: flex-end</option>
              <option value="baseline">align-items: baseline</option>
            </select>
            <select
              className={styles.pill}
              aria-label="Stage text-align"
              value={textAlign}
              onChange={(e) =>
                setTextAlign(e.target.value as TextAlign)
              }
            >
              <option value="start">text-align: start</option>
              <option value="center">text-align: center</option>
              <option value="end">text-align: end</option>
              <option value="justify">text-align: justify</option>
            </select>
            <select
              className={styles.pill}
              aria-label="Stage vertical-align"
              value={verticalAlign}
              onChange={(e) =>
                setVerticalAlign(e.target.value as VerticalAlign)
              }
            >
              <option value="baseline">vertical-align: baseline</option>
              <option value="top">vertical-align: top</option>
              <option value="middle">vertical-align: middle</option>
              <option value="bottom">vertical-align: bottom</option>
            </select>
            <input
              className={clsx(styles.pill, styles.pillNumber)}
              type="number"
              min={0}
              step={1}
              aria-label="Stage padding in pixels"
              title="padding (px)"
              value={padding}
              onChange={(e) => {
                const px = e.target.valueAsNumber;
                if (Number.isFinite(px) && px >= 0) applyPadding(px);
              }}
            />
            <div className={styles.rawResetGroup}>
              <button
                className={styles.recipeBtn}
                onClick={() => setRawMode(false)}
                title="Back to recipes"
              >
                ← recipes
              </button>
              <button
                className={styles.recipeBtn}
                onClick={resetToDefaults}
                title="Reset to the component author's defaults"
              >
                ↺ reset
              </button>
            </div>
          </div>
        ) : (
          <div
            className={styles.recipeBar}
            style={{ "--gutter": `${gutter}px` }}
          >
            <div className={styles.recipeGroup} role="group" aria-labelledby={`${labelId}-layout`}>
              <span className={styles.recipeGroupLabel} id={`${labelId}-layout`}>layout</span>
              <div className={styles.recipeGroupButtons}>
                {RECIPE_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={clsx(
                      styles.recipeBtn,
                      selectedRecipeKey === k && styles.recipeBtnSelected,
                    )}
                    aria-pressed={selectedRecipeKey === k}
                    onClick={() => applyRecipe(k)}
                    title={RECIPES[k].description}
                  >
                    {RECIPES[k].label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.recipeGroup} role="group" aria-labelledby={`${labelId}-overflow`}>
              <span className={styles.recipeGroupLabel} id={`${labelId}-overflow`}>overflow</span>
              <div className={styles.recipeGroupButtons}>
                {OVERFLOW_CHOICES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={clsx(
                      styles.recipeBtn,
                      selectedOverflowChoice === c.key && styles.recipeBtnSelected,
                    )}
                    aria-pressed={selectedOverflowChoice === c.key}
                    onClick={() => applyOverflowChoice(c.key)}
                    title={c.description}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.recipeGroup} role="group" aria-labelledby={`${labelId}-padding`}>
              <span className={styles.recipeGroupLabel} id={`${labelId}-padding`}>padding</span>
              <div className={styles.recipeGroupButtons}>
                {paddingChoices.map((px) => (
                  <button
                    key={px}
                    type="button"
                    className={clsx(
                      styles.recipeBtn,
                      padding === px && styles.recipeBtnSelected,
                    )}
                    aria-pressed={padding === px}
                    aria-label={`${px} pixels`}
                    onClick={() => applyPadding(px)}
                    title={`padding: ${px}px${px === defaultPadding ? " (default)" : ""}`}
                  >
                    {px}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.rawResetGroup}>
              <button
                className={styles.recipeBtn}
                onClick={() => setRawMode(true)}
                title="Reveal raw CSS dropdowns"
              >
                ⚙ raw
              </button>
              <button
                className={styles.recipeBtn}
                onClick={resetToDefaults}
                title="Reset to the component author's defaults"
              >
                ↺ reset
              </button>
            </div>
          </div>
        )}
        <div className={styles.frame} ref={frameRef} style={frameStyle}>
          <div
            className={clsx(
              styles.edges,
              showWarning && styles.edgesWarning,
              activeHandle != null && styles.edgesActive,
            )}
          />
          {ALL_CORNERS.map((c) => (
            <div
              key={c}
              data-corner={c}
              className={clsx(
                styles.bracket,
                activeHandle != null && styles.bracketVisible,
                highlightedCorners.has(c) && styles.bracketHighlighted,
                showWarning && styles.bracketWarning,
              )}
            />
          ))}
          <div
            className={styles.stage}
            ref={stageRef}
            style={{
              ...displayProps(displayMode),
              position: positionMode,
              ...overflowProps(overflowMode),
              padding,
              // The inline sample sits in a paragraph, so it takes body
              // line height; a tight line clips inline chips such as Code.
              ...(inlineContext
                ? { lineHeight: "var(--squonk-roles-type-body-line-height)" }
                : {}),
              justifyContent,
              alignItems,
              textAlign,
              verticalAlign,
            }}
          >
            {inlineContext ? (
              <>
                <span className={styles.inlineProse}>Lorem ipsum dolor sit amet, </span>
                <Story of={of} />
                <span className={styles.inlineProse}>
                  {" "}
                  consectetur adipiscing elit sed do eiusmod tempor.
                </span>
              </>
            ) : (
              <Story of={of} />
            )}
          </div>
          {ALL_HANDLES.map((k) => (
            <div
              className={styles.handle}
              key={k}
              data-handle={k}
              onMouseDown={startDrag(k)}
              onMouseEnter={() => setHovered(k)}
              onMouseLeave={() =>
                setHovered((cur) => (cur === k ? null : cur))
              }
            />
          ))}
        </div>
      </div>
      <div className={styles.toolbarRow}>
        {codeTab === null ? (
          <button className={styles.toggleBtn} onClick={() => setCodeTab("source")}>↓ Show Code</button>
        ) : (
          <>
            <div className={styles.tabGroup}>
              <button
                className={clsx(
                  styles.tabBtn,
                  codeTab === "source" && styles.tabBtnActive,
                )}
                onClick={() => setCodeTab("source")}
              >
                Source
              </button>
              <button
                className={clsx(
                  styles.tabBtn,
                  codeTab === "rendered" && styles.tabBtnActive,
                )}
                onClick={() => setCodeTab("rendered")}
              >
                Rendered
              </button>
              <button
                className={clsx(
                  styles.tabBtn,
                  codeTab === "a11y" && styles.tabBtnActive,
                )}
                onClick={() => setCodeTab("a11y")}
              >
                Accessibility Tree
              </button>
            </div>
            <button className={styles.toggleBtn} onClick={() => setCodeTab(null)}>← Hide Code</button>
          </>
        )}
      </div>
      {codeTab === "source" && (
        <div className={clsx("sb-unstyled", styles.codePanel)}>
          <Source of={of} />
        </div>
      )}
      {codeTab === "rendered" && (
        <>
          <div className={clsx("sb-unstyled", styles.codePanel)}>
            <div className={styles.sectionLabel}>HTML</div>
            {renderedHtml ? (
              <Source code={renderedHtml} language="html" />
            ) : (
              <div className={styles.a11yEmpty}>(no rendered output)</div>
            )}
          </div>
          {renderedCss && (
            <div className={clsx("sb-unstyled", styles.codePanel)}>
              <div className={styles.sectionLabel}>Matching CSS</div>
              <Source code={renderedCss} language="css" />
            </div>
          )}
        </>
      )}
      {codeTab === "a11y" && (
        <div className={clsx("sb-unstyled", styles.codePanel)}>
          {a11yLines.length === 0 ? (
            <div className={styles.a11yEmpty}>Presentational only</div>
          ) : (
            <pre className={clsx(styles.a11yPre, "prismjs")}>
              {a11yLines.map((line, i) => (
                <div key={i}>
                  {"  ".repeat(line.depth)}
                  <span className="token tag">{line.role}</span>
                  {line.name && (
                    <>
                      {" "}
                      <span className="token string">{`"${line.name}"`}</span>
                    </>
                  )}
                  {line.states.length > 0 && (
                    <>
                      {" "}
                      <span className="token punctuation">[</span>
                      {line.states.map((state, j) => {
                        const eq = state.indexOf("=");
                        return (
                          <React.Fragment key={j}>
                            {j > 0 && (
                              <span className="token punctuation">, </span>
                            )}
                            {eq === -1 ? (
                              <span className="token attr-name">{state}</span>
                            ) : (
                              <>
                                <span className="token attr-name">
                                  {state.slice(0, eq)}
                                </span>
                                <span className="token attr-equals">=</span>
                                <span className="token attr-value">
                                  {state.slice(eq + 1)}
                                </span>
                              </>
                            )}
                          </React.Fragment>
                        );
                      })}
                      <span className="token punctuation">]</span>
                    </>
                  )}
                </div>
              ))}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
