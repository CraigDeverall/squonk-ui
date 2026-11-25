"use client";

import React from "react";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import styles from "./skeleton.module.css";
import { Motion } from "../../animation/motion/motion";

export type SkeletonShape = "rect" | "text" | "circle";

export interface SkeletonProps {
  /** Visual shape. `text` is a single line; `rect` is a block; `circle` is a square forced to a circle. */
  shape?: SkeletonShape;
  /** CSS width; numbers are pixels. Defaults to `100%`, or 40px for `circle`. */
  width?: string | number;
  /** CSS height. Defaults vary by shape (text: 1em, rect: 16px, circle: matches width). */
  height?: string | number;
  /** Number of lines for `shape="text"`. */
  lines?: number;
  /** Disable the shimmer animation. */
  noAnimation?: boolean;
}

const SKELETON_CIRCLE_DEFAULT_SIZE_PX = 40;
const SKELETON_RECT_DEFAULT_HEIGHT_PX = 16;

const toCss = (value: string | number | undefined, fallback: string): string => {
  if (value === undefined) return fallback;
  return typeof value === "number" ? `${value}px` : value;
};

/** A placeholder block shown while content loads. Hidden from assistive technology. */
export function Skeleton({
  shape = "rect",
  width,
  height,
  lines,
  noAnimation = false,
}: SkeletonProps) {
  const themeVars = useThemeCssVars();
  const blockClass = styles.block;
  // A still placeholder skips the shimmer.
  const shimmer = (block: React.ReactElement<{ className?: string }>) =>
    noAnimation ? block : <Motion.Shimmer>{block}</Motion.Shimmer>;

  if (shape === "text" && lines && lines > 1) {
    return (
      <span
        aria-hidden="true"
        className={styles.lines}
        style={{ ...themeVars.style, "--skeleton-width": toCss(width, "100%") }}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <React.Fragment key={i}>
            {shimmer(
              <span
                className={blockClass}
                data-shape="text"
                style={{
                  "--skeleton-width": i === lines - 1 ? "60%" : "100%",
                  "--skeleton-height": toCss(height, "1em"),
                }}
              />
            )}
          </React.Fragment>
        ))}
      </span>
    );
  }

  const defaultHeight =
    shape === "text"
      ? "1em"
      : shape === "circle"
        ? toCss(width, `${SKELETON_CIRCLE_DEFAULT_SIZE_PX}px`)
        : `${SKELETON_RECT_DEFAULT_HEIGHT_PX}px`;
  return shimmer(
      <span
        aria-hidden="true"
        className={blockClass}
        data-shape={shape}
        style={{
          ...themeVars.style,
          "--skeleton-width": toCss(
            width,
            shape === "circle" ? `${SKELETON_CIRCLE_DEFAULT_SIZE_PX}px` : "100%"
          ),
          "--skeleton-height": toCss(height, defaultHeight),
        }}
      />
  );
}
