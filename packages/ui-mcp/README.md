# @squonkstack/ui-mcp

Connects coding agents to [`@squonkstack/ui`](../../README.md). It has two parts:

- **An MCP server** with component lookup, the design guides, and the library's own Storybook stories, which it shows with live controls, rendered with the app's installed components.
- **A setup command** that installs everything and registers the server with your agents.

## Set up an app

The packages are on the public npm registry, so there's nothing to sign in to. Run this in the app's folder:

```sh
npx @squonkstack/ui
```

It asks whether to set up the MCP server (default yes), then runs `npx @squonkstack/ui-mcp init` at the same version as the `@squonkstack/ui` it came from. You can also run `npx @squonkstack/ui-mcp init` directly; it sets up the MCP server without asking.

It asks before each step, and running it again changes nothing:

1. Warns if the app's or your home `.npmrc` still sends `@squonkstack` to another registry, which would stop installs reaching npm.
2. Installs `@squonkstack/ui`, and `@squonkstack/ui-mcp` as a dev dependency, both at the version of `init` you ran, so the pair always matches and every developer and agent runs the same version. Packages already in the app are left as they are.
3. Registers the `squonk-ui` server for the agents you pick:

   | Agent | File |
   | --- | --- |
   | Claude Code (also the desktop app's Code tab) | `.mcp.json` |
   | Codex | `.codex/config.toml` (Codex reads it in trusted projects) |
   | VS Code (Copilot) | `.vscode/mcp.json` |
   | Cursor | `.cursor/mcp.json` |
   | Claude Desktop (chat) | `claude_desktop_config.json` in your user settings, including the Microsoft Store build's. The entry runs the app's installed copy with absolute paths and `--root`, through `wsl.exe` when you run `init` in WSL, so it starts without a registry token. Claude Desktop runs one `squonk-ui` server at a time; `init` asks before switching it to another app. |

4. Adds a marked `@squonkstack/ui` section to `AGENTS.md`, which points agents at the installed skill and the server's tools. For Claude Code it also imports that file into `CLAUDE.md`, and can link the skill into `.claude/skills`.
5. Shows the ESLint and app-root snippets. It doesn't edit your code.

`--yes` accepts every default without asking, `--agents claude,codex` picks agents, `--no-install` skips installing, and `--windows-client` sets up Claude Code on Windows for a WSL checkout ([see below](#windows-agent-wsl-checkout)).

`--no-mcp` skips the server: it still installs `@squonkstack/ui` and writes the `AGENTS.md` section (pointing agents at `@squonkstack/ui/catalog.json` instead of the server's tools), but doesn't install `@squonkstack/ui-mcp` or register it with any agent.

## Check that the server starts

An agent whose server can't start says only "Connection closed" at the start of a session, and has none of the tools below. Run this in the app's folder to start each `squonk-ui` server the app's configs name, the way the agent will:

```sh
npx @squonkstack/ui-mcp check
```

It reports each config's command, whether it answered and with how many tools, and what a failure most likely means: a command that doesn't exist on that machine, an old `@squonkstack:registry` line sending npm to another registry, or a missing install. `--client windows` runs the commands through Windows from WSL, as a Windows agent would.

### Windows agent, WSL checkout

`.mcp.json` runs `npx` on the machine the agent runs on. When the app is in WSL but Claude Code runs on Windows, for example the desktop app's Code tab with a `\\wsl.localhost\…` folder, that machine is Windows. Windows usually has no Node, token or `~/.npmrc`, so the server never starts.

When you run `init` in WSL and pick Claude Code, it asks whether the agent runs on Windows (`--windows-client` answers yes). If it does, `init` adds a launcher that starts the server inside WSL:

```json
{
  "type": "stdio",
  "command": "wsl.exe",
  "args": ["-d", "Ubuntu", "--exec", "/usr/bin/node", "/home/you/app/node_modules/@squonkstack/ui-mcp/dist/cli.js", "--root", "/home/you/app"]
}
```

It runs the app's installed copy with absolute paths, as the Claude Desktop entry does, so it needs no login shell or version manager at launch. Because the distro and paths are yours, `init` writes it to this folder's local scope in your Windows user's `.claude.json`, not to the shared `.mcp.json`. The local scope takes precedence over `.mcp.json`, and nothing in the repository changes. Restart the session afterwards. If you change Node versions and the path stops existing, run `init` again.

Opening the folder in the desktop app as a WSL project, so the session itself runs in WSL, avoids the problem: the shared `.mcp.json` then runs inside WSL too. VS Code, Cursor and Codex on Windows run the same `npx` command, so the same failure applies when they run outside WSL; VS Code's and Cursor's WSL remote modes run it inside WSL.

## Tools

| Tool | Arguments | What it does |
| --- | --- | --- |
| `find_components` | `query?` | Searches the installed catalog. Returns the import path, exports, purpose and UX patterns for each match. No query lists everything. |
| `get_component` | `id` | Returns a component's full catalog entry: types, documented sections, accessibility guidance and pitfalls, with each pattern linked to its guide. Takes an id, title or export name. |
| `find_guidance` | `query?` | Searches the design guides (Foundations, Patterns, Forms). Returns each match's id, summary and sections. No query lists every guide. |
| `get_guide` | `id` | Returns one guide as markdown: rules, do and don't examples with code, and links to components and other guides. Takes an id or title. |
| `list_stories` | `query?`, `component?`, `limit?` | Lists the stories shipped with the installed `@squonkstack/ui`: every component's variants and the example screens. With no arguments it lists them all, briefly: each story's id, "Component / Story" name, component and a short description, with `kind: "demo"` on the example screens. `query` ranks matches, best first. |
| `get_theme` | `id?` | An example theme's document to copy, or with no id a starter: the default primitives, what each switch, choice and slider does, and the shared purposes worth re-pointing. |
| `preview_story` | `storyId`, `theme?`, `width?`, `args?`, `exampleTheme?`, `customTheme?`, `screenshot?` | Shows one story with a Controls panel for its props, so the user can try it. See below. |

It also serves the catalog as resources, for hosts that browse or attach them:

| Resource | Contents |
| --- | --- |
| `squonk-ui://catalog` | The whole installed catalog, as JSON. |
| `squonk-ui://components/{id}` | One component or recipe's entry, as `get_component` returns it. Listed for every entry. |
| `squonk-ui://guides` | An index of the design guides. |
| `squonk-ui://guides/{id}` | One guide as markdown, as `get_guide` returns it. Listed for every guide. |

## Checking UI the agent wrote

The server doesn't render the agent's own code. After writing UI, the agent should look at it in the running app with the browser access it has: a Playwright or browser MCP server, a built-in browser, or the user opening the dev server's URL. That shows the real screen, with the app's data, routing and providers, which a separate preview can't.

## Stories with live controls

`preview_story` shows one of the library's Storybook stories, found with `list_stories`, so the user can try a component or an example screen without leaving the chat. It takes `storyId`, and optionally `theme` (`"light"` or `"dark"`; defaults to the host's), `width` (frame width in pixels, 240–2560, such as `375` for a phone), `args` (prop values to start from, such as `{ "variant": "danger" }`), `exampleTheme` (one of the docs' example themes, such as `"tidepool"`; the page also has a Theme picker), `customTheme` (a theme document the user is designing, optionally `basedOn` an example theme, checked with the installed library's parser; the page also has a Theme editor) and `screenshot` (`true` to also return a PNG and whether it rendered without errors).

The page renders the story as Storybook does, with its args, decorators and render function, and adds:

- a **Controls panel** built from the story's argTypes and its component's props: switches for booleans, inputs for text and numbers, selects or radios for options, and a JSON editor for objects and arrays. Changing one re-renders the story at once.
- a **Dark** switch, a **Width** select (fill, phone, tablet, desktop) and **Reset**, which puts the story's own args back.

The page's controls are `@squonkstack/ui` components themselves. Where it shows:

- **Hosts that support [MCP Apps](https://github.com/modelcontextprotocol/ext-apps)** show it in the chat. Today that means Claude Desktop, VS Code (Copilot) and ChatGPT.
- **claude.ai in a browser** can't connect: it only reaches servers on the internet, and this server runs on your computer against your app's installed packages. Use Claude Desktop for stories in a Claude chat.
- **Every host** also gets a local URL (`http://127.0.0.1:<port>/story/<id>`) to the same page. Claude Code, Codex and terminals call the tool as text only, so this link is how they show it. `http://127.0.0.1:<port>/` lists every story.
- **With `screenshot: true`**, the result includes a PNG of the story and whether it rendered without errors. This needs Playwright in the app (`npm i -D playwright && npx playwright install chromium`).

## How stories stay accurate

`@squonkstack/ui` ships its stories in `dist/stories`: `stories.mjs` (the stories, the example screens and their controls), `stories.css` and `manifest.json`, which `list_stories` reads without loading the code. The stories import the library's own built modules, so they use the same components as the app.

The first story builds one self-contained HTML page with esbuild from the app's own `node_modules`: React, `@squonkstack/ui`, its stories, `styles.css` and the fonts. It takes a few seconds and comes to about 3 MB. The page is cached in `node_modules/.cache/squonk-ui-mcp` and rebuilt when the library changes. Because it is built from the installed copy, a story always matches the version the app ships. Everything is inline, because MCP Apps hosts block outside scripts and styles by default.

## Server options

| Option | Default |
| --- | --- |
| `--root <dir>` or `SQUONK_UI_ROOT` | The working directory. Set it for hosts that don't start servers in the project, such as Claude Desktop's `claude_desktop_config.json`. |
| `SQUONK_UI_PREVIEW_PORT` | A free port, picked each session. |

## Develop

From the repository root:

```sh
npm run build                          # build @squonkstack/ui first; stories come from its dist
npm run build -w @squonkstack/ui-mcp
npm test -w @squonkstack/ui-mcp            # unit tests
npm run test:e2e -w @squonkstack/ui-mcp    # drives the built server against this repo, with screenshots
```

The package is released alongside `@squonkstack/ui`, with the same version. `npx @squonkstack/ui` (the library's `bin/squonk-ui.mjs`) relies on that: it runs `npx --yes @squonkstack/ui-mcp@<its own version> init`. A development version (`0.0.0-…`) has no matching release, so it uses `latest`, and init installs both packages unpinned. Run from a checkout with this package built, it runs the workspace copy instead, so `node <checkout>/bin/squonk-ui.mjs --no-install` in a scratch app tries both working trees together.
