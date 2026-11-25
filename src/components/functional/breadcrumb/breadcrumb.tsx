"use client";

import { clsx } from "clsx";
import React from "react";
import { Breadcrumb as AriaBreadcrumb, Breadcrumbs, Button } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { ChevronRightIcon, HomeIcon } from "../../functional-primitive/icon/icon";
import { Link } from "../link/link";
import styles from "./breadcrumb.module.css";

export interface BreadcrumbItem {
  /** The page's name. */
  label: string;
  /** Where the crumb links. The last item is the current page and never links. */
  href?: string;
}

export interface BreadcrumbProps extends Omit<React.ComponentProps<"nav">, "children"> {
  /** The trail from the top level down to the current page, in order. */
  items: BreadcrumbItem[];
  /** The component links render as, such as Next.js's `Link`. Defaults to `<a>`. */
  linkAs?: React.ElementType;
  /** Collapse the middle of a long trail behind a "…" button, keeping the
   *  first item and the last `maxItems - 1`. */
  maxItems?: number;
  /** Show a home icon in place of the first item's text (the text stays as
   *  its accessible name). */
  homeIcon?: boolean;
}

/**
 * Where the current page sits in the site's hierarchy: a `nav` landmark
 * named "Breadcrumb" holding an ordered list of links, with the current page
 * last and marked `aria-current="page"`.
 */
export function Breadcrumb({
  items,
  linkAs,
  maxItems,
  homeIcon = false,
  className,
  style,
  "aria-label": ariaLabel = "Breadcrumb",
  ...otherProps
}: BreadcrumbProps) {
  const themeVars = useThemeCssVars();
  const [expanded, setExpanded] = React.useState(false);
  const listRef = React.useRef<HTMLOListElement>(null);
  const collapse = !expanded && maxItems !== undefined && maxItems >= 2 && items.length > maxItems;
  const hidden = collapse ? items.length - maxItems : 0;
  const visible = collapse ? [items[0], ...items.slice(hidden + 1)] : items;

  return (
    <nav
      className={clsx(styles.root, className)}
      style={{ ...themeVars.style, ...style }}
      aria-label={ariaLabel}
      {...otherProps}
    >
      <Breadcrumbs className={styles.list} ref={listRef}>
        {visible.flatMap((item, index) => {
          const isCurrent = index === visible.length - 1;
          const showHome = homeIcon && item === items[0];
          const content = showHome ? (
            <>
              <HomeIcon className={styles.homeIcon} />
              <span className={styles.visuallyHidden}>{item.label}</span>
            </>
          ) : (
            item.label
          );
          const crumb = (
            <AriaBreadcrumb key={`${item.label}-${index}`} id={`${item.label}-${index}`} className={styles.item}>
              {isCurrent ? (
                <span className={styles.current} aria-current="page">{content}</span>
              ) : item.href ? (
                <Link as={linkAs} href={item.href} variant="subtle" underline="hover" className={styles.link}>
                  {content}
                </Link>
              ) : (
                <span className={styles.plain}>{content}</span>
              )}
              {isCurrent ? null : <ChevronRightIcon className={styles.separator} />}
            </AriaBreadcrumb>
          );
          if (!(collapse && index === 0)) return [crumb];
          return [
            crumb,
            <AriaBreadcrumb key="expand" id="expand" className={styles.item}>
              <Button
                className={styles.expand}
                aria-label={`Show ${hidden} more ${hidden === 1 ? "level" : "levels"}`}
                onPress={() => {
                  setExpanded(true);
                  // Focus the first revealed crumb so keyboard users carry on from there.
                  requestAnimationFrame(() => listRef.current?.querySelectorAll<HTMLElement>("a, [aria-current]")[1]?.focus());
                }}
              >
                …
              </Button>
              <ChevronRightIcon className={styles.separator} />
            </AriaBreadcrumb>,
          ];
        })}
      </Breadcrumbs>
    </nav>
  );
}
