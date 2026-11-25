import React from "react";
import { beforeMount } from "@playwright/experimental-ct-react/hooks";
import { SquonkThemeProvider } from "../src/theme/theme-provider";
import "../src/fonts.css";
import "../src/theme/tokens.css";

beforeMount(async ({ App }) => {
  return (
    <SquonkThemeProvider>
      <App />
    </SquonkThemeProvider>
  );
});
