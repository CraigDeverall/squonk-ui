import React from "react";
import { useSquonkTheme } from "../../../theme/theme-context";

export function ThemeProbe({ id }: { id: string }) {
  const theme = useSquonkTheme();
  return <output data-testid={id}>{JSON.stringify({ mode: theme.mode, primary: theme.colors.primary, sm: theme.spacing.sm, md: theme.spacing.md })}</output>;
}
