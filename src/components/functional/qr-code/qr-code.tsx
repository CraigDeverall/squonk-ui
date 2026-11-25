"use client";

import React from "react";
import QRCode from "react-qr-code";
import { purposeValue, useThemeCssVars } from "../../../theme/use-theme-css-vars";
import styles from "./qr-code.module.css";
import { useSquonkTheme } from "../../../theme/theme-context";

export interface QrCodeProps {
  /** The string value to encode verbatim as a QR code */
  value: string;
  /** Foreground (module) colour. Defaults to the theme's text colour (`roles.color.text`). */
  fgColor?: string;
  /** Background colour. Defaults to the theme's surface colour (`roles.color.surface`). */
  bgColor?: string;
  /** Padding around the QR code image in pixels. Defaults to `components.qrCode.padding`. */
  padding?: number;
  /**
   * If provided, the string is rendered as a clickable anchor tag either
   * above or below the QR code.
   */
  label?: string;
  /** Where to render the label — defaults to 'below'. */
  labelPosition?: "above" | "below";
}

/** Renders `value` as a QR code, coloured from the theme, with an optional link label. */
export function QrCode({
  value,
  fgColor,
  bgColor,
  padding,
  label,
  labelPosition = "below",
}: QrCodeProps) {
  // react-qr-code paints with SVG attributes, which can't read CSS variables,
  // so the module colours come from the resolved theme.
  const theme = useSquonkTheme();
  const themeVars = useThemeCssVars();

  const resolvedFgColor = fgColor ?? purposeValue(theme, "roles.color.text");
  const resolvedBgColor = bgColor ?? purposeValue(theme, "roles.color.surface");
  const resolvedPadding = padding ?? parseInt(purposeValue(theme, "components.qrCode.padding"), 10);

  const qrSvg = (
    <div
      className={styles.square}
      style={{ "--qr-background": resolvedBgColor, "--qr-padding": `${resolvedPadding}px` }}
    >
      <QRCode
        value={value}
        fgColor={resolvedFgColor}
        bgColor={resolvedBgColor}
        // react-qr-code writes width and height attributes from `size` over
        // any passed in, so CSS sizes the SVG to the square instead.
        style={{ display: "block", width: "100%", height: "auto" }}
        aria-label={`QR code for: ${value}`}
      />
    </div>
  );

  const labelEl = label ? (
    <a className={styles.label} href={value} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  ) : null;

  return (
    <div className={styles.outer} style={themeVars.style}>
      <div className={styles.inner}>
        {labelPosition === "above" && labelEl}
        {qrSvg}
        {labelPosition === "below" && labelEl}
      </div>
    </div>
  );
}
