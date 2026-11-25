"use client";

import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./spinner.module.css";
import { Motion } from "../../animation/motion/motion";

export type SpinnerTone = "primary" | "neutral" | "inverse";

export interface SpinnerProps {
  /** Color treatment. */
  tone?: SpinnerTone;
  /** Accessible label. Defaults to "Loading". */
  label?: string;
}

/** An indeterminate loading indicator that announces `label` as a polite status. */
export function Spinner({ tone = "primary", label = "Loading" }: SpinnerProps) {
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  return (
    <span role="status" aria-live="polite" style={themeVars.style}>
      <Motion.Spin><span className={styles.ring} data-register={register} data-tone={tone} aria-hidden="true" /></Motion.Spin>
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}
