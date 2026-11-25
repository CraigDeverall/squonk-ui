"use client";

import { clsx } from "clsx";
import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import styles from "./kbd.module.css";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** The key or shortcut to show, such as `Esc` or `Ctrl`. Use one `Kbd` per key. */
  children?: React.ReactNode;
}

/** A keyboard key, rendered as `<kbd>`, for documenting shortcuts. */
export function Kbd({ children, className, style, ...rest }: KbdProps) {
  const themeVars = useThemeCssVars();
  return (
    <kbd className={clsx(styles.root, className)} style={{ ...themeVars.style, ...style }} {...rest}>
      {themeVars.provide(children)}
    </kbd>
  );
}
