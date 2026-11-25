// Runs init in a scratch app with a scratch home folder. --no-install keeps it
// off the network, and --agents stops it looking for Claude Desktop.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { init } from "../src/init/index.ts";

let scratch: string;
let app: string;

beforeEach(() => {
  scratch = mkdtempSync(path.join(tmpdir(), "squonk-ui-init-"));
  app = path.join(scratch, "app");
  mkdirSync(path.join(scratch, "home"));
  mkdirSync(app);
  writeFileSync(path.join(app, "package.json"), JSON.stringify({ name: "society-app" }));
  vi.stubEnv("HOME", path.join(scratch, "home"));
  vi.stubEnv("USERPROFILE", path.join(scratch, "home"));
  vi.stubEnv("WSL_DISTRO_NAME", "");
  // npm passes the real user config to scripts; use the scratch home instead.
  vi.stubEnv("npm_config_userconfig", "");
  vi.stubEnv("NPM_CONFIG_USERCONFIG", "");
  vi.spyOn(process, "cwd").mockReturnValue(app);
  vi.spyOn(process.stdout, "write").mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  rmSync(scratch, { recursive: true, force: true });
});

const read = (file: string) => readFileSync(path.join(app, file), "utf8");

describe("init", () => {
  it("connects the chosen agents to the MCP server by default", async () => {
    await init(["--yes", "--no-install", "--agents", "claude,codex"]);
    expect(JSON.parse(read(".mcp.json")).mcpServers["squonk-ui"]).toBeDefined();
    expect(read(".codex/config.toml")).toContain("[mcp_servers.squonk-ui]");
    expect(read("AGENTS.md")).toContain("`squonk-ui` MCP server");
    expect(read("CLAUDE.md")).toBe("@AGENTS.md\n");
    expect(existsSync(path.join(app, ".npmrc"))).toBe(false);
  });

  it("with --no-mcp, writes the instructions but connects no agents", async () => {
    await init(["--yes", "--no-install", "--no-mcp", "--agents", "claude,codex,claude-desktop"]);
    expect(existsSync(path.join(app, ".mcp.json"))).toBe(false);
    expect(existsSync(path.join(app, ".codex"))).toBe(false);
    const agentsMd = read("AGENTS.md");
    expect(agentsMd).toContain("@squonk/ui/catalog.json");
    expect(agentsMd).not.toMatch(/MCP|find_components|preview/);
    expect(read("CLAUDE.md")).toBe("@AGENTS.md\n");
    expect(existsSync(path.join(app, ".npmrc"))).toBe(false);
  });

  it("leaves an old @squonk:registry line for the user to remove", async () => {
    const old = "@squonk:registry=https://registry.example.test/npm/\n";
    writeFileSync(path.join(scratch, "home", ".npmrc"), old);
    await init(["--yes", "--no-install", "--no-mcp", "--agents", "claude"]);
    expect(existsSync(path.join(app, ".npmrc"))).toBe(false);
    expect(read(path.join("..", "home", ".npmrc"))).toBe(old);
  });

  it("with --no-mcp, keeps the MCP wording when the server is already installed", async () => {
    writeFileSync(path.join(app, "package.json"), JSON.stringify({ name: "society-app", devDependencies: { "@squonk/ui-mcp": "^3.1.0" } }));
    await init(["--yes", "--no-install", "--no-mcp", "--agents", "claude"]);
    expect(read("AGENTS.md")).toContain("`squonk-ui` MCP server");
  });
});
