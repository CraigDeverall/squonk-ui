import { describe, expect, it } from "vitest";
import { findComponents, getComponent, type Catalog } from "../src/catalog.ts";

const catalog: Catalog = {
  components: [
    { id: "modal", kind: "component", title: "Modal", importPath: "@squonkstack/ui/modal", exports: ["Modal", "ConfirmModal"], purpose: "A dialog. Use it to confirm.", patterns: [{ id: "modal-confirmation" }], hashes: {} },
    { id: "alert", kind: "component", title: "Alert", importPath: "@squonkstack/ui/alert", exports: ["Alert"], purpose: "A status message you confirm later." },
  ],
  recipes: [{ id: "log-a-sighting", kind: "composition-recipe", title: "Log a Sighting", purpose: "A sighting report." }],
};

describe("findComponents", () => {
  it("ranks name matches above purpose matches", () => {
    expect(findComponents(catalog, "confirm").map((c) => c.id)).toEqual(["modal", "alert"]);
  });

  it("lists everything without a query, with one-sentence purposes", () => {
    const all = findComponents(catalog);
    expect(all).toHaveLength(2);
    expect(all[0].purpose).toBe("A dialog.");
  });
});

describe("getComponent", () => {
  it("finds by id, title or export and drops CI-only fields", () => {
    expect(getComponent(catalog, "ConfirmModal")?.id).toBe("modal");
    expect(getComponent(catalog, "log a sighting")?.id).toBe("log-a-sighting");
    expect(getComponent(catalog, "modal")).not.toHaveProperty("hashes");
    expect(getComponent(catalog, "nope")).toBeUndefined();
  });
});
