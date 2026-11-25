// The primitives the panel's edits sit on: the library defaults with the
// example theme chosen in the toolbar on top. The preview builds the theme the
// same way (PanelThemeProvider), so the panel shows and compares against what
// is actually on screen. An edit equal to this base is no edit at all.
import { useEffect, useMemo, useState } from "react";
import { addons } from "storybook/manager-api";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { mergePrimitives, type Primitives } from "../../../src/theme/theme";
import { exampleTheme } from "../../../src/design-system/themes/themes";

/** The example theme id in Storybook's `theme` global, followed as it changes. */
export function useThemeGlobal(): string | undefined {
  const [themeId, setThemeId] = useState(
    () => new URLSearchParams(window.location.search).get("globals")?.match(/(?:^|;)theme:([\w-]+)/)?.[1],
  );
  useEffect(() => {
    const channel = addons.getChannel();
    const follow = ({ globals }: { globals: Record<string, unknown> }) => {
      if (typeof globals?.theme === "string") setThemeId(globals.theme);
    };
    channel.on(SET_GLOBALS, follow);
    channel.on(GLOBALS_UPDATED, follow);
    return () => {
      channel.off(SET_GLOBALS, follow);
      channel.off(GLOBALS_UPDATED, follow);
    };
  }, []);
  return themeId;
}

/** The library defaults with the chosen example theme's primitives on top. */
export function useBasePrimitives(): Primitives {
  const themeId = useThemeGlobal();
  return useMemo(() => mergePrimitives(exampleTheme(themeId).primitives), [themeId]);
}
