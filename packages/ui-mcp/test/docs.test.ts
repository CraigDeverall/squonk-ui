import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/server.ts";

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

// The docs list every tool's arguments; this keeps them in step with the server.
describe("tool docs", async () => {
  const { server } = createServer(process.cwd());
  const client = new Client({ name: "docs-test", version: "0" });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  const { tools } = await client.listTools();

  const pages = {
    "the README": read("../README.md"),
    "Working with your agent": read("../../../src/working-with-your-agent.mdx"),
  };

  for (const [page, text] of Object.entries(pages)) {
    it(`${page} names every tool and its arguments`, () => {
      for (const tool of tools) {
        const row = text.split("\n").find((line) => line.startsWith(`| \`${tool.name}\``));
        expect(row, `${page} has no row for ${tool.name}`).toBeDefined();
        for (const argument of Object.keys(tool.inputSchema.properties ?? {})) {
          expect(row, `${page}: ${tool.name} doesn't mention ${argument}`).toContain(`\`${argument}`);
        }
      }
    });
  }
});
