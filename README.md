<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/squonk-ui-components-dark.svg">
    <img src="public/squonk-ui-components.svg" alt="SquonkUI" width="320">
  </picture>
</p>

# @squonkstack/ui

**Documentation site: <a href="https://ui.squonkstack.io/" target="_blank" rel="noopener noreferrer">ui.squonkstack.io</a>**

A modern UI library for building React-based applications with Storybook integration and a robust development workflow. Its Storybook documentation site is branded SquonkUI and the default theme uses Squonk blue with the Squonk red reserved for the docs chrome.

## Quick Start

In your app's folder:

```sh
npx @squonkstack/ui
```

That's the recommended way to add `@squonkstack/ui` to an app. It asks before each step, then:

- installs `@squonkstack/ui` (and, unless you pass `--no-mcp`, [`@squonkstack/ui-mcp`](./packages/ui-mcp/README.md))
- connects the `squonk-ui` MCP server to Claude Code, Codex, VS Code or Cursor, so agents can look up components and show you the library's stories with live controls
- adds a short `@squonkstack/ui` section to `AGENTS.md` that points agents at the skill shipped in the package

Pass `--yes` to accept every default, or `--help` for the other options.

Then import the styles once at your app root and wrap the app in the theme provider:

```tsx
import "@squonkstack/ui/fonts.css";
import "@squonkstack/ui/styles.css";
import { SquonkThemeProvider } from "@squonkstack/ui/theme-provider";
import { Button } from "@squonkstack/ui/button";

export function App() {
  return (
    <SquonkThemeProvider mode="light" withGlobalStyles>
      <Button>Continue</Button>
    </SquonkThemeProvider>
  );
}
```

To do each step by hand instead, see [Using the library](#using-the-library).

## Table of Contents

- [Quick Start](#quick-start)
- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Using the library](#using-the-library)
  - [For coding agents](#for-coding-agents)
  - [Installation](#installation)
  - [Development](#development)
  - [Building the Project](#building-the-project)
- [Scripts](#scripts)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

`@squonkstack/ui` is a UI library designed to streamline the development of React applications. It leverages modern tools like Rollup, TypeScript, and Storybook to provide a seamless developer experience. This library is modular, type-safe, and optimized for both development and production environments.

Every component ships as an individual entry point (see [Using the library](#using-the-library)), client component boundaries are preserved in the published build for framework integration, and styling is static CSS (`@squonkstack/ui/styles.css`) — no CSS-in-JS runtime or style registry to reconcile with your app's setup.

---

## Features

- **React 19**: React and React DOM 19.2+ within 19.x; tested baseline 19.3.0.
- **Storybook Integration**: Develop and test components in isolation.
- **TypeScript Support**: Fully typed for better developer experience.
- **Rollup Bundling**: Optimized builds for production.
- **ESLint and Prettier**: Enforced code quality and formatting.
- **Testing with Vitest**: Fast and modern testing framework.

---

## Getting Started

### Prerequisites

- **Node.js** at the version pinned in [`.nvmrc`](./.nvmrc) for repository development and CI (run `nvm use`). The package engine range also permits Node 22.14+ within 22.x and Node 24.10+, so consumers on Node 22 and 24 are unaffected. React and React DOM peers are 19.2+ within 19.x; the current lockfile uses 19.3.0.
- **Docker Desktop** — required to run the visual snapshot suite (`npm test`). Snapshots are taken inside a containerised Playwright runner so font rendering is byte-identical between local machines and the CI pipeline. Install from [docs.docker.com](https://docs.docker.com/desktop/setup/install/mac-install/) and ensure the daemon is running before running tests.

### Using the library

The [Quick Start](#quick-start) command does all of this for you. This section covers the same steps by hand.

`@squonkstack/ui` and `@squonkstack/ui-mcp` are published to the public npm registry under the MIT licence; there's nothing to sign in to.

Install as usual:

```bash
npm install @squonkstack/ui
```

**Prefer per-component imports** — every component is its own entry point via the package's generated exports map, so your bundler only pulls in what you use:

```tsx
import { Button } from "@squonkstack/ui/button";
import { Card } from "@squonkstack/ui/card";
import { SquonkThemeProvider } from "@squonkstack/ui/theme-provider";

export function App() {
  return (
    <SquonkThemeProvider mode="light" withGlobalStyles>
      <Card><Button>Continue</Button></Card>
    </SquonkThemeProvider>
  );
}
```

Mount the provider above library components. `withGlobalStyles` is opt-in: it resets body margin and sets body background, text color, and font family; it is not a universal CSS reset. Omit it when the application owns those styles. The root package export remains supported, but per-component imports make dependencies explicit.

The theme uses Inter, which ships with the package as self-hosted variable font files (SIL Open Font License 1.1). Import it once at your app root; without it, text falls back to Helvetica Neue or Arial:

```ts
import "@squonkstack/ui/fonts.css";
```

Import the component stylesheet once at your app root. Components built with CSS Modules read their styles from it, and it declares every `--squonk-*` theme variable. Without it, those components render unstyled:

```ts
import "@squonkstack/ui/styles.css";
```

The optional `@squonkstack/ui/docs` helpers run inside Storybook 10.6 with `@storybook/addon-docs` installed and configured. They are browser documentation utilities; import `@squonkstack/ui/docs.css` alongside them, and keep them out of application runtime and server-rendered entry points.

For SSR, import `@squonkstack/ui/styles.css` like any stylesheet; the library has no CSS-in-JS runtime and needs no style collection. Published interactive/provider entry points preserve `"use client"`; this does not replace hydration checks or an application-level integration test.

### For coding agents

The package ships a skill for agents that build apps with it: setup, finding components, composition rules, theme scoping, accessibility and what the library does not provide. It lives in the installed package, so an agent always reads the guidance for the version the project has installed, together with a machine-readable catalog of every component:

```sh
node -p "require.resolve('@squonkstack/ui/skill')"         # skills/use-squonk-ui/SKILL.md
node -p "require.resolve('@squonkstack/ui/catalog.json')"  # component catalog for this version
```

The quickest setup is the [Quick Start](#quick-start) command, run in the app's folder:

```sh
npx @squonkstack/ui
```

It first asks whether to also set up the MCP server for coding agents (default yes; `--no-mcp` declines), then runs `npx @squonkstack/ui-mcp init` at the same version, which asks before each step: it adds the registry to `.npmrc`, installs `@squonkstack/ui` and [`@squonkstack/ui-mcp`](./packages/ui-mcp/README.md) at that version, registers the `squonk-ui` MCP server with Claude Code, Codex, VS Code or Cursor, and adds a short `@squonkstack/ui` section to `AGENTS.md` (imported into `CLAUDE.md`) that points agents at the installed skill. The MCP server looks components up in the catalog and shows the library's **stories with live controls**, rendered with the app's installed components: inside the chat in hosts that support MCP Apps, and at a local URL elsewhere.

`@squonkstack/ui/eslint` holds lint rules for apps; add `...squonkUi.configs.recommended` to `eslint.config.js` so agents (and people) get told when they rebuild a control the library has, import from internals or hard-code a colour.

To wire it up by hand instead, point your agent configuration at the installed skill rather than copying it, for example: "When the project depends on `@squonkstack/ui`, read the skill at `require.resolve('@squonkstack/ui/skill')` and follow it." The repository's own `.claude/skills/` are for developing the library and are not published.

### Server rendering and App Router integration

Client directives preserve framework boundaries. The packed App Router fixture in `scripts/fixtures/next-consumer` imports `styles.css` and needs no style registry; its page and layout remain Server Components.

### Installation

The steps above are for *consuming* `@squonkstack/ui`. To work on the library itself, clone the repository and install dependencies:

```bash
git clone https://github.com/CraigDeverall/squonk-ui.git
cd squonk-ui
nvm use
npm ci
```

### Development

Start the development server with Storybook:

```bash
npm run dev
```

This will launch Storybook on [http://localhost:6006](http://localhost:6006), where you can view and interact with your components.

### Building the Project

To build the library for production:

```bash
npm run build
```

The output will be available in the `dist` folder.

---

## Scripts

Here are the available npm scripts:

- **`npm run dev`**: Starts the Storybook development server.
- **`npm run build`**: Builds the library using Rollup and TypeScript.
- **`npm run prebuild`**: Cleans the `dist` folder before building.
- **`npm run lint`**: Runs ESLint to check for code quality issues.
- **`npm run build-storybook`**: Builds the Storybook static site.
- **`npm run typecheck` / `npm run typecheck:tests`**: Checks source and component-test types.
- **`npm run test:unit`**: Runs pure theme/utility tests.
- **`npm test`**: Runs canonical containerized component interaction, accessibility, and visual tests. Coordinate Docker Desktop so only this project stack is active.
- **`npm run test:package`**: Checks packed consumer fixtures after building.

---

## Folder Structure

```plaintext
squonk-ui/
├── dist/               # Compiled output (generated after build)
├── src/                # Source code for components
├── .storybook/         # Storybook configuration
├── package.json        # Project metadata and dependencies
├── README.md           # Project documentation
├── LICENSE             # License information
```

### Brand assets

`public/brand/` holds vector Squonk logos built from the official logo on squonkstack.io: the hex mark and the horizontal logo with the Collective Success tagline, each in a light-background and a `-dark` version. `public/squonk-ui*.svg` are the SquonkUI lockups used in the Storybook sidebar, and `public/favicon.svg` is the docs site favicon. `public/og.png` is the card that link previews show for the site; `node scripts/generate-og-image.mjs` renders it again, and its tags are in `.storybook/manager-head.html`.

---

## Automated Releases with Semantic Release

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) to automate versioning and package publishing. The release process is triggered on commits to the `main` branch, ensuring a consistent and predictable release cycle.

### Configuration

Semantic Release is configured in this project with the following settings:

- **Branches**: Releases are triggered from the `main` branch.
- **Versions from tags**: The version comes from git tags, so `package.json` keeps `0.0.0-development` and nothing is committed back to `main`.
- **Plugins**:
  - `@semantic-release/commit-analyzer`: Determines the type of version bump (major, minor, or patch) based on commit messages.
  - `@semantic-release/release-notes-generator`: Generates release notes from commit messages.
  - `@semantic-release/npm` (twice): Writes the version into `@squonkstack/ui` and `@squonkstack/ui-mcp` and publishes both to the public npm registry with provenance.
  - `@semantic-release/github`: Tags the release and creates a GitHub Release with the notes.

### Commit Message Conventions

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. Commit messages should be structured as follows:

#### Format:

```plaintext
<type>(<scope>): <description>

<body>

<footer>
```

#### Example:

```plaintext
feat(auth): add JWT authentication

Implemented user authentication using JWT tokens. Includes token validation and refresh mechanisms.

Closes #42
```

#### Commit Types:

> Using `BREAKING CHANGE` will ensure a major version change.

- `feat`: Introduces a new feature (version bump as a **minor**).
- `fix`: Fixes a bug (version bump as a **patch**).
- `perf`: Improves performance without changing functionality (version bump as a **patch**).

Others (No version change):

- `chore`: Routine maintenance, CI/CD changes, or dependency updates (does not itself trigger a release).
- `docs`: Documentation updates.
- `style`: Code style changes (e.g., formatting, missing semicolons).
- `refactor`: Code changes that improve maintainability but do not add new features or fix bugs.
- `test`: Adding or updating tests.
- `build`: Changes that affect the build system or dependencies.
- `ci`: Changes to CI/CD configuration.

Additive exports, optional props, and tokens are normally minor changes. Removing or renaming exports/props, narrowing accepted types, changing established default behavior, or raising a supported dependency/runtime floor requires a major release and migration notes. A `fix:` label does not make a compatibility break a patch.

### Running Releases Manually

Semantic Release runs automatically in the `release` job of the CI workflow on `main`, but you can preview a release locally by running:

```sh
npx semantic-release --dry-run
```

Dry-run skips publishing, but can contact authenticated remotes and execute verification hooks; it is not an offline check. Use it only in the authorized release context.

### Continuous integration and documentation

GitHub Actions ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) runs on every pull request, in the merge queue and on `main`: lint, typecheck, commitlint, the exports, catalog and token checks, the dependency audit, the unit, script, generator, ui-mcp and devtools tests, the build and packed-consumer check, the Playwright component tests in the `mcr.microsoft.com/playwright` image (where the Linux snapshot baselines are rendered), and the Storybook build.

On `main` the `release` job then runs semantic-release, and the Storybook site is deployed with GitHub Pages to [ui.squonkstack.io](https://ui.squonkstack.io/), with the theme devtools extension under `/downloads/`.

`main` takes changes only through pull requests. Renovate proposes dependency updates ([`renovate.json`](./renovate.json)).

### Additional Resources

- [Semantic Release Documentation](https://semantic-release.gitbook.io/semantic-release/)

---

## Contributing

Open a pull request for code changes, or an issue for ideas and bugs. CI runs component tests, lint, typecheck, build and the design catalog check. All commits are **Conventional Commits** (enforced by commitlint), and a maintainer approves every merge. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

Downstream projects consume versioned packages. Conventional Commits, the release notes on [GitHub Releases](https://github.com/CraigDeverall/squonk-ui/releases) and `BREAKING CHANGE` migration notes tell them what changed.

**Read more:**

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — the full contribution guide
- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — design principles and conventions
- [`REVIEW_GUIDE.md`](./REVIEW_GUIDE.md) — what reviewers check

---

## License

Released under the MIT License. See [LICENSE](./LICENSE).

---
