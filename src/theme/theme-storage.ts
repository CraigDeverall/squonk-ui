import { parseThemeDocument, type ThemeDocument } from "./theme";

type StoredField = "primitives" | "bindings" | "addedPrimitives" | "roleBindings";

/** Read old panel storage defensively. Malformed state is discarded so the
 * reset control and valid subsequent imports remain usable. */
export function parseStoredThemePart<K extends StoredField>(raw: string | null, field: K): ThemeDocument[K] | undefined {
  if (raw === null) return undefined;
  try {
    let value: unknown = JSON.parse(raw);
    if (field === "primitives" && value !== null && typeof value === "object" && !Array.isArray(value) && "overrides" in value) {
      value = (value as { overrides?: unknown }).overrides ?? {};
    }
    const parsed = parseThemeDocument(JSON.stringify({ version: 1, [field]: value }));
    return parsed.ok ? parsed.doc[field] : undefined;
  } catch {
    return undefined;
  }
}
