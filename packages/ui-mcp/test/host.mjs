// Plays the part of an MCP Apps host (Claude Desktop, VS Code, ChatGPT): reads
// the preview_story tool's ui:// resource from the built server, loads it in a
// sandboxed iframe, connects the ext-apps AppBridge and sends the tool's
// arguments, then checks the story renders inline, in light and dark, and that
// its controls change it.
// Usage: node test/host.mjs [app root] [png dir]
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getToolUiResourceUri } from "@modelcontextprotocol/ext-apps/app-bridge";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { build } from "esbuild";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = process.argv[2] ?? path.resolve(here, "../../..");
const out = process.argv[3] ?? mkdtempSync(path.join(tmpdir(), "squonk-ui-host-"));

const client = new Client({ name: "host-test", version: "0" });
await client.connect(new StdioClientTransport({ command: "node", args: [path.join(here, "../dist/cli.js"), "--root", root] }));
const { tools } = await client.listTools();
const preview = tools.find((tool) => tool.name === "preview_story");
const uri = getToolUiResourceUri(preview);
assert.equal(uri, "ui://squonk-ui/story", "preview_story declares its UI resource");
const resource = (await client.readResource({ uri })).contents[0];
assert.equal(resource.mimeType, "text/html;profile=mcp-app");
await client.close();

// The host side runs in the browser, so bundle the SDK's AppBridge for it.
const bridge = await build({
  stdin: {
    contents: `
      import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";
      globalThis.showPreview = (html, args, theme) => new Promise((resolve) => {
        const frame = document.createElement("iframe");
        frame.title = "preview";
        // As strict hosts do: scripts, but no same-origin access.
        frame.sandbox = "allow-scripts";
        frame.style.cssText = "width: 720px; height: 640px; border: 0";
        document.body.append(frame);
        const host = new AppBridge(null, { name: "host-test", version: "0" }, {}, { hostContext: { theme } });
        host.onsizechange = ({ height }) => { if (height) frame.style.height = height + "px"; };
        host.oninitialized = () => { host.sendToolInput({ arguments: args }); resolve(); };
        host.connect(new PostMessageTransport(frame.contentWindow, frame.contentWindow));
        frame.srcdoc = html;
      });`,
    resolveDir: here,
  },
  bundle: true,
  format: "iife",
  write: false,
  logLevel: "silent",
});

const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"]) {
    const page = await browser.newPage({ viewport: { width: 760, height: 720 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(`<!doctype html><html><body style="margin: 16px; background: ${theme === "dark" ? "#111" : "#fff"}"></body></html>`);
    await page.addScriptTag({ content: bridge.outputFiles[0].text });
    await page.evaluate(({ html, args, theme }) => globalThis.showPreview(html, args, theme), {
      html: resource.text,
      args: { storyId: "functional-button--primary" },
      theme,
    });
    const frame = page.frameLocator('iframe[title="preview"]');
    const controls = frame.getByRole("group", { name: "Controls" });
    await controls.waitFor({ timeout: 30000 });
    // The story's own label, then edited through its children control.
    const label = controls.getByLabel("children", { exact: true });
    const before = await label.inputValue();
    assert.ok(before, "the children control shows the story's label");
    await frame.locator(".sv-stage").getByRole("button", { name: before }).waitFor();
    await label.fill("Pay now");
    await frame.locator(".sv-stage").getByRole("button", { name: "Pay now" }).waitFor();
    assert.equal(await frame.getByRole("switch", { name: "Dark" }).isChecked(), theme === "dark", "the page starts in the host's theme");
    const file = path.join(out, `host-${theme}.png`);
    await page.screenshot({ path: file });
    assert.deepEqual(errors, []);
    console.log(`${theme}: rendered inline, and its controls change it (${file})`);
    await page.close();
  }
} finally {
  await browser.close();
}
