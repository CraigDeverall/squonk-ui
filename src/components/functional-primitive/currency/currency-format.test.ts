import { describe, expect, it } from "vitest";
import {
  currencyFormatOptions,
  currencyFractionDigits,
  formatCurrency,
  fromMinorUnits,
  isCurrencyAmount,
  isNegativeAmount,
  parseCurrencyInput,
  roundCurrency,
  toDecimalString,
  toMinorUnits,
} from "./currency-format";

// Intl separates some parts with no-break spaces; compare with plain spaces.
const spaces = (text: string) => text.replace(/[\u00a0\u202f]/g, " ");

describe("currencyFractionDigits", () => {
  it("uses each currency's own decimal places", () => {
    expect(currencyFractionDigits("NZD")).toBe(2);
    expect(currencyFractionDigits("GBP")).toBe(2);
    expect(currencyFractionDigits("USD")).toBe(2);
    expect(currencyFractionDigits("JPY")).toBe(0);
    expect(currencyFractionDigits("KWD")).toBe(3);
    expect(currencyFractionDigits("BHD")).toBe(3);
  });

  it("defaults to NZD", () => {
    expect(currencyFractionDigits()).toBe(2);
  });
});

describe("roundCurrency", () => {
  it("rounds the decimal people see, not the binary float", () => {
    expect(roundCurrency(1.005, 2)).toBe(1.01);
    expect(roundCurrency(2.675, 2)).toBe(2.68);
    expect(roundCurrency(1.045, 2)).toBe(1.05);
    expect(roundCurrency(0.1 + 0.2, 2)).toBe(0.3);
  });

  it("rounds half away from zero", () => {
    expect(roundCurrency(-1.005, 2)).toBe(-1.01);
    expect(roundCurrency(12.5, 0)).toBe(13);
    expect(roundCurrency(-12.5, 0)).toBe(-13);
  });

  it("never returns negative zero", () => {
    expect(Object.is(roundCurrency(-0.001, 2), 0)).toBe(true);
  });

  it("passes non-finite numbers through", () => {
    expect(roundCurrency(NaN, 2)).toBeNaN();
    expect(roundCurrency(Infinity, 2)).toBe(Infinity);
  });
});

describe("toDecimalString and minor units", () => {
  it("submits a plain decimal with the currency's places", () => {
    expect(toDecimalString(1234.5, 2)).toBe("1234.50");
    expect(toDecimalString(0.1 + 0.2, 2)).toBe("0.30");
    expect(toDecimalString(1500, 0)).toBe("1500");
    expect(toDecimalString(-12.3456, 3)).toBe("-12.346");
    expect(toDecimalString(-0.001, 2)).toBe("0.00");
  });

  it("converts to integer minor units without float error", () => {
    expect(toMinorUnits(12.5, 2)).toBe(1250);
    expect(toMinorUnits(19.99, 2)).toBe(1999);
    expect(toMinorUnits(0.1 + 0.2, 2)).toBe(30);
    expect(toMinorUnits(1.005, 2)).toBe(101);
    expect(toMinorUnits(1500, 0)).toBe(1500);
  });

  it("converts minor units back to an exact decimal string", () => {
    expect(fromMinorUnits(123456, 2)).toBe("1234.56");
    expect(fromMinorUnits(5, 2)).toBe("0.05");
    expect(fromMinorUnits(-5, 2)).toBe("-0.05");
    expect(fromMinorUnits(1500, 0)).toBe("1500");
    expect(fromMinorUnits(1234567, 3)).toBe("1234.567");
    expect(fromMinorUnits(BigInt("900719925474099312"), 2)).toBe("9007199254740993.12");
  });
});

describe("formatCurrency", () => {
  it("formats for the locale and the currency", () => {
    expect(formatCurrency(1234.5, { locale: "en-NZ", currency: "NZD" })).toBe("$1,234.50");
    expect(formatCurrency(1234.5, { locale: "en-GB", currency: "GBP" })).toBe("£1,234.50");
    expect(spaces(formatCurrency(1234.5, { locale: "de-DE", currency: "EUR" }))).toBe("1.234,50 €");
    expect(formatCurrency(1234.5, { locale: "ja-JP", currency: "JPY" })).toMatch(/^[¥￥]1,235$/);
    expect(spaces(formatCurrency(1234.5, { locale: "en-NZ", currency: "KWD" }))).toBe("KWD 1,234.500");
  });

  it("disambiguates dollars relative to the locale", () => {
    expect(formatCurrency(5, { locale: "en-NZ", currency: "USD" })).toBe("US$5.00");
    expect(formatCurrency(5, { locale: "en-US", currency: "NZD" })).toBe("NZ$5.00");
    expect(formatCurrency(5, { locale: "en-US", currency: "NZD", currencyDisplay: "narrowSymbol" })).toBe("$5.00");
    expect(spaces(formatCurrency(5, { locale: "en-NZ", currency: "NZD", currencyDisplay: "code" }))).toBe("NZD 5.00");
    expect(formatCurrency(5, { locale: "en-NZ", currency: "NZD", currencyDisplay: "name" })).toBe("5.00 New Zealand dollars");
  });

  it("never shows float noise", () => {
    expect(formatCurrency(0.1 + 0.2, { locale: "en-NZ" })).toBe("$0.30");
    expect(formatCurrency(1.005, { locale: "en-NZ" })).toBe("$1.01");
  });

  it("supports accounting brackets, signs, compact notation and fraction overrides", () => {
    expect(formatCurrency(-5, { locale: "en-NZ", accounting: true })).toBe("($5.00)");
    expect(formatCurrency(5, { locale: "en-NZ", signDisplay: "always" })).toBe("+$5.00");
    expect(formatCurrency(1234567, { locale: "en-NZ", compact: true })).toBe("$1.2M");
    expect(formatCurrency(1234.5, { locale: "en-NZ", fractionDigits: 0 })).toBe("$1,235");
  });

  it("formats minor units, bigints and decimal strings exactly", () => {
    expect(formatCurrency(123456, { locale: "en-NZ", minorUnits: true })).toBe("$1,234.56");
    expect(formatCurrency(1500, { locale: "ja-JP", currency: "JPY", minorUnits: true })).toMatch(/^[¥￥]1,500$/);
    expect(formatCurrency(1234567, { locale: "en-NZ", currency: "KWD", minorUnits: true }).replace(/\s/g, " ")).toBe("KWD 1,234.567");
    expect(formatCurrency("9007199254740993.12", { locale: "en-NZ" })).toBe("$9,007,199,254,740,993.12");
    expect(formatCurrency(BigInt(5), { locale: "en-NZ" })).toBe("$5.00");
  });

  it("returns an empty string for something that isn't an amount", () => {
    expect(formatCurrency(null)).toBe("");
    expect(formatCurrency(undefined)).toBe("");
    expect(formatCurrency(NaN)).toBe("");
    expect(formatCurrency("12abc")).toBe("");
  });
});

describe("currencyFormatOptions", () => {
  it("defaults to NZD shown as a symbol", () => {
    expect(currencyFormatOptions()).toEqual({ style: "currency", currency: "NZD", currencyDisplay: "symbol" });
  });
});

describe("isCurrencyAmount and isNegativeAmount", () => {
  it("accepts finite numbers, bigints and decimal strings", () => {
    expect(isCurrencyAmount(0)).toBe(true);
    expect(isCurrencyAmount(BigInt(1))).toBe(true);
    expect(isCurrencyAmount("-12.50")).toBe(true);
    expect(isCurrencyAmount("")).toBe(false);
    expect(isCurrencyAmount(Infinity)).toBe(false);
    expect(isCurrencyAmount("1,234")).toBe(false);
  });

  it("knows a negative amount", () => {
    expect(isNegativeAmount(-1)).toBe(true);
    expect(isNegativeAmount("-0.01")).toBe(true);
    expect(isNegativeAmount("-0.00")).toBe(false);
    expect(isNegativeAmount(BigInt(-1))).toBe(true);
    expect(isNegativeAmount(0)).toBe(false);
  });
});

describe("parseCurrencyInput", () => {
  it("reads pasted amounts with symbols, codes and grouping", () => {
    expect(parseCurrencyInput("1,234.56", "en-NZ")).toBe(1234.56);
    expect(parseCurrencyInput("$1,234.56", "en-NZ")).toBe(1234.56);
    expect(parseCurrencyInput("NZ$1,234.56", "en-NZ")).toBe(1234.56);
    expect(parseCurrencyInput("USD 1234.56", "en-NZ")).toBe(1234.56);
    expect(parseCurrencyInput(" £12 ", "en-GB")).toBe(12);
  });

  it("reads negatives as a minus or accounting brackets", () => {
    expect(parseCurrencyInput("-$5.00", "en-NZ")).toBe(-5);
    expect(parseCurrencyInput("−5", "en-NZ")).toBe(-5);
    expect(parseCurrencyInput("($5.00)", "en-NZ")).toBe(-5);
    expect(parseCurrencyInput("5-", "en-NZ")).toBe(-5);
  });

  it("follows the locale's decimal separator", () => {
    expect(parseCurrencyInput("1.234,56 €", "de-DE")).toBe(1234.56);
    expect(parseCurrencyInput("1.234", "de-DE")).toBe(1234);
    expect(parseCurrencyInput("1.234", "en-NZ")).toBe(1.234);
    expect(parseCurrencyInput("12,5", "de-DE")).toBe(12.5);
  });

  it("works out the decimal point when the text says so", () => {
    expect(parseCurrencyInput("1,234.56", "de-DE")).toBe(1234.56);
    expect(parseCurrencyInput("1,234,567", "en-NZ")).toBe(1234567);
    expect(parseCurrencyInput("12,5", "en-NZ")).toBe(12.5);
    expect(parseCurrencyInput("1 234 567,89", "fr-FR")).toBe(1234567.89);
  });

  it("returns NaN without digits", () => {
    expect(parseCurrencyInput("", "en-NZ")).toBeNaN();
    expect(parseCurrencyInput("$", "en-NZ")).toBeNaN();
    expect(parseCurrencyInput("abc", "en-NZ")).toBeNaN();
  });
});
