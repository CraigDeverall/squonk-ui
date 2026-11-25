"use client";

import { clsx } from "clsx";
import React from "react";
import { Focusable, OverlayArrow, Tooltip as AriaTooltip, TooltipTrigger } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import styles from "./tooltip.module.css";
import { Motion } from "../../animation/motion/motion";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps
  extends Omit<React.ComponentProps<"div">, "children" | "content"> {
  /** The hint. Keep it to a short phrase; it is announced as a description. */
  content: React.ReactNode;
  /** The trigger: one focusable element that accepts a `ref`, such as a
   *  `Button`, `IconButton` or `Link`. */
  children: React.ReactElement;
  /** Preferred side of the trigger. Flips when there is no room. Defaults to `"top"`. */
  placement?: TooltipPlacement;
  /** Milliseconds of hover before opening. Defaults to `400`. */
  openDelay?: number;
  /** Milliseconds before closing once the pointer leaves. Defaults to `150`. */
  closeDelay?: number;
  /** Draw a small arrow pointing at the trigger. Defaults to `true`. */
  arrow?: boolean;
  /** Never open. */
  disabled?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Notified whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * A short hint shown on hover and keyboard focus, built on React Aria's
 * TooltipTrigger and Tooltip.
 *
 * The trigger gains `aria-describedby` pointing at the hint while it is
 * open. Escape closes it, and the pointer can move onto the hint without it
 * closing (WCAG 1.4.13). The hint is portalled, so overflow on an ancestor
 * never clips it.
 */
export function Tooltip({
  content,
  children,
  placement = "top",
  openDelay = 400,
  closeDelay = 150,
  arrow = true,
  disabled,
  open,
  defaultOpen,
  onOpenChange,
  className,
  style,
  ...otherProps
}: TooltipProps) {
  const themeVars = useThemeCssVars({ portal: true });

  return (
    <TooltipTrigger
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      delay={openDelay}
      closeDelay={closeDelay}
      isDisabled={disabled}
    >
      {/* Typed for DOM elements; any child that forwards its ref works. */}
      <Focusable>{children as React.ComponentProps<typeof Focusable>["children"]}</Focusable>
      <Motion.Pop>
        <AriaTooltip
          {...(otherProps as object)}
          className={clsx(styles.content, className)}
          style={{ ...themeVars.style, ...style }}
          placement={placement}
          // The gap to the trigger is measured to the arrow tip.
          offset={arrow ? 12 : 4}
          containerPadding={8}
        >
          {arrow ? (
            <OverlayArrow className={styles.arrow}>
              <span className={styles.arrowTip} />
            </OverlayArrow>
          ) : null}
          {themeVars.provide(content)}
        </AriaTooltip>
      </Motion.Pop>
    </TooltipTrigger>
  );
}
