"use client";

import { clsx } from "clsx";
import React from "react";
import {
  Select as AriaSelect,
  Button,
  ButtonContext,
  Label,
  Popover,
  SelectStateContext,
  SelectValue,
  Text,
} from "react-aria-components";
import type { ButtonProps } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import { ChevronDownIcon, CloseIcon } from "../../functional-primitive/icon/icon";
import { MultiSearchableSelect, type MultiSelectProps } from "./multi-searchable-select";
import { SearchableSelect } from "./searchable-select";
import { SelectOptions } from "./select-options";
import styles from "./select.module.css";
import { Motion } from "../../animation/motion/motion";

export interface SelectOption<T extends string = string> {
  /** The value passed to `onChange` and submitted with `name`. Must be unique
   *  within `options`. */
  value: T;
  /** Shown in the list and once chosen. In a searchable Select, what typing matches. */
  label: string;
  /** A second line in the list, such as a code or a region. Searchable
   *  Selects match it too. */
  description?: string;
  /** Shown but cannot be chosen. */
  disabled?: boolean;
}

interface SelectBaseProps<T extends string> {
  /** Label rendered above the control and associated with it. */
  label?: string;
  /** Options to choose from. */
  options: SelectOption<T>[];
  /** Controlled value. Pass `""` to mean "no selection". */
  value?: T | "";
  /** Uncontrolled initial value. */
  defaultValue?: T | "";
  /** Change handler — receives the picked value (or `""` when cleared). */
  onChange?: (value: T | "") => void;
  /** Placeholder shown while nothing is chosen. */
  placeholder?: string;
  /** Show a clear button once something is chosen. Defaults to `false`. */
  clearable?: boolean;
  /** Helper text below the control. Replaced by `error` when set. */
  helperText?: string;
  /** Error message. When set, the control takes error styling and `aria-invalid`. */
  error?: string;
  /** Stretch to the parent's width. Defaults to `true`. */
  fullWidth?: boolean;
}

/** A list of options to pick from: a button that opens a listbox. */
export interface ListSelectProps<T extends string = string>
  extends SelectBaseProps<T>,
    Omit<
      React.SelectHTMLAttributes<HTMLSelectElement>,
      "size" | "onChange" | "value" | "defaultValue" | "multiple" | "placeholder"
    > {
  /** Type to filter the options. Defaults to `false`. */
  searchable?: false;
  /** This control supports a single scalar value; use a native multi-select for arrays. */
  multiple?: false;
  /** Only on a searchable Select. */
  onSearchChange?: never;
  /** Only on a searchable Select. */
  filter?: never;
  /** Only on a searchable Select. */
  emptyText?: never;
  /** The visible trigger button. */
  ref?: React.Ref<HTMLButtonElement>;
}

/** A text input that filters the options as people type. */
export interface SearchableSelectPublicProps<T extends string = string>
  extends SelectBaseProps<T>,
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "size" | "onChange" | "value" | "defaultValue" | "placeholder"
    > {
  /** Type to filter the options. Use for long lists: countries, offices,
   *  account codes. */
  searchable: true;
  /** Notified as people type. Pair with `filter={false}` to search on a server. */
  onSearchChange?: (text: string) => void;
  /** Filter `options` by what has been typed (label and description,
   *  ignoring case and accents). Turn off when `options` already holds
   *  server results. Defaults to `true`. */
  filter?: boolean;
  /** Shown in the list when nothing matches. Defaults to `"No matches"`. */
  emptyText?: string;
  /** The text input. */
  ref?: React.Ref<HTMLInputElement>;
}

export type SelectProps<T extends string = string> = ListSelectProps<T> | SearchableSelectPublicProps<T>;

/**
 * Picks one option from a list. By default a button opens a listbox (React
 * Aria's Select). `searchable` turns it into a text input that filters the
 * options as people type (React Aria's ComboBox), for lists too long to scroll.
 * Both share labels, helper and error text, sizing and the `value`/`onChange`
 * contract, and `name` submits the chosen value in both.
 */
export function Select<T extends string = string>(props: SelectProps<T>) {
  const { searchable, ...rest } = props;
  return searchable ? (
    <SearchableSelect {...(rest as Omit<SearchableSelectPublicProps<T>, "searchable">)} />
  ) : (
    <ListSelect {...(rest as Omit<ListSelectProps<T>, "searchable">)} />
  );
}

export type { MultiSelectProps } from "./multi-searchable-select";

/**
 * Chooses several options from a long or server-searched list, such as
 * people to invite: a searchable Select whose `value` is an array. Each
 * choice shows as a removable tag under the input. It shares Select's
 * labels, helper and error text, sizing and option shape.
 */
export function MultiSelect<T extends string = string>(props: MultiSelectProps<T>) {
  return <MultiSearchableSelect {...props} />;
}

/** Clears a list Select; hidden while nothing is chosen. */
function ClearButton() {
  const state = React.useContext(SelectStateContext);
  if (state?.selectedKey == null) return null;
  return (
    // Out of the Select's ButtonContext, which belongs to the trigger.
    <ButtonContext.Provider value={null}>
      <Button className={styles.clear} aria-label="Clear" onPress={() => state.setValue(null)}>
        <CloseIcon />
      </Button>
    </ButtonContext.Provider>
  );
}

/**
 * A single-value select built on React Aria's Select: a button opening a
 * listbox with arrow-key, Home/End and typeahead navigation, collision-aware
 * positioning, and a hidden native `<select>` that submits `name`. `ref` and
 * other attributes and handlers go to the visible trigger.
 */
function ListSelect<T extends string = string>({
  label,
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  clearable = false,
  helperText,
  error,
  fullWidth = true,
  disabled,
  required,
  name,
  form,
  autoComplete,
  id,
  ref,
  "aria-describedby": describedBy,
  "aria-labelledby": labelledBy,
  "aria-label": ariaLabel,
  ...triggerProps
}: Omit<ListSelectProps<T>, "searchable">) {
  const message = error ?? helperText;
  const register = usePresentation();
  // Single selection only; never forward `multiple` to the trigger button.
  delete (triggerProps as { multiple?: unknown }).multiple;
  const themeVars = useThemeCssVars();
  const portalVars = useThemeCssVars({ portal: true });
  const toKey = (v: T | "" | undefined) => (v === undefined ? undefined : v === "" ? null : v);

  return (
    <AriaSelect
      className={clsx(styles.root, !fullWidth && styles.fit)}
      style={themeVars.style}
      id={id}
      value={toKey(value)}
      defaultValue={toKey(defaultValue)}
      onChange={(key) => onChange?.((key ?? "") as T | "")}
      // Blank rather than React Aria's "Select an item" when none is given.
      placeholder={placeholder ?? ""}
      isDisabled={disabled}
      isRequired={required}
      isInvalid={Boolean(error)}
      validationBehavior="aria"
      name={name}
      form={form}
      autoComplete={autoComplete}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {label ? <Label className={styles.label}>{label}</Label> : null}
      <div className={styles.control}>
        <Motion.Feedback>
          <Button
            ref={ref}
            className={styles.trigger}
            data-register={register}
            {...(triggerProps as ButtonProps)}
          >
            <SelectValue className={styles.valueText} />
          </Button>
        </Motion.Feedback>
        {clearable ? <ClearButton /> : null}
        <span className={styles.indicator} aria-hidden="true"><ChevronDownIcon size="control" /></span>
      </div>
      {message ? (
        <Text slot={error ? "errorMessage" : "description"} className={styles.message}>{message}</Text>
      ) : null}
      <Motion.Pop>
        <Popover className={styles.content} style={portalVars.style} placement="bottom start" offset={4} maxHeight={320}>
          {portalVars.provide(<SelectOptions options={options} styles={styles} />)}
        </Popover>
      </Motion.Pop>
    </AriaSelect>
  );
}
