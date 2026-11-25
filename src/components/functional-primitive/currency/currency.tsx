"use client";

import { clsx } from "clsx";
import React from "react";
import { useLocale } from "react-aria-components";
import { useThemeCssVars } from "../../../theme/use-theme-css-vars";
import type { TextTone } from "../text/text";
import {
  currencyFractionDigits,
  DEFAULT_CURRENCY,
  formatCurrency,
  isCurrencyAmount,
  isNegativeAmount,
  majorUnits,
  roundCurrency,
  toDecimalString,
  type CurrencyAmount,
  type CurrencyDisplay,
  type CurrencySignDisplay,
} from "./currency-format";
import styles from "./currency.module.css";

export {
  currencyFractionDigits,
  DEFAULT_CURRENCY,
  formatCurrency,
  formatCurrencyToParts,
  fromMinorUnits,
  roundCurrency,
  toDecimalString,
  toMinorUnits,
  type CurrencyAmount,
  type CurrencyDisplay,
  type CurrencyFormatOptions,
  type CurrencySignDisplay,
} from "./currency-format";

export interface CurrencyProps extends Omit<React.ComponentPropsWithRef<"data">, "children" | "value"> {
  /**
   * The amount, in major units (dollars) unless `minorUnits` is set. A
   * number, a bigint, or a plain decimal string such as `"1234.50"`, which
   * formats exactly. `null`, `undefined` and `NaN` show `fallback`.
   */
  value: CurrencyAmount | null | undefined;
  /** ISO 4217 code, such as `"NZD"`, `"GBP"` or `"JPY"`. Defaults to `"NZD"`. */
  currency?: string;
  /** BCP 47 locale, such as `"en-NZ"`. Defaults to React Aria's locale (`I18nProvider`, else the browser's). */
  locale?: string;
  /**
   * How the currency is named. `"symbol"` (default) is relative to the
   * locale, so NZD shows as `$` in en-NZ and `NZ$` in en-US; `"narrowSymbol"`
   * is always the bare `$`; `"code"` shows `NZD`; `"name"` spells it out.
   */
  currencyDisplay?: CurrencyDisplay;
  /** When to show the sign. `"always"` or `"exceptZero"` suit changes, such as `+$20.00`. Defaults to `"auto"`. */
  signDisplay?: CurrencySignDisplay;
  /** Show negatives in brackets, as statements and ledgers do: `($5.00)`. Screen readers still hear a minus. */
  accounting?: boolean;
  /** Abbreviate large amounts (`$1.2M`) for dashboards. Screen readers hear the full amount. */
  compact?: boolean;
  /** Decimal places, overriding the currency's own (2 for NZD, 0 for JPY, 3 for KWD). Use `0` for whole dollars. */
  fractionDigits?: number;
  /**
   * The value is an integer count of minor units (cents for NZD, yen for
   * JPY, fils for KWD), as money is best stored. `1999` shows `$19.99`.
   */
  minorUnits?: boolean;
  /** Colour of the amount, from `Text`'s tones. Defaults to the surrounding text colour. */
  tone?: TextTone;
  /** Colour of a negative amount, overriding `tone`, such as `"error"` for amounts owed. */
  negativeTone?: TextTone;
  /** What to show when `value` is not an amount. Defaults to an em dash. */
  fallback?: React.ReactNode;
}

/**
 * An amount of money, formatted for its currency and locale with the
 * currency's own decimal places, as a `<data>` element whose `value` is the
 * plain decimal (`"1234.50"`). Inline: it takes the surrounding font size
 * and weight, and tabular figures so amounts in a column line up.
 */
export function Currency({
  value,
  currency = DEFAULT_CURRENCY,
  locale,
  currencyDisplay,
  signDisplay,
  accounting,
  compact,
  fractionDigits,
  minorUnits,
  tone,
  negativeTone,
  fallback = "—",
  className,
  style,
  ref,
  ...dataProps
}: CurrencyProps) {
  const themeVars = useThemeCssVars();
  const { locale: contextLocale } = useLocale();
  const resolvedLocale = locale ?? contextLocale;
  const classes = clsx(styles.root, className);
  const styled = { ...themeVars.style, ...style };

  if (!isCurrencyAmount(value)) {
    return (
      <span {...dataProps} className={classes} style={styled} data-tone={tone} data-empty="">
        {fallback}
      </span>
    );
  }

  const digits = fractionDigits ?? currencyFractionDigits(currency);
  // Work in exact major units: minor units become a decimal string, and a
  // number is rounded first so -0.001 is $0.00, not a negative zero.
  const raw = majorUnits(value, { currency, minorUnits });
  const major = typeof raw === "number" ? roundCurrency(raw, digits) : raw;
  const options = { currency, locale: resolvedLocale, currencyDisplay, signDisplay, accounting, compact, fractionDigits };
  const negative = isNegativeAmount(major);
  const text = formatCurrency(major, options);
  // Brackets and abbreviations read badly aloud ("left paren", "M"), so a
  // screen reader gets the full signed amount instead.
  const spoken = (accounting && negative) || compact ? formatCurrency(major, { ...options, accounting: false, compact: false }) : undefined;
  const decimal = typeof major === "number" ? toDecimalString(major, digits) : String(major);

  return (
    <data
      className={classes}
      style={styled}
      value={decimal}
      data-tone={(negative && negativeTone) || tone}
      data-negative={negative || undefined}
      {...dataProps}
      ref={ref}
    >
      {spoken ? (
        <>
          <span aria-hidden="true">{text}</span>
          <span className={styles.visuallyHidden}>{spoken}</span>
        </>
      ) : (
        text
      )}
    </data>
  );
}
