import { describe, expect, it } from "vitest";
import { declarations, resolveLocal, varRefs, withoutStates } from "./token-usage";

describe("withoutStates", () => {
  it("keeps selectors with no state as they are", () => {
    expect(withoutStates(".root .label")).toEqual({ selector: ".root .label", changed: false });
    expect(withoutStates('.root[data-variant="enclosed"] .list').changed).toBe(false);
  });

  it("neutralises React Aria state attributes and state pseudo-classes", () => {
    expect(withoutStates(".button[data-hovered] .control")).toEqual({ selector: ".button:is(*) .control", changed: true });
    expect(withoutStates(".root:is([data-selected], [data-indeterminate]) .control").selector).toBe(".root:is(:is(*), :is(*)) .control");
    expect(withoutStates(".sortButton:hover").selector).toBe(".sortButton:is(*)");
    expect(withoutStates('.tab[aria-selected="true"]').selector).toBe(".tab:is(*)");
  });

  it("drops :not() conditions and pseudo-elements, which can't be matched", () => {
    expect(withoutStates(".control[data-hovered]:not([data-disabled])").selector).toBe(".control:is(*)");
    expect(withoutStates(".input::placeholder")).toEqual({ selector: ".input", changed: false });
  });
});

describe("varRefs", () => {
  it("lists every variable a value reads", () => {
    expect(varRefs("var(--squonk-roles-border-width) solid var(--checkbox-accent, var(--squonk-x))")).toEqual(["--squonk-roles-border-width", "--checkbox-accent", "--squonk-x"]);
    expect(varRefs("12px")).toEqual([]);
  });
});

describe("resolveLocal", () => {
  it("follows local variables to theme tokens, through chains and cycles", () => {
    const defs = new Map([
      ["--checkbox-accent", new Set(["--squonk-roles-color-accent", "--squonk-roles-color-invalid"])],
      ["--a", new Set(["--b"])],
      ["--b", new Set(["--squonk-spacing-md", "--a"])],
    ]);
    expect(resolveLocal("--checkbox-accent", defs)).toEqual(["--squonk-roles-color-accent", "--squonk-roles-color-invalid"]);
    expect(resolveLocal("--a", defs)).toEqual(["--squonk-spacing-md"]);
    expect(resolveLocal("--missing", defs)).toEqual([]);
  });
});

describe("declarations", () => {
  it("keeps shorthands that read a variable", () => {
    expect(declarations("transition: var(--squonk-roles-motion-feedback); padding: var(--x) var(--y); color: var(--c);")).toEqual([
      ["transition", "var(--squonk-roles-motion-feedback)"],
      ["padding", "var(--x) var(--y)"],
      ["color", "var(--c)"],
    ]);
  });

  it("doesn't split inside parentheses or strings, and drops !important", () => {
    expect(declarations('background: url("a;b.png"); --local: var(--squonk-a, calc(1px; 2px)); gap: var(--squonk-b) !important')).toEqual([
      ["background", 'url("a;b.png")'],
      ["--local", "var(--squonk-a, calc(1px; 2px))"],
      ["gap", "var(--squonk-b)"],
    ]);
  });
});
