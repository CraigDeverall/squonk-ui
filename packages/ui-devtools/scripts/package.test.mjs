import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { chromeVersion } from "./package.mjs";
import { zip } from "./zip.mjs";

test("chromeVersion takes release versions and refuses the rest", () => {
  assert.equal(chromeVersion("9.0.0"), "9.0.0");
  assert.equal(chromeVersion("1.2.3.4"), "1.2.3.4");
  assert.equal(chromeVersion("0.0.0-development"), null);
  assert.equal(chromeVersion("0.0.0"), null);
  assert.equal(chromeVersion("1.70000.0"), null);
  assert.equal(chromeVersion(undefined), null);
});

test("zip gives the same bytes whatever order the files arrive in", () => {
  const a = { name: "a.txt", data: Buffer.from("alpha ".repeat(200)) };
  const b = { name: "assets/b.bin", data: Buffer.from([1, 2, 3]) };
  assert.deepEqual(zip([a, b]), zip([b, a]));
});

test("zip writes an archive that unzip can read back", (t) => {
  try {
    execFileSync("unzip", ["-v"], { stdio: "ignore" });
  } catch {
    t.skip("no unzip on this machine");
    return;
  }
  const directory = mkdtempSync(join(tmpdir(), "squonk-zip-"));
  try {
    const text = "Squonk UI ".repeat(500);
    const archive = join(directory, "out.zip");
    writeFileSync(
      archive,
      zip([
        { name: "manifest.json", data: Buffer.from(text) },
        { name: "assets/tiny.bin", data: Buffer.from([0, 255, 7]) },
        { name: "empty.txt", data: Buffer.alloc(0) },
      ])
    );
    execFileSync("unzip", ["-t", archive], { stdio: "ignore" });
    execFileSync("unzip", ["-q", archive, "-d", join(directory, "x")]);
    assert.equal(
      readFileSync(join(directory, "x/manifest.json"), "utf8"),
      text
    );
    assert.deepEqual(
      [...readFileSync(join(directory, "x/assets/tiny.bin"))],
      [0, 255, 7]
    );
    assert.equal(readFileSync(join(directory, "x/empty.txt")).length, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
