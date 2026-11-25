// Serves the story page on localhost, for hosts that can't show an MCP App
// (Claude Code, Codex, terminals) and for screenshots. The page is the same one
// the MCP App uses, with the story's input inlined. URLs are stable for the
// session: /story/<id>?theme=dark&width=375&exampleTheme=tidepool&args=<json>, and
// / lists them all.
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { ShellBuilder } from "./shell/build.ts";
import type { StoryInput } from "./shell/protocol.ts";
import type { StoryEntry } from "./stories.ts";

const escape = (text: string) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** The query string the page reads back into a StoryInput. */
export function storyPath(input: StoryInput): string {
  const params = new URLSearchParams();
  if (input.theme) params.set("theme", input.theme);
  if (input.width) params.set("width", String(input.width));
  if (input.exampleTheme) params.set("exampleTheme", input.exampleTheme);
  if (input.customTheme) params.set("customTheme", JSON.stringify(input.customTheme));
  if (input.args && Object.keys(input.args).length) params.set("args", JSON.stringify(input.args));
  const query = params.toString();
  return `/story/${encodeURIComponent(input.storyId)}${query ? `?${query}` : ""}`;
}

export function parseStoryPath(url: string): StoryInput | undefined {
  const parsed = new URL(url, "http://localhost");
  const match = /^\/story\/([^/]+)$/.exec(parsed.pathname);
  if (!match) return undefined;
  const theme = parsed.searchParams.get("theme");
  const width = Number(parsed.searchParams.get("width"));
  const exampleTheme = parsed.searchParams.get("exampleTheme");
  let customTheme: StoryInput["customTheme"];
  try {
    const raw = parsed.searchParams.get("customTheme");
    const value: unknown = raw ? JSON.parse(raw) : undefined;
    if (value && typeof value === "object" && !Array.isArray(value)) customTheme = value as StoryInput["customTheme"];
  } catch {
    customTheme = undefined;
  }
  let args: Record<string, unknown> | undefined;
  try {
    const raw = parsed.searchParams.get("args");
    if (raw) args = JSON.parse(raw);
  } catch {
    args = undefined;
  }
  return {
    storyId: decodeURIComponent(match[1]),
    ...(theme === "dark" || theme === "light" ? { theme } : {}),
    ...(width >= 240 && width <= 2560 ? { width } : {}),
    ...(exampleTheme && /^[\w-]+$/.test(exampleTheme) ? { exampleTheme } : {}),
    ...(customTheme ? { customTheme } : {}),
    ...(args && typeof args === "object" ? { args } : {}),
  };
}

export class PreviewServer {
  private server?: Server;
  private origin?: Promise<string>;

  constructor(
    private shells: ShellBuilder,
    private stories: () => StoryEntry[],
    private port = Number(process.env.SQUONK_UI_PREVIEW_PORT ?? 0),
  ) {}

  /** The story page's URL. */
  async url(input: StoryInput): Promise<string> {
    return `${await this.start()}${storyPath(input)}`;
  }

  private index(): string {
    const groups = new Map<string, StoryEntry[]>();
    for (const story of this.stories()) groups.set(story.title, [...(groups.get(story.title) ?? []), story]);
    const sections = [...groups].map(
      ([title, stories]) =>
        `<li>${escape(title)}<ul>${stories.map((s) => `<li><a href="${escape(storyPath({ storyId: s.id }))}">${escape(s.name)}</a></li>`).join("")}</ul></li>`,
    );
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>@squonk/ui stories</title><style>body{font:14px/1.5 system-ui,sans-serif;margin:24px;color-scheme:light dark}ul{padding-left:20px}</style></head><body><h1>@squonk/ui stories</h1><ul>${sections.join("")}</ul></body></html>`;
  }

  private start(): Promise<string> {
    this.origin ??= new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        // Refuse other hosts so a web page can't reach this server by DNS rebinding.
        if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host ?? "")) {
          res.writeHead(403).end();
          return;
        }
        if (req.url === "/" || req.url === "") {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(this.index());
          return;
        }
        const input = parseStoryPath(req.url ?? "");
        if (!input) {
          res.writeHead(404, { "content-type": "text/plain" }).end("Not found. Open / for the list of stories.");
          return;
        }
        this.shells.standalone(input).then(
          (html) => res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }).end(html),
          (error) => res.writeHead(500, { "content-type": "text/plain" }).end(String(error)),
        );
      });
      server.once("error", reject);
      server.listen(this.port, "127.0.0.1", () => {
        this.server = server;
        server.unref();
        resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
      });
    });
    return this.origin;
  }

  close() {
    this.server?.close();
  }
}
