// `npx @squonk/ui-mcp init`: installs @squonk/ui and this server in an app,
// registers the server with the developer's coding agents and adds the agent
// instructions. Every step asks first, and running it again changes nothing.
// `npx @squonk/ui` runs this too, with --no-mcp when the server is declined:
// then only the registry, the library and the instructions are set up.
import * as p from "@clack/prompts";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { findRoot } from "../project.ts";
import { claudeCodeWindowsConfig, claudeDesktopConfig } from "./desktop.ts";
import {
  AGENTS,
  ESLINT_SNIPPET,
  ROOT_SNIPPET,
  addClaudeLocalServer,
  addCodexServer,
  addDesktopServer,
  desktopServerEntry,
  desktopServerRoot,
  addJsonServer,
  importAgentsIntoClaude,
  isPublicRegistry,
  scopeRegistry,
  installCommand,
  packagesToInstall,
  upsertAgentsBlock,
  windowsProjectKey,
  type Agent,
  type PackageManager,
} from "./writers.ts";

const HELP = `Usage: npx @squonk/ui-mcp init [options]

\`npx @squonk/ui\` runs this too, after asking whether to include the MCP server.

  --yes                Accept every default without asking (for scripts and agents)
  --agents <list>      Comma-separated: claude,codex,vscode,cursor,claude-desktop
  --no-install         Don't install packages
  --no-mcp             Skip the MCP server: don't install @squonk/ui-mcp or connect agents
  --windows-client     In WSL: Claude Code runs on Windows, so start the server inside WSL for it
  -h, --help           Show this help`;

const read = (file: string) => (existsSync(file) ? readFileSync(file, "utf8") : undefined);

function detectPackageManager(root: string): PackageManager {
  if (existsSync(path.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(root, "yarn.lock"))) return "yarn";
  if (existsSync(path.join(root, "bun.lock")) || existsSync(path.join(root, "bun.lockb"))) return "bun";
  return "npm";
}

function detectAgents(root: string): Agent[] {
  const found: Agent[] = [];
  if (existsSync(path.join(root, ".claude")) || existsSync(path.join(root, "CLAUDE.md")) || existsSync(path.join(root, ".mcp.json"))) found.push("claude");
  if (existsSync(path.join(root, ".codex"))) found.push("codex");
  if (existsSync(path.join(root, ".vscode"))) found.push("vscode");
  if (existsSync(path.join(root, ".cursor"))) found.push("cursor");
  const desktop = claudeDesktopConfig();
  if (desktop && existsSync(path.dirname(desktop.file))) found.push("claude-desktop");
  return found.length ? found : ["claude"];
}

function eslintConfig(root: string): string | undefined {
  return ["eslint.config.js", "eslint.config.mjs", "eslint.config.ts", "eslint.config.mts", "eslint.config.cjs"].find((f) => existsSync(path.join(root, f)));
}

/**
 * The node running init, by a path that survives upgrades. process.execPath is
 * the resolved binary, such as Homebrew's versioned Cellar folder, so prefer
 * the PATH entry that points at the same file. A version manager's shim is a
 * script, not that file, so then the binary's own path is used.
 */
function stableNode(): string {
  const real = realpathSync(process.execPath);
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    const candidate = path.join(dir, process.platform === "win32" ? "node.exe" : "node");
    try {
      if (dir && realpathSync(candidate) === real) return candidate;
    } catch {
      // Not in this folder.
    }
  }
  return process.execPath;
}

export async function init(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      yes: { type: "boolean", short: "y" },
      agents: { type: "string" },
      "no-install": { type: "boolean" },
      "no-mcp": { type: "boolean" },
      "windows-client": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(HELP);
    return;
  }
  const auto = Boolean(values.yes) || !process.stdout.isTTY;
  const shouldInstall = !values["no-install"];
  const mcp = !values["no-mcp"];
  const changed: string[] = [];

  /** Asks yes/no, or takes the default under --yes. Exits cleanly on Ctrl+C. */
  const ask = async (message: string, initialValue = true) => {
    if (auto) return initialValue;
    const answer = await p.confirm({ message, initialValue });
    if (p.isCancel(answer)) {
      p.cancel("Setup cancelled. Nothing after this step was changed.");
      process.exit(0);
    }
    return answer;
  };
  const write = (root: string, file: string, next: string, current: string | undefined) => {
    if (next === current) return;
    const full = path.join(root, file);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, next);
    changed.push(file);
  };

  /**
   * .mcp.json runs npx on the machine the agent runs on. When the checkout is
   * in WSL and Claude Code runs on Windows (the desktop app's Code tab opening
   * a \\wsl.localhost folder), that is Windows, which usually has no Node, and
   * the server never starts. A local-scope entry in the Windows user's
   * .claude.json starts it inside WSL instead, without changing the repository.
   */
  const windowsClient = async () => {
    const windows = claudeCodeWindowsConfig();
    if (!windows) return;
    const wanted = values["windows-client"] ??
      (await ask("Does Claude Code run on Windows for this app (the desktop app's Code tab opening a \\\\wsl.localhost folder)? Then it needs a launcher that starts the server inside WSL.", false));
    if (!wanted) return;
    const cli = path.join(root, "node_modules", "@squonk", "ui-mcp", "dist", "cli.js");
    if (!existsSync(cli)) {
      p.log.warn("The Windows launcher runs this app's installed @squonk/ui-mcp; install it (run init again without --no-install), then run init again.");
      return;
    }
    const current = read(windows.file);
    try {
      const next = addClaudeLocalServer(current, windowsProjectKey(windows.wslDistro, root), desktopServerEntry(root, stableNode(), { wslDistro: windows.wslDistro }));
      if (next === current) return;
      // Claude Code rewrites this file often, so swap it in whole rather than writing in place.
      writeFileSync(`${windows.file}.squonk-ui`, next);
      renameSync(`${windows.file}.squonk-ui`, windows.file);
      changed.push(`${windows.file} (Claude Code on Windows, this folder's local scope)`);
    } catch (error) {
      p.log.warn((error as Error).message);
    }
  };

  p.intro("@squonk/ui setup");

  let root: string;
  try {
    root = findRoot(process.cwd());
  } catch {
    p.cancel("Run this in your app's folder (one with a package.json).");
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  const installed = { ...manifest.dependencies, ...manifest.devDependencies };
  p.log.info(`App: ${manifest.name ?? path.basename(root)} (${root})`);

  // 1. Registry. The packages are on the public npm registry and need no sign-in.
  // An old `@squonk:registry` line in the app's or the user's .npmrc would send
  // installs somewhere else, so point it out (the app's .npmrc wins, as in npm).
  const userNpmrcPath = process.env.npm_config_userconfig || process.env.NPM_CONFIG_USERCONFIG || path.join(homedir(), ".npmrc");
  for (const [label, file] of [["This app's .npmrc", path.join(root, ".npmrc")], ["Your ~/.npmrc", userNpmrcPath]] as const) {
    const registry = scopeRegistry(read(file));
    if (registry && !isPublicRegistry(registry)) {
      p.log.warn(`${label} sends @squonk packages to ${registry}. They're on the public npm registry now: remove the @squonk:registry line (${file}).`);
      break;
    }
  }

  // 2. Packages.
  const pm = detectPackageManager(root);
  // `npx @squonk/ui` runs the init released with it, so this is that version too.
  const { version } = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  const toInstall = packagesToInstall(installed, mcp, version);
  if (shouldInstall && toInstall.length) {
    const names = toInstall.map(([pkgs, dev]) => `${pkgs.join(" ")}${dev ? " (dev)" : ""}`).join(", ");
    if (await ask(`Install ${names} with ${pm}?`)) {
      for (const [pkgs, dev] of toInstall) {
        const [command, args] = installCommand(pm, pkgs, dev);
        const spin = p.spinner();
        spin.start(`${command} ${args.join(" ")}`);
        const result = spawnSync(command, args, { cwd: root, encoding: "utf8", shell: process.platform === "win32" });
        if (result.status !== 0) {
          spin.error(`${command} ${args.join(" ")} failed`);
          p.log.error((result.stderr || result.stdout || String(result.error)).trim().split("\n").slice(-12).join("\n"));
          p.cancel("Fix the install, then run init again; it picks up where it stopped.");
          process.exit(1);
        }
        spin.stop(`Installed ${pkgs.join(" ")}`);
      }
    }
  }

  // 3. Agents. Without the MCP server there is nothing to register, so it
  // only works out which instruction files to write, without asking.
  let agents: Agent[];
  if (typeof values.agents === "string") {
    agents = values.agents.split(",").map((a) => a.trim()).filter((a): a is Agent => a in AGENTS);
  } else if (auto || !mcp) {
    agents = detectAgents(root);
  } else {
    const picked = await p.multiselect({
      message: "Which coding agents should know about @squonk/ui?",
      options: (Object.keys(AGENTS) as Agent[]).map((value) => ({ value, label: AGENTS[value].label, hint: AGENTS[value].hint || undefined })),
      initialValues: detectAgents(root),
      required: false,
    });
    if (p.isCancel(picked)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    agents = picked;
  }

  if (!mcp) agents = agents.filter((agent) => agent !== "claude-desktop");

  for (const agent of mcp ? agents : []) {
    if (agent === "claude-desktop") {
      const desktop = claudeDesktopConfig();
      const cli = path.join(root, "node_modules", "@squonk", "ui-mcp", "dist", "cli.js");
      if (!desktop) {
        p.log.warn("Couldn't find Claude Desktop's settings on this computer, so it wasn't set up.");
      } else if (!existsSync(cli)) {
        p.log.warn("Claude Desktop runs this app's installed @squonk/ui-mcp; install it (run init again without --no-install), then set up Claude Desktop.");
      } else {
        const current = read(desktop.file);
        const other = desktopServerRoot(current);
        if (!other || other === root || (await ask(`Claude Desktop's squonk-ui server points at ${other}. Point it at this app instead? It can serve one app at a time.`))) {
          try {
            write("", desktop.file, addDesktopServer(current, desktopServerEntry(root, stableNode(), { wslDistro: desktop.wslDistro })), current);
          } catch (error) {
            p.log.warn((error as Error).message);
          }
        }
      }
      continue;
    }
    const file = AGENTS[agent].config;
    const current = read(path.join(root, file));
    try {
      write(root, file, agent === "codex" ? addCodexServer(current) : addJsonServer(current, agent), current);
    } catch (error) {
      p.log.warn((error as Error).message);
    }
    if (agent === "claude") await windowsClient();
  }

  // 4. Instructions every agent reads, and the skill for Claude Code.
  if (agents.length) {
    const agentsMd = read(path.join(root, "AGENTS.md"));
    // Keep the MCP wording if the server is already installed from an earlier run.
    write(root, "AGENTS.md", upsertAgentsBlock(agentsMd, { mcp: mcp || Boolean(installed["@squonk/ui-mcp"]) }), agentsMd);
  }
  if (agents.includes("claude")) {
    const claudeMd = read(path.join(root, "CLAUDE.md"));
    write(root, "CLAUDE.md", importAgentsIntoClaude(claudeMd), claudeMd);
    const link = path.join(root, ".claude", "skills", "use-squonk-ui");
    const exists = (() => {
      try {
        return Boolean(lstatSync(link));
      } catch {
        return false;
      }
    })();
    if (!exists && (await ask("Link the @squonk/ui skill into .claude/skills so Claude Code loads it as a skill? It follows the installed version."))) {
      mkdirSync(path.dirname(link), { recursive: true });
      try {
        symlinkSync(path.join("..", "..", "node_modules", "@squonk", "ui", "skills", "use-squonk-ui"), link, "dir");
        changed.push(".claude/skills/use-squonk-ui (link)");
      } catch (error) {
        p.log.warn(`Couldn't create the link (${(error as Error).message}). AGENTS.md still points agents at the skill.`);
      }
    }
  }

  // 5. Things that touch the app's own code are shown, not written.
  const eslint = eslintConfig(root);
  if (eslint) p.note(ESLINT_SNIPPET, `Add the lint rules to ${eslint}`);
  if (!installed["@squonk/ui"]) p.note(ROOT_SNIPPET, "Load the styles and provider at your app's root");

  if (changed.length) p.log.success(`Changed:\n${changed.map((f) => `  ${f}`).join("\n")}`);
  else p.log.info("Everything was already set up.");
  if (!mcp) p.outro("Done. To add the MCP server for coding agents later, run `npx @squonk/ui` again.");
  else
    p.outro(
      agents.length
        ? `Restart your agent so it loads the "squonk-ui" server${agents.includes("claude-desktop") ? " (quit Claude Desktop fully, from the tray or menu bar, and reopen it)" : ""}, then try: "Preview a sign-in form built with @squonk/ui". If it says "Connection closed", run \`npx @squonk/ui-mcp check\`.`
        : "Done.",
    );
}
