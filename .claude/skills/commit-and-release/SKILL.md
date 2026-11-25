---
name: commit-and-release
description: Author conventional-commit messages for the @squonkstack/ui library, lint them with commitlint, and preview the next semantic-release version + changelog entry before pushing. Also installs commitlint + the husky commit-msg hook if not present. Use when the user asks to commit, "make a commit", "prep a release", "what version will this be", or push a branch from this repo.
---

# Commit and Release

Execution context: [repository skill contract](../README.md#skill-execution-contract). Paths and shell examples are relative to the repository root; only execute tools available to the current role.

This skill is for the `@squonkstack/ui` library only. The release pipeline is fully automated by `semantic-release` on `main` — the **only** thing you can get wrong is the commit message, and a bad message either ships the wrong version or ships nothing at all.

## The contract

See [.releaserc.js](../../../.releaserc.js). The release plugin chain is:

`commit-analyzer` → `release-notes-generator` → `npm` (writes the version into each package and publishes to the configured npm registry) (run twice: `@squonkstack/ui`, then `@squonkstack/ui-mcp` from `packages/ui-mcp`) → `github` (tags the release and creates a GitHub Release with the notes). Versions come from tags; nothing is committed back to `main`.

Conventional Commits drive everything:

| Type | Effect |
|---|---|
| `feat:` | minor version bump |
| `fix:` | patch version bump |
| `perf:` | patch version bump |
| `chore:` `docs:` `style:` `refactor:` `test:` `build:` `ci:` | **no release** |
| any with `!` after type/scope, OR `BREAKING CHANGE:` footer | major version bump |

Format: `<type>(<scope>): <description>` — scope is optional but encouraged.

**Choose the type by its effect on the published package, not by whether the change fixes something.** A change that touches only the documentation site, Storybook config, stories, MDX, demos, tests, scripts or CI ships nothing to consumers, so use `docs:`, `test:`, `ci:` or `chore:` even when it fixes a bug there. `fix(storybook): …` publishes a patch release with no package change; v1.0.1 shipped that way for a browser-tab title fix.

The same applies when merging. Pull requests land on GitHub as merge commits, which keep each commit's type, so fix the commit messages before merging.

Common scopes in this repo: `theme`, `button`, `text-field`, `page`, `generator`, `release`, `storybook`, `playwright`, `rollup`, `husky`, `eslint`.

## Step 1 — install commitlint if absent (one-time)

Check first:
```bash
# Run from the repository root
ls .husky/commit-msg 2>/dev/null && grep -l "commitlint" .commitlintrc* commitlint.config.* package.json 2>/dev/null
```

If commitlint isn't installed, ask the user before installing (it's a repo change). On approval:

```bash
# Run from the repository root
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

Create `commitlint.config.js`:
```js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      ['theme', 'button', 'text-field', 'page', 'generator', 'release',
       'storybook', 'playwright', 'rollup', 'husky', 'eslint', 'docs',
       'components', 'utils', 'types']
    ],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
};
```

Create the husky hook:
```bash
# Run from the repository root
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
chmod +x .husky/commit-msg
```

Commit the setup as `build(husky): add commitlint commit-msg hook` (it's tooling — no release impact).

## Step 2a — REQUIRED: sync with remote before composing the message

Before doing anything else, fetch and check whether the local branch has diverged from its remote tracking branch. **This is non-negotiable** — committing without fetching is how you push a refactor that breaks a sibling component someone else added on remote (real incident, 2026-05-14).

```bash
# Run from the repository root
git fetch origin
BRANCH=$(git branch --show-current)
git rev-list --left-right --count origin/$BRANCH...HEAD
# Output is "<behind>\t<ahead>"
```

Interpret the output:
- `0\t0` — in sync, proceed.
- `0\tN` — N commits ahead of remote, proceed (the normal state for a feature branch).
- `M\t0` — M commits behind remote. **STOP.** Run `git pull --rebase origin $BRANCH` first, resolve any conflicts, then re-run tsc + tests. Only then proceed.
- `M\tN` — diverged. **STOP.** Use the `non-breaking-refactor` skill to classify whether the M remote commits affect anything in your N local commits before rebasing. Common pitfall: a remote `feat:` added a component that consumes a token your local `refactor:` removed — rebase succeeds but tsc fails.

Rebasing here is only for syncing your local branch with its remote. Nobody commits on `main` itself: pull requests land as merge commits, and the release pipeline reads each commit inside them, so merge commits are expected there.

## Step 2b — author the commit message

Now gather change context:
```bash
# Run from the repository root
git status --short
git diff --stat
git log -5 --oneline
```

Build the message:

1. **Pick the type.** Look at the diff:
   - New exported component / new optional prop / new token → `feat:`
   - Bug fix that consumers will notice → `fix:`
   - Perf improvement → `perf:`
   - Internal refactor with no API change → `refactor:`
   - Tests only → `test:`
   - Storybook stories/docs only → `docs:` (or `chore(storybook):`)
   - Build/tooling only → `build:` / `chore:`
   - **If any breaking-change classification fires** (run `non-breaking-refactor` skill first), append `!` and add a `BREAKING CHANGE:` footer.

2. **Pick the scope** from changed paths:
   - `src/theme/**` → `theme`
   - `src/components/functional/button/**` → `button`
   - `src/components/**` (multiple) → `components`
   - `generators/**` → `generator`
   - `.releaserc.js`, `CHANGELOG.md` (manual) → `release`

3. **Write the subject** in imperative present tense, under 72 chars, no trailing period.

4. **Body** (optional but encouraged for `feat`/`fix`): explain the *why*. For breaking changes, the body **must** include a `BREAKING CHANGE:` paragraph with the migration recipe.

### REQUIRED: invoke non-breaking-refactor first if any public-API path was touched

If `git diff --name-only origin/$BRANCH...HEAD` lists **any** of:

- `src/index.ts`
- `src/components/**` (files reachable from the barrel export)
- `src/theme/theme.ts`, `src/theme/index.ts`
- `src/utils/index.ts` or any file re-exported from it
- `src/types/**` (type declarations consumed by exported APIs)

…then **invoke the `non-breaking-refactor` skill before writing the commit message**. Don't rely on memory to decide whether something is breaking — having a skill ≠ using it, and a missed `BREAKING CHANGE:` ships the wrong major version. The skill produces a per-symbol classification table you then feed into the commit type (`feat` / `feat!` / `fix` / `fix!`) and body.

Skip the invocation only when the diff is purely:
- Generator templates (`generators/**`)
- Storybook stories/docs (`*.stories.tsx`, `*.mdx`)
- Tests (`*.test.tsx`, `*.test.ts`)
- Tooling (`.releaserc.js`, `.husky/**`, `eslint.config.js`, `scripts/**`)
- Documentation (`README.md`, `COMPONENT_LIST.md`, `DESIGN_SYSTEM.md`)

Example for a non-breaking feature:
```
feat(button): add `variant="cool"` option

Replaces the boolean `isCool` prop, which is kept as a deprecated alias
that maps to `variant="cool"`. `isCool` will be removed in v2.0.0.
```

Example for a breaking change:
```
refactor(theme)!: remove `primitives` export

Primitives were never intended as public API but were reachable via
deep imports. Components should consume `theme.*` computed getters only.

BREAKING CHANGE: `import { primitives } from "@squonkstack/ui"` is removed.
Replace with the corresponding `theme.*` getter — see MIGRATIONS.md.
```

## Step 3 — validate the message locally

Before committing, dry-run commitlint:
```bash
# Run from the repository root
echo "feat(button): add variant prop" | npx --no -- commitlint
```
Exit 0 = valid. Fix any reported violations before the actual commit.

## Step 4 — preview the resulting release

```bash
# Run from the repository root
npx semantic-release --dry-run --no-ci 2>&1 | tail -40
```

Show the user:
- Current version (from `package.json`)
- Predicted next version
- Predicted release notes (what the GitHub Release will say)

If the predicted version doesn't match what the user expects (e.g. they thought this was a major but it shows minor), flag it — usually that means a missing `!` or `BREAKING CHANGE:` footer.

## Step 5 — create the commit

Use a HEREDOC for proper multi-line formatting:
```bash
git add -- <specific files>
git commit -m "$(cat <<'EOF'
feat(button): add variant prop

Replaces the boolean isCool prop with a discriminated `variant` union...

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Run pre-commit hooks naturally — never `--no-verify`. If `pre-commit` fails (`lint-staged && tsc --noEmit`), fix the underlying issue and **create a new commit**, don't `--amend`.

### CRITICAL: never mask the exit code of git commands

When chaining `git commit` with anything else (status output, push, formatting), **never pipe through `tail`, `head`, `grep`, or any filter** — the pipe swallows git's exit code and a failed pre-commit hook will look like success.

Wrong (this exact pattern shipped broken `main` once):
```bash
git commit -m "..." 2>&1 | tail -10 && git push    # BROKEN: tail masks commit failure
```

Right — run them as separate calls and check exit codes:
```bash
git commit -m "..." || { echo "commit failed, aborting"; exit 1; }
git push origin "$BRANCH"
```

Or use `set -e` in a script. The rule: **anything that decides whether to push next must see git's real exit code.**

## Step 6 — push the branch; open and merge the pull request

Push feature branches freely:
```bash
git push -u origin <branch>
```

Never push to `main`: changes land through GitHub pull requests. When the merged commits call for a release (`feat:`, `fix:`, `perf:`, a breaking change), the CI workflow's `release` job publishes to npm, tags and creates the GitHub Release; `docs:`, `test:`, `ci:` and `chore:` alone release nothing. Say what the merge will release:

> "This is a `<predicted-version>` release — `semantic-release` will publish when it merges."

Open the pull request with `gh pr create`. Merge it (a merge commit) only once its checks pass, including the Playwright component tests, and a maintainer has approved it.

## Quick reference — what NOT to do

- **Don't add to `CHANGELOG.md`.** Release notes live on GitHub Releases.
- **Don't edit `package.json` version.** It stays `0.0.0-development`; the version comes from tags.
- **Don't use `--no-verify`** to skip the commit-msg or pre-commit hook. If it fails, fix the cause.
- **Don't bundle unrelated changes** into a single commit — semantic-release reads each commit independently to determine the bump.
- **Don't squash conventional commits into a single non-conventional one** before merging — the per-commit semantics get lost.
