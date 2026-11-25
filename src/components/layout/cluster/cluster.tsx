"use client";

import React from "react";
import {
  HStack,
  type HStackProps,
} from "../../layout-primitive/hstack/hstack";
import type {
  StackAlign,
  StackGap,
} from "../../layout-primitive/vstack/vstack";

export type ClusterAlign = Exclude<StackAlign, "stretch">;
export type ClusterJustify = "start" | "center" | "end";

export interface ClusterProps {
  /** Cross-axis alignment of items within a row. Defaults to `center`. */
  align?: ClusterAlign;
  /** Main-axis alignment of the cluster as a whole. Defaults to `start` —
   *  the typical "left-aligned tag cloud". `center` for centered groups
   *  (e.g. CTAs under a hero), `end` for trailing toolbars. */
  justify?: ClusterJustify;
  /** Gap between items. Defaults to `sm` — clusters tend to be tighter
   *  than a VStack. */
  gap?: StackGap;
  /** The items to flow and wrap, such as `Badge`s, `Tag`s or `Button`s. */
  children?: React.ReactNode;
}

/**
 * `Cluster` is a wrapping horizontal flow for a group of small items —
 * tags, chips, breadcrumbs, button rows, badge sets. Children flow left to
 * right and wrap to the next line as needed, all with a consistent gap.
 *
 * Internally composes `HStack` with `wrap`. Use `Cluster` when the intent
 * is "loose group of related items" — the wrapping is the point. For a
 * row that should never wrap (and pushes children to opposite ends), use
 * `Split`.
 *
 * ```tsx
 * <Cluster gap="sm">
 *   <Badge>React</Badge>
 *   <Badge>TypeScript</Badge>
 *   <Badge>styled-components</Badge>
 * </Cluster>
 * ```
 */
export function Cluster({
  align = "center",
  justify = "start",
  gap = "sm",
  children,
}: ClusterProps) {
  const justifyMap: Record<ClusterJustify, HStackProps["justify"]> = {
    start: "start",
    center: "center",
    end: "end",
  };

  return (
    <HStack justify={justifyMap[justify]} align={align} gap={gap} wrap>
      {children}
    </HStack>
  );
}
