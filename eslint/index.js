// ESLint rules for apps built with @squonk/ui. They catch the mistakes coding
// agents (and people) make most: rebuilding a control the library has, reaching
// into the package's internals, and hard-coding colours the theme owns.
//
//   import squonkUi from "@squonk/ui/eslint";
//   export default [...squonkUi.configs.recommended, /* your config */];

/** Native elements the library replaces, and what to use instead. */
const REPLACEMENTS = {
  button: "Button (@squonk/ui/button) or IconButton (@squonk/ui/icon-button)",
  input: "TextField, Checkbox, Radio or Switch from @squonk/ui",
  select: "Select (@squonk/ui/select)",
  textarea: "Textarea (@squonk/ui/textarea)",
  dialog: "Modal or Drawer from @squonk/ui",
  a: "Link (@squonk/ui/link)",
};

const COLOR = /#[0-9a-f]{3,8}\b|\b(rgb|hsl)a?\(/i;

const preferComponents = {
  meta: {
    type: "suggestion",
    docs: { description: "Use @squonk/ui components instead of the native elements they replace." },
    schema: [{ type: "object", properties: { allow: { type: "array", items: { type: "string" } } }, additionalProperties: false }],
    messages: { replace: "Use {{replacement}} instead of <{{element}}>. Library components carry the theme, states and accessibility." },
  },
  create(context) {
    const allow = new Set(context.options[0]?.allow ?? []);
    return {
      JSXOpeningElement(node) {
        const element = node.name.type === "JSXIdentifier" ? node.name.name : undefined;
        if (!element || allow.has(element) || !Object.hasOwn(REPLACEMENTS, element)) return;
        // <input type="hidden"> and <input type="file"> have no library equivalent.
        if (element === "input") {
          const type = node.attributes.find((a) => a.type === "JSXAttribute" && a.name.name === "type");
          if (type?.value?.type === "Literal" && ["hidden", "file"].includes(type.value.value)) return;
        }
        context.report({ node, messageId: "replace", data: { element, replacement: REPLACEMENTS[element] } });
      },
    };
  },
};

const noInternalImports = {
  meta: {
    type: "problem",
    docs: { description: "Import @squonk/ui from its public entry points, not its build output or the libraries under it." },
    schema: [],
    messages: {
      internal: "Import from a public @squonk/ui entry point (e.g. @squonk/ui/button), not {{source}}. Internal paths change without notice.",
      underlying: "@squonk/ui wraps {{source}}. Use the library's component so theme and behaviour stay consistent.",
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") return;
        if (/^@squonk\/ui\/(dist|src)\//.test(source)) context.report({ node, messageId: "internal", data: { source } });
        else if (source === "react-aria-components" || source.startsWith("@ark-ui/")) context.report({ node, messageId: "underlying", data: { source } });
      },
    };
  },
};

const noColorLiterals = {
  meta: {
    type: "suggestion",
    docs: { description: "Take colours from the theme, not literals in inline styles." },
    schema: [],
    messages: { literal: "Colour literal in an inline style. Use a theme token (var(--squonk-…)) or a component's tone or variant prop." },
  },
  create(context) {
    return {
      "JSXAttribute[name.name='style'] Literal"(node) {
        if (typeof node.value === "string" && COLOR.test(node.value)) context.report({ node, messageId: "literal" });
      },
      "JSXAttribute[name.name='style'] TemplateElement"(node) {
        if (COLOR.test(node.value.raw)) context.report({ node, messageId: "literal" });
      },
    };
  },
};

const plugin = {
  meta: { name: "@squonk/ui" },
  rules: {
    "prefer-components": preferComponents,
    "no-internal-imports": noInternalImports,
    "no-color-literals": noColorLiterals,
  },
  configs: {},
};

plugin.configs.recommended = [
  {
    name: "@squonk/ui/recommended",
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts}"],
    plugins: { "@squonk/ui": plugin },
    rules: {
      "@squonk/ui/prefer-components": "warn",
      "@squonk/ui/no-internal-imports": "error",
      "@squonk/ui/no-color-literals": "warn",
    },
  },
];

export default plugin;
