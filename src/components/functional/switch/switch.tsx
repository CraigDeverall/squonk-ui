"use client";

import { clsx } from "clsx";
import React from "react";
import { SwitchButton, SwitchField, Text } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./switch.module.css";
import { Motion } from "../../animation/motion/motion";

export interface SwitchProps {
  /** Label rendered next to the switch. */
  label?: React.ReactNode;
  /** Helper text below the label. */
  helperText?: string;
  /** Controlled state. */
  checked?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  /** Change handler. */
  onChange?: (checked: boolean) => void;
  /** Id of the native input. */
  id?: string;
  /** Form field name. */
  name?: string;
  /** Submitted value when on. */
  value?: string;
  /** Prevent interaction and dim the switch. */
  disabled?: boolean;
  /** Mark the field as required for form validation. */
  required?: boolean;
  /** Show the state but prevent changing it. */
  readOnly?: boolean;
  /** Focus the switch on mount. */
  autoFocus?: boolean;
  /** Notified when the switch gains focus. */
  onFocus?: (event: React.FocusEvent) => void;
  /** Notified when the switch loses focus. */
  onBlur?: (event: React.FocusEvent) => void;
  /** Class added to the root element. */
  className?: string;
  /** Inline styles merged onto the root element. */
  style?: React.CSSProperties;
  /** Accessible name when there is no visible `label`. */
  "aria-label"?: string;
  /** Id of an element that names the switch. */
  "aria-labelledby"?: string;
  /** Id of an element that describes the switch, in addition to `helperText`. */
  "aria-describedby"?: string;
  /** Ref to the native input. */
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * Behaviour (state, keyboard, form reset) comes from React Aria's
 * SwitchField; a visually hidden native checkbox (role="switch") stays the
 * focus target and form value.
 */
export function Switch({
  label,
  helperText,
  checked,
  defaultChecked,
  onChange,
  ref,
  disabled,
  required,
  readOnly,
  className,
  style,
  ...rest
}: SwitchProps) {
  const register = usePresentation();
  const themeVars = useThemeCssVars();

  return (
    <SwitchField
      {...rest}
      className={clsx(styles.root, className)}
      style={{ ...themeVars.style, ...style }}
      inputRef={ref}
      isSelected={checked}
      defaultSelected={defaultChecked}
      isDisabled={disabled}
      isRequired={required}
      isReadOnly={readOnly}
      validationBehavior="aria"
      onChange={onChange}
    >
      <SwitchButton className={styles.button}>
        <Motion.Feedback>
          <span className={styles.control} data-register={register} aria-hidden="true">
            <Motion.Feedback even><span className={styles.thumb} /></Motion.Feedback>
          </span>
        </Motion.Feedback>
        {label ? <span className={styles.label}>{themeVars.provide(label)}</span> : null}
      </SwitchButton>
      {helperText ? <Text slot="description" className={styles.hint}>{helperText}</Text> : null}
    </SwitchField>
  );
}
