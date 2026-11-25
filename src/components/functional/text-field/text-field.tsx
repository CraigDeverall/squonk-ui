"use client";

import { clsx } from "clsx";
import React from "react";
import { Input, Label, Text, TextField as AriaTextField } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./text-field.module.css";
import { Motion } from "../../animation/motion/motion";

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label rendered above the input, associated with it by `for`/`id`. */
  label?: string;
  /** Helper text below the input. Replaced by `error` text when an error is set. */
  helperText?: string;
  /** Error message. When set, the input takes the error styling and `aria-invalid`. */
  error?: string;
  /** Stretch to the parent's width. Defaults to `true`. */
  fullWidth?: boolean;
  /** Ref to the native input. */
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * React Aria's TextField wires the label, the input and the helper or error
 * text (ids, aria-invalid, required/disabled/read-only). Native input
 * attributes and the native `onChange` event pass straight to the input;
 * `required` stays a native attribute so plain forms validate as before.
 */
export function TextField({
  label,
  helperText,
  error,
  fullWidth = true,
  ref,
  id,
  required,
  disabled,
  readOnly,
  value,
  defaultValue,
  className,
  style,
  "aria-describedby": describedBy,
  "aria-labelledby": labelledBy,
  "aria-label": ariaLabel,
  ...inputProps
}: TextFieldProps) {
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const message = error ?? helperText;

  return (
    <AriaTextField
      className={clsx(styles.root, !fullWidth && styles.fit, className)}
      style={{ ...themeVars.style, ...style }}
      id={id}
      value={value === undefined ? undefined : String(value)}
      defaultValue={defaultValue === undefined ? undefined : String(defaultValue)}
      isInvalid={Boolean(error)}
      isRequired={required}
      isDisabled={disabled}
      isReadOnly={readOnly}
      validationBehavior="aria"
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {label ? <Label className={styles.label}>{label}</Label> : null}
      <Motion.Feedback field>
        <Input ref={ref} className={styles.input} data-register={register} required={required} {...inputProps} />
      </Motion.Feedback>
      {message ? (
        <Text
          slot={error ? "errorMessage" : "description"}
          className={styles.message}
          aria-live={error ? "polite" : undefined}
        >
          {message}
        </Text>
      ) : null}
    </AriaTextField>
  );
}
