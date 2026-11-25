/**
 * Corners of a panel of rows (a menu, a listbox) and of the rows in it,
 * derived so the two always nest.
 *
 * A row sits `inset + border` inside its panel, so its corner is concentric
 * with the panel's when its radius is the panel's less that distance. A
 * browser never rounds a row by more than half its height, though, so past
 * `half a row + inset + border` the panel's curve would cut the first and
 * last rows. The panel's radius stops there.
 */

/** What the panel's radius is worked out from; every value is a resolved CSS value. */
export interface ListPanelRadiusParts {
  /** The radius panels take when nothing limits them (`roles.radius.surface`). */
  surface: string;
  /** Padding around the rows (`roles.space.listInset`). */
  inset: string;
  /** The panel's border (`roles.border.width`). */
  border: string;
  /** A row's text size (`roles.type.listItem`). */
  rowText: string;
  /** A row's line height, a plain number (`roles.type.tightLineHeight`). */
  rowLineHeight: string;
  /** A row's top and bottom padding (`roles.space.listItemInsetBlock`). */
  rowInsetBlock: string;
}

/** What a row's radius is worked out from; every value is a resolved CSS value. */
export interface ListItemRadiusParts {
  /** The panel's radius (`roles.radius.list`). */
  list: string;
  /** The least a row is rounded (`roles.radius.item`). */
  item: string;
  /** Padding around the rows (`roles.space.listInset`). */
  inset: string;
  /** The panel's border (`roles.border.width`). */
  border: string;
}

const px = (value: string): number | undefined => {
  const match = /^(-?\d*\.?\d+)px$/.exec(value.trim());
  return match ? Number(match[1]) : undefined;
};

const plain = (value: string): number | undefined => (/^\d*\.?\d+$/.test(value.trim()) ? Number(value) : undefined);

const toPx = (value: number) => `${Math.round(value * 1000) / 1000}px`;

/**
 * `roles.radius.list`: the surface radius, limited to half a single-line row
 * plus the row's distance from the panel's edge. A pixel value when every
 * part is in pixels, otherwise the same sum left for the browser.
 */
export function listPanelRadius(parts: ListPanelRadiusParts): string {
  const surface = px(parts.surface);
  const inset = px(parts.inset);
  const border = px(parts.border);
  const text = px(parts.rowText);
  const lineHeight = plain(parts.rowLineHeight);
  const block = px(parts.rowInsetBlock);
  if (
    surface !== undefined && inset !== undefined && border !== undefined &&
    text !== undefined && lineHeight !== undefined && block !== undefined
  ) {
    return toPx(Math.min(surface, (text * lineHeight) / 2 + block + inset + border));
  }
  return `min(${parts.surface}, calc(${parts.rowText} * ${parts.rowLineHeight} / 2 + ${parts.rowInsetBlock} + ${parts.inset} + ${parts.border}))`;
}

/**
 * `roles.radius.listItem`: the panel's radius less the row's distance from
 * the panel's edge, and never less than `roles.radius.item`.
 */
export function listItemRadius(parts: ListItemRadiusParts): string {
  const list = px(parts.list);
  const item = px(parts.item);
  const inset = px(parts.inset);
  const border = px(parts.border);
  if (list !== undefined && item !== undefined && inset !== undefined && border !== undefined) {
    return toPx(Math.max(item, list - inset - border));
  }
  return `max(${parts.item}, calc(${parts.list} - ${parts.inset} - ${parts.border}))`;
}
