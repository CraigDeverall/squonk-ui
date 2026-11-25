import React from "react";
import { ThemeControllerPanel } from "@controller/panel";
import { reconnect, setMode, useSession, type Session } from "./session";

/** One line on how the panel is reaching the page, and what that means. */
function describe(session: Session): { label: string; detail: string; tone: "ok" | "warn" | "off" } {
  if (session.status === "connecting" || (session.status === "connected" && session.site === undefined)) {
    return { label: "Connecting", detail: "Looking for a Squonk UI theme on this page.", tone: "off" };
  }
  if (session.status === "unavailable") {
    return {
      label: "Not connected",
      detail:
        "This tab can't be reached. Reload it if it was open before the extension was installed; browser pages and the Web Store can't be themed.",
      tone: "off",
    };
  }
  if (session.site) {
    return { label: "Live theme", detail: "Edits rebuild this site's own theme, as its provider would.", tone: "ok" };
  }
  if (session.detected) {
    return {
      label: "CSS variables only",
      detail:
        "This site's Squonk UI version has no devtools bridge. Edits are computed against the default theme and written as variables on the page root, so values start from the library defaults and scoped areas (inverted or semantic surfaces) don't follow.",
      tone: "warn",
    };
  }
  return { label: "No Squonk UI found", detail: "This page doesn't publish Squonk UI theme variables.", tone: "off" };
}

const TONES = { ok: "#1f9d55", warn: "#d97706", off: "var(--sb-fg-dim)" } as const;

const Header: React.FC<{ session: Session }> = ({ session }) => {
  const { label, detail, tone } = describe(session);
  const canTheme = session.status === "connected" && (session.site || session.detected);
  return (
    <header style={styles.header}>
      <div style={styles.headerRow}>
        <div style={{ minWidth: 0 }}>
          <div style={styles.origin} title={session.origin}>
            {session.origin?.replace(/^https?:\/\//, "") ?? "Squonk UI theme"}
          </div>
          <div style={styles.status} data-testid="status">
            <span style={{ ...styles.dot, background: TONES[tone] }} />
            {label}
          </div>
        </div>
        {canTheme ? (
          <div role="group" aria-label="Colour mode" style={styles.modes}>
            {(["light", "dark"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={session.mode === mode}
                onClick={() => setMode(mode)}
                style={{ ...styles.modeButton, ...(session.mode === mode ? styles.modeButtonOn : null) }}
              >
                {mode === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <p style={styles.detail}>{detail}</p>
      {session.error ? (
        <p role="alert" style={styles.error}>
          The page won't accept these edits: {session.error}
        </p>
      ) : null}
      {session.status === "unavailable" ? (
        <button type="button" onClick={reconnect} style={styles.retry}>
          Try again
        </button>
      ) : null}
    </header>
  );
};

export const App: React.FC = () => {
  const session = useSession();
  const canTheme = session.status === "connected" && session.origin !== undefined && (session.site || session.detected);
  return (
    <div style={styles.root}>
      <Header session={session} />
      {canTheme ? (
        <div style={styles.body}>
          {/* Keyed by site: each keeps its own edits, loaded when the panel mounts. */}
          <ThemeControllerPanel key={session.origin} />
        </div>
      ) : null}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "var(--sb-dock-bg)",
    color: "var(--sb-fg)",
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 12,
  },
  header: { padding: "10px 14px", borderBottom: "1px solid var(--sb-border)", flex: "none" },
  headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  origin: { fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  status: { display: "flex", alignItems: "center", gap: 6, marginTop: 2, color: "var(--sb-fg-dim)" },
  dot: { width: 8, height: 8, borderRadius: "50%", flex: "none" },
  detail: { margin: "6px 0 0", color: "var(--sb-fg-dim)", lineHeight: 1.4 },
  error: { margin: "6px 0 0", color: "#c2410c", lineHeight: 1.4 },
  modes: { display: "flex", flex: "none", border: "1px solid var(--sb-border-strong)", borderRadius: 6, overflow: "hidden" },
  modeButton: {
    font: "inherit",
    padding: "4px 10px",
    border: "none",
    background: "transparent",
    color: "var(--sb-fg)",
    cursor: "pointer",
  },
  modeButtonOn: { background: "color-mix(in srgb, var(--sb-accent) 22%, transparent)", fontWeight: 600 },
  retry: {
    font: "inherit",
    marginTop: 8,
    padding: "4px 10px",
    border: "1px solid var(--sb-border-strong)",
    borderRadius: 6,
    background: "transparent",
    color: "var(--sb-fg)",
    cursor: "pointer",
  },
  body: { flex: 1, minHeight: 0, overflow: "auto" },
};
