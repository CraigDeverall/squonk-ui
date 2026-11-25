---
name: prototype-live
description: Preview an @squonk/ui component or composition in its real rendered environment using existing Storybook or component-test tooling. Use for visual iteration and interactive exploration; do not substitute screenshots for behavior verification.
---

# Prototype Live

Execution context: [repository skill contract](../README.md#skill-execution-contract).
Discover available tools first. This skill does not register MCP servers, install
browser tools globally or authorize a different project stack.

## Choose a real rendering path

1. Prefer an existing story or demo. Run `npm run dev` from the repository root if
   needed, retain its process handle, and open the reported URL with available
   browser tools. Do not assume a globally installed Playwright MCP server.
2. For a new composition, add a clearly identified temporary story using the actual
   `@squonk/ui` components and Squonk theme providers. Use realistic fixture data and local
   handlers; network operations must not run merely because a prototype is opened.
3. For a reproducible component behavior check, use the existing Playwright CT
   harness. Before Docker-backed `npm test`, inspect running project containers and
   follow the one-project rule. Do not stop another task's stack without coordination.

A browser profile already in use is a coordination problem. Reuse the supported
session or launch an isolated session through the available tool. Never kill the
user's browser or change their global MCP settings as an automatic workaround.

## Review the experience

Compare supported light/dark modes and narrow/wide parents. Exercise the paths that
matter: keyboard entry, focus return, disabled/loading states, validation, menus,
scroll and reduced motion. Observe actual rendered changes between iterations.
Use `Presentation`, `ThemeModifier` and `ThemeStyleBlock` for their documented roles;
use `theme-scratchpad` when comparing theme input instead of component behavior.

Report viewport, mode, scenario and actual checks with the output. A static PNG is
visual evidence, not an interactive artifact. If no rendering path is available,
return a composition proposal or a runnable story without claiming it was rendered.

Remove only task-owned scratch files/processes when finished. Keep intended examples
in the repository with docs and behavioral coverage appropriate to their purpose.
