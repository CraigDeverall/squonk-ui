"use client";

import React from "react";
import { Button, type ButtonProps } from "../button/button";
import { Tooltip } from "../tooltip/tooltip";
import type { IconProps } from "../../functional-primitive/icon/icon";

export interface IconButtonProps
  extends Omit<ButtonProps<"button">, "as" | "children" | "fullWidth" | "primary" | "aria-label"> {
  /** The icon, such as `<DeleteIcon />`. It is sized to the control unless
   *  it sets its own `size`. */
  icon: React.ReactElement<IconProps>;
  /** What the button does. Becomes its accessible name and, by default,
   *  its tooltip. */
  label: string;
  /** Show `label` in a tooltip on hover and focus. Defaults to `true`. */
  tooltip?: boolean;
  /** Ref to the underlying `<button>`. */
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * A square button that shows only an icon. `label` names it for assistive
 * technology and appears in a tooltip, so the icon's meaning is never a
 * guess. Same variants and shapes as `Button`; defaults to a quiet
 * `ghost`, `rounded` button for toolbars and table rows.
 */
export function IconButton({
  icon,
  label,
  tooltip = true,
  variant = "ghost",
  shape = "rounded",
  type = "button",
  ...buttonProps
}: IconButtonProps) {
  const button = (
    <Button
      {...buttonProps}
      type={type}
      variant={variant}
      shape={shape}
      aria-label={label}
      data-icon-only=""
    >
      {React.cloneElement(icon, { size: icon.props.size ?? "control" })}
    </Button>
  );
  return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
}
