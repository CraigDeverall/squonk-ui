// Where Claude Desktop keeps its settings on this computer. It reads one
// config per user, not per project.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/**
 * Claude Desktop's settings folder on Windows. The Microsoft Store build keeps
 * them in its package's private AppData, and doesn't read the usual
 * %APPDATA%\Claude, so prefer the package folder when it's there.
 */
export function windowsDesktopDir(appData: string, localAppData: string | undefined): string {
  const packages = localAppData ? path.join(localAppData, "Packages") : undefined;
  const store = packages && existsSync(packages)
    ? readdirSync(packages).filter((name) => /^Claude_/.test(name)).map((name) => path.join(packages, name, "LocalCache", "Roaming", "Claude"))
    : [];
  return store.find((dir) => existsSync(dir)) ?? path.join(appData, "Claude");
}

/**
 * Claude Desktop's config, which is per user, not per project. From WSL the
 * app runs on Windows, so the file is in the Windows user's AppData.
 */
export function claudeDesktopConfig(): { file: string; wslDistro?: string } | undefined {
  const file = (dir: string) => path.join(dir, "claude_desktop_config.json");
  if (process.platform === "darwin") return { file: file(path.join(homedir(), "Library", "Application Support", "Claude")) };
  if (process.platform === "win32") return process.env.APPDATA ? { file: file(windowsDesktopDir(process.env.APPDATA, process.env.LOCALAPPDATA)) } : undefined;
  const wslDistro = process.env.WSL_DISTRO_NAME;
  if (!wslDistro) return undefined; // No Claude Desktop on Linux.
  const appData = windowsPath("APPDATA");
  return appData ? { file: file(windowsDesktopDir(appData, windowsPath("LOCALAPPDATA"))), wslDistro } : undefined;
}

/** A Windows environment variable's folder as a WSL path, from inside WSL. */
function windowsPath(variable: string): string | undefined {
  const value = spawnSync("cmd.exe", ["/c", `echo %${variable}%`], { encoding: "utf8" }).stdout?.trim();
  if (!value || value.includes("%")) return undefined;
  return spawnSync("wslpath", ["-u", value], { encoding: "utf8" }).stdout?.trim() || undefined;
}

/**
 * Claude Code's user config on Windows, from inside WSL. Claude Code on
 * Windows (the desktop app's Code tab, or the CLI) keeps each project's local
 * MCP servers there, including WSL folders opened by their \\wsl.localhost path.
 * Undefined outside WSL, where the agent and the checkout share one machine.
 */
export function claudeCodeWindowsConfig(): { file: string; wslDistro: string } | undefined {
  const wslDistro = process.env.WSL_DISTRO_NAME;
  if (!wslDistro) return undefined;
  const profile = windowsPath("USERPROFILE");
  return profile ? { file: path.join(profile, ".claude.json"), wslDistro } : undefined;
}
