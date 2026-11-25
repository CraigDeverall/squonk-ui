"use client";

import { clsx } from "clsx";
import React from "react";
import {
  Button,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading,
  type DisclosureGroupProps,
  type KeyboardEvent,
} from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import { ChevronDownIcon } from "../../functional-primitive/icon/icon";
import styles from "./accordion.module.css";
import { Motion } from "../../animation/motion/motion";

export interface AccordionItem<T extends string = string> {
  /** Stable identity, used by `value` and `onValueChange`. */
  value: T;
  /** The always-visible heading that opens and closes the section. */
  title: React.ReactNode;
  /** A line under the title, such as a summary or status. */
  description?: React.ReactNode;
  /** The section's content, shown while it is open. */
  content: React.ReactNode;
  /** Keep this section closed and ignore activation. */
  disabled?: boolean;
}

export type AccordionVariant = "divided" | "contained";

/** How a section's header answers the pointer. */
export type AccordionHover = "underline" | "fill";

export interface AccordionProps<T extends string = string>
  extends Omit<React.ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The sections, in order. */
  items: AccordionItem<T>[];
  /** Controlled open sections. */
  value?: T[];
  /** Uncontrolled initially open sections. */
  defaultValue?: T[];
  /** Notified with the open sections after each change. */
  onValueChange?: (value: T[]) => void;
  /** Allow several sections open at once. Defaults to `false`. */
  multiple?: boolean;
  /** Allow the open section to close again when only one may be open.
   *  Defaults to `true`. */
  collapsible?: boolean;
  /** `divided` separates sections with rules; `contained` draws a bordered
   *  box around them. Defaults to `"divided"`. */
  variant?: AccordionVariant;
  /** How a header answers the pointer. `underline` underlines the title;
   *  `fill` shades the whole header row and leaves the title as it is, for
   *  sections that read as rows of a list. Unset keeps the variant's own
   *  look: an underline, and a contained accordion's shaded header. */
  hover?: AccordionHover;
  /** Show the chevron that turns as a section opens. Defaults to `true`. Turn
   *  it off only when the header's look already says it opens, such as rows
   *  with `hover="fill"`; `aria-expanded` still tells assistive technology. */
  indicator?: boolean;
  /** Heading level wrapping each title, to fit the page outline. Defaults to `3`. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

/**
 * Stacked sections that open and close, built on React Aria's
 * DisclosureGroup (the WAI-ARIA accordion pattern): each title is a button
 * inside a heading, with `aria-expanded` and `aria-controls`; arrow keys move
 * between titles; open content animates its height unless motion is reduced.
 * Closed content stays in the page (`hidden="until-found"`), so the
 * browser's find-in-page can reveal it.
 */
export function Accordion<T extends string = string>({
  items,
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  collapsible = true,
  variant = "divided",
  hover,
  indicator = true,
  headingLevel = 3,
  className,
  style,
  ...otherProps
}: AccordionProps<T>) {
  const themeVars = useThemeCssVars();
  const register = usePresentation();
  const [uncontrolled, setUncontrolled] = React.useState<T[]>(defaultValue ?? []);
  const open = value ?? uncontrolled;

  const change = (keys: Set<React.Key>) => {
    const next = [...keys] as T[];
    // React Aria always lets the open section close; honour collapsible={false}.
    if (!multiple && !collapsible && next.length === 0) return;
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  // Arrow keys, Home and End move between the enabled titles.
  const rootRef = React.useRef<HTMLDivElement>(null);
  const moveFocus = (event: KeyboardEvent) => {
    const triggers = [...(rootRef.current?.querySelectorAll<HTMLButtonElement>("[data-accordion-trigger]:not(:disabled)") ?? [])];
    const index = triggers.indexOf(event.target as HTMLButtonElement);
    const next =
      event.key === "ArrowDown" ? triggers[(index + 1) % triggers.length] :
      event.key === "ArrowUp" ? triggers[(index - 1 + triggers.length) % triggers.length] :
      event.key === "Home" ? triggers[0] :
      event.key === "End" ? triggers[triggers.length - 1] :
      undefined;
    if (!next) return event.continuePropagation();
    event.preventDefault();
    next.focus();
  };

  return (
    <DisclosureGroup
      {...(otherProps as Omit<DisclosureGroupProps, "className" | "style">)}
      className={clsx(styles.root, className)}
      style={{ ...themeVars.style, ...style }}
      data-variant={variant}
      data-hover={hover}
      data-register={register}
      expandedKeys={open}
      onExpandedChange={change}
      allowsMultipleExpanded={multiple}
      ref={rootRef}
    >
      {items.map((item) => (
        <Disclosure key={item.value} id={item.value} isDisabled={item.disabled} className={styles.item}>
          <Heading level={headingLevel} className={styles.heading}>
            <Button slot="trigger" className={styles.trigger} data-accordion-trigger="" onKeyDown={moveFocus}>
              <span className={styles.titles}>
                <span className={styles.title}>{themeVars.provide(item.title)}</span>
                {item.description ? <span className={styles.description}>{themeVars.provide(item.description)}</span> : null}
              </span>
              {indicator ? (
                <Motion.Shift>
                  <span className={styles.indicator} aria-hidden="true">
                    <ChevronDownIcon size="control" />
                  </span>
                </Motion.Shift>
              ) : null}
            </Button>
          </Heading>
          <Motion.Collapse>
            <DisclosurePanel role="region" className={styles.content}>
              <div className={styles.body}>{themeVars.provide(item.content)}</div>
            </DisclosurePanel>
          </Motion.Collapse>
        </Disclosure>
      ))}
    </DisclosureGroup>
  );
}
