---
name: scaffold-component
description: Create a new @squonkstack/ui component with the repository's Yeoman templates, validated noninteractive options and four-file contract (plus a CSS module). Use after choosing reuse versus a new public component; do not re-scaffold an existing component.
---

# Scaffold Component

Execution context: [repository skill contract](../README.md#skill-execution-contract).
Run these commands only from an authorised checkout with the generator installed.

## Decide the contract first

Check the public exports and related MDX. Prefer an existing component or a consumer
composition. For a new generic component establish its use/avoid criteria, semantic
base, containment posture, states and compatibility impact. Retrieve
`determine-component-intent`, `pick-base-element` or `containment-behavior` only for
unresolved decisions. Ask about a material constraint, not a routine token choice.

The generator in [generators/component/index.js](../../../generators/component/index.js)
accepts four kinds:

| `--type` | Folder | Polymorphism |
| --- | --- | --- |
| `LayoutPrimitive` | `layout-primitive` | Always on |
| `Layout` | `layout` | Explicit opt-in |
| `FunctionalPrimitive` | `functional-primitive` | Explicit opt-in |
| `Functional` | `functional` | Explicit opt-in |

Style providers and animation wrappers have a governed file-structure exception;
implement them manually from the existing category examples. Card is a Layout
composition. Do not classify every visual panel as Functional.

## Run reproducibly

From the repository root, supply every option to avoid interactive prompts:

```bash
npm run generate -- --name NoticePanel --type Layout --base section \
  --no-polymorphic --children \
  --purpose "Group a related notice and its next action."
```

Replace the example name/intent with the agreed contract. Use `--polymorphic` or
`--no-polymorphic`, and `--children` or `--no-children`, explicitly. Names must be
PascalCase identifiers; existing destination directories are refused. `--purpose`
is required. Never pipe simulated keystrokes into Yeoman.

The base allow-list is `div`, `span`, `header`, `footer`, `section`, `article`, `nav`,
`main`, `aside`, `p`, `ul`, `ol`, `li`, `form`, `button`, `input`, `hr`, `img`, `br`.
Void elements cannot accept children. Native buttons default to `type="button"`.
A semantically appropriate element outside this list requires a deliberate template
extension or manual implementation; do not substitute an inaccessible `div`.

## Complete the scaffold

Check that the generated story title follows the existing sidebar categories (`Layout/Primitives/` or `Functional/Primitives/` for primitive kinds); templates may still use the raw kind name.

Yeoman writes implementation, a CSS module, stories, Playwright component test and
MDX, and adds the component barrel export. It does not complete the component's
intended behavior.

The implementation already follows the CSS Modules pattern: `styles.root` from
`<name>.module.css`, `useThemeCssVars()` spread into `style` and `provide(children)`.
Style in the module with `var(--squonk-*)` tokens; express variants as `data-*`
attributes, flags as classes and token values as component custom properties (see
"Styling with CSS Modules" in `DESIGN_SYSTEM.md`). Build it on the React Aria
Components equivalent whenever one exists, even for a plain button or link
(`wrap-third-party-component`); use bare HTML only where React Aria has nothing.
Never hand-roll focus, keyboard, open/close or selection behaviour.

- Preserve native attributes, React 19 refs and polymorphic typing where supported.
- Use semantic tokens and parent-owned spacing; specify shrink/wrap/scroll behavior.
- Document meaningful variants and states, when to use/avoid, accessible names,
  keyboard/focus, and a real composition. Use the pattern guidance in
  [the site reference](../../../src/design-system/design-system.mdx).
- Add behavior assertions appropriate to the contract. Screenshots complement
  those assertions. Review generated Linux baselines before accepting them.
- Run `npm run test:generator` for template changes, `npm run typecheck`, targeted
  lint, and `npm run build` to refresh package exports. Build Storybook when MDX or
  stories change. Follow the one-project Docker rule for `npm test`.
- Check the generated catalog and all published subpaths before proposing a commit.

If the component already exists, edit it in place and assess compatibility with
`non-breaking-refactor`; never overwrite its implementation with a scaffold.
Report generated files, completed behavior and checks actually run separately.
