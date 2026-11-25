"use client";

import { clsx } from "clsx";
import React from "react";
import { Button, Link } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import { ChevronLeftIcon, ChevronRightIcon } from "../../functional-primitive/icon/icon";
import styles from "./pagination.module.css";
import { Motion } from "../../animation/motion/motion";

export interface PaginationProps
  extends Omit<React.ComponentProps<"nav">, "children" | "onChange"> {
  /** Total number of items being paged through. */
  count: number;
  /** Items per page. Defaults to `10`. */
  pageSize?: number;
  /** Controlled page, starting at 1. */
  page?: number;
  /** Uncontrolled initial page. Defaults to `1`. */
  defaultPage?: number;
  /** Notified with the new page, starting at 1. */
  onPageChange?: (page: number) => void;
  /** Pages shown either side of the current one. Defaults to `1`. */
  siblingCount?: number;
  /** Show "Page 3 of 12" between the arrows instead of page numbers, for
   *  narrow spaces. */
  compact?: boolean;
  /** Show "Showing 21–30 of 112" before the controls. */
  showRange?: boolean;
  /** Render pages as links to these URLs instead of buttons, so each page
   *  has its own address. */
  getPageUrl?: (page: number) => string;
}

/**
 * The page numbers to show, with `"ellipsis"` for each gap: always the first
 * and last page, `siblingCount` pages either side of the current one, and a
 * fixed number of slots so the control keeps its width as the page changes.
 * A gap of a single page shows that page instead of an ellipsis.
 */
export function getPageItems(page: number, totalPages: number, siblingCount = 1): (number | "ellipsis")[] {
  if (totalPages <= 0) return [];
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const slots = siblingCount * 2 + 5;
  if (totalPages <= slots) return range(1, totalPages);

  const left = Math.max(page - siblingCount, 1);
  const right = Math.min(page + siblingCount, totalPages);
  const gapLeft = left > 3;
  const gapRight = right < totalPages - 2;
  const run = slots - 2;

  const items: (number | "ellipsis")[] =
    !gapLeft ? [...range(1, run), "ellipsis", totalPages] :
    !gapRight ? [1, "ellipsis", ...range(totalPages - run + 1, totalPages)] :
    [1, "ellipsis", ...range(left, right), "ellipsis", totalPages];

  return items.map((item, i) => {
    if (item !== "ellipsis") return item;
    const before = items[i - 1] as number;
    const after = items[i + 1] as number;
    return after - before === 2 ? before + 1 : item;
  });
}

/**
 * Moves through a long list a page at a time: a `nav` landmark with
 * previous and next buttons, page numbers with ellipses for long ranges, and
 * the current page marked `aria-current="page"`. React Aria has no
 * pagination, so the controls are its Buttons (or Links, with `getPageUrl`).
 */
export function Pagination({
  count,
  pageSize = 10,
  page,
  defaultPage,
  onPageChange,
  siblingCount = 1,
  compact = false,
  showRange = false,
  getPageUrl,
  className,
  style,
  "aria-label": ariaLabel = "Pagination",
  ...otherProps
}: PaginationProps) {
  const themeVars = useThemeCssVars();
  const register = usePresentation();
  const [uncontrolled, setUncontrolled] = React.useState(defaultPage ?? 1);
  const current = page ?? uncontrolled;
  const totalPages = Math.ceil(count / pageSize);
  const start = (current - 1) * pageSize;

  const go = (next: number) => {
    if (next < 1 || next > totalPages || next === current) return;
    if (page === undefined) setUncontrolled(next);
    onPageChange?.(next);
  };

  // A page control: a Link when pages have addresses, otherwise a Button.
  const control = (
    target: number,
    props: { className: string; "aria-label": string; "aria-current"?: "page"; "data-selected"?: string },
    children: React.ReactNode,
  ) => {
    const isDisabled = target < 1 || target > totalPages;
    return (
      <Motion.Feedback>
        {getPageUrl ? (
          <Link {...props} href={isDisabled ? undefined : getPageUrl(target)} isDisabled={isDisabled} onPress={() => go(target)}>
            {children}
          </Link>
        ) : (
          <Button {...props} isDisabled={isDisabled} onPress={() => go(target)}>
            {children}
          </Button>
        )}
      </Motion.Feedback>
    );
  };

  return (
    <nav
      className={clsx(styles.root, className)}
      style={{ ...themeVars.style, ...style }}
      data-register={register}
      aria-label={ariaLabel}
      {...otherProps}
    >
      {showRange ? (
        <span className={styles.range}>
          {count === 0
            ? "No results"
            : `Showing ${(start + 1).toLocaleString()}–${Math.min(start + pageSize, count).toLocaleString()} of ${count.toLocaleString()}`}
        </span>
      ) : null}
      <span className={styles.controls}>
        {control(current - 1, { className: clsx(styles.button, styles.step), "aria-label": "Previous page" }, (
          <>
            <ChevronLeftIcon size="control" />
            <span className={styles.stepText}>Previous</span>
          </>
        ))}
        {compact ? (
          <span className={styles.status}>
            Page {current} of {Math.max(totalPages, 1)}
          </span>
        ) : (
          getPageItems(current, totalPages, siblingCount).map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className={styles.ellipsis}>…</span>
            ) : (
              <React.Fragment key={`page-${item}`}>
                {control(
                  item,
                  {
                    className: clsx(styles.button, styles.item),
                    "aria-label": `Page ${item}${item === totalPages && totalPages > 1 ? ", last page" : ""}`,
                    "aria-current": item === current ? "page" : undefined,
                    "data-selected": item === current ? "" : undefined,
                  },
                  item,
                )}
              </React.Fragment>
            )
          )
        )}
        {control(current + 1, { className: clsx(styles.button, styles.step), "aria-label": "Next page" }, (
          <>
            <span className={styles.stepText}>Next</span>
            <ChevronRightIcon size="control" />
          </>
        ))}
      </span>
    </nav>
  );
}
