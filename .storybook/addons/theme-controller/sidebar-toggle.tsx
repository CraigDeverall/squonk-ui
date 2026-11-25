import React, { useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { modeStore, type ColorMode } from "./mode-store";

const SUN = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MOON = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SidebarToggle: React.FC = () => {
  const [mode, setMode] = useState<ColorMode>(modeStore.get());

  useEffect(() => modeStore.subscribe(setMode), []);

  return (
    <button
      type="button"
      onClick={() => modeStore.toggle()}
      title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        padding: 0,
        border: "1px solid var(--sb-border, #dee2e6)",
        background: "var(--sb-bg-raised, transparent)",
        color: "var(--sb-fg, #fbf6ec)",
        borderRadius: 9999,
        cursor: "pointer",
        transition: "background 160ms ease, color 160ms ease, border-color 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#ef4237";
        e.currentTarget.style.borderColor = "#ef4237";
        e.currentTarget.style.color = "#1f1f1f";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "var(--sb-border-strong, #bdbdbd)";
        e.currentTarget.style.color = "var(--sb-fg, #fbf6ec)";
      }}
    >
      {mode === "light" ? MOON : SUN}
    </button>
  );
};

const roots = new Map<HTMLElement, Root>();

/**
 * Mount the toggle into a given slot element. Idempotent — calling
 * multiple times with the same slot only renders once. The orchestrator
 * lives in `manager.ts`; this module just provides the React render.
 */
export function renderSidebarToggleInto(slot: HTMLElement) {
  for (const [element, root] of roots) if (!element.isConnected) { root.unmount(); roots.delete(element); }
  if (roots.has(slot)) return;
  const root = createRoot(slot);
  roots.set(slot, root);
  root.render(<SidebarToggle />);
}

export function disposeSidebarToggles() {
  for (const root of roots.values()) root.unmount();
  roots.clear();
}
if (import.meta.hot) import.meta.hot.dispose(disposeSidebarToggles);
