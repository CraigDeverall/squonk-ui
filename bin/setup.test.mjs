import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { initArgs, initCommand, mcpVersion, parseSetupArgs } from "./setup.mjs";

const bin = fileURLToPath(new URL("./squonk-ui.mjs", import.meta.url));
const none = () => false;

describe("parseSetupArgs", () => {
  it("defaults to asking about the MCP server", () => {
    assert.deepEqual(parseSetupArgs([]), { help: false, yes: false, mcp: undefined, install: true, agents: undefined });
  });

  it("reads every option, and accepts the old `init` word", () => {
    assert.deepEqual(parseSetupArgs(["init", "-y", "--no-mcp", "--no-install", "--agents", "claude, codex"]), {
      help: false,
      yes: true,
      mcp: false,
      install: false,
      agents: "claude,codex",
    });
  });

  it("refuses unknown options, extra words and agent lists a shell could misread", () => {
    assert.throws(() => parseSetupArgs(["--force"]), /Unknown option/);
    assert.throws(() => parseSetupArgs(["setup"]), /Unexpected argument "setup"/);
    assert.throws(() => parseSetupArgs(["--agents", "claude&calc"]), /comma-separated/);
  });
});

describe("mcpVersion", () => {
  it("pins the release this package came from", () => {
    assert.equal(mcpVersion("3.1.0"), "3.1.0");
    assert.equal(mcpVersion("3.2.0-beta.1"), "3.2.0-beta.1");
  });

  it("uses the latest release for a development version", () => {
    assert.equal(mcpVersion("0.0.0-development"), "latest");
    assert.equal(mcpVersion("0.0.0"), "latest");
    assert.equal(mcpVersion(undefined), "latest");
    assert.equal(mcpVersion("next"), "latest");
  });
});

describe("initArgs", () => {
  it("passes nothing extra when the MCP server is wanted", () => {
    assert.deepEqual(initArgs({ yes: false, mcp: true, install: true }), ["init"]);
  });

  it("passes the user's choices on", () => {
    assert.deepEqual(initArgs({ yes: true, mcp: false, install: false, agents: "codex" }), ["init", "--yes", "--no-mcp", "--no-install", "--agents", "codex"]);
  });
});

describe("initCommand", () => {
  const packageRoot = path.join(path.sep, "cache", "node_modules", "@squonkstack", "ui");

  it("runs the matching @squonkstack/ui-mcp release with npx", () => {
    assert.deepEqual(initCommand({ packageRoot, version: "3.1.0", platform: "linux", exists: none }, ["init", "--no-mcp"]), {
      command: "npx",
      args: ["--yes", "@squonkstack/ui-mcp@3.1.0", "init", "--no-mcp"],
      shell: false,
      source: "@squonkstack/ui-mcp@3.1.0",
    });
  });

  it("runs npx.cmd through a shell on Windows", () => {
    const run = initCommand({ packageRoot, version: "3.1.0", platform: "win32", exists: none }, ["init"]);
    assert.equal(run.command, "npx.cmd");
    assert.equal(run.shell, true);
  });

  it("runs the latest release from a development version", () => {
    assert.equal(initCommand({ packageRoot, version: "0.0.0-development", platform: "linux", exists: none }, ["init"]).source, "@squonkstack/ui-mcp@latest");
  });

  it("runs the built workspace copy from a checkout of the repository", () => {
    const cli = path.join(packageRoot, "packages", "ui-mcp", "dist", "cli.js");
    assert.deepEqual(initCommand({ packageRoot, version: "3.1.0", platform: "win32", execPath: "/usr/bin/node", exists: (file) => file === cli }, ["init"]), {
      command: "/usr/bin/node",
      args: [cli, "init"],
      shell: false,
      source: cli,
    });
  });
});

describe("the bin", () => {
  it("prints its help without running anything", () => {
    const result = spawnSync(process.execPath, [bin, "--help"], { encoding: "utf8" });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /--no-mcp/);
  });

  it("exits with an error on a bad option", () => {
    const result = spawnSync(process.execPath, [bin, "--nope"], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage: npx @squonkstack\/ui/);
  });
});
