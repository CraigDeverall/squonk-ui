"use client";

import { clsx } from "clsx";
import React from "react";
import { Group, I18nProvider, Input, Label, NumberField, Text, useLocale } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import {
  currencyFormatOptions,
  currencyFractionDigits,
  DEFAULT_CURRENCY,
  parseCurrencyInput,
  roundCurrency,
  toDecimalString,
  type CurrencyDisplay,
} from "../../functional-primitive/currency/currency-format";
import { usePresentation } from "../../style/presentation/presentation";
import styles from "./currency-field.module.css";
import { Motion } from "../../animation/motion/motion";

export interface CurrencyFieldProps {
  /** Label rendered above the input, associated with it. */
  label?: string;
  /** Helper text below the input. Replaced by `error` text when an error is set. */
  helperText?: string;
  /** Error message. When set, the field takes the error styling and `aria-invalid`. */
  error?: string;
  /** ISO 4217 code, such as `"NZD"`, `"GBP"` or `"JPY"`. Sets the symbol and the decimal places. Defaults to `"NZD"`. */
  currency?: string;
  /** BCP 47 locale for symbols, separators and grouping, such as `"en-NZ"`. Defaults to React Aria's locale (`I18nProvider`, else the browser's). */
  locale?: string;
  /**
   * The amount in major units (dollars, not cents), or `null` when the
   * field is empty. Makes the field controlled. `NaN` is read as empty.
   */
  value?: number | null;
  /** The starting amount when uncontrolled, or `null` for empty. */
  defaultValue?: number | null;
  /**
   * Called when the amount is committed: on blur, Enter, paste or an
   * arrow-key step, not on every keystroke. Receives the amount rounded to
   * the currency's decimal places, or `null` when the field is emptied.
   */
  onChange?: (value: number | null) => void;
  /** Called when the input loses focus, after the amount is committed. */
  onBlur?: (event: React.FocusEvent<Element>) => void;
  /** Called when the input gains focus. */
  onFocus?: (event: React.FocusEvent<Element>) => void;
  /** Smallest amount allowed; lower amounts are raised to it on commit. Defaults to `0` unless `allowNegative` is set. */
  minValue?: number;
  /** Largest amount allowed; higher amounts are lowered to it on commit. */
  maxValue?: number;
  /** Allow amounts below zero, such as an adjustment or a credit. Defaults to `false`, which also floors `minValue` at `0`. */
  allowNegative?: boolean;
  /**
   * The arrow-key step in major units. Defaults to `1` for arrows without
   * snapping typed amounts. When set, typed amounts also snap to it on
   * commit, so `step={0.05}` rounds to the nearest five cents.
   */
  step?: number;
  /**
   * How the currency is named in the input. `"symbol"` (default) is relative
   * to the locale: NZD is `$` in en-NZ and `NZ$` elsewhere, USD is `US$` in
   * en-NZ. `"code"` shows `NZD 12.50`.
   */
  currencyDisplay?: CurrencyDisplay;
  /** Decimal places, overriding the currency's own (2 for NZD, 0 for JPY, 3 for KWD). `0` asks for whole dollars. */
  fractionDigits?: number;
  /**
   * Show the ISO code (`NZD`) after the amount. Use it when people work in
   * more than one currency that shares a symbol in their locale, or when
   * the locale isn't known. Ignored when `currencyDisplay` already shows a
   * code or name.
   */
  showCurrencyCode?: boolean;
  /** Placeholder shown while empty. A label is still required. */
  placeholder?: string;
  /** Mark the field required: `aria-required` and the native `required` attribute. */
  required?: boolean;
  /** Disable the field. A disabled field isn't submitted. */
  disabled?: boolean;
  /** Show the amount without allowing changes. */
  readOnly?: boolean;
  /** Submit the amount with a form under this name, as a plain decimal with the currency's places (`"1234.50"`), or `""` when empty. */
  name?: string;
  /** The id of the `<form>` to submit with, when the field is outside it. */
  form?: string;
  /** The input's id. */
  id?: string;
  /** Focus the input on mount. */
  autoFocus?: boolean;
  /** Stretch to the parent's width. Defaults to `true`. */
  fullWidth?: boolean;
  /** Extra class on the field's wrapper. */
  className?: string;
  /** Inline styles on the field's wrapper. */
  style?: React.CSSProperties;
  /** Accessible name when there's no visible `label`. */
  "aria-label"?: string;
  /** Ids of elements that name the field. */
  "aria-labelledby"?: string;
  /** Ids of elements that describe the field, read after `helperText` or `error`. */
  "aria-describedby"?: string;
  /** Key handler on the input. */
  onKeyDown?: (event: React.KeyboardEvent) => void;
  /** Ref to the visible input. */
  ref?: React.Ref<HTMLInputElement>;
}

const empty = (value: number | null | undefined) => value === null || value === undefined || Number.isNaN(value);

/**
 * A money input on React Aria's NumberField. It formats and parses with
 * `Intl.NumberFormat`, so symbols, separators and the currency's decimal
 * places follow the currency and the locale; the amount is rounded to those
 * places when committed. Paste accepts amounts with symbols, codes and
 * grouping (`NZ$1,234.56`). Wheel scrolling never changes the amount.
 */
export function CurrencyField({
  label,
  helperText,
  error,
  currency = DEFAULT_CURRENCY,
  locale,
  value,
  defaultValue = null,
  onChange,
  onBlur,
  onFocus,
  minValue,
  maxValue,
  allowNegative = false,
  step,
  currencyDisplay = "symbol",
  fractionDigits,
  showCurrencyCode = false,
  placeholder,
  required,
  disabled,
  readOnly,
  name,
  form,
  id,
  autoFocus,
  fullWidth = true,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  onKeyDown,
  ref,
}: CurrencyFieldProps) {
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const { locale: contextLocale } = useLocale();
  const resolvedLocale = locale ?? contextLocale;
  const digits = fractionDigits ?? currencyFractionDigits(currency);
  const formatOptions = React.useMemo(
    () => currencyFormatOptions({ currency, currencyDisplay, fractionDigits: digits }),
    [currency, currencyDisplay, digits]
  );
  const min = allowNegative ? minValue : Math.max(minValue ?? 0, 0);
  const codeId = React.useId();
  const showCode = showCurrencyCode && (currencyDisplay === "symbol" || currencyDisplay === "narrowSymbol");
  const message = error || helperText;

  const [uncontrolled, setUncontrolled] = React.useState<number | null>(empty(defaultValue) ? null : defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (empty(value) ? null : value) : uncontrolled;

  const commit = (next: number | null) => {
    if (!controlled) setUncontrolled(next);
    if (!Object.is(next, current)) onChange?.(next);
  };

  // React Aria takes a paste only when it replaces the whole input and is
  // in the locale's own format, so "NZ$1,234.56" or "1,234.56" into a
  // de-DE field would be dropped. Read it ourselves first.
  const onPasteCapture = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const input = event.target;
    if (disabled || readOnly || !(input instanceof HTMLInputElement)) return;
    const replacesAll = input.value === "" || (input.selectionStart === 0 && input.selectionEnd === input.value.length);
    if (!replacesAll) return;
    const pasted = parseCurrencyInput(event.clipboardData.getData("text/plain"), resolvedLocale);
    if (Number.isNaN(pasted)) return;
    event.preventDefault();
    event.stopPropagation();
    const clamped = Math.min(Math.max(roundCurrency(pasted, digits), min ?? -Infinity), maxValue ?? Infinity);
    commit(roundCurrency(clamped, digits));
  };

  const field = (
    <NumberField
      className={clsx(styles.root, !fullWidth && styles.fit, className)}
      style={{ ...themeVars.style, ...style }}
      id={id}
      formatOptions={formatOptions}
      value={current ?? NaN}
      onChange={(next) => commit(Number.isNaN(next) ? null : roundCurrency(next, digits))}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      minValue={min}
      maxValue={maxValue}
      step={step}
      isWheelDisabled
      isInvalid={Boolean(error)}
      isRequired={required}
      isDisabled={disabled}
      isReadOnly={readOnly}
      autoFocus={autoFocus}
      validationBehavior="aria"
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={clsx(showCode && codeId, describedBy) || undefined}
    >
      {label ? <Label className={styles.label}>{label}</Label> : null}
      <Motion.Feedback field>
        <Group className={styles.group} data-register={register} onPasteCapture={onPasteCapture}>
          <Input ref={ref} className={styles.input} placeholder={placeholder} required={required} />
          {showCode ? (
            <span id={codeId} className={styles.code} aria-hidden="true">
              {currency.toUpperCase()}
            </span>
          ) : null}
        </Group>
      </Motion.Feedback>
      {name ? (
        <input type="hidden" name={name} form={form} disabled={disabled} value={current === null ? "" : toDecimalString(current, digits)} />
      ) : null}
      {message ? (
        <Text
          slot={error ? "errorMessage" : "description"}
          className={styles.message}
          aria-live={error ? "polite" : undefined}
        >
          {message}
        </Text>
      ) : null}
    </NumberField>
  );

  // NumberField reads its locale from context, so a `locale` prop provides one.
  return locale ? <I18nProvider locale={locale}>{field}</I18nProvider> : field;
}
