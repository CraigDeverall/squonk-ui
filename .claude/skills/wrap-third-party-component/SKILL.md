---
name: wrap-third-party-component
description: Add an open-source 3rd-party component library as a dependency (or copy its source shadcn-style) and wrap it in @squonkstack/ui's naming, theming, and folder structure. Performs license/bundle-size/maintenance checks before adding the dep, then walks the wrapper implementation. Use when research-component-patterns has concluded "we should wrap library X" rather than build from scratch, or when the user explicitly asks to "build this on React Aria", "use TanStack Table" or "pull in a library component".
---

# Wrap Third-Party Component

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonkstack/ui` library only. It covers two modes:

| Mode | What happens | Existing precedent in repo |
|---|---|---|
| **Wrap as dependency** | Add the library to `dependencies`, import the component, wrap it in our own export with our props + theme tokens. | `react-aria-components` in Checkbox, Select, Dialog, Button…; `react-qr-code` → `QrCode`. |
| **Copy & style** (shadcn pattern) | Copy markup and styles from an upstream source, translate them to our conventions. The library is **not** added as a dep. | Upstream styles translated to CSS Modules (see `THIRD_PARTY_NOTICES.md`). |

The choice between them is part of the workflow. Run this skill when you've decided wrapping (in either mode) is the right call — typically because `research-component-patterns` concluded the prior art is too good to redo.

## When to wrap-as-dep vs. copy-and-style

| Wrap-as-dep | Copy-and-style |
|---|---|
| Library is small, well-maintained, ARIA-complete (React Aria Components, react-qr-code). | Library is large and you only want one component out of many. |
| You'd benefit from upstream bug fixes / accessibility improvements. | You want to own the source to evolve it your way (the shadcn philosophy). |
| Component is one of many you'll wrap from the same library (e.g. multiple React Aria components). | Component is a one-off pull (you don't need the whole library). |
| Bundle cost is acceptable. | Bundle cost of the full library is unacceptable for one component. |

If unsure, default to **wrap-as-dep** unless the bundle cost is prohibitive.

## The library defaults

| Need | Default | Mode | License |
|---|---|---|---|
| Behaviour and accessibility for every component React Aria has (button, link, fields, overlays, menus, tabs, disclosure, table grid…) | **React Aria Components** (`react-aria-components`, already a dependency) | Wrap as dep | Apache 2.0 |
| Table data logic (sorting, filtering, pagination) | **TanStack Table** (`@tanstack/react-table`, already a dependency) | Wrap as dep; React Aria's Table renders interactive grids, a semantic `<table>` otherwise | MIT |
| Form state and validation | **TanStack Form** + **Zod**, behind `@squonkstack/ui/form` | Wrap as dep | MIT |
| Styling for a React Aria component | React Aria's styling docs and CSS starter kit | Copy & style | Apache 2.0 |
| QR code rendering | `react-qr-code` (existing `QrCode`) | Wrap as dep | MIT |

React Aria Components supplies behaviour only; it ships no styles. It is the base for every component it has a primitive for, even simple ones like Button and Link. Plain HTML only where React Aria has nothing (badge, skeleton, alert, a fieldset, an avatar's image fallback, a feed, text and layout primitives). Do not add another component or styling library (Ark UI, Radix, Headless UI, Panda CSS, MUI, Mantine, antd) as a dependency; use them only as references.

## Step 1 — Verify the license

Required before adding any dep or copying source:

```bash
# For a dep:
# Run from the repository root
npx license-checker --packages "<package-name>" --production 2>/dev/null || npm view <package-name> license

# For copy-and-style: open the source file's header / LICENSE in the upstream repo.
```

**Accepted licenses:** MIT, Apache 2.0, BSD (2-clause, 3-clause), ISC.
**Reject:** GPL, LGPL, AGPL, anything with "non-commercial" clauses, anything with attribution requirements that conflict with our distribution (some Creative Commons variants).

If the license is anything other than the accepted list, **stop and tell the user**. Don't proceed silently.

## Step 2 — Verify the bundle and maintenance signals

```bash
# Bundle size:
# Open https://bundlephobia.com/package/<package-name>  via WebFetch, or:
npx -y pkg-size <package-name>

# Maintenance / popularity:
npm view <package-name> time --json | grep -E "modified|created"
npm view <package-name> versions --json | tail -5
```

Rule of thumb:
- **Gzipped > 50 KB** for a single component → reconsider; check whether a React Aria component, or copying and translating its markup, covers it.
- **Last release > 18 months ago** → flag to user. Maintenance risk.
- **Weekly downloads < 10k** → flag, but not necessarily a blocker (some niche libs are fine).

If anything fails, surface to the user before adding the dep.

## Step 3a — Wrap-as-dep path

1. **Install the dep:**
   ```bash
   # Run from the repository root
   npm install --save <package-name>
   ```
2. **Scaffold the wrapper component** via `scaffold-component`. The base element is typically `div` or `span` (the 3rd-party component is what renders the meaningful element).
3. **In the scaffolded `.tsx`, import the 3rd-party parts and style them with a CSS module**:
   ```tsx
   import { CheckboxButton, CheckboxField, Text } from "react-aria-components";
   import styles from "./checkbox.module.css";

   <CheckboxField
     className={styles.root}
     isSelected={checked}
     isDisabled={disabled}
     isInvalid={error ? true : undefined}
     validationBehavior="aria"
     onChange={onChange}
   >
     <CheckboxButton className={styles.button}>
       <span className={styles.control} aria-hidden="true" />
       {label}
     </CheckboxButton>
     {message ? <Text slot={error ? "errorMessage" : "description"}>{message}</Text> : null}
   </CheckboxField>
   ```
   Use React Aria's field components (`TextField` + `Label` + `Input`, `CheckboxField` + `CheckboxButton`, `Text slot="description"`, `FieldError`) so labels, descriptions and errors are wired for you. Fields take `validationBehavior="aria"` and show our `error` prop. Style state through the attributes React Aria sets (`.root[data-selected]`, `[data-disabled]`, `[data-invalid]`, `.button[data-focus-visible]`, `[data-open]`, `[data-entering]`/`[data-exiting]`), with `var(--squonk-*)` tokens; prefer these over `className` functions. React Aria sets them to `"true"`, so tests assert presence, not `""`.
4. **Translate the 3rd-party prop signature** into our naming conventions (use `naming-conventions` to confirm): our `disabled`, `checked`, `onChange`, `error`, `helperText`, `label` map onto React Aria's `isDisabled`, `isSelected` and so on. Internally pass through to the 3rd-party component; externally expose our shape.
5. **Don't re-export the 3rd-party component directly.** Always wrap. The wrapper is what isolates downstream apps from upstream churn.
6. **Theme tokens, not literals.** Run `use-tokens` after implementation.
7. **Tests, stories, mdx** — same canonical 4-file structure as any other component.

## Step 3b — Copy-and-style path (shadcn-pattern)

1. **Do not install a dep.** The whole point is to own the source.
2. **Pull the source file(s)** from the upstream repo at a pinned commit. For React Aria's starter kit that's the component's CSS in the `adobe/react-spectrum` repo (`starters/`).
3. **Add an entry to `THIRD_PARTY_NOTICES.md`** crediting the upstream (repository, path, commit, licence) and including its copyright and licence text. It ships in the package. This is required for MIT/Apache compatibility.
4. **Move the source into our canonical structure** via `scaffold-component`'s "off-pattern" path:
   - Folder: `src/components/{type}/{kebab}/`
   - Files: `{kebab}.tsx`, plus the standard siblings (stories, test, mdx).
5. **Rewrite the styling** as a CSS module using `var(--squonk-*)` tokens. Don't keep Tailwind classes, Panda recipes or class-variance-authority. Map each upstream token to our nearest token. This is usually the bulk of the work.
6. **Strip dependencies you don't need.** Upstream sources often import Panda helpers, `class-variance-authority` or icon packages — replace with our equivalents (`clsx`, CSS modules) or drop.
7. **Run `use-tokens` aggressively** — copied source is the highest-density source of magic literals.

## Step 4 — Test it, then commit

1. **Type check** (`npx tsc --noEmit`).
2. **Snapshot baseline** via `visual-regression` (new-component path).
3. **Storybook check** (`npm run dev`) — confirm the wrapped component renders.
4. **Commit via `commit-and-release`.** The commit message:
   - For wrap-as-dep: `feat(<scope>): add <Component> (wraps <upstream>)`. Body explains why this library, link to the upstream.
   - For copy-and-style: `feat(<scope>): add <Component> (styles adapted from <upstream>)`. Body credits upstream + commit hash.

## Public API consequences

Either mode adds a new export to `src/index.ts`. That's an additive change → minor version bump. `non-breaking-refactor` will classify it correctly.

**Wrap-as-dep has an extra wrinkle**: the 3rd-party package becomes a transitive dep for consumers. If the upstream releases a breaking change, our wrapper insulates the public API as long as we keep the wrapper's prop signature stable. Pin the dep version (`^x.y.z`, not `*`) and treat upstream major bumps as our potential majors.

## What this skill does NOT do

- **Doesn't pick which library to wrap.** That's `research-component-patterns`.
- **Doesn't choose the component's name or category.** Those are `naming-conventions` and `determine-component-intent`.
- **Doesn't handle peer-dep conflicts automatically.** If `npm install` complains about peers, stop and surface to the user.
- **Doesn't re-export the upstream component.** Always wrap.

## Anti-patterns

- **Re-exporting a React Aria component or type from `@squonkstack/ui`** — defeats the purpose of having our own surface. Always wrap.
- **Adding another component or styling library for one component** — use React Aria, or copy and translate instead.
- **Copying source without crediting the license** — legally required for MIT/Apache.
- **Forgetting to translate Panda/Tailwind styles when copying** — our components use CSS Modules and `--squonk-*` tokens.

## Handoff

After the wrapper exists, walks back into the standard pipeline: `use-tokens` → `visual-regression` (new-component path) → `commit-and-release`.
