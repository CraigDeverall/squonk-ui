"use client";

import React from "react";
import { DialogShell, type DialogShellClasses } from "../modal/dialog-shell";
import styles from "./drawer.module.css";
import { Motion } from "../../animation/motion/motion";

export type DrawerPlacement = "end" | "start" | "bottom";
export type DrawerSize = "sm" | "md" | "lg";

export interface DrawerProps
  extends Omit<React.ComponentProps<"div">, "children" | "title"> {
  /** Whether the drawer is shown. The consumer owns this state. */
  open: boolean;
  /** Requested close (backdrop press, Escape, or the close button). */
  onClose?: () => void;
  /** Heading; also labels the drawer for assistive tech. */
  title?: string;
  /** The drawer's content. Scrolls when it is taller than the screen. */
  children?: React.ReactNode;
  /** Actions pinned to the bottom of the drawer, usually Buttons. */
  footer?: React.ReactNode;
  /** The edge it slides in from. `end` is the right in left-to-right
   *  languages. Defaults to `"end"`. */
  placement?: DrawerPlacement;
  /** Width (or height for `bottom`). Defaults to `"md"`. */
  size?: DrawerSize;
  /** Close when the backdrop is pressed. Defaults to `true`. */
  closeOnBackdrop?: boolean;
  /** Render the close button. Defaults to `true` when `onClose` is set. */
  showCloseButton?: boolean;
}

const classes: DialogShellClasses = {
  overlay: styles.overlay,
  content: styles.content,
  titleRow: styles.titleRow,
  close: styles.close,
  body: styles.body,
  footer: styles.footer,
};

/**
 * A modal panel that slides in from the edge of the screen, for a task or
 * detail that needs more room than a Popover but should keep the page in
 * view. Same behaviour as `Modal` (React Aria's ModalOverlay and Dialog):
 * focus is contained inside, Escape and a backdrop press request close, the page behind is
 * inert, and Drawers and Modals opened from it stack on top.
 */
export function Drawer({ placement = "end", size = "md", ...props }: DrawerProps) {
  return <DialogShell {...props} classes={classes} backdropPace="arrive" motion={(panel) => <Motion.Slide from={placement}>{panel}</Motion.Slide>} data-placement={placement} data-size={size} />;
}
