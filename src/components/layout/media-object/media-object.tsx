"use client";

import React from "react";
import { HStack } from "../../layout-primitive/hstack/hstack";
import {
  VStack,
  type StackAlign,
  type StackGap,
} from "../../layout-primitive/vstack/vstack";
import styles from "./media-object.module.css";

export type MediaObjectAlign = "start" | "center";

export interface MediaObjectProps {
  /** The "media" half of the row — typically an `Avatar`, icon, image, or
   *  `Spinner`. Sits to the left of the content; never grows. */
  media: React.ReactNode;
  /** Vertical alignment of the media against the content stack. `start`
   *  (default) tops the media to the first content line (the "comment"
   *  shape). `center` centres it vertically (the "list-item" shape). */
  align?: MediaObjectAlign;
  /** Gap between the media and the content. Defaults to `md`. */
  gap?: StackGap;
  /** The content half — typically a `Heading` plus `Text`, or any vertical
   *  stack of typography. Children are arranged in a column with `xs` gap
   *  by default; nest a `VStack` for custom internal spacing. */
  children?: React.ReactNode;
}

/**
 * `MediaObject` is the canonical "image/avatar on the left, content on the
 * right" shape — list items, comment rows, profile cards, file rows. The
 * media slot is fixed-size; the content area takes the remaining width.
 *
 * Internally composes `HStack` for the outer row and a `VStack` for the
 * content. Reach for `MediaObject` whenever you'd otherwise write
 * `<HStack>` with one fixed-width item and a `VStack` beside it — the
 * named component encodes the recurring pattern.
 *
 * ```tsx
 * <MediaObject media={<Avatar name="Ada Lovelace" />}>
 *   <Heading level={4}>Ada Lovelace</Heading>
 *   <Text tone="secondary">First programmer</Text>
 * </MediaObject>
 * ```
 */
export function MediaObject({
  media,
  align = "start",
  gap = "md",
  children,
}: MediaObjectProps) {
  const stackAlign: StackAlign = align === "center" ? "center" : "start";
  return (
    <HStack align={stackAlign} gap={gap}>
      <div className={styles.media}>{media}</div>
      <VStack className={styles.content} gap="xs">{children}</VStack>
    </HStack>
  );
}
