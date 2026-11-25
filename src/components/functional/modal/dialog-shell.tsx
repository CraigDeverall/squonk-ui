"use client";

import { clsx } from "clsx";
import React from "react";
import { Button as AriaButton, Dialog, Modal as AriaModal, ModalOverlay } from "react-aria-components";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { purposeValue, useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { Heading } from "../../functional-primitive/heading/heading";
import { CloseIcon } from "../../functional-primitive/icon/icon";
import type { SquonkTheme } from "../../../theme/theme-context";
import { Motion, type MotionChild, type MotionPace } from "../../animation/motion/motion";

// Internal: the dialog plumbing shared by Modal and Drawer. Not exported
// from the package; each component supplies its own classes.

const contentBackground = (theme: SquonkTheme) => purposeValue(theme, "roles.color.surface");

const FOCUSABLE =
  'a[href], area[href], button, textarea, input, select, summary, [tabindex], [contenteditable="true"]';

// React Aria's focus walker counts controls inside a disabled <fieldset>
// (and tabindex values below -1) as tabbable; Tab onto one fails silently
// and focus sticks. This list is what the browser would actually reach, with
// one stop per radio group.
function tabbableElements(dialog: HTMLElement, current: Element | null): HTMLElement[] {
  const elements = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => {
    const style = getComputedStyle(element);
    return element.tabIndex >= 0 && !element.matches(":disabled") &&
      !element.closest("[hidden], [inert]") &&
      style.visibility !== "hidden" && style.visibility !== "collapse" &&
      element.getClientRects().length > 0;
  });
  const radioStops = new Map<string, HTMLInputElement>();
  for (const element of elements) {
    if (!(element instanceof HTMLInputElement) || element.type !== "radio" || !element.name) continue;
    const stop = radioStops.get(element.name);
    if (!stop || element === current || (element.checked && stop !== current)) radioStops.set(element.name, element);
  }
  return elements
    .filter((element) => !(element instanceof HTMLInputElement && element.type === "radio" && element.name) ||
      radioStops.get(element.name) === element)
    .sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity));
}

// Moves Tab focus within the dialog, wrapping at the edges, in place of
// React Aria's walker (which still pulls stray focus back inside).
function containTab(event: React.KeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
  const dialog = event.currentTarget;
  const active = document.activeElement;
  const focusable = tabbableElements(dialog, active);
  event.preventDefault();
  event.stopPropagation();
  if (focusable.length === 0) {
    dialog.focus();
    return;
  }
  const index = active ? focusable.indexOf(active as HTMLElement) : -1;
  const next = event.shiftKey
    ? focusable[index <= 0 ? focusable.length - 1 : index - 1]
    : focusable[index === -1 || index === focusable.length - 1 ? 0 : index + 1];
  next.focus();
}

// A dialog rendered inside another dialog's content opens only once its
// parent has opened and taken focus, so it stacks above it and keeps focus.
const ParentOpenContext = React.createContext(true);

/** The class for each part, from the component's CSS module. */
export interface DialogShellClasses {
  /** The full-screen layer: backdrop colour and the dialog's placement. */
  overlay: string;
  /** The dialog box itself. */
  content: string;
  /** The row holding the heading and close button. */
  titleRow: string;
  /** The close button. */
  close: string;
  /** The wrapper around `children`. */
  body: string;
  /** The wrapper around `footer`. */
  footer: string;
}

export interface DialogShellProps
  extends Omit<React.ComponentProps<"div">, "children" | "title"> {
  /** Whether the dialog is shown. The consumer owns this state. */
  open: boolean;
  /** Requested close (backdrop press, Escape, or the close button). */
  onClose?: () => void;
  /** Dialog heading; also labels the dialog for assistive tech. */
  title?: string;
  /** Dialog body. */
  children?: React.ReactNode;
  /** Action row rendered under the body. */
  footer?: React.ReactNode;
  /** Close when the backdrop is pressed. Defaults to `true`. */
  closeOnBackdrop?: boolean;
  /** Render the close button. Defaults to `true` when `onClose` is set. */
  showCloseButton?: boolean;
  /** The class for each part, supplied by the wrapping component. */
  classes: DialogShellClasses;
  /** How quickly the backdrop dims the page. */
  backdropPace: MotionPace;
  /** How the dialog box arrives and leaves: wraps it in a Motion component. */
  motion: (dialog: MotionChild) => React.ReactElement;
}

/**
 * A modal dialog on React Aria's ModalOverlay, Modal and Dialog: focus moves
 * to the dialog and is contained inside it, Escape and a backdrop press
 * request close, the page behind is hidden from assistive technology and
 * scroll-locked, nested dialogs (Modals and Drawers) stack with only the
 * topmost responding, and focus returns to where it was when the dialog
 * closes.
 */
export function DialogShell({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
  showCloseButton,
  classes,
  backdropPace,
  motion,
  className,
  style,
  ref,
  onKeyDown,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...otherProps
}: DialogShellProps) {
  const themeVars = useThemeCssVars({ portal: true });
  const withClose = showCloseButton ?? Boolean(onClose);
  const titleId = React.useId();
  const parentOpen = React.useContext(ParentOpenContext);
  const isOpen = open && parentOpen;
  // Set as the dialog mounts; React runs its focus effect before re-rendering,
  // so children open after it has focused itself.
  const [opened, setOpened] = React.useState(false);
  const setDialog = React.useCallback((node: HTMLElement | null) => {
    setOpened(node !== null);
    if (typeof ref === "function") ref(node as HTMLDivElement | null);
    else if (ref) ref.current = node as HTMLDivElement | null;
  }, [ref]);

  return (
    <Motion.Dim pace={backdropPace}>
      <ModalOverlay
        isOpen={isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose?.();
        }}
        isDismissable={closeOnBackdrop}
        className={classes.overlay}
        style={themeVars.style}
      >
        {/* display: contents — the dialog box is the overlay's flex item, and
            a press outside it is a backdrop press. */}
        <AriaModal style={{ display: "contents" }}>
          {motion(
            <Dialog
              ref={setDialog}
              className={clsx(classes.content, className)}
              style={{ ...themeVars.style, ...style }}
              aria-label={ariaLabel ?? (!ariaLabelledBy && !title ? "Dialog" : undefined)}
              aria-labelledby={ariaLabelledBy ?? (ariaLabel || !title ? undefined : titleId)}
              // React Aria passes through only its own props; the rest of the
              // caller's attributes (aria-busy, data-*, handlers) go on here.
              render={(props) => (
                <section
                  {...(otherProps as React.ComponentProps<"section">)}
                  {...props}
                  onKeyDown={(event) => {
                    props.onKeyDown?.(event);
                    onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLDivElement>);
                    // A nested dialog's keys bubble here through the React tree.
                    if (!event.isPropagationStopped() && event.currentTarget.contains(event.target as Node)) containTab(event);
                  }}
                />
            )}
          >
            {themeVars.provide(
              <ParentOpenContext.Provider value={opened}>
              <SemanticSurface background={contentBackground}>
                {title || withClose ? (
                  <div className={classes.titleRow}>
                    {title ? <Heading id={titleId} level={3} weight="bold">{title}</Heading> : null}
                    {withClose ? (
                      <AriaButton slot="close" className={classes.close} aria-label="Close"><CloseIcon /></AriaButton>
                    ) : null}
                  </div>
                ) : null}
                <div className={classes.body}>{children}</div>
                {footer ? <div className={classes.footer}>{footer}</div> : null}
              </SemanticSurface>
              </ParentOpenContext.Provider>
            )}
          </Dialog>
          )}
        </AriaModal>
      </ModalOverlay>
    </Motion.Dim>
  );
}
