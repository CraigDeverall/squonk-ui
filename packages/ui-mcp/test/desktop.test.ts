import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { windowsDesktopDir } from "../src/init/desktop.ts";

describe("windowsDesktopDir", () => {
  const fresh = () => mkdtempSync(path.join(tmpdir(), "desktop-"));

  it("uses the Microsoft Store build's private AppData when it's installed", () => {
    const local = fresh();
    const store = path.join(local, "Packages", "Claude_pzs8sxrjxfjjc", "LocalCache", "Roaming", "Claude");
    mkdirSync(store, { recursive: true });
    expect(windowsDesktopDir(path.join(fresh(), "Roaming"), local)).toBe(store);
  });

  it("uses %APPDATA%\\Claude for the standard installer", () => {
    const roaming = fresh();
    mkdirSync(path.join(fresh(), "Packages"), { recursive: true });
    expect(windowsDesktopDir(roaming, fresh())).toBe(path.join(roaming, "Claude"));
    expect(windowsDesktopDir(roaming, undefined)).toBe(path.join(roaming, "Claude"));
  });
});
