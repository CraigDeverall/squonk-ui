import React from "react";
import { useSquonkTheme } from "../theme/theme-context";

// The embedded report follows the docs mode through `color-scheme`.
export const IFrame = ({ src }: { src: string }) => {
  const theme = useSquonkTheme();
  return (
    <iframe
      src={src}
      style={{
        background: "var(--squonk-colors-background-default)",
        width: "100%",
        height: "100%",
        border: "none",
        overflow: "scroll",
        colorScheme: theme.mode,
      }}
    >
      <p>Your browser does not support iframes.</p>
    </iframe>
  );
};
