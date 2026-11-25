#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TEST_PROJECT = "squonk-ui-tests";
const root = fileURLToPath(new URL("../", import.meta.url));

export function foreignContainers(containers, repositoryRoot = root) {
  const ownDirectory = path.resolve(repositoryRoot, "test-setup");
  return containers.filter((container) => {
    const labels = container.Config?.Labels ?? {};
    const project = labels["com.docker.compose.project"];
    const directory = labels["com.docker.compose.project.working_dir"];
    // The fixed project name is shared by this repository's worktrees. Accept
    // the old Compose name only when its working directory proves ownership.
    return project !== TEST_PROJECT && !(directory && path.resolve(directory) === ownDirectory);
  });
}

function docker(args) {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    timeout: 10000,
    killSignal: "SIGKILL",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0) {
    throw new Error(`docker ${args[0]} failed; verify the selected Docker context is reachable and Docker Desktop is running.`);
  }
  return result.stdout.trim();
}

export function checkDocker(run = docker) {
  // Use the Docker CLI for every request, so DOCKER_CONTEXT/DOCKER_HOST and
  // context TLS/SSH settings resolve exactly as they do for Compose.
  const context = run(["context", "show"]);
  const info = JSON.parse(run(["info", "--format", "{{json .}}"]));
  const ids = run(["ps", "--quiet"]).split(/\s+/).filter(Boolean);
  const containers = ids.length ? JSON.parse(run(["inspect", ...ids])) : [];
  const desktop = context === "desktop-linux" || /Docker Desktop/i.test(info.OperatingSystem ?? "");
  if (desktop) {
    const foreign = foreignContainers(containers);
    if (foreign.length) {
      const names = foreign.map((item) => `${String(item.Name).replace(/^\//, "")} (${item.Config?.Labels?.["com.docker.compose.project"] ?? "unknown owner"})`);
      throw new Error(`Docker Desktop is running another or unknown project: ${names.join(", ")}. Coordinate and stop that entire stack without removing its volumes before starting ${TEST_PROJECT}. No containers were stopped.`);
    }
  }
  run(["compose", "version"]);
  return { context, desktop, running: containers.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = checkDocker();
    console.log(`Docker context ${result.context}: ${result.running} running container(s); project coordination check passed.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
