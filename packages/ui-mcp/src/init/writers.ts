// Pure edits to the files `init` touches. Each takes the file's current text
// (undefined when it doesn't exist) and returns the new text, or the same text
// when nothing needs to change, so running init twice changes nothing.

export const SERVER_NAME = "squonk-ui";
/** Runs the app's installed copy; npx falls back to the registry when it isn't installed. */
export const SERVER_COMMAND = { command: "npx", args: ["-y", "@squonk/ui-mcp"] };

export type Agent = "claude" | "codex" | "vscode" | "cursor" | "claude-desktop";

export const AGENTS: Record<Agent, { label: string; config: string; hint: string }> = {
  claude: { label: "Claude Code", config: ".mcp.json", hint: "also the Claude desktop app's Code tab" },
  codex: { label: "Codex", config: ".codex/config.toml", hint: "read for trusted projects" },
  vscode: { label: "VS Code (Copilot)", config: ".vscode/mcp.json", hint: "shows stories with live controls in the chat" },
  cursor: { label: "Cursor", config: ".cursor/mcp.json", hint: "" },
  "claude-desktop": { label: "Claude Desktop", config: "claude_desktop_config.json", hint: "shows stories with live controls in the chat; your user settings" },
};

function parseJson(text: string | undefined, file: string): Record<string, unknown> {
  if (!text?.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${file} isn't valid JSON (comments aren't supported); add the "${SERVER_NAME}" server by hand.`);
  }
}

/** Adds the server to a JSON MCP config, keeping every other server. */
export function addJsonServer(text: string | undefined, agent: Exclude<Agent, "codex" | "claude-desktop">): string {
  const config = parseJson(text, AGENTS[agent].config);
  // VS Code keys servers under `servers` and wants a type; the others use `mcpServers`.
  const key = agent === "vscode" ? "servers" : "mcpServers";
  const servers = (config[key] ?? {}) as Record<string, unknown>;
  if (servers[SERVER_NAME]) return text!;
  servers[SERVER_NAME] = agent === "vscode" ? { type: "stdio", ...SERVER_COMMAND } : { ...SERVER_COMMAND };
  return `${JSON.stringify({ ...config, [key]: servers }, null, 2)}\n`;
}

export function addCodexServer(text: string | undefined): string {
  if (text && new RegExp(`^\\[mcp_servers\\.(${SERVER_NAME}|"${SERVER_NAME}")\\]`, "m").test(text)) return text;
  const block = [`[mcp_servers.${SERVER_NAME}]`, `command = "${SERVER_COMMAND.command}"`, `args = [${SERVER_COMMAND.args.map((a) => `"${a}"`).join(", ")}]`].join("\n");
  return text?.trim() ? `${text.trimEnd()}\n\n${block}\n` : `${block}\n`;
}

const START = "<!-- @squonk/ui:start -->";
const END = "<!-- @squonk/ui:end -->";

/**
 * The instructions section for AGENTS.md. Without the MCP server (`init
 * --no-mcp`) it points agents at the catalog instead of the server's tools.
 */
export function agentsBlock(mcp = true): string {
  const find = mcp
    ? `- Use the \`${SERVER_NAME}\` MCP server: \`find_guidance\` and \`get_guide\` for the design rules, \`find_components\` and \`get_component\` before writing UI, and \`list_stories\` and \`preview_story\` to show the user a library component or example with live controls.`
    : "- Before writing UI, look components up in the catalog that ships with it, `@squonk/ui/catalog.json`, and read the design guides in `@squonk/ui/guides.json`; the skill shows how.";
  return `${START}
## UI: @squonk/ui

This app builds its UI with \`@squonk/ui\`, Squonk's React component library.

- Before writing UI, read the skill that ships with the installed version: \`node_modules/@squonk/ui/skills/use-squonk-ui/SKILL.md\`.
${find}
- After UI changes, look at the result in the running app with your browser tools (or ask the user to open the dev server), in light and dark and at a phone width.
- Compose library components. Don't restyle them, rebuild what exists, or import from \`@squonk/ui/dist\`.
- Run the linter after UI changes; \`@squonk/ui/eslint\` flags native controls and colour literals.
${END}`;
}

export const AGENTS_BLOCK = agentsBlock();

/** Adds or refreshes the marked block, leaving the rest of the file alone. */
export function upsertAgentsBlock(text: string | undefined, { mcp = true }: { mcp?: boolean } = {}): string {
  const block = agentsBlock(mcp);
  if (!text?.trim()) return `# Agent instructions\n\n${block}\n`;
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  if (start !== -1 && end > start) return text.slice(0, start) + block + text.slice(end + END.length);
  return `${text.trimEnd()}\n\n${block}\n`;
}

/**
 * Whether a version is one the registry has: semantic-release publishes both
 * packages at each one. A development version (0.0.0-…) has no release.
 */
export function isRelease(version: string | undefined): version is string {
  return /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version ?? "") && !version!.startsWith("0.0.0");
}

/**
 * What init installs: the library, and the server as a dev dependency unless
 * the MCP server was declined. Both are pinned to `version`, init's own, when
 * it is a release, so the app gets a matching pair; otherwise they're
 * unpinned. Each entry is [packages, dev].
 */
export function packagesToInstall(installed: Record<string, unknown>, mcp: boolean, version?: string): [string[], boolean][] {
  const spec = (name: string) => (isRelease(version) ? `${name}@${version}` : name);
  const list: [string[], boolean][] = [];
  if (!installed["@squonk/ui"]) list.push([[spec("@squonk/ui")], false]);
  if (mcp && !installed["@squonk/ui-mcp"]) list.push([[spec("@squonk/ui-mcp")], true]);
  return list;
}

/** Claude Code reads CLAUDE.md, not AGENTS.md; an import line shares one set of instructions. */
export function importAgentsIntoClaude(text: string | undefined): string {
  if (text && /^@AGENTS\.md\s*$/m.test(text)) return text;
  return text?.trim() ? `${text.trimEnd()}\n\n@AGENTS.md\n` : "@AGENTS.md\n";
}

/**
 * The registry an .npmrc sends the @squonk scope to, or undefined when it has
 * no `@squonk:registry` line. The packages are on the public npm registry, so
 * a line pointing anywhere else makes installs fail or pick up old versions.
 */
export function scopeRegistry(text: string | undefined): string | undefined {
  return text?.match(/^@squonk:registry\s*=\s*(\S+)/m)?.[1];
}

/** Whether a registry URL is the public npm registry. */
export function isPublicRegistry(url: string): boolean {
  return /^https?:\/\/registry\.npmjs\.org\/?$/.test(url);
}

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export function installCommand(pm: PackageManager, packages: string[], dev: boolean): [string, string[]] {
  const verb = pm === "npm" ? "install" : "add";
  const devFlag = dev ? [pm === "bun" ? "-d" : "-D"] : [];
  return [pm, [verb, ...devFlag, ...packages]];
}

export const ESLINT_SNIPPET = `import squonkUi from "@squonk/ui/eslint";

export default [
  ...squonkUi.configs.recommended,
  // ...your existing config
];`;

export const ROOT_SNIPPET = `import "@squonk/ui/fonts.css";
import "@squonk/ui/styles.css";
import { SquonkThemeProvider } from "@squonk/ui/theme-provider";

<SquonkThemeProvider mode="light" withGlobalStyles>
  <App />
</SquonkThemeProvider>`;

/** Where Claude Desktop runs relative to this shell: on Windows when this is WSL. */
export type DesktopHost = { wslDistro?: string };

/**
 * Claude Desktop starts servers outside the project and without your shell's
 * environment, so its entry runs the app's installed copy with absolute paths
 * and names the app with --root. No registry or token is needed at launch.
 * From WSL it starts the server inside the distro with wsl.exe.
 */
export function desktopServerEntry(root: string, node: string, host: DesktopHost = {}): { command: string; args: string[] } {
  const cli = `${root.replace(/[\\/]+$/, "")}/node_modules/@squonk/ui-mcp/dist/cli.js`;
  const args = [cli, "--root", root];
  return host.wslDistro ? { command: "wsl.exe", args: ["-d", host.wslDistro, "--exec", node, ...args] } : { command: node, args };
}

/**
 * Puts the server in Claude Desktop's config, keeping every other server and
 * setting. Claude Desktop has one config for all apps, so an existing
 * squonk-ui entry for another app is replaced; ask before calling this.
 */
export function addDesktopServer(text: string | undefined, entry: { command: string; args: string[] }): string {
  const config = parseJson(text, AGENTS["claude-desktop"].config);
  const servers = (config.mcpServers ?? {}) as Record<string, unknown>;
  if (JSON.stringify(servers[SERVER_NAME]) === JSON.stringify(entry)) return text!;
  return `${JSON.stringify({ ...config, mcpServers: { ...servers, [SERVER_NAME]: entry } }, null, 2)}\n`;
}

/**
 * The key Claude Code on Windows gives a WSL folder opened by its
 * \\wsl.localhost path, in the Windows user's .claude.json.
 */
export function windowsProjectKey(distro: string, root: string): string {
  return `//wsl.localhost/${distro}${root.replace(/[\\/]+$/, "")}`;
}

/**
 * The key Claude Code already uses for a project, if any. Windows paths ignore
 * case, so the distro may be stored as "ubuntu" when WSL calls it "Ubuntu".
 */
export function findProjectKey(projects: Record<string, unknown> | undefined, key: string): string {
  return Object.keys(projects ?? {}).find((k) => k.toLowerCase() === key.toLowerCase()) ?? key;
}

/**
 * Puts the server in a project's local scope in Claude Code's user config
 * (~/.claude.json), keeping everything else. The local scope wins over the
 * shared .mcp.json, so a Windows client can start the server inside WSL
 * without changing the repository.
 */
export function addClaudeLocalServer(text: string | undefined, projectKey: string, entry: { command: string; args: string[] }): string {
  const config = parseJson(text, ".claude.json");
  const projects = (config.projects ?? {}) as Record<string, Record<string, unknown>>;
  projectKey = findProjectKey(projects, projectKey);
  const project = projects[projectKey] ?? {};
  const servers = (project.mcpServers ?? {}) as Record<string, unknown>;
  if (JSON.stringify(servers[SERVER_NAME]) === JSON.stringify({ type: "stdio", ...entry })) return text!;
  const next = { ...projects, [projectKey]: { ...project, mcpServers: { ...servers, [SERVER_NAME]: { type: "stdio", ...entry } } } };
  return `${JSON.stringify({ ...config, projects: next }, null, 2)}\n`;
}

/** The app folder an existing Claude Desktop entry points at, if any. */
export function desktopServerRoot(text: string | undefined): string | undefined {
  try {
    const entry = (JSON.parse(text ?? "{}").mcpServers ?? {})[SERVER_NAME] as { args?: string[] } | undefined;
    const i = entry?.args?.indexOf("--root") ?? -1;
    return i >= 0 ? entry!.args![i + 1] : undefined;
  } catch {
    return undefined;
  }
}
