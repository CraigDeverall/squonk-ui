// The story page. It is bundled per installed @squonk/ui version (see
// build.ts) with the library's stories bundle, and runs in two places: inside
// an MCP Apps host, where the story id arrives with the tool call, and on the
// local preview server, where the page carries its input inline. Either way it
// renders the story as Storybook would (args, decorators, render) with a
// Controls panel built from its argTypes, using the library's own components.
import { App } from "@modelcontextprotocol/ext-apps";
import {
  Component,
  createContext,
  createElement,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  SquonkThemeProvider,
  EXAMPLE_THEMES,
  Presentation,
  RadioGroup,
  Select,
  StoryArgsContext,
  Switch,
  TextField,
  Textarea,
  parseThemeDocument,
  stories,
  themeFonts,
  type StoryRecord,
} from "virtual:squonk-ui-stories";
import type { StoryInput, StoryStatus } from "./protocol.ts";

declare global {
  interface Window {
    __PRODUCT_UI_STORY__?: StoryInput;
    __PRODUCT_UI_STORY_STATUS__?: StoryStatus;
  }
}

type Args = Record<string, unknown>;
type ArgType = {
  name?: string;
  description?: string;
  control?: false | string | { type?: string; min?: number; max?: number; step?: number; labels?: Record<string, string> };
  options?: unknown[];
  mapping?: Record<string, unknown>;
  table?: { disable?: boolean; defaultValue?: { summary?: string } };
  type?: { name?: string; required?: boolean };
  if?: { arg?: string; truthy?: boolean; exists?: boolean; eq?: unknown; neq?: unknown };
};
type Decorator = (story: ComponentType<{ args?: Args }>, context: StoryContext) => ReactNode;
type StoryContext = {
  id: string;
  title: string;
  name: string;
  kind: string;
  story: string;
  args: Args;
  initialArgs: Args;
  argTypes: Record<string, ArgType>;
  parameters: Record<string, unknown>;
  globals: Record<string, unknown>;
  viewMode: "story";
  loaded: Record<string, unknown>;
  updateArgs: (next: Args) => void;
};
type Prepared = {
  record: StoryRecord;
  render: (args: Args, context: StoryContext) => ReactNode;
  decorators: Decorator[];
  parameters: Record<string, unknown>;
  args: Args;
  argTypes: Record<string, ArgType>;
  /** argTypes the story or its meta wrote, as opposed to inferred from props. */
  explicit: Set<string>;
};

const byId = new Map(stories.map((record) => [record.id, record]));
/** A theme document: what preview_story's customTheme and the page's Theme editor hold. */
type ThemeDoc = {
  version?: 1;
  primitives?: Record<string, unknown>;
  bindings?: Record<string, string>;
  addedPrimitives?: Record<string, { light: string; dark: string }>;
  roleBindings?: Record<string, string | { light: string; dark: string }>;
};

/** The Theme picker's value for the custom theme. */
const CUSTOM = "custom";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

const docOf = (theme: { primitives: Record<string, unknown>; roleBindings: Record<string, string | { light: string; dark: string }> }): ThemeDoc => ({
  version: 1,
  primitives: theme.primitives,
  roleBindings: theme.roleBindings,
});

/** A theme over a base, as the server merges it: palettes key by key, bindings merged, the custom theme winning. */
function mergeTheme(base: ThemeDoc | undefined, custom: ThemeDoc): ThemeDoc {
  const bp = base?.primitives ?? {};
  const cp = custom.primitives ?? {};
  const primitives: Record<string, unknown> = { ...bp, ...cp };
  for (const palette of ["colors", "darkColors"]) {
    if (isRecord(bp[palette]) || isRecord(cp[palette])) primitives[palette] = { ...(bp[palette] as object), ...(cp[palette] as object) };
  }
  return {
    version: 1,
    primitives,
    bindings: { ...base?.bindings, ...custom.bindings },
    addedPrimitives: { ...base?.addedPrimitives, ...custom.addedPrimitives },
    roleBindings: { ...base?.roleBindings, ...custom.roleBindings },
  };
}

/** preview_story's customTheme, put over the example theme it's based on. */
function customFrom(input: StoryInput): { name: string; doc: ThemeDoc } | undefined {
  if (!input.customTheme) return undefined;
  const { basedOn, name, primitives, bindings, addedPrimitives, roleBindings } = input.customTheme;
  const rest: ThemeDoc = { primitives, bindings, addedPrimitives, roleBindings };
  const base = basedOn ? EXAMPLE_THEMES.find((t) => t.id === basedOn) : undefined;
  return { name: name?.trim() || (base ? `${base.name}, customised` : "Custom"), doc: mergeTheme(base && docOf(base), rest) };
}

/** Drops empty groups, so the editor shows a tidy document. */
function tidy(doc: ThemeDoc): ThemeDoc {
  const out: ThemeDoc = { version: 1 };
  for (const key of ["primitives", "bindings", "addedPrimitives", "roleBindings"] as const) {
    const value = doc[key];
    if (value && Object.keys(value).length) (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

/**
 * The active theme as an editable document. Apply checks it with the
 * library's own parser and shows it as the custom theme; the text can be
 * copied into an app's SquonkThemeProvider.
 */
function ThemeEditor({ doc, onApply }: { doc: ThemeDoc; onApply: (doc: ThemeDoc) => void }) {
  const [textValue, setTextValue] = useState(() => JSON.stringify(tidy(doc), null, 2));
  const [error, setError] = useState<string | undefined>();
  const apply = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(textValue);
    } catch (e) {
      setError(`Not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    if (!isRecord(parsed)) {
      setError("A theme is a JSON object with primitives and roleBindings.");
      return;
    }
    const result = parseThemeDocument(JSON.stringify({ version: 1, ...parsed }));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(undefined);
    onApply(result.doc as ThemeDoc);
  };
  return (
    <div className="sv-theme-editor">
      <Textarea
        label="Theme document"
        helperText="Edit and apply to see it live; copy it into your app's SquonkThemeProvider (primitives, roleBindings)."
        error={error}
        rows={12}
        spellCheck={false}
        value={textValue}
        onChange={(event) => setTextValue(event.target.value)}
      />
      <Button variant="secondary" onClick={apply}>
        Apply theme
      </Button>
    </div>
  );
}

/** The library's own theme: the first example theme, which changes nothing. */
const DEFAULT_THEME = "squonk";

const themeById = (id: string | undefined) => EXAMPLE_THEMES.find((t) => t.id === id) ?? EXAMPLE_THEMES.find((t) => t.id === DEFAULT_THEME)!;

/**
 * Loads an example theme's web fonts from Google Fonts. The story page's MCP
 * resource allows fonts.googleapis.com and fonts.gstatic.com; a host that
 * still blocks them shows each font's fallbacks instead.
 */
function useThemeFonts(families: string[]) {
  const key = families.join("|");
  useEffect(() => {
    if (!key) return;
    const id = `theme-fonts-${key.replace(/[^a-z0-9]+/gi, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${key
      .split("|")
      .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
      .join("&")}&display=swap`;
    document.head.append(link);
  }, [key]);
}
const WIDTHS = [
  { label: "Fill", value: "fill" },
  { label: "Phone (375)", value: "375" },
  { label: "Tablet (768)", value: "768" },
  { label: "Desktop (1280)", value: "1280" },
];

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : value ? [value as T] : []);
const asObject = (value: unknown): Record<string, unknown> => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});

function mergeArgTypes(...layers: unknown[]): Record<string, ArgType> {
  const merged: Record<string, ArgType> = {};
  for (const layer of layers) {
    for (const [name, value] of Object.entries(asObject(layer))) {
      const prev = merged[name] ?? {};
      const next = asObject(value) as ArgType;
      merged[name] = { ...prev, ...next, table: { ...prev.table, ...next.table }, type: { ...prev.type, ...next.type } };
    }
  }
  return merged;
}

/** Normalises CSF3 objects and CSF2 functions into one shape. */
function prepare(record: StoryRecord): Prepared {
  const meta = asObject(record.meta);
  const raw = record.story as Record<string, unknown> | ((...a: unknown[]) => ReactNode) | undefined;
  const story: Record<string, unknown> =
    typeof raw === "function" ? { ...(raw as unknown as Record<string, unknown>), render: raw } : asObject(raw);
  const component = (story.component ?? meta.component) as ComponentType<Args> | undefined;
  const render =
    (story.render as Prepared["render"] | undefined) ??
    (meta.render as Prepared["render"] | undefined) ??
    ((args: Args) => (component ? createElement(component, args) : <ErrorPanel message="This story has no render function or component." />));
  return {
    record,
    render,
    // Story decorators wrap the story first, then the meta's, as in Storybook.
    decorators: [...asArray<Decorator>(story.decorators), ...asArray<Decorator>(meta.decorators)],
    parameters: { ...asObject(meta.parameters), ...asObject(story.parameters) },
    args: { ...asObject(meta.args), ...asObject(story.args) },
    argTypes: mergeArgTypes(record.argTypes, meta.argTypes, story.argTypes),
    explicit: new Set([...Object.keys(asObject(meta.argTypes)), ...Object.keys(asObject(story.argTypes))]),
  };
}

/** Applies argTypes' `mapping`, as Storybook does before render. */
function mapArgs(args: Args, argTypes: Record<string, ArgType>): Args {
  const out: Args = {};
  for (const [key, value] of Object.entries(args)) {
    const mapping = argTypes[key]?.mapping;
    out[key] = mapping && typeof value === "string" && value in mapping ? mapping[value] : value;
  }
  return out;
}

const StoryContextReact = createContext<StoryContext | null>(null);

/**
 * The story as a component tree: the render in its own component (so hooks in
 * a render function work), wrapped by each decorator in its own component.
 * Built once per story, so changing an arg re-renders without remounting.
 */
function compose(prepared: Prepared): ComponentType {
  function StoryRender() {
    const context = useContext(StoryContextReact)!;
    return <>{prepared.render(context.args, context)}</>;
  }
  let Inner: ComponentType = StoryRender;
  for (const decorator of prepared.decorators) {
    const Next = Inner;
    Inner = function Decorated() {
      const context = useContext(StoryContextReact)!;
      const Story = useMemo(
        () =>
          function Story(props?: { args?: Args }) {
            const outer = useContext(StoryContextReact)!;
            if (!props?.args) return <Next />;
            return (
              <StoryContextReact.Provider value={{ ...outer, args: { ...outer.args, ...props.args } }}>
                <Next />
              </StoryContextReact.Provider>
            );
          },
        [],
      );
      return <>{decorator(Story, context)}</>;
    };
  }
  return Inner;
}

/**
 * Each story's prepared shape and component tree, built the first time it is
 * shown and kept, so re-renders (and remounts on reset) reuse the same
 * component types.
 */
const prepared = new Map<string, { prepared: Prepared; Composed: ComponentType }>();
function storyFor(record: StoryRecord) {
  let entry = prepared.get(record.id);
  if (!entry) {
    const shape = prepare(record);
    entry = { prepared: shape, Composed: compose(shape) };
    prepared.set(record.id, entry);
  }
  return entry;
}

class Boundary extends Component<{ onError: (error: Error) => void; children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.error ? <ErrorPanel message={this.state.error.message} stack={this.state.error.stack} /> : this.props.children;
  }
}

function ErrorPanel({ message, stack }: { message: string; stack?: string }) {
  return (
    <pre className="sv-error" role="alert">
      {message}
      {stack ? `\n\n${stack.split("\n").slice(1, 6).join("\n")}` : ""}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Controls

type ControlKind = "boolean" | "number" | "range" | "text" | "color" | "date" | "select" | "radio" | "object" | "none";

const isElementLike = (value: unknown): boolean =>
  isValidElement(value) || typeof value === "function" || (Array.isArray(value) && value.some(isElementLike));

function controlKind(argType: ArgType, value: unknown, explicit: boolean): ControlKind {
  if (argType.control === false || argType.table?.disable) return "none";
  if (isElementLike(value)) return "none";
  const named = typeof argType.control === "string" ? argType.control : argType.control?.type;
  const options = argType.options ?? (argType.mapping ? Object.keys(argType.mapping) : undefined);
  switch (named) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "range":
      return "range";
    case "text":
      return "text";
    case "color":
      return "color";
    case "date":
      return "date";
    case "select":
    case "multi-select":
      return options ? "select" : "text";
    case "radio":
    case "inline-radio":
      return options ? "radio" : "text";
    case "object":
    case "check":
    case "inline-check":
      // Inferred object props (arrays of options, column definitions) only get
      // a control when the story gives them a value to edit.
      return explicit || value !== undefined ? "object" : "none";
    case "file":
      return "none";
  }
  if (options) return "select";
  if (argType.type?.name === "function") return "none";
  switch (typeof value) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "string":
      return "text";
    case "object":
      return value === null ? "text" : "object";
  }
  return "none";
}

function visible(argType: ArgType, args: Args): boolean {
  const condition = argType.if;
  if (!condition?.arg) return true;
  const value = args[condition.arg];
  if ("truthy" in condition) return Boolean(value) === Boolean(condition.truthy);
  if ("exists" in condition) return (value !== undefined) === Boolean(condition.exists);
  if ("eq" in condition) return value === condition.eq;
  if ("neq" in condition) return value !== condition.neq;
  return Boolean(value);
}

const firstSentence = (text = "") => {
  const plain = text.replace(/`/g, "").replace(/\s+/g, " ").trim();
  const end = plain.search(/\.(\s|$)/);
  return end === -1 ? plain : plain.slice(0, end + 1);
};

function JsonControl({ name, value, help, onChange }: { name: string; value: unknown; help?: string; onChange: (v: unknown) => void }) {
  const format = (v: unknown) => (v === undefined ? "" : JSON.stringify(v, null, 2));
  const [text, setText] = useState(() => format(value));
  const [error, setError] = useState<string>();
  const last = useRef(value);
  // Follow changes made elsewhere (reset, or the story updating its own args).
  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      setText(format(value));
      setError(undefined);
    }
  }, [value]);
  return (
    <Textarea
      label={name}
      value={text}
      rows={Math.min(8, Math.max(2, text.split("\n").length))}
      helperText={error ? undefined : help}
      error={error}
      spellCheck={false}
      className="sv-json"
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        if (next.trim() === "") {
          setError(undefined);
          last.current = undefined;
          onChange(undefined);
          return;
        }
        try {
          const parsed = JSON.parse(next);
          setError(undefined);
          last.current = parsed;
          onChange(parsed);
        } catch (e) {
          setError(`Not valid JSON: ${(e as Error).message}`);
        }
      }}
    />
  );
}

function Control({ name, argType, kind, value, onChange }: { name: string; argType: ArgType; kind: ControlKind; value: unknown; onChange: (v: unknown) => void }) {
  const help = firstSentence(argType.description) || undefined;
  const control = typeof argType.control === "object" && argType.control ? argType.control : {};
  const options = argType.options ?? (argType.mapping ? Object.keys(argType.mapping) : []);
  const label = (option: unknown) => control.labels?.[String(option)] ?? (typeof option === "string" ? option : JSON.stringify(option));
  switch (kind) {
    case "boolean":
      return <Switch label={name} helperText={help} checked={Boolean(value)} onChange={(checked) => onChange(checked)} />;
    case "number":
    case "range":
      return (
        <TextField
          label={name}
          helperText={help}
          type={kind === "range" ? "range" : "number"}
          min={control.min}
          max={control.max}
          step={control.step}
          value={typeof value === "number" ? String(value) : ""}
          onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
        />
      );
    case "color":
    case "text":
      return (
        <TextField
          label={name}
          helperText={help}
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(event) => onChange(event.target.value === "" ? undefined : event.target.value)}
        />
      );
    case "date":
      return (
        <TextField
          label={name}
          helperText={help}
          type="date"
          value={value ? new Date(value as string | number).toISOString().slice(0, 10) : ""}
          onChange={(event) => onChange(event.target.value ? new Date(event.target.value).getTime() : undefined)}
        />
      );
    case "select": {
      const index = options.findIndex((option) => option === value);
      return (
        <Select
          label={name}
          helperText={help}
          placeholder="Not set"
          clearable
          options={options.map((option, i) => ({ value: String(i), label: label(option) }))}
          value={index === -1 ? "" : String(index)}
          onChange={(picked) => onChange(picked === "" ? undefined : options[Number(picked)])}
        />
      );
    }
    case "radio": {
      const index = options.findIndex((option) => option === value);
      return (
        <RadioGroup
          name={`control-${name}`}
          legend={name}
          helperText={help}
          direction="row"
          options={options.map((option, i) => ({ value: String(i), label: label(option) }))}
          value={index === -1 ? undefined : String(index)}
          onChange={(picked) => onChange(options[Number(picked)])}
        />
      );
    }
    case "object":
      return <JsonControl name={name} value={value} help={help} onChange={onChange} />;
    default:
      return null;
  }
}

function ControlsPanel({ prepared, args, onChange }: { prepared: Prepared; args: Args; onChange: (name: string, value: unknown) => void }) {
  const controlsParam = asObject(prepared.parameters.controls);
  if (controlsParam.disable) return <p className="sv-note">This story has no controls: try it as it is.</p>;
  const matches = (name: string, rule: unknown) =>
    rule instanceof RegExp ? rule.test(name) : Array.isArray(rule) ? rule.includes(name) : typeof rule === "string" ? rule === name : false;
  const names = [...new Set([...Object.keys(prepared.argTypes), ...Object.keys(args)])].filter(
    (name) =>
      (controlsParam.include === undefined || matches(name, controlsParam.include)) &&
      (controlsParam.exclude === undefined || !matches(name, controlsParam.exclude)),
  );
  const rows = names
    .map((name) => {
      const argType = prepared.argTypes[name] ?? {};
      return { name, argType, kind: controlKind(argType, args[name], prepared.explicit.has(name)) };
    })
    .filter((row) => row.kind !== "none" && visible(row.argType, args));
  if (rows.length === 0) return <p className="sv-note">This story has no controls: try it as it is.</p>;
  return (
    <div className="sv-controls" role="group" aria-label="Controls">
      {rows.map((row) => (
        <div key={row.name} className={row.kind === "object" ? "sv-control sv-control-wide" : "sv-control"}>
          <Control name={row.name} argType={row.argType} kind={row.kind} value={args[row.name]} onChange={(value) => onChange(row.name, value)} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The viewer

function StoryView({
  record,
  args,
  setArgs,
  reset,
  onStatus,
  globals,
}: {
  record: StoryRecord;
  args: Args;
  setArgs: (update: Args) => void;
  reset: () => void;
  onStatus: (s: StoryStatus) => void;
  /** Storybook globals the story may read: the example theme's id as `theme`. */
  globals: { theme: string };
}) {
  const { prepared, Composed } = storyFor(record);
  const context: StoryContext = {
    id: record.id,
    title: record.title,
    name: record.name,
    kind: record.title,
    story: record.name,
    args: mapArgs(args, prepared.argTypes),
    initialArgs: prepared.args,
    argTypes: prepared.argTypes,
    parameters: prepared.parameters,
    globals,
    viewMode: "story",
    loaded: {},
    updateArgs: setArgs,
  };
  const argsContext = { args, update: setArgs, reset, globals, parameters: prepared.parameters, context };
  useEffect(() => {
    onStatus({ state: "rendered" });
  }, [onStatus]);
  return (
    <StoryArgsContext.Provider value={argsContext}>
      <StoryContextReact.Provider value={context}>
        <Composed />
      </StoryContextReact.Provider>
    </StoryArgsContext.Provider>
  );
}

function Viewer({ input, onStatus }: { input: StoryInput; onStatus: (s: StoryStatus) => void }) {
  const record = byId.get(input.storyId);
  const prepared = record ? storyFor(record).prepared : undefined;
  // The page remounts the viewer for each tool call, so its starting args are fixed.
  const [initial] = useState<Args>(() => ({ ...prepared?.args, ...input.args }));
  const [args, setArgsState] = useState<Args>(initial);
  const [dark, setDark] = useState(input.theme === "dark");
  const [custom, setCustom] = useState(() => customFrom(input));
  const [themeId, setThemeId] = useState(custom ? CUSTOM : themeById(input.exampleTheme).id);
  const activeDoc = themeId === CUSTOM && custom ? custom.doc : docOf(themeById(themeId));
  useThemeFonts(themeFonts({ primitives: activeDoc.primitives ?? {} }));
  const applyTheme = (doc: ThemeDoc) => {
    setCustom((current) => ({ name: current?.name ?? `${themeById(themeId).name}, customised`, doc }));
    setThemeId(CUSTOM);
  };
  const [width, setWidth] = useState(input.width ? String(input.width) : "fill");
  const [resets, setResets] = useState(0);

  const setArgs = useCallback((update: Args) => setArgsState((current) => ({ ...current, ...update })), []);
  const reset = useCallback(() => {
    setArgsState(initial);
    setResets((n) => n + 1);
  }, [initial]);
  const onChange = useCallback(
    (name: string, value: unknown) =>
      setArgsState((current) => {
        const next = { ...current };
        if (value === undefined) delete next[name];
        else next[name] = value;
        return next;
      }),
    [],
  );

  const problem = !record
    ? `No story "${input.storyId}" in this version of @squonk/ui. Use list_stories to find one.`
    : record.unavailable
      ? `${record.title} / ${record.name} can't be shown outside Storybook: ${record.unavailable}`
      : undefined;
  useEffect(() => {
    if (problem) onStatus({ state: "error", message: problem });
  }, [problem, onStatus]);
  const body = problem ? <ErrorPanel message={problem} /> : undefined;

  const fullscreen = prepared?.parameters.layout === "fullscreen";
  return (
    <SquonkThemeProvider
      mode={dark ? "dark" : "light"}
      primitives={activeDoc.primitives}
      roleBindings={activeDoc.roleBindings}
      colorBindings={activeDoc.bindings}
      addedColorPrimitives={activeDoc.addedPrimitives}
      withGlobalStyles
    >
      <div className="sv" data-mode={dark ? "dark" : "light"}>
        <Presentation register="compact">
          <div className="sv-bar" role="toolbar" aria-label="Story options">
            <div className="sv-title">
              <span className="sv-path">{record ? record.title.split("/").slice(0, -1).join(" / ") : "@squonk/ui"}</span>
              <strong>{record ? `${record.title.split("/").at(-1)}: ${record.name}` : input.storyId}</strong>
            </div>
            <div className="sv-theme">
              <Select
                label="Theme"
                options={[...(custom ? [{ value: CUSTOM, label: custom.name }] : []), ...EXAMPLE_THEMES.map((t) => ({ value: t.id, label: t.name }))]}
                value={themeId}
                onChange={(value) => setThemeId(value === CUSTOM && custom ? CUSTOM : themeById(value ?? undefined).id)}
              />
            </div>
            <Switch label="Dark" checked={dark} onChange={setDark} />
            <div className="sv-width">
              <Select label="Width" options={WIDTHS.some((w) => w.value === width) ? WIDTHS : [...WIDTHS, { label: `${width}px`, value: width }]} value={width} onChange={(value) => setWidth(value || "fill")} />
            </div>
            <Button variant="secondary" onClick={reset} disabled={!prepared}>
              Reset
            </Button>
          </div>
        </Presentation>
        <div className="sv-stage" data-fullscreen={fullscreen || undefined}>
          <div className="sv-frame" style={{ width: width === "fill" ? "100%" : `${width}px` }} data-fullscreen={fullscreen || undefined}>
            {body ?? (
              <Boundary key={`${input.storyId}:${resets}`} onError={(error) => onStatus({ state: "error", message: error.message })}>
                <StoryView record={record!} args={args} setArgs={setArgs} reset={reset} onStatus={onStatus} globals={{ theme: themeId === CUSTOM ? CUSTOM : themeId }} />
              </Boundary>
            )}
          </div>
        </div>
        {prepared && !body ? (
          <Presentation register="compact">
            <section className="sv-panel" aria-label="Controls">
              <h2 className="sv-panel-title">Controls</h2>
              <ControlsPanel key={resets} prepared={prepared} args={args} onChange={onChange} />
            </section>
            <section className="sv-panel" aria-label="Theme">
              <h2 className="sv-panel-title">Theme</h2>
              <ThemeEditor key={`${themeId}:${JSON.stringify(activeDoc).length}`} doc={activeDoc} onApply={applyTheme} />
            </section>
          </Presentation>
        ) : null}
      </div>
    </SquonkThemeProvider>
  );
}

const root = createRoot(document.getElementById("story-root")!);
const embedded = window.__PRODUCT_UI_STORY__;

if (embedded) {
  // Local preview server: the page carries its input. Screenshots read the status.
  const onStatus = (status: StoryStatus) => {
    window.__PRODUCT_UI_STORY_STATUS__ = status;
  };
  root.render(<Viewer input={embedded} onStatus={onStatus} />);
} else {
  // MCP Apps host: the arguments arrive with the tool call.
  const app = new App({ name: "@squonk/ui story", version: "1.0.0" });
  let lastError: string | undefined;
  const onStatus = (status: StoryStatus) => {
    window.__PRODUCT_UI_STORY_STATUS__ = status;
    const message = status.state === "error" ? status.message : undefined;
    if (message === lastError) return;
    lastError = message;
    if (message) {
      void app.updateModelContext({ content: [{ type: "text", text: `The @squonk/ui story failed to render: ${message}` }] }).catch(() => {});
    }
  };
  let calls = 0;
  root.render(<p className="sv-waiting">Waiting for a story…</p>);
  app.ontoolinput = ({ arguments: args }) => {
    if (!args || typeof args.storyId !== "string") return;
    const hostTheme = app.getHostContext()?.theme;
    const input: StoryInput = {
      storyId: args.storyId,
      theme: (args.theme as StoryInput["theme"]) ?? (hostTheme === "dark" ? "dark" : "light"),
      width: typeof args.width === "number" ? args.width : undefined,
      args: args.args && typeof args.args === "object" ? (args.args as Args) : undefined,
    };
    root.render(<Viewer key={calls++} input={input} onStatus={onStatus} />);
  };
  await app.connect();
}
