"use client";

import { clsx } from "clsx";
import React from "react";
import {
  Button as AriaButton,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover as AriaPopover,
  Separator,
} from "react-aria-components";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { purposeValue, useThemeCssVars } from "../../../theme/use-theme-css-vars";
import styles from "./dropdown-menu.module.css";
import type { SquonkTheme } from "../../../theme/theme-context";
import { Motion } from "../../animation/motion/motion";

const contentBackground = (theme: SquonkTheme) => purposeValue(theme, "roles.color.surface");

/** A selectable entry in the menu. */
export interface DropdownMenuItem {
  /** Stable identity for the entry. */
  key: string;
  /** Entry content — usually a short label. */
  label: React.ReactNode;
  /** Called when the entry is activated (click or Enter/Space). */
  onSelect?: () => void;
  /** Optional leading adornment (icon, avatar…). */
  icon?: React.ReactNode;
  /** Grey out and ignore activation. */
  disabled?: boolean;
  /** Semantic color. `danger` marks destructive entries. */
  tone?: "default" | "danger";
}

/** Menu content: items, with `"separator"` drawing a divider between groups. */
export type DropdownMenuEntry = DropdownMenuItem | "separator";

export interface DropdownMenuProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  /** Content of the trigger button (text, an `<Avatar>`, …). */
  trigger: React.ReactNode;
  /** Menu entries, top to bottom. */
  items: DropdownMenuEntry[];
  /** Which edge of the trigger the menu aligns to. Defaults to `"start"`. */
  align?: "start" | "end";
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Notified whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Accessible name for the trigger — required when `trigger` has no text. */
  triggerLabel?: string;
  /** Disable the trigger entirely. */
  disabled?: boolean;
}

/**
 * A trigger button with an attached menu of actions — the primitive behind
 * user menus, row-action menus, and "…" overflow menus.
 *
 * Built on React Aria's MenuTrigger and Menu (the WAI-ARIA menu-button
 * pattern): `Enter`/`Space`/`ArrowDown` open and focus the first item,
 * `ArrowUp` the last, arrows and typeahead move focus between items,
 * `Escape` closes and refocuses the trigger, and clicking outside closes.
 * Opened by pointer, the menu itself takes focus and items follow the
 * pointer.
 */
export function DropdownMenu({
  trigger,
  items,
  align = "start",
  open,
  defaultOpen = false,
  onOpenChange,
  triggerLabel,
  disabled,
  className,
  style,
  ...otherProps
}: DropdownMenuProps) {
  const themeVars = useThemeCssVars();
  const portalVars = useThemeCssVars({ portal: true });
  const disabledKeys = items.flatMap((entry) => (entry !== "separator" && entry.disabled ? [entry.key] : []));

  return (
    <div className={clsx(styles.root, className)} style={{ ...themeVars.style, ...style }} {...otherProps}>
      <MenuTrigger isOpen={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <AriaButton className={styles.trigger} isDisabled={disabled} aria-label={triggerLabel}>
          {trigger}
        </AriaButton>
        <Motion.Pop>
          <AriaPopover
            className={styles.popover}
            style={portalVars.style}
            placement={align === "end" ? "bottom end" : "bottom start"}
            offset={4}
            containerPadding={8}
          >
            {portalVars.provide(
              <SemanticSurface background={contentBackground}>
                <Menu
                  className={styles.content}
                  aria-label={triggerLabel}
                  disabledKeys={disabledKeys}
                  onAction={(key) => {
                    const item = items.find((entry) => entry !== "separator" && entry.key === key);
                    if (item && item !== "separator") item.onSelect?.();
                  }}
                >
                  {items.map((entry, i) =>
                    entry === "separator" ? (
                      <Separator key={`separator-${i}`} className={styles.separator} />
                    ) : (
                      <MenuItem
                        key={entry.key}
                        id={entry.key}
                        textValue={typeof entry.label === "string" ? entry.label : undefined}
                        className={styles.item}
                        data-tone={entry.tone ?? "default"}
                      >
                        {entry.icon ?? null}
                        {entry.label}
                      </MenuItem>
                    )
                  )}
                </Menu>
              </SemanticSurface>
            )}
          </AriaPopover>
        </Motion.Pop>
      </MenuTrigger>
    </div>
  );
}
