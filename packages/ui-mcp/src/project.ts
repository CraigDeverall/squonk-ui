// Finds the app project and the @squonkstack/ui it has installed. Everything the
// server shows (catalog, guides, stories) comes from that installed copy, so an
// agent always sees the version the app actually uses.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export const LIBRARY = "@squonkstack/ui";

export type Project = {
  /** The app's root: the folder whose package.json depends on @squonkstack/ui. */
  root: string;
  /** Root of the installed @squonkstack/ui package. */
  libraryDir: string;
  libraryVersion: string;
  /** The library's package.json `exports`. */
  exports: Record<string, unknown>;
};

export class ProjectError extends Error {}

/** Walks up from `start` to the nearest folder with a package.json. */
export function findRoot(start: string): string {
  let dir = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new ProjectError(`No package.json found at or above ${start}.`);
    dir = parent;
  }
}

export function loadProject(start: string): Project {
  const root = findRoot(start);
  const require = createRequire(path.join(root, "package.json"));
  let manifestPath: string;
  try {
    manifestPath = require.resolve(`${LIBRARY}/package.json`);
  } catch {
    throw new ProjectError(
      `${LIBRARY} is not installed in ${root}. Run \`npx @squonkstack/ui\` there, or start the server with --root pointing at the app.`,
    );
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  return {
    root,
    libraryDir: path.dirname(manifestPath),
    libraryVersion: manifest.version,
    exports: manifest.exports ?? {},
  };
}

/** Resolves an optional package from the app (for example zod or playwright). */
export function resolveFromProject(project: Project, specifier: string): string | undefined {
  try {
    return createRequire(path.join(project.root, "package.json")).resolve(specifier);
  } catch {
    return undefined;
  }
}
