// `npx @squonkstack/ui`: the front door for setting up an app. It asks whether to
// include the MCP server, then hands off to `@squonkstack/ui-mcp init`, the one
// setup implementation, at the same version as this package. It uses only Node
// built-ins, so running it adds nothing to the library's dependencies.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export const MCP_PACKAGE = "@squonkstack/ui-mcp";

export const HELP = `Usage: npx @squonkstack/ui [options]

Sets up @squonkstack/ui in the app in this folder: the registry, the package and
the agent instructions in AGENTS.md. It first asks whether to also set up the
MCP server for coding agents (${MCP_PACKAGE}), then runs \`npx ${MCP_PACKAGE} init\`
at the same version, which asks before each step.

  --yes                Accept every default without asking, including the MCP server
  --no-mcp             Skip the MCP server: don't install ${MCP_PACKAGE} or connect agents
  --agents <list>      Comma-separated: claude,codex,vscode,cursor,claude-desktop
  --no-install         Don't install packages
  -h, --help           Show this help`;

const AGENTS = /^[a-z-]+(,[a-z-]+)*$/;

/**
 * Parses the command line. Only known options are accepted, and the arguments
 * passed on are rebuilt from them, never copied, so nothing a user types
 * reaches a shell unchecked.
 * @param {string[]} argv
 * @returns {{ help: boolean, yes: boolean, mcp: boolean | undefined, install: boolean, agents: string | undefined }}
 */
export function parseSetupArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      yes: { type: "boolean", short: "y" },
      agents: { type: "string" },
      "no-install": { type: "boolean" },
      "no-mcp": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  // `npx @squonkstack/ui init` reads like the old command; accept it.
  const extra = positionals.filter((value, index) => !(index === 0 && value === "init"));
  if (extra.length) throw new Error(`Unexpected argument "${extra[0]}".`);
  const agents = values.agents?.replace(/\s+/g, "");
  if (agents !== undefined && !AGENTS.test(agents)) throw new Error(`--agents takes a comma-separated list, such as claude,codex.`);
  return {
    help: Boolean(values.help),
    yes: Boolean(values.yes),
    mcp: values["no-mcp"] ? false : undefined,
    install: !values["no-install"],
    agents,
  };
}

/**
 * The @squonkstack/ui-mcp version to run. Both packages are released together at
 * one version, so a released version pins the same one. A development version
 * (0.0.0-…, or anything that isn't a version npm could have published) has no
 * matching release, so it uses the latest.
 * @param {string | undefined} version
 */
export function mcpVersion(version) {
  const release = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version ?? "") && !version.startsWith("0.0.0");
  return release ? version : "latest";
}

/**
 * The arguments for `@squonkstack/ui-mcp init`.
 * @param {{ yes: boolean, mcp: boolean, install: boolean, agents?: string }} options
 */
export function initArgs({ yes, mcp, install, agents }) {
  const args = ["init"];
  if (yes) args.push("--yes");
  if (!mcp) args.push("--no-mcp");
  if (!install) args.push("--no-install");
  if (agents !== undefined) args.push("--agents", agents);
  return args;
}

/**
 * The command that runs `@squonkstack/ui-mcp init`. Run from a checkout of this
 * repository (or a link to one) with the workspace package built, it runs that
 * copy, so changes to both are tried together. Otherwise it runs the matching
 * release through npx. On Windows npx is `npx.cmd`, which Node only starts
 * through a shell; the arguments come from `initArgs`, so they are safe there.
 * @param {{ packageRoot: string, version?: string, platform?: string, execPath?: string, exists?: (file: string) => boolean }} where
 * @param {string[]} args from `initArgs`
 * @returns {{ command: string, args: string[], shell: boolean, source: string }}
 */
export function initCommand({ packageRoot, version, platform = process.platform, execPath = process.execPath, exists = existsSync }, args) {
  const workspace = path.join(packageRoot, "packages", "ui-mcp", "dist", "cli.js");
  if (exists(workspace)) return { command: execPath, args: [workspace, ...args], shell: false, source: workspace };
  const spec = `${MCP_PACKAGE}@${mcpVersion(version)}`;
  return { command: platform === "win32" ? "npx.cmd" : "npx", args: ["--yes", spec, ...args], shell: platform === "win32", source: spec };
}

/** Asks a yes/no question, defaulting to yes. Resolves undefined on Ctrl+C. */
async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const cancelled = new Promise((resolve) => rl.once("SIGINT", () => resolve(undefined)));
  try {
    const answer = await Promise.race([rl.question(`${question} (Y/n) `), cancelled]);
    if (answer === undefined) return undefined;
    const value = answer.trim().toLowerCase();
    return value === "" || value === "y" || value === "yes";
  } finally {
    rl.close();
  }
}

/** Runs the setup and returns the exit code. */
export async function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseSetupArgs(argv);
  } catch (error) {
    console.error(`${error.message}\n\n${HELP}`);
    return 1;
  }
  if (options.help) {
    console.log(HELP);
    return 0;
  }
  const packageRoot = fileURLToPath(new URL("..", import.meta.url));
  const { version } = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));
  const auto = options.yes || !process.stdin.isTTY || !process.stdout.isTTY;
  const mcp = options.mcp ?? (auto ? true : await confirm(`Also set up the MCP server for coding agents (${MCP_PACKAGE})?`));
  if (mcp === undefined) {
    console.log("\nSetup cancelled. Nothing was changed.");
    return 0;
  }

  const args = initArgs({ ...options, mcp });
  const run = initCommand({ packageRoot, version }, args);
  // With a shell, pass one command line: Node deprecates separate arguments there (DEP0190).
  const result = run.shell
    ? spawnSync([run.command, ...run.args].join(" "), { stdio: "inherit", shell: true })
    : spawnSync(run.command, run.args, { stdio: "inherit" });
  if (result.error) {
    console.error(`Couldn't run ${run.source} (${result.error.message}). Run \`npx ${MCP_PACKAGE} ${args.join(" ")}\` instead.`);
    return 1;
  }
  return result.status ?? 1;
}
