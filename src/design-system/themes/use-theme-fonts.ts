import React from "react";
import { EXAMPLE_THEMES, themeFonts } from "./themes";

/**
 * Loads every example theme's web fonts once, for pages that show several
 * themes side by side. (The toolbar loads the chosen theme's own fonts.)
 */
export function useExampleThemeFonts() {
  React.useEffect(() => {
    const families = [...new Set(EXAMPLE_THEMES.flatMap(themeFonts))];
    const id = "example-theme-fonts";
    if (!families.length || document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`).join("&")}&display=swap`;
    document.head.append(link);
  }, []);
}
