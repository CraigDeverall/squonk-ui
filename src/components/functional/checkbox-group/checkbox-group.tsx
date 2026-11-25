"use client";

import { clsx } from "clsx";
import React from "react";
import { CheckboxGroup as AriaCheckboxGroup, Label, Text } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { Checkbox } from "../checkbox/checkbox";
import fieldsetStyles from "../fieldset/fieldset.module.css";
import styles from "./checkbox-group.module.css";

export interface CheckboxGroupOption<T extends string = string> {
  /** Stable identity; what the selection holds and what the form submits. */
  value: T;
  /** Text shown next to the checkbox. */
  label: React.ReactNode;
  /** Guidance shown under this option's label. */
  helperText?: string;
  /** Make this option unavailable. */
  disabled?: boolean;
}

export interface CheckboxGroupProps<T extends string = string> {
  /** Names the group. */
  legend: React.ReactNode;
  /** Options to render. */
  options: CheckboxGroupOption<T>[];
  /** Controlled selection. */
  value?: T[];
  /** Uncontrolled initial selection. */
  defaultValue?: T[];
  /** Notified with the full selection after each change. */
  onChange?: (value: T[]) => void;
  /** Form field name shared by every checkbox; each checked one submits its value. */
  name?: string;
  /** Guidance for the whole group. */
  helperText?: React.ReactNode;
  /** An error about the group, such as "Choose at least one". */
  error?: React.ReactNode;
  /** Disable every option. */
  disabled?: boolean;
  /** Most options that can be chosen; the rest are disabled once reached. */
  max?: number;
  /** Layout direction. Defaults to `"column"`. */
  direction?: "column" | "row";
  /** Id of the group element. */
  id?: string;
  /** Extra class on the group element. */
  className?: string;
  /** Inline styles on the group element. */
  style?: React.CSSProperties;
  /** Ids of extra elements that describe the group, added to its own helper and error text. */
  "aria-describedby"?: string;
  /** Called when focus leaves the group. */
  onBlur?: (event: React.FocusEvent) => void;
}

/**
 * Several independent on/off choices under one legend: "Which accounts do you
 * want to set up?". React Aria's CheckboxGroup keeps the selection as an
 * array of values and names and describes the group; it is laid out like
 * `Fieldset` so every group in a form reads alike.
 */
export function CheckboxGroup<T extends string = string>({
  legend,
  options,
  value,
  defaultValue,
  onChange,
  name,
  helperText,
  error,
  disabled,
  max,
  direction = "column",
  className,
  style,
  ...otherProps
}: CheckboxGroupProps<T>) {
  const themeVars = useThemeCssVars();
  const [uncontrolled, setUncontrolled] = React.useState<string[]>(defaultValue ?? []);
  const selected = value ?? uncontrolled;
  const full = max !== undefined && selected.length >= max;

  return (
    <AriaCheckboxGroup
      {...otherProps}
      className={clsx(fieldsetStyles.root, styles.root, className)}
      style={{ "--fieldset-gap": "var(--squonk-roles-space-choice-list-gap)", ...themeVars.style, ...style } as React.CSSProperties}
      value={value}
      defaultValue={defaultValue}
      onChange={(next) => {
        setUncontrolled(next);
        onChange?.(next as T[]);
      }}
      name={name}
      isInvalid={error ? true : undefined}
      isDisabled={disabled}
      validationBehavior="aria"
    >
      <Label elementType="span" className={fieldsetStyles.legend}>{themeVars.provide(legend)}</Label>
      {helperText ? <Text slot="description" className={fieldsetStyles.helper}>{helperText}</Text> : null}
      {error ? <Text slot="errorMessage" className={fieldsetStyles.error}>{error}</Text> : null}
      <div className={clsx(fieldsetStyles.fields, styles.options)} data-direction={direction}>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            value={option.value}
            label={option.label}
            helperText={option.helperText}
            disabled={option.disabled || (full && !selected.includes(option.value)) || undefined}
          />
        ))}
      </div>
    </AriaCheckboxGroup>
  );
}
