"use client";

import React, { useMemo } from "react";
import { buildThemeFromPrimitives } from "../../../theme/theme";
import {
  ThemeMetaContext,
  useThemeMeta,
} from "../../../theme/theme-meta-context";
import {
  type ThemeOverride,
  applyThemeTransforms,
  mergeTheme,
} from "../../../theme/theme-overrides";
import { SquonkThemeContext, useSquonkTheme, type SquonkTheme } from "../../../theme/theme-context";

export type ThemeModifierProps = {
  /** A partial theme merged over the inherited one for this subtree. Set
   *  `mode` (`"light"` or `"dark"`) to rebuild the theme in that colour mode. */
  override: ThemeOverride;
  /** The subtree that takes the overridden theme. */
  children: React.ReactNode;
};

/**
 * `ThemeModifier` scopes a partial theme override to a subtree. Every descendant
 * `@squonkstack/ui` component that reads from the theme will pick up the merged
 * values. Outside the scope the theme is unchanged.
 *
 * This is the consumer-facing mechanism for:
 * - dark mode (root-level or nested),
 * - per-subtree brand overrides ("co-branded panel"),
 * - one-off colour swaps without forking the component or writing CSS.
 *
 * It is intentionally a `Style` component — it has no visual output of its
 * own, only theme re-threading.
 */
export function ThemeModifier({ override, children }: ThemeModifierProps) {
  const parent = useSquonkTheme();
  const parentMeta = useThemeMeta();
  const transform = useMemo(() => {
    // Mode is a rebuild input. Later ThemeStyleBlock inversion owns it;
    // explicit resolved token overrides continue to win after rebuilding.
    const tokens = { ...override };
    delete tokens.mode;
    return (theme: SquonkTheme) => mergeTheme(theme, tokens);
  }, [override]);
  const meta = useMemo(
    () => ({
      ...parentMeta,
      mode: override.mode ?? parentMeta.mode,
      transforms: [...parentMeta.transforms, transform],
    }),
    [parentMeta, override.mode, transform]
  );
  const merged = useMemo<SquonkTheme>(() => {
    const base =
      override.mode !== undefined && override.mode !== parent.mode
        ? applyThemeTransforms(
            buildThemeFromPrimitives(
              parentMeta.primitives,
              meta.mode,
              parentMeta.colorBindings,
              parentMeta.addedColorPrimitives,
              parentMeta.roleBindings
            ),
            parentMeta.transforms
          )
        : parent;
    return { ...transform(base), mode: meta.mode };
  }, [parent, parentMeta, override.mode, transform, meta.mode]);
  return (
    <ThemeMetaContext.Provider value={meta}>
      <SquonkThemeContext.Provider value={merged}>
        {children}
      </SquonkThemeContext.Provider>
    </ThemeMetaContext.Provider>
  );
}
