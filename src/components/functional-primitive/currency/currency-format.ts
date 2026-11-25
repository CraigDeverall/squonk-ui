// Money formatting shared by Currency (display) and CurrencyField (input),
// so the two always agree. Everything rounds through Intl.NumberFormat,
// which rounds the shortest decimal form of a number (1.005 → 1.01), the
// same way React Aria's NumberField rounds when it commits.

/** The currency used when none is given: New Zealand dollars. */
export const DEFAULT_CURRENCY = "NZD";

/**
 * How the currency is named: `"symbol"` (`$`, `US$`, `€`; the symbol is
 * relative to the locale, so NZD is `$` in en-NZ and `NZ$` in en-US),
 * `"narrowSymbol"` (always the bare `$`), `"code"` (`NZD`) or `"name"`
 * (`New Zealand dollars`).
 */
export type CurrencyDisplay = "symbol" | "narrowSymbol" | "code" | "name";

/** When to show the sign, as `Intl.NumberFormat`'s `signDisplay`. */
export type CurrencySignDisplay = "auto" | "always" | "exceptZero" | "negative" | "never";

/** An amount of money as given to `formatCurrency`: a number, a bigint or a plain decimal string such as `"1234.50"`. */
export type CurrencyAmount = number | bigint | string;

export interface CurrencyFormatOptions {
  /** ISO 4217 code, such as `"NZD"`, `"GBP"` or `"JPY"`. Defaults to `"NZD"`. */
  currency?: string;
  /** BCP 47 locale, such as `"en-NZ"`. Defaults to the runtime's locale. */
  locale?: string;
  /** How the currency is named. Defaults to `"symbol"`. */
  currencyDisplay?: CurrencyDisplay;
  /** Decimal places, overriding the currency's own (2 for NZD, 0 for JPY, 3 for KWD). */
  fractionDigits?: number;
  /** When to show the sign. Defaults to `"auto"` (negatives only). */
  signDisplay?: CurrencySignDisplay;
  /** Show negatives in brackets, as accounts do: `($5.00)`. */
  accounting?: boolean;
  /** Abbreviate large amounts: `$1.2M`. Rounds to about two significant digits unless `fractionDigits` is set. */
  compact?: boolean;
  /** Treat the value as an integer count of minor units (cents for NZD, yen for JPY, fils for KWD). */
  minorUnits?: boolean;
}

const cache = new Map<string, Intl.NumberFormat>();

function formatter(locale: string | undefined, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`;
  let cached = cache.get(key);
  if (!cached) {
    cached = new Intl.NumberFormat(locale, options);
    cache.set(key, cached);
  }
  return cached;
}

/** The number of decimal places a currency uses: 2 for NZD, GBP and USD, 0 for JPY, 3 for KWD and BHD. */
export function currencyFractionDigits(currency: string = DEFAULT_CURRENCY): number {
  return formatter("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

/**
 * The `Intl.NumberFormat` options for an amount, as both components use
 * them. `minorUnits` and `locale` are not Intl options and are left out.
 */
export function currencyFormatOptions({
  currency = DEFAULT_CURRENCY,
  currencyDisplay = "symbol",
  fractionDigits,
  signDisplay,
  accounting,
  compact,
}: CurrencyFormatOptions = {}): Intl.NumberFormatOptions {
  const options: Intl.NumberFormatOptions = { style: "currency", currency, currencyDisplay };
  if (fractionDigits !== undefined) {
    options.minimumFractionDigits = fractionDigits;
    options.maximumFractionDigits = fractionDigits;
  }
  if (signDisplay) options.signDisplay = signDisplay;
  if (accounting) options.currencySign = "accounting";
  if (compact) options.notation = "compact";
  return options;
}

const plain = (digits: number) =>
  formatter("en-US", { useGrouping: false, minimumFractionDigits: digits, maximumFractionDigits: digits });

/**
 * Round to a number of decimal places, half away from zero, on the decimal
 * value people see: `roundCurrency(1.005, 2)` is `1.01` and
 * `roundCurrency(0.1 + 0.2, 2)` is `0.3`. Non-finite numbers pass through.
 */
export function roundCurrency(value: number, fractionDigits: number): number {
  if (!Number.isFinite(value)) return value;
  const rounded = Number(plain(fractionDigits).format(value));
  return rounded === 0 ? 0 : rounded;
}

/**
 * A plain decimal string with exactly `fractionDigits` places and no
 * grouping or symbol, such as `"1234.50"` or `"-0.30"`: what a form submits.
 */
export function toDecimalString(value: number, fractionDigits: number): string {
  const text = plain(fractionDigits).format(roundCurrency(value, fractionDigits));
  return text.startsWith("-") && Number(text) === 0 ? text.slice(1) : text;
}

/**
 * An amount in major units as an integer count of minor units:
 * `toMinorUnits(12.5, 2)` is `1250`. Rounds first, so it never returns
 * `1249.9999999999998`. Send money to a server this way, or as a decimal string.
 */
export function toMinorUnits(value: number, fractionDigits: number): number {
  return Number(toDecimalString(value, fractionDigits).replace(".", ""));
}

/**
 * An integer count of minor units as an exact decimal string in major
 * units: `fromMinorUnits(123456, 2)` is `"1234.56"`. A non-integer number is
 * rounded to the nearest minor unit first.
 */
export function fromMinorUnits(minor: number | bigint, fractionDigits: number): string {
  const whole = typeof minor === "bigint" ? minor : BigInt(Math.round(minor));
  const negative = whole < BigInt(0);
  const digits = (negative ? -whole : whole).toString().padStart(fractionDigits + 1, "0");
  const integer = fractionDigits === 0 ? digits : digits.slice(0, -fractionDigits);
  const fraction = fractionDigits === 0 ? "" : `.${digits.slice(-fractionDigits)}`;
  return `${negative ? "-" : ""}${integer}${fraction}`;
}

const DECIMAL_STRING = /^\s*[-+]?(\d+\.?\d*|\.\d+)\s*$/;

/**
 * Whether an amount can be formatted: a finite number, a bigint, or a plain
 * decimal string. `null`, `undefined`, `NaN` and `""` are not amounts.
 */
export function isCurrencyAmount(value: unknown): value is CurrencyAmount {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "bigint") return true;
  return typeof value === "string" && DECIMAL_STRING.test(value);
}

/**
 * The amount in major units, as an exact value Intl can format: a decimal
 * string for `minorUnits`, otherwise the value itself.
 */
export function majorUnits(value: CurrencyAmount, { currency = DEFAULT_CURRENCY, minorUnits }: CurrencyFormatOptions = {}): number | bigint | string {
  if (!minorUnits) return typeof value === "string" ? value.trim() : value;
  const digits = currencyFractionDigits(currency);
  if (typeof value === "string") {
    const [integer] = value.trim().split(".");
    return fromMinorUnits(BigInt(integer), digits);
  }
  return fromMinorUnits(value, digits);
}

/**
 * Format an amount of money for a locale:
 * `formatCurrency(1234.5, { locale: "en-NZ" })` is `"$1,234.50"`. Uses the
 * currency's own decimal places unless `fractionDigits` is set, and rounds
 * half away from zero. Decimal strings and bigints format exactly, beyond
 * the precision of a number. Returns `""` for something that isn't an amount.
 */
export function formatCurrency(value: CurrencyAmount | null | undefined, options: CurrencyFormatOptions = {}): string {
  if (!isCurrencyAmount(value)) return "";
  // Intl formats decimal strings exactly (ES2023); the cast covers older lib typings.
  return formatter(options.locale, currencyFormatOptions(options)).format(majorUnits(value, options) as number);
}

/**
 * Format an amount into its parts, for callers that style the symbol or
 * fraction separately. Same rules as `formatCurrency`.
 */
export function formatCurrencyToParts(value: CurrencyAmount, options: CurrencyFormatOptions = {}): Intl.NumberFormatPart[] {
  if (!isCurrencyAmount(value)) return [];
  return formatter(options.locale, currencyFormatOptions(options)).formatToParts(majorUnits(value, options) as number);
}

/** Whether an amount is below zero, without converting it to a number. */
export function isNegativeAmount(value: CurrencyAmount): boolean {
  if (typeof value === "string") return /^\s*-/.test(value) && /[1-9]/.test(value);
  return typeof value === "bigint" ? value < BigInt(0) : value < 0;
}

function decimalSeparator(locale: string | undefined): string {
  const parts = formatter(locale, { minimumFractionDigits: 1 }).formatToParts(1.5);
  return parts.find((p) => p.type === "decimal")?.value ?? ".";
}

/**
 * Read an amount from text pasted or typed in any common shape: `"1,234.56"`,
 * `"$1,234.56"`, `"NZ$1,234.56"`, `"USD 1234.56"`, `"(12.00)"`, `"1.234,56 €"`.
 * Symbols, codes and spaces are ignored. When the text has both `.` and `,`,
 * the last one is the decimal point; with only one kind, the locale decides,
 * unless it can only be a group separator (`1,234,567`) or only a decimal
 * point (`12,5`). Returns `NaN` when there are no digits.
 */
export function parseCurrencyInput(text: string, locale?: string): number {
  const trimmed = text.trim();
  if (!/\d/.test(trimmed)) return NaN;
  const negative = /^\(.*\)$/.test(trimmed) || /^[^\d]*[-−‐]/.test(trimmed) || /\d[^\d]*[-−]\s*$/.test(trimmed);
  const localeDecimal = decimalSeparator(locale);
  // Keep digits and the two separators people type; everything else (symbols,
  // letters, spaces, apostrophes used as group separators) goes.
  const kept = trimmed.replace(/[^0-9.,]/g, "");
  const marks = [...kept].filter((c) => c === "." || c === ",");
  let decimalMark: string | undefined;
  if (marks.includes(".") && marks.includes(",")) {
    decimalMark = marks[marks.length - 1];
  } else if (marks.length > 0) {
    const mark = marks[0];
    const count = marks.length;
    const after = kept.slice(kept.lastIndexOf(mark) + 1);
    if (count > 1) decimalMark = undefined;
    else if (after.length !== 3) decimalMark = mark;
    else decimalMark = mark === localeDecimal ? mark : undefined;
  }
  const normalised = [...kept]
    .map((c, i) => (c === decimalMark && i === kept.lastIndexOf(c) ? "." : c === "." || c === "," ? "" : c))
    .join("");
  const value = Number(normalised);
  if (!Number.isFinite(value) || normalised === "" || normalised === ".") return NaN;
  return negative && value !== 0 ? -value : value;
}
