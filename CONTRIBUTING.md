# Contributing to `@squonk/ui`

## How to contribute

- **Have working code?** Open a **pull request** against `main`. Describe the
  problem, the change, and how you verified it.
- **Have an idea or found a bug?** Open an **issue**. Say what you were trying to
  achieve, what happened, and which component or page is involved.

Read [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) before adding or changing a component.
Reviewers check changes against [`REVIEW_GUIDE.md`](REVIEW_GUIDE.md). A
maintainer approves every merge.

If you use a coding assistant, point it at the repository skills in
[`.claude/skills/`](.claude/skills/README.md).

## Before you open a pull request

Run the same checks CI runs:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:scripts
npm run catalog:check
npm run tokens:check
```

Run `npm run test` for the Playwright component tests when you change a
component's rendering. It needs Docker so the snapshots match CI.

When you change the theme, run `npm run tokens:generate` and commit the updated
`src/theme/tokens.css`.

When you add, rename or remove a component or story, run `npm run catalog:generate`
and commit the updated `COMPONENT_LIST.md` and `public/design-catalog.json`.

## Commits

All commits are **Conventional Commits**, enforced by commitlint (the husky
`commit-msg` hook will reject a malformed header). `fix:`/`perf:` → patch, `feat:` →
minor, `!` or a `BREAKING CHANGE:` footer → major. Header ≤72 chars, lowercase
subject, scope from the allowlist.

Choose the type by its effect on the published package. Changes that touch only the
documentation site, Storybook, stories, MDX, tests, scripts or CI use `docs:`,
`test:`, `ci:` or `chore:`, even when they fix a bug there, because `fix:` and `feat:`
publish a new version. Pull requests land as merge commits, so every commit on the
branch counts toward the release, not just the pull request title; give each one the
right type, and give the pull request a Conventional Commits title too.

`skills/use-squonk-ui/SKILL.md` ships in the package, so a change to it reaches
consumers only through a release. Use `fix(skill):` for corrections and
`feat(skill):` for new guidance. When you add, rename or remove a public component,
prop or pattern, update the skill in the same pull request; the packed-package
check fails if the skill imports something the package does not export.

Removing or renaming a public export, prop or token is a breaking change. Mark it
with `!` and describe the migration in the commit body.

## Merging

Open a pull request against `main`; nobody pushes to `main` directly. Merge it
when its checks pass and a maintainer has approved it. CI runs lint, typecheck,
commitlint, the exports, catalog and token checks, the unit, script, ui-mcp and
devtools tests, the build and packed-package check, the Playwright component
tests and the Storybook build. Merges are merge commits, so every commit on the
branch keeps its type and counts toward the release.

## Releases

Every merge to `main` runs semantic-release in the CI workflow's `release` job.
When the commits call for it, it publishes `@squonk/ui` and `@squonk/ui-mcp`
together at one version to the public npm registry with provenance, tags it
(`vX.Y.Z`) and creates a GitHub Release with the notes. It commits nothing back
to `main`. So:

- Leave `0.0.0-development` as the `version` in both `package.json` files.
- Don't add to `CHANGELOG.md`; release notes live on GitHub Releases.
