"use client";

import React from "react";
import { Button } from "../button/button";
import { Text } from "../../functional-primitive/text/text";
import { DialogShell, type DialogShellClasses } from "./dialog-shell";
import styles from "./modal.module.css";
import { Motion } from "../../animation/motion/motion";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps
  extends Omit<React.ComponentProps<"div">, "children" | "title"> {
  /** Whether the dialog is shown. The consumer owns this state. */
  open: boolean;
  /** Requested close (backdrop press, Escape, or the close button). */
  onClose?: () => void;
  /** Dialog heading; also labels the dialog for assistive tech. */
  title?: string;
  /** Dialog body. */
  children?: React.ReactNode;
  /** Action row rendered under the body — usually Buttons. */
  footer?: React.ReactNode;
  /** Max width of the dialog. Defaults to `"md"`. */
  size?: ModalSize;
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
 * A modal dialog, built on React Aria's ModalOverlay and Dialog: focus moves
 * to the dialog and is contained inside it, Escape and a backdrop press
 * request close, the page behind is hidden from assistive technology and
 * scroll-locked, nested dialogs stack, and focus returns to where it was
 * when the dialog closes.
 */
export function Modal({ size = "md", ...props }: ModalProps) {
  return <DialogShell {...props} classes={classes} backdropPace="overlay" motion={(dialog) => <Motion.Pop pace="arrive">{dialog}</Motion.Pop>} data-size={size} />;
}

export interface ConfirmModalProps {
  /** Whether the dialog is shown. */
  open: boolean;
  /** Dialog heading. Defaults to `"Are you sure?"`. */
  title?: string;
  /** Explanation of what confirming will do. */
  message?: React.ReactNode;
  /** Confirm button label. Defaults to `"Confirm"`. */
  confirmLabel?: string;
  /** Cancel button label. Defaults to `"Cancel"`. */
  cancelLabel?: string;
  /** Style the confirm button as destructive. Defaults to `false`. */
  danger?: boolean;
  /** Disable actions and all user dismissal while the confirmed action is in flight. */
  loading?: boolean;
  /** Called when the user confirms. */
  onConfirm: () => void;
  /** Called when the user cancels or dismisses. */
  onCancel: () => void;
}

/**
 * A ready-made confirmation dialog on top of `Modal` — title, message, and a
 * cancel/confirm pair, with a `danger` variant for destructive actions.
 */
export function ConfirmModal({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onCancel}
      closeOnBackdrop={!loading}
      showCloseButton={!loading}
      aria-busy={loading}
      title={title}
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message ? <Text>{message}</Text> : null}
    </Modal>
  );
}
