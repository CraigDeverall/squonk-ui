import fs from "node:fs";
import lodash from "lodash";
import Generator from "yeoman-generator";

// Define common HTML void elements (elements that cannot have children)
const voidElements = new Set([
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

const TYPE_FOLDERS = {
  LayoutPrimitive: "layout-primitive",
  Layout: "layout",
  FunctionalPrimitive: "functional-primitive",
  Functional: "functional",
};
const VALID_TYPES = Object.keys(TYPE_FOLDERS);
const VALID_BASE_ELEMENTS = [
  "div", "span", "header", "footer", "section", "article", "nav", "main",
  "aside", "p", "ul", "ol", "li", "form", "button",
  "input", "hr", "img", "br",
];

export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("name", {
      type: String,
      description: "Component name in PascalCase (e.g. Card, UserProfile)",
    });
    this.option("type", {
      type: String,
      description: `Component type: ${VALID_TYPES.join(" | ")}`,
    });
    this.option("base", {
      type: String,
      description: `Base HTML element: ${VALID_BASE_ELEMENTS.join(", ")}`,
    });
    this.option("polymorphic", {
      type: Boolean,
      description: "Polymorphic component (forced true for LayoutPrimitive)",
    });
    this.option("children", {
      type: Boolean,
      description: "Accepts children (forced false for void elements)",
    });
    this.option("purpose", {
      type: String,
      description: "One sentence explaining when a consumer should use this component",
    });
  }

  _kebabCase(str) {
    return lodash.kebabCase(str);
  }

  async prompting() {
    const prompts = [];

    if (!this.options.purpose) {
      prompts.push({
        type: "input",
        name: "purpose",
        message: "When should a consumer use this component?",
        validate: (input) => Boolean(input?.trim()) || "Describe the intended use.",
      });
    }

    if (!this.options.name) {
      prompts.push({
        type: "input",
        name: "componentName",
        message: "What is the name of your component? (e.g., MyButton, UserProfile)",
        validate: (input) =>
          input && input.trim().length > 0 ? true : "Please provide a component name.",
        filter: (input) => input.trim(),
      });
    }

    if (!this.options.type) {
      prompts.push({
        type: "list",
        name: "componentType",
        message: "What type of component would you like to create?",
        choices: VALID_TYPES,
        default: "Functional",
      });
    }

    if (!this.options.base) {
      prompts.push({
        type: "list",
        name: "baseElement",
        message: "Choose the base HTML element for your component:",
        choices: VALID_BASE_ELEMENTS,
        default: "div",
      });
    }

    if (typeof this.options.polymorphic === "undefined") {
      prompts.push({
        type: "confirm",
        name: "isPolymorphic",
        message: "Is this a polymorphic component?",
        default: false,
        when: (answers) => {
          const t = this.options.type ?? answers.componentType;
          return t !== "LayoutPrimitive";
        },
      });
    }

    if (typeof this.options.children === "undefined") {
      prompts.push({
        type: "confirm",
        name: "acceptsChildren",
        message: "Does your component accept children?",
        default: false,
        when: (answers) => {
          const b = this.options.base ?? answers.baseElement;
          return !voidElements.has(b);
        },
      });
    }

    const responses = prompts.length > 0 ? await this.prompt(prompts) : {};

    this.answers = {
      componentName: this.options.name ?? responses.componentName,
      componentType: this.options.type ?? responses.componentType,
      baseElement: this.options.base ?? responses.baseElement,
      isPolymorphic: this.options.polymorphic ?? responses.isPolymorphic,
      acceptsChildren: this.options.children ?? responses.acceptsChildren,
      purpose: (this.options.purpose ?? responses.purpose)?.trim(),
    };

    if (!/^[A-Z][A-Za-z0-9]*$/.test(this.answers.componentName ?? "")) {
      throw new Error("Component name must be a PascalCase identifier (use --name).");
    }
    if (!VALID_TYPES.includes(this.answers.componentType)) {
      throw new Error(`Invalid type "${this.answers.componentType}". Must be one of: ${VALID_TYPES.join(", ")}.`);
    }
    if (!VALID_BASE_ELEMENTS.includes(this.answers.baseElement)) {
      throw new Error(`Invalid base "${this.answers.baseElement}". Must be one of: ${VALID_BASE_ELEMENTS.join(", ")}.`);
    }

    if (!this.answers.purpose) throw new Error("A component purpose is required (use --purpose).");

    if (this.answers.componentType === "LayoutPrimitive") {
      this.answers.isPolymorphic = true;
    } else if (typeof this.answers.isPolymorphic === "undefined") {
      this.answers.isPolymorphic = false;
    }

    if (voidElements.has(this.answers.baseElement)) {
      if (this.answers.acceptsChildren) {
        this.log(
          `Base element '${this.answers.baseElement}' cannot accept children. Overriding acceptsChildren to false.`
        );
      }
      this.answers.acceptsChildren = false;
    } else if (typeof this.answers.acceptsChildren === "undefined") {
      this.answers.acceptsChildren = false;
    }
  }

  writing() {
    // Deconstruct answers *after* potential modifications in prompting()
    const {
      componentName,
      componentType,
      baseElement,
      isPolymorphic,
      acceptsChildren, // This value is now guaranteed to be correct for void elements
      purpose,
    } = this.answers;

    const componentNameKebab = this._kebabCase(componentName);
    const componentTypeFolder = TYPE_FOLDERS[componentType];

    const templates = [
      "component.tsx.ejs",
      "component.module.css.ejs",
      "component.mdx.ejs",
      "component.stories.tsx.ejs",
      "component.test.tsx.ejs",
    ];

    const destinationFolder = this.destinationPath(
      "src",
      "components",
      componentTypeFolder,
      componentNameKebab
    );

    if (fs.existsSync(destinationFolder)) {
      throw new Error(`Component already exists at ${destinationFolder}; refusing to overwrite it.`);
    }

    // acceptsChildren passed here will be correctly 'false' for void elements
    const templateData = {
      componentName,
      componentType,
      baseElement,
      isPolymorphic,
      acceptsChildren,
      componentNameKebab,
      purpose,
      exampleLabel: lodash.startCase(componentName),
    };

    templates.forEach((template) => {
      const outputFileName = template
        .replace(".ejs", "")
        .replace("component", componentNameKebab);

      this.fs.copyTpl(
        this.templatePath(template),
        this.destinationPath(destinationFolder, outputFileName),
        templateData
      );
    });

    const exportLine = `export * from "./${componentTypeFolder}/${componentNameKebab}/${componentNameKebab}";\n`;
    const indexPath = this.destinationPath("src", "components", "index.ts");

    const barrel = this.fs.exists(indexPath) ? this.fs.read(indexPath) : "";
    if (!barrel.includes(exportLine.trim())) {
      this.fs.write(indexPath, `${barrel}${barrel && !barrel.endsWith("\n") ? "\n" : ""}${exportLine}`);
    }
    this.log("Scaffold written. Add component-specific behavior/variants and Linux snapshot baselines before release; run npm run build to refresh exports.");
  }
}
