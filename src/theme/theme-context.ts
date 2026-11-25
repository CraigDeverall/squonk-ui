"use client";

import { createContext, useContext } from "react";
import { buildThemeFromPrimitives, theme as defaultTheme } from "./theme";

/** The resolved theme: every semantic getter for the active primitives and mode. */
export type SquonkTheme = ReturnType<typeof buildThemeFromPrimitives>;

/**
 * The resolved theme for a subtree. `SquonkThemeProvider`, `ThemeModifier`,
 * `ThemeStyleBlock` and painted surfaces provide it; outside any provider it
 * is the default light theme.
 */
export const SquonkThemeContext = createContext<SquonkTheme>(defaultTheme);

/** Read the resolved theme in TypeScript, for values that can't be CSS. */
export const useSquonkTheme = (): SquonkTheme => useContext(SquonkThemeContext);
