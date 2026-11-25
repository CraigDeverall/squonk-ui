"use client";

import { clsx } from "clsx";
import React from "react";
import styles from "./printable.module.css";

interface PrintMarkerProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** What it marks. */
  children?: React.ReactNode;
  /** Render a `span` instead of a `div`, for a mark inside a line of text. Defaults to `false`. */
  inline?: boolean;
}

export interface PrintableProps extends PrintMarkerProps {
  /** Start this area on a new printed page. Defaults to `false`. */
  breakBefore?: boolean;
  /** Keep this area on one printed page where it fits, instead of splitting it across two. Defaults to `false`. */
  keepTogether?: boolean;
}

export type NotPrintableProps = PrintMarkerProps;
export type PrintOnlyProps = PrintMarkerProps;

/** A `div`, or a `span` inside a line of text. */
const tag = (inline: boolean | undefined) => (inline ? "span" : "div");

/**
 * Marks what to print. While at least one `Printable` is on the page,
 * printing includes only the `Printable` areas (and everything inside them),
 * and the layout around them is flattened so they start at the page's edge.
 * With none on the page, the whole page prints. Areas can sit anywhere and
 * nest; inside one, `NotPrintable` still leaves things out. On screen it adds
 * no box and changes nothing.
 *
 * ```tsx
 * <Printable>
 *   <Heading level={1}>Statement of account</Heading>
 *   <Table … />
 * </Printable>
 * ```
 */
export function Printable({ inline, breakBefore = false, keepTogether = false, className, children, ...rest }: PrintableProps) {
  return React.createElement(
    tag(inline),
    {
      ...rest,
      className: clsx(styles.printable, className),
      "data-inline": inline || undefined,
      "data-break-before": breakBefore || undefined,
      "data-keep-together": keepTogether || undefined,
    },
    children,
  );
}

/**
 * Leaves its contents off paper: actions, navigation, help that only makes
 * sense on screen. Works anywhere, including inside a `Printable`. On screen
 * it adds no box and changes nothing.
 */
export function NotPrintable({ inline, className, children, ...rest }: NotPrintableProps) {
  return React.createElement(tag(inline), { ...rest, className: clsx(styles.notPrintable, className) }, children);
}

/**
 * Shows its contents only on paper: a letterhead, a reference number, the
 * date printed, a note that replaces an interactive control. Hidden on
 * screen, from assistive technology too, so don't put anything there a
 * screen reader user needs.
 */
export function PrintOnly({ inline, className, children, ...rest }: PrintOnlyProps) {
  return React.createElement(tag(inline), { ...rest, className: clsx(styles.printOnly, className) }, children);
}
