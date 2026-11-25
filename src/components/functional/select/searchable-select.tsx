"use client";

import { clsx } from "clsx";
import React from "react";
import {
  Button,
  ButtonContext,
  ComboBox,
  ComboBoxStateContext,
  Input,
  Label,
  Popover,
  Text,
  useFilter,
} from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import { ChevronDownIcon, CloseIcon } from "../../functional-primitive/icon/icon";
import { SelectOptions } from "./select-options";
import styles from "./searchable-select.module.css";

import type { SelectOption } from "./select";
import { Motion } from "../../animation/motion/motion";

// Internal: Select's `searchable` mode. Select owns the public props.

export interface SearchableSelectProps<T extends string = string>
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange" | "value" | "defaultValue"> {
  /** Label rendered above the input and associated with it. */
  label?: string;
  /** Options to choose from. */
  options: SelectOption<T>[];
  /** Controlled value. Pass `""` to mean "no selection". */
  value?: T | "";
  /** Uncontrolled initial value. */
  defaultValue?: T | "";
  /** Change handler — receives the picked value (or `""` when cleared). */
  onChange?: (value: T | "") => void;
  /** Notified as people type. Pair with `filter={false}` to search on a server. */
  onSearchChange?: (text: string) => void;
  /** Filter `options` by what has been typed. Defaults to `true`. */
  filter?: boolean;
  /** Show a clear button once something is chosen. Defaults to `false`. */
  clearable?: boolean;
  /** Shown in the list when nothing matches. Defaults to `"No matches"`. */
  emptyText?: string;
  /** Helper text below the input. Replaced by `error` when set. */
  helperText?: string;
  /** Error message. When set, the input takes error styling and `aria-invalid`. */
  error?: string;
  /** Stretch to the parent's width. Defaults to `true`. */
  fullWidth?: boolean;
  /** The text input. */
  ref?: React.Ref<HTMLInputElement>;
}

/** Clears the choice; hidden while nothing is chosen. */
function ClearButton() {
  const state = React.useContext(ComboBoxStateContext);
  if (state?.selectedKey == null) return null;
  return (
    // Out of the ComboBox's ButtonContext, which belongs to the list button.
    <ButtonContext.Provider value={null}>
      <Button className={styles.action} aria-label="Clear" onPress={() => state.setValue(null)}>
        <CloseIcon />
      </Button>
    </ButtonContext.Provider>
  );
}

/**
 * The input. A click opens the full list, as on a list Select, and typing
 * highlights the first match so Enter chooses it. MultiSelect shares it.
 */
export function SearchInput(props: React.ComponentProps<typeof Input>) {
  const state = React.useContext(ComboBoxStateContext);
  // Set by typing; consumed once the filtered list is open.
  const typed = React.useRef(false);
  const latest = React.useRef(state);
  React.useLayoutEffect(() => { latest.current = state; });
  React.useEffect(() => {
    if (!state?.isOpen || !typed.current) return;
    typed.current = false;
    // A frame later: the ComboBox clears the highlight after each change,
    // and its effects run after this one.
    requestAnimationFrame(() => {
      const current = latest.current;
      if (!current?.isOpen) return;
      const { collection, selectionManager } = current;
      let key = collection.getFirstKey();
      while (key != null && (collection.getItem(key)?.type !== "item" || selectionManager.isDisabled(key))) key = collection.getKeyAfter(key);
      if (key != null) selectionManager.setFocusedKey(key);
    });
  });
  return (
    <Input
      {...props}
      onChange={(event) => {
        typed.current = event.target.value !== "";
        props.onChange?.(event);
      }}
      onClick={() => { if (!state?.isOpen) state?.open(null, "manual"); }}
    />
  );
}

/**
 * A text input that suggests options as people type, built on React Aria's
 * ComboBox (the WAI-ARIA combobox pattern with a listbox popup): typing
 * filters the list by label and description, arrow keys move through it,
 * Enter chooses, Escape closes and restores the chosen text. `name` submits
 * the chosen value, not the typed text.
 */
export function SearchableSelect<T extends string = string>({
  label,
  options,
  value,
  defaultValue,
  onChange,
  onSearchChange,
  filter = true,
  clearable = false,
  emptyText = "No matches",
  helperText,
  error,
  fullWidth = true,
  disabled,
  required,
  readOnly,
  name,
  form,
  id,
  ref,
  placeholder,
  className,
  style,
  "aria-describedby": describedBy,
  "aria-labelledby": labelledBy,
  "aria-label": ariaLabel,
  ...inputProps
}: SearchableSelectProps<T>) {
  const message = error ?? helperText;
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const portalVars = useThemeCssVars({ portal: true });
  const { contains } = useFilter({ sensitivity: "base" });
  const [uncontrolled, setUncontrolled] = React.useState<T | "">(defaultValue ?? "");
  const selected = value === undefined ? uncontrolled : value;
  const toKey = (v: T | "" | undefined) => (v === undefined ? undefined : v === "" ? null : v);

  // React Aria filters on each option's text (its label); match the
  // description as well. It shows every option when the list is opened
  // rather than typed into.
  const matches = React.useCallback(
    (text: string, query: string) =>
      !filter ||
      options.some((option) => option.label === text && (contains(option.label, query) || (option.description ? contains(option.description, query) : false))),
    [options, filter, contains]
  );
  // The input shows the chosen option's label.
  const selectedLabel = options.find((option) => option.value === selected)?.label ?? "";

  return (
    <ComboBox
      className={clsx(styles.root, !fullWidth && styles.fit, className)}
      style={{ ...themeVars.style, ...style }}
      id={id}
      value={toKey(value)}
      defaultValue={toKey(defaultValue)}
      onChange={(key) => {
        const next = (key ?? "") as T | "";
        setUncontrolled(next);
        onChange?.(next);
      }}
      onInputChange={onSearchChange}
      defaultFilter={matches}
      allowsEmptyCollection
      isDisabled={disabled}
      isRequired={required}
      isReadOnly={readOnly}
      isInvalid={Boolean(error)}
      validationBehavior="aria"
      name={name}
      form={form}
      formValue="key"
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {label ? <Label className={styles.label}>{label}</Label> : null}
      <div className={styles.control}>
        <Motion.Feedback field>
          <SearchInput
            ref={ref}
            className={styles.input}
            data-register={register}
            placeholder={placeholder}
            {...inputProps}
            onKeyDown={(event) => {
              // Enter in a form submits it, unless the text is a chosen option
              // and the list is closed. Runs after React Aria has handled the
              // key, so a highlighted option is still chosen.
              const input = event.currentTarget;
              if (event.key === "Enter" && (input.getAttribute("aria-expanded") === "true" || input.value !== selectedLabel)) {
                event.preventDefault();
              }
              inputProps.onKeyDown?.(event);
            }}
          />
        </Motion.Feedback>
        <span className={styles.actions}>
          {clearable ? <ClearButton /> : null}
          <Button className={styles.action}>
            <ChevronDownIcon size="control" />
          </Button>
        </span>
      </div>
      {message ? (
        <Text slot={error ? "errorMessage" : "description"} className={styles.message}>{message}</Text>
      ) : null}
      <Motion.Pop>
        <Popover className={styles.content} style={portalVars.style} placement="bottom start" offset={4} maxHeight={320}>
          {portalVars.provide(<SelectOptions options={options} styles={styles} emptyText={emptyText} />)}
        </Popover>
      </Motion.Pop>
    </ComboBox>
  );
}
