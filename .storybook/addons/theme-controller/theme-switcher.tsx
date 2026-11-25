// A bar across the top of each example that switches between the example
// themes. It drives the same Storybook global as the toolbar's Theme menu, so
// the two stay in step, and it sits outside the theme so it never restyles.
import React from "react";
import { EXAMPLE_THEMES } from "../../../src/design-system/themes/themes";
import { setThemePreset, useThemePreset } from "../../../src/design-system/themes/theme-preset-store";

const bar: React.CSSProperties = {
  boxSizing: "border-box",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  background: "#1b1f24",
  color: "#f2f2f1",
  font: '500 13px/1.2 system-ui, -apple-system, "Segoe UI", sans-serif',
};

export function ThemeSwitcher() {
  const current = useThemePreset();
  return (
    <div role="group" aria-label="Example theme" style={bar}>
      <span style={{ marginRight: 6, opacity: 0.75 }}>Theme</span>
      {EXAMPLE_THEMES.map((theme) => {
        const active = theme.id === current;
        return (
          <button
            key={theme.id}
            type="button"
            aria-pressed={active}
            title={theme.description}
            onClick={() => setThemePreset(theme.id)}
            style={{
              font: "inherit",
              cursor: "pointer",
              padding: "5px 12px",
              borderRadius: 999,
              border: `1px solid ${active ? "#f2f2f1" : "#4a525c"}`,
              background: active ? "#f2f2f1" : "transparent",
              color: active ? "#1b1f24" : "#f2f2f1",
            }}
          >
            {theme.name}
          </button>
        );
      })}
    </div>
  );
}
