#!/usr/bin/env node
// squonk-ui-mcp            start the MCP server (what agent configs run)
// squonk-ui-mcp init       set up @squonkstack/ui and agent configs in an app
// squonk-ui-mcp check      start each configured server the way its agent will
import { parseArgs } from "node:util";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  strict: false,
  options: {
    root: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});
const command = positionals[0] ?? "serve";

if (values.help && command !== "init" && command !== "check") {
  console.log(`Usage:
  squonk-ui-mcp [serve] [--root <app>]   Start the MCP server over stdio
  squonk-ui-mcp init [options]           Set up @squonkstack/ui, the MCP server and agent instructions
  squonk-ui-mcp check [--client windows] Start each configured server the way its agent will

Run "squonk-ui-mcp init --help" for setup options.`);
} else if (command === "serve") {
  const { serve } = await import("./server.ts");
  await serve(typeof values.root === "string" ? values.root : (process.env.SQUONK_UI_ROOT ?? process.cwd()));
} else if (command === "init") {
  const { init } = await import("./init/index.ts");
  await init(process.argv.slice(3));
} else if (command === "check") {
  const { check } = await import("./self-check.ts");
  await check(process.argv.slice(3));
} else {
  console.error(`Unknown command "${command}". Run squonk-ui-mcp --help.`);
  process.exit(1);
}
