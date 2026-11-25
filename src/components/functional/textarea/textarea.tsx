"use client";

import { clsx } from "clsx";
import React from "react";
import { Label, Text, TextArea as AriaTextArea, TextField } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./textarea.module.css";
import { Motion } from "../../animation/motion/motion";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label rendered above the textarea, associated with it by `for`/`id`. */
  label?: string;
  /** Helper text below the textarea. Replaced by `error` text when an error is set. */
  helperText?: string;
  /** Error message. When set, the textarea takes the error styling and `aria-invalid`. */
  error?: string;
  /** Grow with the content instead of scrolling. `rows` stays the minimum. */
  autoResize?: boolean;
  /** Show a character count. Shows "n / max" when `maxLength` is set. */
  showCount?: boolean;
  /** Stretch to the parent's width. Defaults to `true`. */
  fullWidth?: boolean;
  /** Ref to the native textarea. */
  ref?: React.Ref<HTMLTextAreaElement>;
}

/** Fits the textarea's border box to its content; `rows` sets the floor. */
function fitHeight(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  const { borderTopWidth, borderBottomWidth } = getComputedStyle(el);
  el.style.height = `${el.scrollHeight + parseFloat(borderTopWidth) + parseFloat(borderBottomWidth)}px`;
}

/**
 * A multi-line text input. React Aria's TextField wires the label, the
 * textarea and the helper or error text, as in `TextField`; the native
 * `onChange` event passes straight to the textarea.
 */
export function Textarea({
  label,
  helperText,
  error,
  autoResize = false,
  showCount = false,
  fullWidth = true,
  rows = 3,
  ref,
  id,
  required,
  disabled,
  readOnly,
  maxLength,
  value,
  defaultValue,
  onChange,
  className,
  style,
  "aria-describedby": describedBy,
  "aria-labelledby": labelledBy,
  "aria-label": ariaLabel,
  ...textareaProps
}: TextareaProps) {
  const countId = React.useId();
  const message = error ?? helperText;
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const innerRef = React.useRef<HTMLTextAreaElement>(null);
  const mergedRef = React.useCallback((el: HTMLTextAreaElement | null) => {
    innerRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as React.RefObject<HTMLTextAreaElement | null>).current = el;
  }, [ref]);

  // Counted locally so an uncontrolled textarea can show its count too.
  const [uncontrolledLength, setUncontrolledLength] = React.useState(() => String(defaultValue ?? "").length);
  const length = value === undefined ? uncontrolledLength : String(value).length;

  React.useLayoutEffect(() => {
    if (autoResize && innerRef.current) fitHeight(innerRef.current);
  }, [autoResize, value]);

  return (
    <TextField
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
      aria-describedby={[describedBy, showCount ? countId : undefined].filter(Boolean).join(" ") || undefined}
    >
      {label ? <Label className={styles.label}>{label}</Label> : null}
      <Motion.Feedback field>
        <AriaTextArea
          ref={mergedRef}
          className={styles.textarea}
          data-register={register}
          data-autoresize={autoResize ? "" : undefined}
          rows={rows}
          maxLength={maxLength}
          required={required}
          onChange={(event) => {
            setUncontrolledLength(event.target.value.length);
            if (autoResize) fitHeight(event.target);
            onChange?.(event);
          }}
          {...textareaProps}
        />
      </Motion.Feedback>
      {message || showCount ? (
        <div className={styles.footer}>
          {message ? (
            <Text
              slot={error ? "errorMessage" : "description"}
              className={styles.message}
              aria-live={error ? "polite" : undefined}
            >
              {message}
            </Text>
          ) : <span />}
          {showCount ? (
            <span id={countId} className={styles.count} data-full={maxLength !== undefined && length >= maxLength ? "" : undefined}>
              {maxLength === undefined ? `${length} characters` : `${length} / ${maxLength}`}
              {maxLength === undefined ? null : <span className={styles.visuallyHidden}> characters</span>}
            </span>
          ) : null}
        </div>
      ) : null}
    </TextField>
  );
}
