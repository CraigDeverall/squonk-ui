"use client";

import { clsx } from "clsx";
import React from "react";
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Heading,
  OverlayArrow,
  Popover as AriaPopover,
  Pressable,
  Text,
} from "react-aria-components";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { purposeValue, useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { CloseIcon } from "../../functional-primitive/icon/icon";
import styles from "./popover.module.css";
import type { SquonkTheme } from "../../../theme/theme-context";
import { Motion } from "../../animation/motion/motion";

type AriaPlacement = NonNullable<React.ComponentProps<typeof AriaPopover>["placement"]>;

const contentBackground = (theme: SquonkTheme) => purposeValue(theme, "roles.color.surface");

export type PopoverPlacement =
  | "top" | "top-start" | "top-end"
  | "bottom" | "bottom-start" | "bottom-end"
  | "left" | "right";

export interface PopoverProps
  extends Omit<React.ComponentProps<"div">, "children" | "title"> {
  /** The element that opens the popover: one focusable element that accepts
   *  a `ref`, usually a `Button` or `IconButton`. */
  trigger: React.ReactElement;
  /** Heading; also names the popover. */
  title?: React.ReactNode;
  /** A line under the title; also describes the popover. */
  description?: React.ReactNode;
  /** The popover's content. May include links, buttons and form fields. */
  children?: React.ReactNode;
  /** Actions under the content, usually Buttons. */
  footer?: React.ReactNode;
  /** Preferred position against the trigger. Flips when there is no room.
   *  Defaults to `"bottom-start"`. */
  placement?: PopoverPlacement;
  /** Show a close button. Defaults to `true` when there is a title. */
  showCloseButton?: boolean;
  /** Draw a small arrow pointing at the trigger. Defaults to `false`. */
  arrow?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Notified whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Width of the panel. Defaults to `"md"` (320px). */
  size?: "sm" | "md" | "lg";
}

/**
 * Content anchored to a trigger, built on React Aria's DialogTrigger,
 * Popover and Dialog: the trigger has `aria-expanded`, focus moves into the
 * panel on open and back to the trigger on close, and Escape or a click
 * outside closes it. While it is open, Tab stays within the panel and the
 * rest of the page is hidden from assistive technology.
 */
export function Popover({
  trigger,
  title,
  description,
  children,
  footer,
  placement = "bottom-start",
  showCloseButton,
  arrow = false,
  open,
  defaultOpen,
  onOpenChange,
  size = "md",
  className,
  style,
  ...otherProps
}: PopoverProps) {
  const themeVars = useThemeCssVars({ portal: true });
  const withClose = showCloseButton ?? Boolean(title);
  const descriptionId = React.useId();

  return (
    <DialogTrigger isOpen={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {/* Typed for DOM elements; any trigger that forwards its ref works. */}
      <Pressable>{trigger as React.ComponentProps<typeof Pressable>["children"]}</Pressable>
      <Motion.Pop>
        <AriaPopover
          {...(otherProps as object)}
          className={clsx(styles.content, className)}
          style={{ ...themeVars.style, ...style }}
          data-size={size}
          placement={placement.replace("-", " ") as AriaPlacement}
          // The gap to the trigger is measured to the arrow tip.
          offset={arrow ? 15 : 6}
          containerPadding={8}
        >
          {arrow ? (
            <OverlayArrow className={styles.arrow}>
              <span className={styles.arrowTip} />
            </OverlayArrow>
          ) : null}
          {/* Without a title, DialogTrigger names the dialog after its trigger. */}
          <Dialog className={styles.dialog} aria-describedby={description ? descriptionId : undefined}>
            {themeVars.provide(
              <SemanticSurface background={contentBackground}>
                {title || withClose ? (
                  <div className={styles.header}>
                    <div className={styles.titles}>
                      {title ? <Heading slot="title" className={styles.title}>{title}</Heading> : null}
                      {description ? (
                        <Text id={descriptionId} slot="description" elementType="p" className={styles.description}>{description}</Text>
                      ) : null}
                    </div>
                    {withClose ? (
                      <AriaButton slot="close" className={styles.close} aria-label="Close">
                        <CloseIcon />
                      </AriaButton>
                    ) : null}
                  </div>
                ) : null}
                {children ? <div className={styles.body}>{children}</div> : null}
                {footer ? <div className={styles.footer}>{footer}</div> : null}
              </SemanticSurface>
            )}
          </Dialog>
        </AriaPopover>
      </Motion.Pop>
    </DialogTrigger>
  );
}
