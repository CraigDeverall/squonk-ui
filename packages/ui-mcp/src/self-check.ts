// `npx @squonk/ui-mcp check`: starts each squonk-ui server the app's agent
// configs name, the way the agent will, and reports the ones that don't answer.
// An agent only says "Connection closed" when its server can't start, so this
// finds a missing Node, token or path before a session does.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { claudeCodeWindowsConfig, claudeDesktopConfig } from "./init/desktop.ts";
import { SERVER_NAME, findProjectKey, windowsProjectKey } from "./init/writers.ts";
import { findRoot } from "./project.ts";

const HELP = `Usage: npx @squonk/ui-mcp check [options]

Starts each "${SERVER_NAME}" server this app's agent configs name and checks it answers.

  --client windows     Run the commands through Windows, as a Windows agent would (from WSL)
  -h, --help           Show this help`;

export type ServerEntry = { command: string; args?: string[]; cwd?: string };
export type ConfiguredServer = { source: string; entry: ServerEntry; windows?: boolean };

const readJson = (file: string) => {
  try {
    return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
};
const product = (servers: unknown) => (servers as Record<string, ServerEntry> | undefined)?.[SERVER_NAME];

/** Every squonk-ui entry that would start for this app, and where each one is configured. */
export function configuredServers(root: string, { windowsClient = false } = {}): ConfiguredServer[] {
  const found: ConfiguredServer[] = [];
  for (const [file, key] of [[".mcp.json", "mcpServers"], [".cursor/mcp.json", "mcpServers"], [".vscode/mcp.json", "servers"]] as const) {
    const entry = product(readJson(path.join(root, file))?.[key]);
    if (entry?.command) found.push({ source: file, entry: { ...entry, cwd: root }, windows: windowsClient });
  }
  const codex = existsSync(path.join(root, ".codex/config.toml")) ? readFileSync(path.join(root, ".codex/config.toml"), "utf8") : "";
  const table = new RegExp(`^\\[mcp_servers\\.(?:${SERVER_NAME}|"${SERVER_NAME}")\\]([\\s\\S]*?)(?=^\\[|(?![\\s\\S]))`, "m").exec(codex)?.[1];
  const command = table && /^command\s*=\s*"([^"]+)"/m.exec(table)?.[1];
  if (command) {
    const args = [...(/^args\s*=\s*\[([^\]]*)\]/m.exec(table)?.[1] ?? "").matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    found.push({ source: ".codex/config.toml", entry: { command, args, cwd: root }, windows: windowsClient });
  }
  const windows = claudeCodeWindowsConfig();
  if (windows) {
    const projects = readJson(windows.file)?.projects as Record<string, { mcpServers?: unknown }> | undefined;
    const key = findProjectKey(projects, windowsProjectKey(windows.wslDistro, root));
    const entry = product(projects?.[key]?.mcpServers);
    // The local scope replaces .mcp.json for a Windows client, so check it instead.
    if (entry?.command) {
      for (const server of found) if (server.source === ".mcp.json") server.windows = false;
      found.push({ source: `Claude Code on Windows, local scope (${key})`, entry, windows: true });
    }
  }
  const desktop = claudeDesktopConfig();
  const desktopEntry = desktop && product(readJson(desktop.file)?.mcpServers);
  if (desktopEntry?.command) found.push({ source: "Claude Desktop", entry: desktopEntry, windows: Boolean(desktop?.wslDistro) });
  return found;
}

/** What a failed start most likely means, from the error and the server's stderr. */
export function diagnose(message: string, stderr: string, windows: boolean): string {
  const text = `${message}\n${stderr}`;
  if (/ENOENT|not recognized as an internal or external command|command not found/i.test(text))
    return windows
      ? "The command doesn't exist on Windows. Windows usually has no Node: start the server inside WSL with `npx @squonk/ui-mcp init --windows-client`."
      : "The command doesn't exist on this machine. Install Node, or check the command in the config.";
  if (/\bE?40[13]\b/.test(text)) return "The registry refused the request. The @squonk packages are public on registry.npmjs.org and need no sign-in: remove any old @squonk:registry line (and its _authToken line) from the app's .npmrc and ~/.npmrc.";
  if (/\bE?404\b/.test(text)) return "npm couldn't find @squonk/ui-mcp. Check that the app's .npmrc and ~/.npmrc have no old @squonk:registry line pointing somewhere other than registry.npmjs.org, and that the pinned version exists.";
  if (/Cannot find module|MODULE_NOT_FOUND/.test(text)) return "The installed @squonk/ui-mcp is missing: run npm install in the app, or init again.";
  if (/timed out/i.test(text)) return "The server started but didn't answer in time. Run the command yourself to see what it's waiting for.";
  return "The server stopped before answering. Its output is above.";
}

/** Starts one entry and asks it for its tools. Resolves to the tool names, or throws with its stderr. */
export async function probe({ entry, windows }: ConfiguredServer, timeout = 60_000): Promise<{ version?: string; tools: string[] }> {
  // From WSL, cmd.exe runs the command on Windows, as a Windows agent would.
  const viaWindows = windows && Boolean(process.env.WSL_DISTRO_NAME);
  const transport = new StdioClientTransport({
    command: viaWindows ? "cmd.exe" : entry.command,
    args: viaWindows ? ["/d", "/c", entry.command, ...(entry.args ?? [])] : (entry.args ?? []),
    cwd: viaWindows ? undefined : entry.cwd,
    stderr: "pipe",
  });
  let stderr = "";
  transport.stderr?.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
  const client = new Client({ name: "squonk-ui-check", version: "1" });
  try {
    await Promise.race([
      client.connect(transport),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`No answer after ${timeout / 1000} seconds (timed out).`)), timeout).unref()),
    ]);
    const { tools } = await client.listTools();
    return { version: client.getServerVersion()?.version, tools: tools.map((t) => t.name) };
  } catch (error) {
    throw Object.assign(new Error((error as Error).message), { stderr });
  } finally {
    await client.close().catch(() => {});
  }
}

export async function check(argv: string[]) {
  const { values } = parseArgs({ args: argv, options: { client: { type: "string" }, help: { type: "boolean", short: "h" } } });
  if (values.help) {
    console.log(HELP);
    return;
  }
  const root = findRoot(process.cwd());
  const servers = configuredServers(root, { windowsClient: values.client === "windows" });
  if (!servers.length) {
    console.log(`No agent config for this app names a "${SERVER_NAME}" server. Run npx @squonk/ui-mcp init.`);
    process.exitCode = 1;
    return;
  }
  for (const server of servers) {
    const where = server.windows && process.env.WSL_DISTRO_NAME ? " on Windows" : "";
    const command = [server.entry.command, ...(server.entry.args ?? [])].join(" ");
    try {
      const { version, tools } = await probe(server);
      console.log(`✔ ${server.source}: started${where}, ${SERVER_NAME} ${version ?? ""} with ${tools.length} tools.\n    ${command}`);
    } catch (error) {
      const stderr = ((error as { stderr?: string }).stderr ?? "").trim();
      console.log(`✖ ${server.source}: didn't start${where}.\n    ${command}`);
      if (stderr) console.log(stderr.split("\n").slice(-8).map((line) => `    | ${line}`).join("\n"));
      console.log(`    ${diagnose((error as Error).message, stderr, Boolean(server.windows))}`);
      process.exitCode = 1;
    }
  }
}
