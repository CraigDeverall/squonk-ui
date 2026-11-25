"use client";

import React from "react";
import { HStack } from "../../layout-primitive/hstack/hstack";
import type {
  StackAlign,
  StackGap,
} from "../../layout-primitive/vstack/vstack";

export type SplitAlign = Exclude<StackAlign, "stretch">;

export interface SplitProps {
  /** Cross-axis alignment of the split groups. Defaults to `center` — the
   *  natural "title on left, action on right" pairing. */
  align?: SplitAlign;
  /** Gap between children. Defaults to `md`. Children get pushed to the
   *  ends regardless of gap — the gap only matters when children would
   *  otherwise touch (e.g. wrapped row, narrow viewport). */
  gap?: StackGap;
  /** Wrap onto the next line when there isn't horizontal room. Defaults to
   *  `false` — Splits hold their row by design. Turn on when the trailing
   *  group should drop below on narrow screens. */
  wrap?: boolean;
  /** The groups to push apart: usually two, a leading and a trailing one. */
  children?: React.ReactNode;
}

/**
 * `Split` is a horizontal row whose children are pushed to opposite ends —
 * the canonical "leading group | trailing group" pattern (a title with a
 * trailing action, a card header with a status badge, a list-item with a
 * value on the right).
 *
 * Internally composes `HStack justify="between"`. Reach for `Split` over
 * `HStack` whenever the *intent* is "these things are at opposite ends" —
 * the named component makes the layout's purpose obvious at a glance.
 * For a wrapping row of equal-spaced items, use `Cluster`.
 *
 * ```tsx
 * <Split>
 *   <Heading level={3}>Active sessions</Heading>
 *   <Button>New session</Button>
 * </Split>
 * ```
 */
export function Split({
  align = "center",
  gap = "md",
  wrap = false,
  children,
}: SplitProps) {
  return (
    <HStack justify="between" align={align} gap={gap} wrap={wrap}>
      {children}
    </HStack>
  );
}
