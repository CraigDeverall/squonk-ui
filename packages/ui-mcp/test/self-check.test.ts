import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { configuredServers, diagnose, probe } from "../src/self-check.ts";

describe("configuredServers", () => {
  const distro = process.env.WSL_DISTRO_NAME;
  beforeEach(() => delete process.env.WSL_DISTRO_NAME);
  afterEach(() => {
    if (distro) process.env.WSL_DISTRO_NAME = distro;
  });

  it("finds the squonk-ui entry in each agent's config, and only that one", () => {
    const root = mkdtempSync(path.join(tmpdir(), "check-"));
    const npx = { command: "npx", args: ["-y", "@squonkstack/ui-mcp"] };
    writeFileSync(path.join(root, ".mcp.json"), JSON.stringify({ mcpServers: { other: { command: "x" }, "squonk-ui": npx } }));
    mkdirSync(path.join(root, ".vscode"));
    writeFileSync(path.join(root, ".vscode", "mcp.json"), JSON.stringify({ servers: { "squonk-ui": { type: "stdio", ...npx } } }));
    mkdirSync(path.join(root, ".codex"));
    writeFileSync(path.join(root, ".codex", "config.toml"), 'model = "o4"\n\n[mcp_servers.squonk-ui]\ncommand = "npx"\nargs = ["-y", "@squonkstack/ui-mcp"]\n\n[other]\nargs = ["no"]\n');
    const found = configuredServers(root, { windowsClient: true });
    expect(found.map((s) => s.source)).toEqual([".mcp.json", ".vscode/mcp.json", ".codex/config.toml"]);
    expect(found.every((s) => s.windows && s.entry.command === "npx" && s.entry.cwd === root)).toBe(true);
    expect(found[2].entry.args).toEqual(["-y", "@squonkstack/ui-mcp"]);
  });
});

describe("diagnose", () => {
  it("points a Windows client without Node at the WSL launcher", () => {
    expect(diagnose("", "'npx' is not recognized as an internal or external command", true)).toMatch(/--windows-client/);
  });

  it("names the registry problem", () => {
    expect(diagnose("Connection closed", "npm error code E401", false)).toMatch(/@squonkstack:registry/);
    expect(diagnose("Connection closed", "npm error 404 Not Found", false)).toMatch(/\.npmrc/);
  });
});

describe("probe", () => {
  it("reports what the server printed when it stops before answering", async () => {
    const entry = { command: process.execPath, args: ["-e", "console.error('npm error code E401'); process.exit(1)"] };
    const error = await probe({ source: "test", entry }, 10_000).catch((e) => e);
    expect(error.stderr).toContain("E401");
  });

  it("fails when the command doesn't exist", async () => {
    await expect(probe({ source: "test", entry: { command: "squonk-ui-no-such-command" } }, 10_000)).rejects.toThrow();
  });
});
