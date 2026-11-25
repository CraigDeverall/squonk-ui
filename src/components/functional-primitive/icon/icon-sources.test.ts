import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// React Icons bundles packs under different licences. Only packs whose
// licence lets us redistribute without attribution in the UI may supply
// curated icons. Add a pack here only after checking its licence, and
// record it in THIRD_PARTY_NOTICES.md.
const ALLOWED_PACKS: Record<string, string> = {
  lu: "Lucide (ISC)",
  si: "Simple Icons (CC0 1.0)",
  tb: "Tabler Icons (MIT)",
  hi2: "Heroicons 2 (MIT)",
  pi: "Phosphor Icons (MIT)",
  md: "Material Design icons (Apache 2.0)",
  ri: "Remix Icon (Apache 2.0)",
  bs: "Bootstrap Icons (MIT)",
  go: "GitHub Octicons (MIT)",
  rx: "Radix Icons (MIT)",
};

describe("curated icons", () => {
  const source = readFileSync(new URL("./icon.tsx", import.meta.url), "utf8");
  const packs = [...source.matchAll(/from "react-icons\/([a-z0-9]+)"/g)].map((m) => m[1]);

  it("come only from permissively licensed packs", () => {
    expect(packs.length).toBeGreaterThan(0);
    for (const pack of packs) expect(ALLOWED_PACKS, `react-icons/${pack} is not an allowed pack`).toHaveProperty(pack);
  });

  it("have unique public names", () => {
    const names = [...source.matchAll(/createIcon\(\w+, "(\w+)"\)/g)].map((m) => m[1]);
    expect(new Set(names).size).toBe(names.length);
  });
});
