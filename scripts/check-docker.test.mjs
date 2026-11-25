import test from "node:test";
import assert from "node:assert/strict";
import { checkDocker, foreignContainers, TEST_PROJECT } from "./check-docker.mjs";

const container = (name, labels = {}) => ({ Name: `/${name}`, Config: { Labels: labels } });
function runner({ context = "desktop-linux", containers = [] } = {}) {
  const calls = [];
  const run = (args) => {
    calls.push(args);
    if (args[0] === "context") return context;
    if (args[0] === "info") return JSON.stringify({ OperatingSystem: context === "desktop-linux" ? "Docker Desktop" : "Linux" });
    if (args[0] === "ps") return containers.map((_, i) => `id${i}`).join("\n");
    if (args[0] === "inspect") return JSON.stringify(containers);
    if (args[0] === "compose") return "Compose v2";
    throw new Error("unexpected command");
  };
  return { run, calls };
}

test("Desktop refuses unrelated and unowned containers without stopping anything", () => {
  const fixture = runner({ containers: [container("database", { "com.docker.compose.project": "another-app" }), container("unknown")] });
  assert.throws(() => checkDocker(fixture.run), /another or unknown project/);
  assert.ok(fixture.calls.every(([command]) => !["stop", "rm", "kill"].includes(command)));
});

test("Desktop accepts this project and inspects the active CLI context", () => {
  const fixture = runner({ containers: [container("ui-tests", { "com.docker.compose.project": TEST_PROJECT })] });
  assert.deepEqual(checkDocker(fixture.run), { context: "desktop-linux", desktop: true, running: 1 });
  assert.deepEqual(fixture.calls[0], ["context", "show"]);
});

test("one-project policy does not restrict a shared remote host", () => {
  const fixture = runner({ context: "remote", containers: [container("unrelated")] });
  assert.equal(checkDocker(fixture.run).desktop, false);
});

test("legacy project ownership requires an exact directory", () => {
  assert.equal(foreignContainers([container("legacy", { "com.docker.compose.project.working_dir": "/repo/test-setup" })], "/repo").length, 0);
  assert.equal(foreignContainers([container("legacy", { "com.docker.compose.project.working_dir": "/other/test-setup" })], "/repo").length, 1);
});
