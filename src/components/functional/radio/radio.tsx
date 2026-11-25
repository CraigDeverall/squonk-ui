"use client";

import React from "react";
import { Label, RadioButton, RadioField, RadioGroup as AriaRadioGroup, Text } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import styles from "./radio.module.css";
import { Motion } from "../../animation/motion/motion";

export interface RadioOption<T extends string = string> {
  /** The value passed to `onChange` when this option is chosen. */
  value: T;
  /** Text shown beside the radio. */
  label: React.ReactNode;
  /** A hint under the option's label; also describes the radio. */
  helperText?: string;
  /** Make this option unselectable. */
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string = string> {
  /** Id of an element that describes the group, in addition to `helperText`. */
  "aria-describedby"?: string;
  /** Id of an element that names the group. Use when there is no `legend`. */
  "aria-labelledby"?: string;
  /** Accessible name for the group when there is no visible `legend`. */
  "aria-label"?: string;
  /** Group name — used for the underlying `<input>` `name` attribute and a11y. */
  name: string;
  /** Visible legend describing the group. */
  legend?: string;
  /** Options to render. */
  options: RadioOption<T>[];
  /** Controlled value. */
  value?: T;
  /** Change handler. */
  onChange?: (value: T) => void;
  /** Helper text under the legend, above the options. Overridden by `error` when set. */
  helperText?: string;
  /** Error message. Switches the group to the error color. */
  error?: string;
  /** Layout direction. */
  direction?: "column" | "row";
  /** Notified when focus leaves the group. */
  onBlur?: (event: React.FocusEvent) => void;
}

/**
 * React Aria's RadioGroup supplies radiogroup semantics, arrow-key
 * selection, form reset and validation wiring; the native radios stay the
 * focus targets. Laid out like `Fieldset` so every group reads alike.
 */
export function RadioGroup<T extends string = string>({
  name,
  legend,
  options,
  value,
  onChange,
  helperText,
  error,
  direction = "column",
  ...otherProps
}: RadioGroupProps<T>) {
  const themeVars = useThemeCssVars();
  const message = error ?? helperText;

  return (
    <AriaRadioGroup
      {...otherProps}
      className={styles.root}
      style={themeVars.style}
      name={name}
      value={value ?? null}
      onChange={(next) => onChange?.(next as T)}
      isInvalid={error ? true : undefined}
      validationBehavior="aria"
      orientation={direction === "row" ? "horizontal" : "vertical"}
    >
      {legend ? <Label elementType="span" className={styles.legend}>{legend}</Label> : null}
      {/* Group help and errors sit under the legend, as in Fieldset. */}
      {message ? (
        <Text slot={error ? "errorMessage" : "description"} className={styles.groupMessage}>{message}</Text>
      ) : null}
      <div className={styles.options}>
        {options.map((opt) => (
          <RadioField key={opt.value} value={opt.value} isDisabled={opt.disabled} className={styles.item}>
            <RadioButton className={styles.button}>
              <Motion.Feedback>
                <span className={styles.control} aria-hidden="true" />
              </Motion.Feedback>
              <span className={styles.label}>{themeVars.provide(opt.label)}</span>
            </RadioButton>
            {opt.helperText ? <Text slot="description" className={styles.hint}>{opt.helperText}</Text> : null}
          </RadioField>
        ))}
      </div>
    </AriaRadioGroup>
  );
}
