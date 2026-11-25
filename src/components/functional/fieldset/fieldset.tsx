"use client";

import { clsx } from "clsx";
import React from "react";
import {
  ButtonContext,
  CheckboxFieldContext,
  CheckboxGroupContext,
  ComboBoxContext,
  Provider,
  RadioGroupContext,
  SelectContext,
  SwitchFieldContext,
  TextFieldContext,
} from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import styles from "./fieldset.module.css";

export interface FieldsetProps extends Omit<React.ComponentProps<"fieldset">, "children"> {
  /** Names the group. Announced before each field inside it. */
  legend: React.ReactNode;
  /** Visually hide the legend while keeping it for assistive technology. */
  hideLegend?: boolean;
  /** Guidance for the whole group, below the legend. */
  helperText?: React.ReactNode;
  /** An error about the group as a whole, such as "Choose at least one". */
  error?: React.ReactNode;
  /** Disable every control inside. */
  disabled?: boolean;
  /** Space between the fields. Defaults to `"md"`. */
  gap?: "xs" | "sm" | "md" | "lg";
  /** The grouped fields. */
  children?: React.ReactNode;
}

const DISABLED = { isDisabled: true };

/**
 * Groups related fields under a legend. A native `<fieldset>`: the legend
 * names the group and helper and error text describe it. `disabled` turns
 * off every native control natively, and reaches the library's React Aria
 * fields through their contexts so they look disabled too.
 */
export function Fieldset({
  legend,
  hideLegend = false,
  helperText,
  error,
  disabled,
  gap = "md",
  children,
  className,
  style,
  "aria-describedby": describedBy,
  ...otherProps
}: FieldsetProps) {
  const id = React.useId();
  const themeVars = useThemeCssVars();
  const description = [describedBy, error ? `${id}-error` : undefined, helperText ? `${id}-helper` : undefined]
    .filter(Boolean).join(" ") || undefined;

  // purpose-tokens: scale-api — `gap` is the consumer's choice of spacing step between the fields.
  const fields = <div className={styles.fields}>{themeVars.provide(children)}</div>;

  return (
    <fieldset
      className={clsx(styles.root, className)}
      style={{ "--fieldset-gap": `var(--squonk-spacing-${gap})`, ...themeVars.style, ...style } as React.CSSProperties}
      disabled={disabled}
      data-invalid={error ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      aria-describedby={description}
      {...otherProps}
    >
      <legend className={clsx(styles.legend, hideLegend && styles.visuallyHidden)}>
        {themeVars.provide(legend)}
      </legend>
      {helperText ? <span id={`${id}-helper`} className={styles.helper}>{helperText}</span> : null}
      {error ? <span id={`${id}-error`} className={styles.error}>{error}</span> : null}
      {disabled ? (
        <Provider
          values={[
            [ButtonContext, DISABLED],
            [CheckboxFieldContext, DISABLED],
            [CheckboxGroupContext, DISABLED],
            [ComboBoxContext, DISABLED],
            [RadioGroupContext, DISABLED],
            [SelectContext, DISABLED],
            [SwitchFieldContext, DISABLED],
            [TextFieldContext, DISABLED],
          ]}
        >
          {fields}
        </Provider>
      ) : fields}
    </fieldset>
  );
}
