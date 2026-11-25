"use client";

import { clsx } from "clsx";
import React from "react";
import { CheckboxButton, CheckboxField, Text } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import styles from "./checkbox.module.css";
import { Motion } from "../../animation/motion/motion";

export interface CheckboxProps {
  /** Label rendered next to the checkbox. */
  label?: React.ReactNode;
  /** Controlled state. */
  checked?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  /** Three-state checkbox — sets the visual to a dash. Pair with `checked={false}`. */
  indeterminate?: boolean;
  /** Helper text below the label. */
  helperText?: string;
  /** Error message; overrides `helperText` and switches the box to the error color. */
  error?: string;
  /** Change handler. */
  onChange?: (checked: boolean) => void;
  /** Id of the native input. */
  id?: string;
  /** Form field name. */
  name?: string;
  /** Submitted value when checked, and the item's value inside a CheckboxGroup. */
  value?: string;
  /** Make the checkbox unavailable; it cannot be toggled or focused. */
  disabled?: boolean;
  /** Mark the checkbox as required for form submission. */
  required?: boolean;
  /** Show the state but ignore toggling; it stays focusable. */
  readOnly?: boolean;
  /** Focus the checkbox when it mounts. */
  autoFocus?: boolean;
  /** Called when the checkbox gains focus. */
  onFocus?: (event: React.FocusEvent) => void;
  /** Called when the checkbox loses focus. */
  onBlur?: (event: React.FocusEvent) => void;
  /** Extra class on the wrapping element. */
  className?: string;
  /** Inline styles on the wrapping element. */
  style?: React.CSSProperties;
  /** Accessible name when there is no visible `label`. */
  "aria-label"?: string;
  /** Id of an element that names the checkbox, in place of `label`. */
  "aria-labelledby"?: string;
  /** Ids of extra elements that describe the checkbox. */
  "aria-describedby"?: string;
  /** React Aria slot, e.g. `"selection"` for a row checkbox in a Table. */
  slot?: string;
  /** Ref to the native input. */
  ref?: React.Ref<HTMLInputElement>;
}

const Tick = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path data-check-dash d="M3 8h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path data-check-tick d="M3.5 8.5l3 3 6-6" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * A single on/off choice with an optional label, helper and error text.
 * Behaviour (state, keyboard, form reset, group membership) comes from React
 * Aria's CheckboxField; a visually hidden native input stays the focus target
 * and form value.
 */
export function Checkbox({
  label,
  checked,
  defaultChecked,
  indeterminate = false,
  helperText,
  error,
  onChange,
  ref,
  disabled,
  required,
  readOnly,
  className,
  style,
  ...rest
}: CheckboxProps) {
  const themeVars = useThemeCssVars();
  const message = error ?? helperText;

  return (
    <CheckboxField
      {...rest}
      className={clsx(styles.root, className)}
      style={{ ...themeVars.style, ...style }}
      inputRef={ref}
      isSelected={checked}
      defaultSelected={defaultChecked}
      isIndeterminate={indeterminate}
      isDisabled={disabled}
      // Undefined, not false, so a CheckboxGroup's invalid state reaches it.
      isInvalid={error ? true : undefined}
      isRequired={required}
      isReadOnly={readOnly}
      validationBehavior="aria"
      onChange={onChange}
    >
      <CheckboxButton className={styles.button}>
        <Motion.Feedback><span className={styles.control} aria-hidden="true"><Tick /></span></Motion.Feedback>
        {label ? <span className={styles.label}>{themeVars.provide(label)}</span> : null}
      </CheckboxButton>
      {message ? (
        <Text slot={error ? "errorMessage" : "description"} className={styles.hint}>{message}</Text>
      ) : null}
    </CheckboxField>
  );
}
