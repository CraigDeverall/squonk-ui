/*
 * Stands in for the Storybook panel's ./base-primitives. In Storybook the
 * panel's edits sit on the library defaults; here they sit on the site's own
 * primitives (reported by its root provider), with the chosen example theme
 * on top, so the panel shows what is actually on the page.
 */
import { useMemo } from "react";
import { mergeOverPrimitives, mergePrimitives, type Primitives } from "@theme/theme";
import { exampleTheme } from "@src/design-system/themes/themes";
import { useSession } from "../session";

/** The example theme chosen in the panel, if any. */
export function useThemeGlobal(): string | undefined {
  return useSession().presetId;
}

/** The site's primitives (the library defaults where unknown) with the chosen example theme on top. */
export function useBasePrimitives(): Primitives {
  const { site, presetId } = useSession();
  return useMemo(
    () => mergeOverPrimitives(site?.primitives ?? mergePrimitives(), exampleTheme(presetId).primitives),
    [site, presetId],
  );
}
