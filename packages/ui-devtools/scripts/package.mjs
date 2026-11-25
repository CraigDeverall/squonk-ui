// Zips the built extension (dist/) into package/squonk-ui-theme-devtools.zip,
// the file the documentation site serves at /downloads/. Run through
// `npm run package -w @squonk/ui-devtools`, which builds first.
//
// A release build passes the library version as EXTENSION_VERSION and it
// replaces the manifest's own, so an installed copy says which release it
// came from. Anything Chrome would refuse as a version is ignored.
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { zip } from "./zip.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "../dist");
const out = resolve(here, "../package");
const NAME = "squonk-ui-theme-devtools";

/** Chrome takes one to four dot-separated integers, each 0 to 65535. */
export function chromeVersion(value) {
  if (!/^\d+(\.\d+){0,3}$/.test(value ?? "")) return null;
  const parts = value.split(".").map(Number);
  return parts.every((part) => part <= 65535) && parts.some((part) => part > 0)
    ? value
    : null;
}

async function walk(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(path)));
    else if (entry.isFile()) found.push(path);
  }
  return found;
}

async function main() {
  const files = [];
  for (const path of await walk(dist)) {
    files.push({
      name: relative(dist, path).split(sep).join("/"),
      data: await readFile(path),
    });
  }

  const manifestEntry = files.find((file) => file.name === "manifest.json");
  if (!manifestEntry)
    throw new Error(`No manifest.json in ${dist}: build the extension first.`);
  const manifest = JSON.parse(manifestEntry.data.toString("utf8"));
  const version = chromeVersion(process.env.EXTENSION_VERSION);
  if (version) {
    manifest.version = version;
    manifestEntry.data = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  }
  for (const needed of [
    "sidepanel.html",
    manifest.background.service_worker,
    ...manifest.content_scripts.flatMap((script) => script.js),
  ]) {
    if (!files.some((file) => file.name === needed))
      throw new Error(
        `The manifest names ${needed}, which is not in the build.`
      );
  }

  const archive = zip(files);
  const sha256 = createHash("sha256").update(archive).digest("hex");
  await mkdir(out, { recursive: true });
  await writeFile(join(out, `${NAME}.zip`), archive);
  await writeFile(join(out, `${NAME}.zip.sha256`), `${sha256}  ${NAME}.zip\n`);
  await writeFile(
    join(out, `${NAME}.json`),
    `${JSON.stringify({ name: manifest.name, version: manifest.version, file: `${NAME}.zip`, bytes: archive.length, sha256 }, null, 2)}\n`
  );
  console.log(
    `${NAME}.zip  v${manifest.version}  ${files.length} files  ${archive.length} bytes  sha256 ${sha256}`
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
