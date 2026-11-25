import type { SquonkTheme } from "./theme-context";

export type ThemeOverride = {
  [K in keyof SquonkTheme]?: SquonkTheme[K] extends object
    ? DeepPartial<SquonkTheme[K]>
    : SquonkTheme[K];
};

type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

export type ThemeTransform = (theme: SquonkTheme) => SquonkTheme;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export function mergeTheme<T>(base: T, override: DeepPartial<T>): T {
  if (override === undefined) return base;
  if (!isRecord(base) || !isRecord(override)) return override as T;
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined && !["__proto__", "constructor", "prototype"].includes(key)) {
      result[key] = isRecord(base[key]) && isRecord(value)
        ? mergeTheme(base[key], value)
        : value;
    }
  }
  return result as T;
}

export function applyThemeTransforms(theme: SquonkTheme, transforms: readonly ThemeTransform[]): SquonkTheme {
  return transforms.reduce((current, transform) => transform(current), theme);
}
