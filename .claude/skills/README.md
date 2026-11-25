# Repository skills

These skills guide coding assistants working on `@squonkstack/ui`. They travel with the
repository, so a developer's global skills or local memory are not required. Run
commands from the repository root.

They are not published. The skill for agents that *use* the library is
`skills/use-squonk-ui/SKILL.md`, which ships in the package. When a change adds,
renames or removes a public component, prop or pattern, update that skill in the
same pull request.

## Sources of truth

- `DESIGN_SYSTEM.md`: design principles and compatibility rules.
- `REVIEW_GUIDE.md`: what reviewers treat as must-fix.
- `src/design-system/design-system.mdx`: foundations, supported UX compositions,
  theme boundaries and icon guidance.
- `src/components/index.ts`, the `package.json` exports and the implementations:
  the available public components. `COMPONENT_LIST.md` is an inventory, not proof
  of behavioural coverage. Run `npm run catalog:generate` after adding a public entry.
- `src/theme/theme.ts`: primitives, semantic getters and CSS-variable serialisation.

React 19 and CSS Modules power the library, with React Aria Components supplying
behaviour for every component it has a primitive for, TanStack Table for table
data and TanStack Form with Zod for forms. Its six source categories are
functional primitives, functional components, layout primitives, layout
compositions, style providers and animation. The Yeoman component generator
supports the first four. Style and animation work follows the documented exception
in `DESIGN_SYSTEM.md`; do not force it into another category.

## Skill execution contract

Select only the skills relevant to the current request. Loading every skill wastes
context and can mix unrelated workflows.

Use the tools actually available in the checkout. Commands in skills are examples of
authorised repository work, not permission to install global tools, edit unrelated
projects, message people or deploy. Preserve existing work and use the repository's
pull request process. Before starting Docker, check the active context and running
project labels: only one project stack may run in local Docker Desktop at a time.

Loading a skill does not run it. Report what you actually did, and turn work you
cannot do into a concrete proposal or a stated limitation.

## Route by the decision needed

| Request | Skills |
| --- | --- |
| New component | `determine-component-intent`, `research-component-patterns` when needed, `naming-conventions`, `pick-base-element`, `scaffold-component` |
| Existing component behaviour or API change | `inspect-snapshots`, `non-breaking-refactor`, relevant implementation skills |
| Wrap an external primitive | `research-component-patterns`, `wrap-third-party-component` |
| Layout, containment or responsiveness | `containment-behavior`, `responsive-conventions` |
| Theme or token design | `theme-scratchpad`, `use-tokens`; `add-token` only for a justified vocabulary gap |
| Stories and public documentation | `write-stories`, `write-mdx-docs` |
| Keyboard, semantics, focus or announcements | `accessibility-conventions` |
| Visual exploration | `prototype-live`; `inspect-snapshots` for existing evidence |
| Verification | `test-strategy`, then `visual-regression` or `write-unit-tests` as appropriate |
| Commit and release classification | `non-breaking-refactor`, `commit-and-release` |

Do not run the whole component pipeline for a typo, a read-only question or a
composition that needs no new API. A scaffold is a starting point: complete its
interaction, variants, docs and checks before opening a pull request.

## Consistent design decisions

Prefer reuse, then composition, then a compatible extension, then a new generic
component. Domain-specific business logic stays with consumers. Distinguish
`Presentation`'s visual register from `ThemeStyleBlock`'s primitive scaling and mode;
use `ThemeModifier` for ordered semantic overrides. Providing a resolved theme
through `SquonkThemeContext` directly skips the metadata that nested Squonk theme rebuilds need.

Default typography, semantic colours and spacing are intentional. Improve hierarchy,
alignment, state clarity and consistency before inventing a new palette or font.
Icons come from the curated set in `functional-primitive/icon`, built on
react-icons (Lucide for UI, Simple Icons for brands). Add a missing icon there with
a semantic name; never import `react-icons` from a component directly.

Ask a focused clarification only when the answer changes the outcome. Offer an
existing supported composition and explain the trade-off.

## Checks and reporting

Use the Node version in `.nvmrc` and the existing lockfile. Relevant commands:
`npm run typecheck`, `npm run typecheck:tests`, `npm run lint`,
`npm run test:unit`, `npm run test:scripts`, `npm run test:generator`,
`npm run catalog:check`, `npm run build` and `npm run build-storybook`.
`npm test` runs the Docker-backed Playwright component tests, which cover browser
behaviour as well as screenshots. Do not start it over another project's stack.

Check docs and stories in both light and dark mode. Report evidence separately:
source inspected, static checks passed, browser behaviour exercised, screenshots
reviewed. A file's existence, a successful build or a skill reference is not proof
of rendered correctness.
