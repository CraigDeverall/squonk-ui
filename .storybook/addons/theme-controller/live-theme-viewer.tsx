import React from "react";
import { ThemeViewer } from "../../../src/documentation-imports/theme-viewer";
import {
  useAddedColorPrimitives,
  useColorBindings,
  useColorMode,
  useRoleBindings,
  useThemeOverrides,
} from "./preview";

/** The Theme page's computed theme, following the Theme Controls panel live. */
export const LiveThemeViewer = () => {
  const overrides = useThemeOverrides();
  const bindings = useColorBindings();
  const added = useAddedColorPrimitives();
  const mode = useColorMode();
  const roleBindings = useRoleBindings();
  return (
    <ThemeViewer
      overrides={overrides}
      bindings={bindings}
      added={added}
      roleBindings={roleBindings}
      mode={mode}
    />
  );
};
