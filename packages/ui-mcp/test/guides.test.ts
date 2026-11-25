import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findGuides, getGuide, guideForUrl, type Guide } from "../src/guides.ts";

const guide = (id: string, section: string, title: string, text: string): Guide => ({ id, section, title, summary: `${title}.`, docsUrl: `?path=/docs/${id}--docs`, text });

const guides: Guide[] = [
  guide("patterns-labels-badge-or-tag", "Patterns", "Labels: Badge or Tag", "# Labels: Badge or Tag\n\nA Badge reports. A Tag names.\n\n## The test\n\nUse a badge for status."),
  guide("foundations-colour", "Foundations", "Colour", "# Colour\n\n## Status\n\nA badge, an alert and a tag can carry status colour. Badge badge badge."),
  guide("patterns-forms-validation", "Patterns / Forms", "Validation", "# Validation\n\n## Messages\n\nSay what to fix."),
];

describe("findGuides", () => {
  it("ranks a guide named for the question above pages that mention the words", () => {
    const [first] = findGuides(guides, "badge or tag");
    expect(first.id).toBe("patterns-labels-badge-or-tag");
    expect(first.uri).toBe("squonk-ui://guides/patterns-labels-badge-or-tag");
    expect(first.sections).toEqual(["The test"]);
  });

  it("ignores filler words: 'when should I use a badge' searches for 'badge'", () => {
    expect(findGuides(guides, "when should I use a badge").map((g) => g.id)).toEqual(findGuides(guides, "badge").map((g) => g.id));
  });

  it("matches the section, so 'forms' finds the Forms guides", () => {
    expect(findGuides(guides, "forms").map((g) => g.id)).toEqual(["patterns-forms-validation"]);
  });

  it("lists every guide for an empty query, and none for nonsense", () => {
    expect(findGuides(guides)).toHaveLength(3);
    expect(findGuides(guides, "zzzz")).toEqual([]);
  });
});

describe("getGuide", () => {
  it("accepts an id, a title, a resource URI or a docs link", () => {
    for (const key of ["foundations-colour", "Colour", "squonk-ui://guides/foundations-colour", "?path=/docs/foundations-colour--docs"]) {
      expect(getGuide(guides, key)?.id).toBe("foundations-colour");
    }
    expect(getGuide(guides, "nope")).toBeUndefined();
  });
});

describe("guideForUrl", () => {
  it("links a catalog pattern to its guide only when the guide shipped", () => {
    expect(guideForUrl(guides, "?path=/docs/patterns-forms-validation--docs")).toBe("squonk-ui://guides/patterns-forms-validation");
    expect(guideForUrl(guides, "?path=/docs/patterns-missing--docs")).toBeUndefined();
    expect(guideForUrl(guides, undefined)).toBeUndefined();
  });
});

// The library's real guides, as `npm run catalog:generate` writes them.
const shipped: Guide[] = JSON.parse(readFileSync(fileURLToPath(new URL("../../../public/design-guides.json", import.meta.url)), "utf8")).guides;
const top = (query: string, n = 2) => findGuides(shipped, query).slice(0, n).map((g) => g.id);

describe("findGuides on the shipped guides", () => {
  it("leads with the component chooser when an agent asks which component to use", () => {
    expect(top("which component should I use for a status", 1)).toEqual(["patterns-choosing-components"]);
    expect(top("which component should I use", 1)).toEqual(["patterns-choosing-components"]);
  });

  it("finds the overlay guides for 'modal vs drawer'", () => {
    expect(top("when to use a modal vs drawer")).toEqual(expect.arrayContaining(["patterns-overlays-and-disclosures", "patterns-choosing-components"]));
  });

  it("finds the screen-level patterns by their everyday names", () => {
    expect(top("page layout", 1)).toEqual(["patterns-page-layouts-and-app-shells"]);
    expect(top("search and filter a list", 1)).toEqual(["patterns-search-filtering-and-sorting"]);
    expect(top("settings page", 1)).toEqual(["patterns-settings-and-preferences"]);
    expect(top("loading state", 1)).toEqual(["patterns-loading-and-progress"]);
    expect(top("compact density", 1)).toEqual(["patterns-density-and-registers"]);
  });
});
