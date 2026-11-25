import { describe, expect, it } from "vitest";
import {
  legendKinds,
  linkAnimationDuration,
  linkThickness,
  nodeColor,
  resolveLinkKind,
  resolveNodeKind,
  toggleHiddenKind,
  type NetworkGraphLinkKinds,
  type NetworkGraphNodeKinds,
} from "./network-graph-kinds";

const nodeKinds: NetworkGraphNodeKinds = {
  company: { label: "Company" },
  person: { label: "Person", shape: "square" },
  risk: { label: "Risk", tone: "warning", shape: "diamond" },
  partner: { label: "Partner", tone: "brandViolet" },
  pinned: { label: "Pinned", slot: 7 },
};
const linkKinds: NetworkGraphLinkKinds = {
  supplies: { label: "Supplies" },
  disputes: { label: "Disputes", tone: "error", variant: "dashed" },
};

describe("resolveNodeKind", () => {
  it("gives a kind with no colour the data series slot of its position", () => {
    expect(resolveNodeKind(nodeKinds, "company")).toEqual({
      key: "company",
      label: "Company",
      shape: "circle",
      color: "var(--squonk-roles-color-data-series1)",
    });
    expect(resolveNodeKind(nodeKinds, "person").color).toBe("var(--squonk-roles-color-data-series2)");
    expect(resolveNodeKind(nodeKinds, "person").shape).toBe("square");
  });

  it("uses a status tone's token", () => {
    expect(resolveNodeKind(nodeKinds, "risk").color).toBe("var(--squonk-colors-tone-warning-solid)");
  });

  it("uses a colour the theme added, by its key", () => {
    expect(resolveNodeKind(nodeKinds, "partner").color).toBe("var(--squonk-colors-tone-brand-violet-solid)");
  });

  it("uses a pinned data series slot", () => {
    expect(resolveNodeKind(nodeKinds, "pinned").color).toBe("var(--squonk-roles-color-data-series7)");
  });

  it("draws a kind nobody described as a neutral circle named by its key", () => {
    expect(resolveNodeKind(nodeKinds, "mystery")).toEqual({
      key: "mystery",
      label: "mystery",
      shape: "circle",
      color: "var(--squonk-colors-tone-neutral-solid)",
    });
    expect(resolveNodeKind(undefined, "mystery").label).toBe("mystery");
  });

  it("falls back to neutral past the eighth kind and for a tone that is not a colour key", () => {
    const many = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`kind${i}`, { label: `Kind ${i}` }]));
    expect(resolveNodeKind(many, "kind7").color).toBe("var(--squonk-roles-color-data-series8)");
    expect(resolveNodeKind(many, "kind8").color).toBe("var(--squonk-colors-tone-neutral-solid)");
    expect(resolveNodeKind({ odd: { label: "Odd", tone: "red; color: blue" } }, "odd").color).toBe(
      "var(--squonk-roles-color-data-series1)",
    );
  });
});

describe("nodeColor", () => {
  it("lets a node's own tone override its kind's colour", () => {
    const kind = resolveNodeKind(nodeKinds, "company");
    expect(nodeColor("error", kind)).toBe("var(--squonk-colors-tone-error-solid)");
    expect(nodeColor(undefined, kind)).toBe(kind.color);
  });
});

describe("resolveLinkKind", () => {
  it("leaves a link plain and solid unless its kind says otherwise", () => {
    expect(resolveLinkKind(linkKinds, "supplies")).toEqual({
      key: "supplies",
      label: "Supplies",
      variant: "solid",
      color: undefined,
      animation: "none",
    });
    expect(resolveLinkKind(linkKinds, undefined)).toEqual({ key: "", label: "", variant: "solid", color: undefined, animation: "none" });
  });

  it("takes the kind's tone and line", () => {
    expect(resolveLinkKind(linkKinds, "disputes")).toEqual({
      key: "disputes",
      label: "Disputes",
      variant: "dashed",
      color: "var(--squonk-colors-tone-error-solid)",
      animation: "none",
    });
  });
});

describe("legendKinds", () => {
  it("lists every described kind when no data is given", () => {
    expect(legendKinds(nodeKinds, undefined).map((entry) => entry.key)).toEqual([
      "company",
      "person",
      "risk",
      "partner",
      "pinned",
    ]);
  });

  it("lists only the kinds in the data, in described order, with counts, then undescribed kinds", () => {
    expect(
      legendKinds(nodeKinds, [{ kind: "person" }, { kind: "mystery" }, { kind: "company" }, { kind: "person" }]),
    ).toEqual([
      { key: "company", count: 1 },
      { key: "person", count: 2 },
      { key: "mystery", count: 1 },
    ]);
  });

  it("skips links that have no kind", () => {
    expect(legendKinds(linkKinds, [{ kind: "supplies" }, {}])).toEqual([{ key: "supplies", count: 1 }]);
  });
});

describe("toggleHiddenKind", () => {
  it("hides a shown kind and shows a hidden one, leaving the other group alone", () => {
    const hidden = toggleHiddenKind({ links: ["disputes"] }, "nodes", "person");
    expect(hidden).toEqual({ nodes: ["person"], links: ["disputes"] });
    expect(toggleHiddenKind(hidden, "nodes", "person")).toEqual({ nodes: [], links: ["disputes"] });
    expect(toggleHiddenKind(undefined, "links", "supplies")).toEqual({ nodes: [], links: ["supplies"] });
  });
});

describe("link thickness and animation", () => {
  const kinds: NetworkGraphLinkKinds = {
    pays: { label: "Pays", thickness: 4, animation: "flow", animationDuration: 900 },
    plain: { label: "Plain" },
  };

  it("takes a kind's thickness and animation, and lets a link set its own", () => {
    const pays = resolveLinkKind(kinds, "pays");
    expect(pays).toMatchObject({ thickness: 4, animation: "flow", animationDuration: 900 });
    expect(linkThickness(undefined, pays)).toBe(4);
    expect(linkThickness(8, pays)).toBe(8);
    expect(linkAnimationDuration(undefined, pays)).toBe(900);
    expect(linkAnimationDuration(2000, pays)).toBe(2000);
  });

  it("leaves a plain link at the usual width and cycle", () => {
    const plain = resolveLinkKind(kinds, "plain");
    expect(linkThickness(undefined, plain)).toBeUndefined();
    expect(linkAnimationDuration(undefined, plain)).toBe(1600);
  });

  it("clamps thickness to 0.5–12 and the cycle to at least 200ms", () => {
    const plain = resolveLinkKind(kinds, "plain");
    expect(linkThickness(40, plain)).toBe(12);
    expect(linkThickness(0, plain)).toBe(0.5);
    expect(linkThickness(Number.NaN, plain)).toBeUndefined();
    expect(linkAnimationDuration(10, plain)).toBe(200);
  });
});
