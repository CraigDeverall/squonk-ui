import React, { useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeControllerPanel } from "./panel";

const DOCK_STATE_KEY = "squonk-theme-dock:expanded:v1";
const COLLAPSED_WIDTH = 32;
const EXPANDED_WIDTH = 380;

function loadExpanded(): boolean {
  try {
    return localStorage.getItem(DOCK_STATE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveExpanded(v: boolean) {
  try {
    localStorage.setItem(DOCK_STATE_KEY, String(v));
  } catch {
    /* no-op */
  }
}

const ChevronLeft = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRight = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const ThemeDock: React.FC = () => {
  const [expanded, setExpanded] = useState<boolean>(() => loadExpanded());

  useEffect(() => {
    saveExpanded(expanded);
    // Keep Storybook's main content out from under the dock. We push the
    // manager body's right padding so the canvas/sidebar shrink rather
    // than being overlapped.
    document.body.style.paddingRight = `${
      expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH
    }px`;
  }, [expanded]);

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        background: "var(--sb-dock-bg)",
        color: "var(--sb-fg)",
        borderLeft: "1px solid var(--sb-border-strong)",
        boxShadow: expanded ? "var(--sb-dock-shadow)" : "none",
        transition:
          "width 200ms ease, box-shadow 200ms ease, background 160ms ease",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
      aria-label="Theme controller"
    >
      <DockHeader expanded={expanded} onToggle={() => setExpanded((e) => !e)} />
      {expanded ? (
        <div style={{ flex: 1, overflow: "auto" }}>
          <ThemeControllerPanel />
        </div>
      ) : (
        <CollapsedRail onClick={() => setExpanded(true)} />
      )}
    </aside>
  );
};

const DockHeader: React.FC<{
  expanded: boolean;
  onToggle: () => void;
}> = ({ expanded, onToggle }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: expanded ? "space-between" : "center",
      padding: expanded ? "10px 12px" : "10px 0",
      borderBottom: expanded ? "1px solid var(--sb-border)" : "none",
      fontWeight: 600,
      fontSize: 13,
      letterSpacing: "0.01em",
    }}
  >
    {expanded && <span>Theme</span>}
    <button
      type="button"
      onClick={onToggle}
      title={expanded ? "Collapse panel" : "Expand panel"}
      aria-label={expanded ? "Collapse panel" : "Expand panel"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        padding: 0,
        background: "transparent",
        border: "1px solid var(--sb-border-strong)",
        borderRadius: 9999,
        color: "var(--sb-fg)",
        cursor: "pointer",
        transition: "background 160ms ease, color 160ms ease, border-color 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--sb-accent)";
        e.currentTarget.style.borderColor = "var(--sb-accent)";
        e.currentTarget.style.color = "#1f1f1f";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "var(--sb-border-strong)";
        e.currentTarget.style.color = "var(--sb-fg)";
      }}
    >
      {expanded ? ChevronRight : ChevronLeft}
    </button>
  </div>
);

const CollapsedRail: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="Expand Theme panel"
    aria-label="Expand Theme panel"
    style={{
      flex: 1,
      width: "100%",
      background: "transparent",
      border: "none",
      color: "var(--sb-fg)",
      cursor: "pointer",
      padding: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <span
      style={{
        writingMode: "vertical-rl",
        transform: "rotate(180deg)",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
    >
      Theme
    </span>
  </button>
);

let root: Root | null = null;

export function mountThemeDock() {
  if (document.querySelector("[data-squonk-theme-dock]")) return;
  const slot = document.createElement("div");
  slot.setAttribute("data-squonk-theme-dock", "");
  document.body.appendChild(slot);
  root = createRoot(slot);
  root.render(<ThemeDock />);
}

export function unmountThemeDock() {
  root?.unmount();
  root = null;
  document.querySelector("[data-squonk-theme-dock]")?.remove();
}
if (import.meta.hot) import.meta.hot.dispose(unmountThemeDock);
