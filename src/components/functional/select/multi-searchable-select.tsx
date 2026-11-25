"use client";

import { clsx } from "clsx";
import React from "react";
import { Button, ComboBox, Label, Popover, Text, useFilter } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import { ChevronDownIcon } from "../../functional-primitive/icon/icon";
import { Tag, TagGroup } from "../tag/tag";
import { SearchInput } from "./searchable-select";
import { SelectOptions } from "./select-options";
import styles from "./searchable-select.module.css";

import type { SelectOption } from "./select";
import { Motion } from "../../animation/motion/motion";

// MultiSelect's implementation. select.tsx exports MultiSelect and these props.

export interface MultiSelectProps<T extends string = string>
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange" | "value" | "defaultValue" | "multiple"> {
  /** Label rendered above the input and associated with it. */
  label?: string;
  /** Options to choose from. */
  options: SelectOption<T>[];
  /** Controlled values, in the order they were chosen. */
  value?: readonly T[];
  /** Uncontrolled initial values. */
  defaultValue?: readonly T[];
  /** Change handler: receives every chosen value, in the order they were chosen. */
  onChange?: (value: T[]) => void;
  /** Notified as people type. Pair with `filter={false}` to search on a server. */
  onSearchChange?: (text: string) => void;
  /** Filter `options` by what has been typed. Defaults to `true`. */
  filter?: boolean;
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

/**
 * Chooses several options from a long list, built on React Aria's ComboBox
 * in its multiple selection mode: typing filters the list, Enter or a click
 * adds the highlighted option and clears the text for the next search, and
 * choosing a chosen option again removes it. The chosen options show as
 * removable tags under the input. Backspace in the empty input removes the
 * last one. `name` submits each chosen value.
 */
export function MultiSearchableSelect<T extends string = string>({
  label,
  options,
  value,
  defaultValue,
  onChange,
  onSearchChange,
  filter = true,
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
}: MultiSelectProps<T>) {
  const message = error ?? helperText;
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const portalVars = useThemeCssVars({ portal: true });
  const { contains } = useFilter({ sensitivity: "base" });
  const [uncontrolled, setUncontrolled] = React.useState<readonly T[]>(defaultValue ?? []);
  const selected = value ?? uncontrolled;
  const [text, setText] = React.useState("");
  // The labels of chosen options, kept when a server search replaces `options`.
  const [known, setKnown] = React.useState<Record<string, string>>({});
  const labelOf = (key: T) => options.find((option) => option.value === key)?.label ?? known[key] ?? key;

  const matches = React.useCallback(
    (optionText: string, query: string) =>
      !filter ||
      options.some(
        (option) =>
          option.label === optionText &&
          (contains(option.label, query) || (option.description ? contains(option.description, query) : false)),
      ),
    [options, filter, contains],
  );

  const search = (next: string) => {
    setText(next);
    onSearchChange?.(next);
  };

  const commit = (next: readonly T[]) => {
    const labels: Record<string, string> = {};
    for (const key of next) labels[key] = labelOf(key);
    setKnown(labels);
    setUncontrolled(next);
    onChange?.([...next]);
  };

  const chosenLabel = label ? `${label}: chosen` : "Chosen";

  return (
    <div className={clsx(styles.root, !fullWidth && styles.fit, className)} style={{ ...themeVars.style, ...style }}>
      <ComboBox
        className={styles.root}
        id={id}
        selectionMode="multiple"
        value={selected}
        onChange={(keys) => {
          // Copy whatever iterable React Aria hands over into an array.
          commit(Array.from(keys as Iterable<T>));
          if (text) search("");
        }}
        inputValue={text}
        onInputChange={search}
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
                if (event.key === "Backspace" && text === "" && selected.length > 0 && !readOnly && !disabled) {
                  event.preventDefault();
                  commit(selected.slice(0, -1));
                }
                // Enter chooses; it never submits the form from here.
                if (event.key === "Enter") event.preventDefault();
                inputProps.onKeyDown?.(event);
              }}
            />
          </Motion.Feedback>
          <span className={styles.actions}>
            <Button className={styles.action}>
              <ChevronDownIcon size="control" />
            </Button>
          </span>
        </div>
        {message ? (
          <Text slot={error ? "errorMessage" : "description"} className={styles.message}>
            {message}
          </Text>
        ) : null}
        <Motion.Pop>
          <Popover className={styles.content} style={portalVars.style} placement="bottom start" offset={4} maxHeight={320}>
            {portalVars.provide(<SelectOptions options={options} styles={styles} emptyText={emptyText} />)}
          </Popover>
        </Motion.Pop>
      </ComboBox>
      {selected.length > 0 ? (
        <TagGroup aria-label={chosenLabel}>
          {selected.map((key) => (
            <Tag
              key={key}
              id={key}
              disabled={disabled || readOnly}
              onRemove={disabled || readOnly ? undefined : () => commit(selected.filter((item) => item !== key))}
              removeLabel={`Remove ${labelOf(key)}`}
            >
              {labelOf(key)}
            </Tag>
          ))}
        </TagGroup>
      ) : null}
    </div>
  );
}
