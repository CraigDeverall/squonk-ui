"use client";

import { clsx } from "clsx";
import React from "react";
import { Link as AriaLink } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { Motion } from "../../animation/motion/motion";
import type { IconProps } from "../../functional-primitive/icon/icon";
import styles from "./nav-list.module.css";

export interface NavListItem {
  /** Identifies the item; `current` names the current one by it. */
  id: string;
  /** The page's name. */
  label: string;
  /** Where it goes. */
  href: string;
  /** An icon before the label, such as `<HomeIcon />`. Decorative: the label names the link. */
  icon?: React.ReactElement<IconProps>;
  /** Something short after the label, such as a count or a `Badge`. */
  end?: React.ReactNode;
  /**
   * A page that exists but can't be opened yet, such as one coming soon.
   * It shows dimmed, isn't a link and can't be focused, and assistive
   * technology hears it as unavailable. Say why with `end` or `title`.
   */
  disabled?: boolean;
  /** A tooltip for the item, such as why it's disabled ("Coming later"). */
  title?: string;
}

export type NavListOrientation = "vertical" | "horizontal";

export interface NavListProps extends Omit<
  React.ComponentPropsWithRef<"nav">,
  "children"
> {
  /** Names the navigation for assistive technology, such as "Main" or "Account". Required: a page often has several. */
  label: string;
  /** The pages, in order. */
  items: NavListItem[];
  /** The `id` of the page you're on. It's marked as the current page (`aria-current="page"`). */
  current?: string;
  /** `vertical` (default) for a side navigation; `horizontal` for a row across the top of a section. */
  orientation?: NavListOrientation;
  /** Called with an item's `id` when it's chosen, such as to close a mobile drawer. Navigation still follows `href`. */
  onNavigate?: (id: string) => void;
  /** The component links render as, such as Next.js's `Link`. Defaults to React Aria's link, which uses the app's `RouterProvider` when there is one. */
  linkAs?: React.ElementType;
  children?: never;
}

/**
 * Navigation between the pages of an app, marking the current one. How the
 * current page and the item under the pointer are marked (a bar, a fill, an
 * underline or a ring standing off the fill) comes from the theme's
 * `roles.indicator.*` tokens and its `indicatorStyle`, so it's the same
 * everywhere in the app.
 */
export function NavList({
  label,
  items,
  current,
  orientation = "vertical",
  onNavigate,
  linkAs,
  className,
  style,
  ...otherProps
}: NavListProps) {
  const themeVars = useThemeCssVars();

  return (
    <nav
      aria-label={label}
      className={clsx(styles.root, className)}
      style={{ ...themeVars.style, ...style }}
      data-orientation={orientation}
      {...otherProps}
    >
      {themeVars.provide(
        <ul className={styles.list}>
          {items.map((item) => {
            const isCurrent = item.id === current;
            // The fill stands off the item's edge by the ring and its gap,
            // so a ring drawn on the item reads as a border with a gap.
            const content = (
              <Motion.Feedback>
                <span className={styles.fill}>
                  {item.icon ? (
                    <span className={styles.icon} aria-hidden="true">
                      {React.cloneElement(item.icon, {
                        size: item.icon.props.size ?? "inherit",
                      })}
                    </span>
                  ) : null}
                  <span className={styles.label}>{item.label}</span>
                  {item.end != null ? (
                    <span className={styles.end}>{item.end}</span>
                  ) : null}
                </span>
              </Motion.Feedback>
            );
            const shared = {
              className: styles.item,
              title: item.title,
              "aria-current": isCurrent ? ("page" as const) : undefined,
              "data-current": isCurrent || undefined,
            };
            if (item.disabled) {
              // Not a link: nothing to follow or focus. role="link" with
              // aria-disabled keeps it in the list as an unavailable page.
              return (
                <li key={item.id} className={styles.entry}>
                  <span {...shared} role="link" aria-disabled="true" data-disabled="">
                    <span className={styles.fill}>
                      {item.icon ? (
                        <span className={styles.icon} aria-hidden="true">
                          {React.cloneElement(item.icon, { size: item.icon.props.size ?? "inherit" })}
                        </span>
                      ) : null}
                      <span className={styles.label}>{item.label}</span>
                      {item.end != null ? <span className={styles.end}>{item.end}</span> : null}
                    </span>
                  </span>
                </li>
              );
            }
            if (linkAs) {
              const Component = linkAs;
              return (
                <li key={item.id} className={styles.entry}>
                  <Motion.Feedback>
                    <Component
                      {...shared}
                      href={item.href}
                      onClick={() => onNavigate?.(item.id)}
                    >
                      {content}
                    </Component>
                  </Motion.Feedback>
                </li>
              );
            }
            return (
              <li key={item.id} className={styles.entry}>
                <Motion.Feedback>
                  <AriaLink
                    {...shared}
                    href={item.href}
                    onPress={() => onNavigate?.(item.id)}
                  >
                    {content}
                  </AriaLink>
                </Motion.Feedback>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
