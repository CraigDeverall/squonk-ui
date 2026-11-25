import { describe, expect, it } from "vitest";
import { diffSnippet } from "./snippet";

describe("Copy diff", () => {
  it("is empty when nothing changed", () => {
    expect(diffSnippet({})).toBe("");
  });

  it("shows only role bindings when only purposes changed", () => {
    const out = diffSnippet({}, {}, { "roles.space.fieldGap": "spacing.md" });
    expect(out).toBe('// Pass to your SquonkThemeProvider\nroleBindings={{\n    "roles.space.fieldGap": "spacing.md",\n}}');
  });

  it("puts primitives first, then each kind of binding", () => {
    const out = diffSnippet({ spacingPx: 10 }, { "colors.primary": "accent" }, { "roles.radius.control": "borders.radius.full" });
    expect(out).toContain("// Apply to primitives in src/theme/theme.ts\n{\n  spacingPx: 10,\n}");
    expect(out.indexOf("colorBindings={{")).toBeLessThan(out.indexOf("roleBindings={{"));
    expect(out).toContain('"colors.primary": "accent"');
  });
});

describe("Copy diff with per-mode role bindings", () => {
  it("writes a { light, dark } binding as an object", () => {
    const out = diffSnippet({}, {}, { "roles.color.heading": { light: "#1d3557", dark: "#f1faee" } });
    expect(out).toBe('// Pass to your SquonkThemeProvider\nroleBindings={{\n    "roles.color.heading": { light: "#1d3557", dark: "#f1faee" },\n}}');
  });
});
