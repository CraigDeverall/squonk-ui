import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadProject } from "../src/project.ts";
import type { StoriesManifest } from "../src/stories.ts";
import { exampleThemeDocument, mergeThemes, resolveCustomTheme, starterTheme } from "../src/themes.ts";

const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const manifestPath = path.join(root, "dist/stories/manifest.json");
const built = existsSync(manifestPath) && existsSync(path.join(root, "dist/theme/theme.mjs"));

describe("mergeThemes", () => {
  it("merges palettes key by key and lets the custom theme win", () => {
    const merged = mergeThemes(
      { version: 1, primitives: { spacingPx: 8, colors: { primary: "#111111", link: "#222222" } }, roleBindings: { "roles.radius.chip": "borders.radius.full" } },
      { version: 1, primitives: { colors: { primary: "#ff00aa" } }, roleBindings: { "roles.space.related": "spacing.sm" } },
    );
    expect(merged.primitives).toEqual({ spacingPx: 8, colors: { primary: "#ff00aa", link: "#222222" } });
    expect(merged.roleBindings).toEqual({ "roles.radius.chip": "borders.radius.full", "roles.space.related": "spacing.sm" });
  });
});

describe.skipIf(!built)("custom themes against the built library", () => {
  const project = loadProject(root);
  const manifest = built ? (JSON.parse(readFileSync(manifestPath, "utf8")) as StoriesManifest) : undefined;

  it("copies an example theme and puts changes over it", async () => {
    const result = await resolveCustomTheme(project, manifest, { basedOn: "tidepool", primitives: { colors: { primary: "#0b7a5c" } } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.theme.name).toBe("Tidepool, customised");
    expect((result.theme.primitives?.colors as Record<string, string>).primary).toBe("#0b7a5c");
    expect(result.theme.primitives?.squeezeOnPress).toBe(true);
    expect(exampleThemeDocument(manifest, "tidepool")?.primitives?.squeezeOnPress).toBe(true);
  });

  it("returns the library parser's error for a bad value, and names the example themes for a bad basedOn", async () => {
    const bad = await resolveCustomTheme(project, manifest, { primitives: { colors: { primary: "not a colour" } } });
    expect(bad).toMatchObject({ ok: false, error: expect.stringContaining("primitives.colors.primary") });
    const unknown = await resolveCustomTheme(project, manifest, { basedOn: "neon" });
    expect(unknown).toMatchObject({ ok: false, error: expect.stringContaining("tidepool") });
  });

  it("offers a starter with the defaults, switches, choices and shared purposes", async () => {
    const starter = await starterTheme(project, manifest);
    expect(starter.document.primitives).toHaveProperty("spacingPx", 8);
    expect(starter.switches).toHaveProperty("pillControls");
    expect(starter.choices.indicatorStyle).toHaveProperty("ring");
    expect(starter.sharedPurposes["roles.space.related"]).toMatch(/label and its field/);
    expect(starter.exampleThemes.map((t) => t.id)).toContain("aurora");
  });
});
