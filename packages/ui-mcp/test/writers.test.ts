import { describe, expect, it } from "vitest";
import { addClaudeLocalServer, addCodexServer, addDesktopServer, addJsonServer, desktopServerEntry, desktopServerRoot, importAgentsIntoClaude, installCommand, isPublicRegistry, packagesToInstall, scopeRegistry, upsertAgentsBlock, windowsProjectKey } from "../src/init/writers.ts";

describe("addJsonServer", () => {
  it("creates a Claude Code config", () => {
    expect(JSON.parse(addJsonServer(undefined, "claude"))).toEqual({ mcpServers: { "squonk-ui": { command: "npx", args: ["-y", "@squonkstack/ui-mcp"] } } });
  });

  it("keeps other VS Code servers and adds a type", () => {
    const next = JSON.parse(addJsonServer(JSON.stringify({ servers: { other: { command: "x" } }, inputs: [] }), "vscode"));
    expect(next.servers.other).toEqual({ command: "x" });
    expect(next.servers["squonk-ui"].type).toBe("stdio");
    expect(next.inputs).toEqual([]);
  });

  it("leaves an existing entry alone", () => {
    const text = JSON.stringify({ mcpServers: { "squonk-ui": { command: "node", args: ["custom.js"] } } });
    expect(addJsonServer(text, "cursor")).toBe(text);
  });

  it("refuses to rewrite JSON it can't parse", () => {
    expect(() => addJsonServer("{ // comment\n}", "vscode")).toThrow(/by hand/);
  });
});

describe("addCodexServer", () => {
  it("appends a table once", () => {
    const once = addCodexServer('model = "o4"\n');
    expect(once).toContain('model = "o4"\n\n[mcp_servers.squonk-ui]');
    expect(addCodexServer(once)).toBe(once);
  });
});

describe("upsertAgentsBlock", () => {
  it("appends to an existing file and replaces its own block on a rerun", () => {
    const first = upsertAgentsBlock("# Rules\n\nBe nice.\n");
    expect(first.startsWith("# Rules\n\nBe nice.\n\n<!-- @squonkstack/ui:start -->")).toBe(true);
    const stale = first.replace("Compose library components", "OLD");
    expect(upsertAgentsBlock(stale)).toBe(first);
  });
});

describe("upsertAgentsBlock without the MCP server", () => {
  it("points at the catalog instead of the server's tools, and switches back on a rerun with it", () => {
    const without = upsertAgentsBlock(undefined, { mcp: false });
    expect(without).toContain("@squonkstack/ui/catalog.json");
    expect(without).not.toMatch(/MCP|find_components/);
    expect(upsertAgentsBlock(without)).toBe(upsertAgentsBlock(undefined));
  });
});

describe("packagesToInstall", () => {
  it("installs the server as a dev dependency unless it was declined", () => {
    expect(packagesToInstall({}, true)).toEqual([[["@squonkstack/ui"], false], [["@squonkstack/ui-mcp"], true]]);
    expect(packagesToInstall({}, false)).toEqual([[["@squonkstack/ui"], false]]);
    expect(packagesToInstall({ "@squonkstack/ui": "^3.0.0" }, true)).toEqual([[["@squonkstack/ui-mcp"], true]]);
  });

  it("pins both to init's own version when it's a release, so they match", () => {
    expect(packagesToInstall({}, true, "3.2.0")).toEqual([[["@squonkstack/ui@3.2.0"], false], [["@squonkstack/ui-mcp@3.2.0"], true]]);
    expect(packagesToInstall({}, false, "3.2.0-beta.1")).toEqual([[["@squonkstack/ui@3.2.0-beta.1"], false]]);
  });

  it("leaves a development version unpinned", () => {
    for (const version of ["0.0.0-development", "0.0.0", "next", undefined]) {
      expect(packagesToInstall({}, true, version)).toEqual([[["@squonkstack/ui"], false], [["@squonkstack/ui-mcp"], true]]);
    }
  });
});

describe("importAgentsIntoClaude", () => {
  it("adds the import once", () => {
    const once = importAgentsIntoClaude("# Claude\n");
    expect(once).toBe("# Claude\n\n@AGENTS.md\n");
    expect(importAgentsIntoClaude(once)).toBe(once);
  });
});

describe("scopeRegistry", () => {
  it("reads where an .npmrc sends the @squonkstack scope", () => {
    expect(scopeRegistry("save-exact=true\n@squonkstack:registry=https://registry.example.test/npm/\n")).toBe("https://registry.example.test/npm/");
    expect(scopeRegistry("save-exact=true\n")).toBeUndefined();
    expect(scopeRegistry(undefined)).toBeUndefined();
  });

  it("knows the public npm registry", () => {
    expect(isPublicRegistry("https://registry.npmjs.org/")).toBe(true);
    expect(isPublicRegistry("https://registry.npmjs.org")).toBe(true);
    expect(isPublicRegistry("https://registry.example.test/npm/")).toBe(false);
  });
});

describe("installCommand", () => {
  it("uses each package manager's verb and dev flag", () => {
    expect(installCommand("npm", ["a"], true)).toEqual(["npm", ["install", "-D", "a"]]);
    expect(installCommand("pnpm", ["a"], false)).toEqual(["pnpm", ["add", "a"]]);
    expect(installCommand("bun", ["a"], true)).toEqual(["bun", ["add", "-d", "a"]]);
  });
});

describe("Claude Desktop", () => {
  const root = "/home/aroha/apps/society";
  const node = "/usr/local/bin/node";

  it("runs the app's installed copy with absolute paths and --root", () => {
    expect(desktopServerEntry(root, node)).toEqual({
      command: node,
      args: ["/home/aroha/apps/society/node_modules/@squonkstack/ui-mcp/dist/cli.js", "--root", root],
    });
  });

  it("starts the server inside the distro when Claude Desktop runs on Windows over WSL", () => {
    expect(desktopServerEntry(`${root}/`, node, { wslDistro: "Ubuntu" })).toEqual({
      command: "wsl.exe",
      args: ["-d", "Ubuntu", "--exec", node, "/home/aroha/apps/society/node_modules/@squonkstack/ui-mcp/dist/cli.js", "--root", `${root}/`],
    });
  });

  it("keeps other servers and settings, and changes nothing the second time", () => {
    const current = JSON.stringify({ globalShortcut: "Ctrl+Space", mcpServers: { files: { command: "x" } } });
    const once = addDesktopServer(current, desktopServerEntry(root, node));
    const parsed = JSON.parse(once);
    expect(parsed.globalShortcut).toBe("Ctrl+Space");
    expect(parsed.mcpServers.files).toEqual({ command: "x" });
    expect(desktopServerRoot(once)).toBe(root);
    expect(addDesktopServer(once, desktopServerEntry(root, node))).toBe(once);
  });

  it("replaces an entry for another app, which the caller asks about first", () => {
    const other = addDesktopServer(undefined, desktopServerEntry("/home/aroha/apps/old", node));
    expect(desktopServerRoot(other)).toBe("/home/aroha/apps/old");
    expect(desktopServerRoot(addDesktopServer(other, desktopServerEntry(root, node)))).toBe(root);
  });

  it("refuses to rewrite a config it can't parse", () => {
    expect(() => addDesktopServer("{ // comment\n}", desktopServerEntry(root, node))).toThrow(/by hand/);
  });
});

describe("addClaudeLocalServer", () => {
  const entry = desktopServerEntry("/home/me/app", "/usr/bin/node", { wslDistro: "Ubuntu" });

  it("adds the launcher to the project's local scope and keeps everything else", () => {
    const text = JSON.stringify({ userID: "x", projects: { "C:/other": { mcpServers: { a: { command: "a" } } } } });
    const next = JSON.parse(addClaudeLocalServer(text, windowsProjectKey("Ubuntu", "/home/me/app/"), entry));
    expect(next.userID).toBe("x");
    expect(next.projects["C:/other"]).toEqual({ mcpServers: { a: { command: "a" } } });
    expect(next.projects["//wsl.localhost/Ubuntu/home/me/app"].mcpServers["squonk-ui"]).toEqual({
      type: "stdio",
      command: "wsl.exe",
      args: ["-d", "Ubuntu", "--exec", "/usr/bin/node", "/home/me/app/node_modules/@squonkstack/ui-mcp/dist/cli.js", "--root", "/home/me/app"],
    });
  });

  it("uses the key Windows already has for the folder, whatever its case, and changes nothing on a rerun", () => {
    const text = JSON.stringify({ projects: { "//wsl.localhost/ubuntu/home/me/app": { allowedTools: ["x"] } } });
    const once = addClaudeLocalServer(text, windowsProjectKey("Ubuntu", "/home/me/app"), entry);
    expect(Object.keys(JSON.parse(once).projects)).toEqual(["//wsl.localhost/ubuntu/home/me/app"]);
    expect(JSON.parse(once).projects["//wsl.localhost/ubuntu/home/me/app"].allowedTools).toEqual(["x"]);
    expect(addClaudeLocalServer(once, windowsProjectKey("Ubuntu", "/home/me/app"), entry)).toBe(once);
  });
});
