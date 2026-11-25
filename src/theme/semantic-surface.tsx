"use client";

import React, { useMemo } from "react";
import { themeForSurface } from "./theme-surface";
import { ThemeMetaContext, useThemeMeta } from "./theme-meta-context";
import { SquonkThemeContext, useSquonkTheme, type SquonkTheme } from "./theme-context";

/** Internal surface boundary: content roles adapt; independent control/code
 * surfaces retain their own backgrounds and contrast calculations. */
export function SemanticSurface({ background, children }: {
  background: (theme: SquonkTheme) => string;
  children?: React.ReactNode;
}) {
  const parent = useSquonkTheme();
  const meta = useThemeMeta();
  const surface = background(parent);
  // An inner mode/size change does not repaint this boundary's DOM box.
  // Reapply foreground roles against its actual, outer surface color.
  const transform = useMemo(() => (theme: SquonkTheme) => themeForSurface(theme, surface), [surface]);
  const nextTheme = useMemo(() => transform(parent), [parent, transform]);
  const nextMeta = useMemo(() => ({ ...meta, transforms: [...meta.transforms, transform] }), [meta, transform]);
  return (
    <ThemeMetaContext.Provider value={nextMeta}>
      <SquonkThemeContext.Provider value={nextTheme}>{children}</SquonkThemeContext.Provider>
    </ThemeMetaContext.Provider>
  );
}
