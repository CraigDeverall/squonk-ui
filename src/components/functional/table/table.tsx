"use client";

import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  functionalUpdate,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { clsx } from "clsx";
import React from "react";
import {
  Button as AriaButton,
  Cell,
  Column,
  Row as AriaRow,
  Table as AriaTable,
  TableBody,
  TableHeader,
  type Selection,
  type SortDescriptor,
} from "react-aria-components";
import { SemanticSurface } from "../../../theme/semantic-surface";
import { useThemeCssVars, purposeValue } from "../../../theme/use-theme-css-vars";
import { usePresentation } from "../../style/presentation/presentation";
import { Checkbox } from "../checkbox/checkbox";
import { ArrowDownIcon, ArrowUpIcon, SortIcon } from "../../functional-primitive/icon/icon";
import { Pagination } from "../pagination/pagination";
import { Motion } from "../../animation/motion/motion";
import styles from "./table.module.css";
import type { SquonkTheme } from "../../../theme/theme-context";

type AutomaticCellValue = string | number | bigint | boolean | null | undefined;
type AutomaticColumnKey<Row> = Extract<{
  [Key in keyof Row]-?: Row[Key] extends AutomaticCellValue ? Key : never;
}[keyof Row], string>;
type RowIdentityKey<Row> = Extract<{
  [Key in keyof Row]-?: Row[Key] extends React.Key ? Key : never;
}[keyof Row], string>;

interface ColumnPresentation {
  /** Column header content. */
  header: React.ReactNode;
  /** Horizontal alignment of the column's cells. Defaults to `"left"`. */
  align?: "left" | "center" | "right";
  /** Fixed column width (any CSS width). Unset columns share what's left. */
  width?: string;
  /** Let people sort by this column from its header. Rendered columns also
   *  need `sortValue`. */
  sortable?: boolean;
}

/** Scalar fields can render automatically; derived/object fields require a renderer. */
export type TableColumn<Row> = ColumnPresentation & (
  | { /** A row field with a scalar value, rendered as-is. Also the column's id for sorting. */ key: AutomaticColumnKey<Row>; render?: never }
  | {
      /** A unique column id, used for sorting. Need not be a row field. */
      key: string;
      /** Renders the cell for a row. Required when the column is derived or
       *  its field is not a scalar. */
      render: (row: Row, rowIndex: number) => React.ReactNode;
      /** Value used to sort and filter a rendered column. */
      sortValue?: (row: Row) => string | number;
    }
);

export type TableSortDirection = "asc" | "desc";

/** The active sort: a column key and direction, or `null` for data order. */
export type TableSort = { key: string; direction: TableSortDirection } | null;

export interface TableProps<Row>
  extends Omit<React.ComponentProps<"div">, "children"> {
  /** Column definitions, left to right. */
  columns: TableColumn<Row>[];
  /** Row data, top to bottom. */
  rows: Row[];
  /** Stable key field or accessor. Index fallback is suitable only for static rows. */
  rowKey?: RowIdentityKey<Row> | ((row: Row, rowIndex: number) => React.Key);
  /** Accessible table description, rendered visually hidden. */
  caption?: string;
  /** Shown instead of the body when `rows` is empty. */
  empty?: React.ReactNode;
  /** Zebra-stripe the body rows. Defaults to `false`. */
  striped?: boolean;
  /** Controlled sort. Sortable columns are set with `sortable` on the column. */
  sort?: TableSort;
  /** Initial sort when uncontrolled. */
  defaultSort?: TableSort;
  /** Called when a header changes the sort: ascending, descending, then none. */
  onSortChange?: (sort: TableSort) => void;
  /** Show only rows with a cell containing this text (case-insensitive). */
  filter?: string;
  /** Split rows into pages of this size and show page controls. */
  pageSize?: number;
  /** Controlled zero-based page. */
  pageIndex?: number;
  /** Called when the page changes. */
  onPageIndexChange?: (pageIndex: number) => void;
  /** Make rows selectable, with a checkbox column. */
  selectable?: boolean;
  /** Controlled selection, as row keys (see `rowKey`). */
  selectedKeys?: string[];
  /** Initial selection when uncontrolled. */
  defaultSelectedKeys?: string[];
  /** Called with the selected row keys. */
  onSelectionChange?: (keys: string[]) => void;
  /** Render as an interactive grid even without selection, for tables whose
   *  cells hold controls: arrow keys move between cells and Tab leaves. */
  interactive?: boolean;
}

// The outermost element is a block wrapper that scrolls horizontally when the
// table is wider than its container — wide content must never stretch the
// page (containment rule).
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

// TanStack needs object rows; Table<Row> is unconstrained, so rows are
// handled as Data internally and cast back at the edges.
type Data = Record<string, unknown>;

const tableBackground = (theme: SquonkTheme) => purposeValue(theme, "roles.color.surface");
const stripedBackground = (theme: SquonkTheme) => purposeValue(theme, "roles.color.stripe");

/** A controllable value: the prop when given, otherwise local state. */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [local, setLocal] = React.useState(defaultValue);
  const current = value !== undefined ? value : local;
  const set = React.useCallback((updater: Updater<T>) => {
    const next = functionalUpdate(updater, current);
    if (value === undefined) setLocal(next);
    onChange?.(next);
  }, [current, value, onChange]);
  return [current, set] as const;
}

const automaticValue = (row: unknown, key: string): AutomaticCellValue => {
  const value = (row as Record<string, unknown>)[key];
  if (value == null || ["string", "number", "bigint", "boolean"].includes(typeof value)) {
    return value as AutomaticCellValue;
  }
  throw new TypeError(`Table column "${key}" requires a render function for non-scalar values.`);
};

/**
 * A data table: typed column definitions over an array of rows, wrapped in a
 * horizontally-scrolling container so wide tables never stretch the page.
 * TanStack Table computes sorting, filtering and pages.
 *
 * By default it is a semantic `<table>` for reading: sortable headers are
 * React Aria buttons and the sorted header carries `aria-sort`. With
 * `selectable` (or `interactive`) it renders through React Aria's Table as a
 * WAI-ARIA grid: one tab stop, arrow keys between rows and cells, row
 * selection with Space, and announcements of sort and selection changes.
 */
export function Table<Row>({
  columns,
  rows,
  rowKey,
  caption,
  empty,
  striped = false,
  sort,
  defaultSort = null,
  onSortChange,
  filter,
  pageSize,
  pageIndex,
  onPageIndexChange,
  selectable = false,
  selectedKeys,
  defaultSelectedKeys = [],
  onSelectionChange,
  interactive = false,
  className,
  style,
  ...otherProps
}: TableProps<Row>) {
  const register = usePresentation();
  const themeVars = useThemeCssVars();
  const isGrid = selectable || interactive;
  const captionId = React.useId();

  const [sorting, setSorting] = useControllable<SortingState>(
    sort === undefined ? undefined : sort ? [{ id: sort.key, desc: sort.direction === "desc" }] : [],
    defaultSort ? [{ id: defaultSort.key, desc: defaultSort.direction === "desc" }] : [],
    onSortChange && ((next) => onSortChange(next[0] ? { key: next[0].id, direction: next[0].desc ? "desc" : "asc" } : null))
  );
  const [pagination, setPagination] = useControllable<PaginationState>(
    pageIndex === undefined ? undefined : { pageIndex, pageSize: pageSize ?? Number.MAX_SAFE_INTEGER },
    { pageIndex: 0, pageSize: pageSize ?? Number.MAX_SAFE_INTEGER },
    onPageIndexChange && ((next) => onPageIndexChange(next.pageIndex))
  );
  const [selected, setSelected] = useControllable<string[]>(selectedKeys, defaultSelectedKeys, onSelectionChange);

  const columnDefs = React.useMemo<ColumnDef<typeof features, Data>[]>(() => columns.map((column) => {
    const sortValue = column.render ? column.sortValue : (row: Row) => automaticValue(row, column.key);
    return {
      id: column.key,
      ...(sortValue ? { accessorFn: (row: Data) => sortValue(row as Row) as string | number } : {}),
      enableSorting: Boolean(column.sortable && sortValue),
      enableGlobalFilter: Boolean(sortValue),
      sortFn: "alphanumeric",
      sortDescFirst: false,
    } as ColumnDef<typeof features, Data>;
  }), [columns]);

  const table = useTable({
    features,
    columns: columnDefs,
    data: rows as unknown as Data[],
    getRowId: (data: Data, index: number) => {
      const row = data as Row;
      return String(typeof rowKey === "function" ? rowKey(row, index) : rowKey === undefined ? index : row[rowKey]);
    },
    state: { sorting, pagination, globalFilter: filter ?? "" },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
    enableMultiSort: false,
    autoResetPageIndex: false,
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const visibleRows = table.getRowModel().rows;
  const pageCount = pageSize ? Math.max(1, Math.ceil(filteredCount / pageSize)) : 1;

  // Keep the page in range when filtering or deletion shortens the data.
  const lastPage = pageCount - 1;
  React.useEffect(() => {
    if (pagination.pageIndex > lastPage) setPagination((old) => ({ ...old, pageIndex: lastPage }));
  }, [pagination.pageIndex, lastPage, setPagination]);

  // The grid's sort and selection are announced by React Aria; the reading
  // table announces its own sort, and both announce the filtered row count.
  const [announcement, setAnnouncement] = React.useState("");
  const sortedColumn = sorting[0];
  const sortHeader = sortedColumn ? columns.find((column) => column.key === sortedColumn.id)?.header : undefined;
  const sortLabel = sortedColumn
    ? `${typeof sortHeader === "string" ? sortHeader : sortedColumn.id}, ${sortedColumn.desc ? "descending" : "ascending"}`
    : "";
  const announced = React.useRef({ sortLabel, filteredCount });
  React.useEffect(() => {
    const previous = announced.current;
    announced.current = { sortLabel, filteredCount };
    if (!isGrid && previous.sortLabel !== sortLabel) setAnnouncement(sortLabel ? `Sorted by ${sortLabel}` : "Sort cleared");
    else if (previous.filteredCount !== filteredCount) setAnnouncement(`${filteredCount} ${filteredCount === 1 ? "row" : "rows"}`);
  }, [sortLabel, filteredCount, isGrid]);

  // React Aria sorts ascending, then descending; a third press clears.
  const sortDescriptor: SortDescriptor | undefined = sorting[0]
    ? { column: sorting[0].id, direction: sorting[0].desc ? "descending" : "ascending" }
    : undefined;
  const onAriaSortChange = (next: SortDescriptor) => {
    const clearing = sorting[0]?.id === next.column && sorting[0].desc && next.direction === "ascending";
    setSorting(clearing ? [] : [{ id: String(next.column), desc: next.direction === "descending" }]);
  };

  const visibleKeys = visibleRows.map((row) => row.id);
  const onAriaSelectionChange = (keys: Selection) => {
    if (keys === "all") {
      setSelected(Array.from(new Set([...selected, ...visibleKeys])));
      return;
    }
    // Keep selections on other pages; this collection only holds this page.
    setSelected([...selected.filter((key) => !visibleKeys.includes(key)), ...Array.from(keys, String)]);
  };

  const cellContent = (column: TableColumn<Row>, row: (typeof visibleRows)[number]) =>
    themeVars.provide(column.render ? column.render(row.original as Row, row.index) : automaticValue(row.original, column.key));
  const rowBackground = (rowIndex: number) => (striped && rowIndex % 2 === 1 ? stripedBackground : tableBackground);
  const firstRowIndex = pageSize ? pagination.pageIndex * pageSize : 0;
  const sortIcon = (direction: "ascending" | "descending" | undefined) => (
    <span className={styles.sortIndicator} data-direction={direction ?? "none"} aria-hidden="true">
      {direction === "ascending" ? <ArrowUpIcon /> : direction === "descending" ? <ArrowDownIcon /> : <SortIcon />}
    </span>
  );

  const readingTable = (
    <table className={styles.table} aria-labelledby={caption ? captionId : undefined} aria-rowcount={pageSize ? filteredCount + 1 : undefined}>
      {caption ? <caption id={captionId} className={styles.visuallyHidden}>{caption}</caption> : null}
      <colgroup>
        {columns.map((column) => <col key={column.key} style={column.width ? { width: column.width } : undefined} />)}
      </colgroup>
      <thead>
        <tr aria-rowindex={pageSize ? 1 : undefined}>
          {columns.map((column) => {
            const tableColumn = table.getColumn(column.key);
            const sorted = tableColumn?.getIsSorted();
            const direction = sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined;
            return (
              <th
                key={column.key}
                scope="col"
                className={styles.header}
                data-register={register}
                data-align={column.align ?? "left"}
                aria-sort={direction}
              >
                {tableColumn?.getCanSort() ? (
                  <AriaButton className={styles.sortButton} onPress={() => tableColumn.toggleSorting()}>
                    {column.header}
                    {sortIcon(direction)}
                  </AriaButton>
                ) : column.header}
              </th>
            );
          })}
        </tr>
      </thead>
      {/* Rows glide to their new places when sorted or filtered. */}
      <Motion.Layout>
      <tbody>
        {visibleRows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className={styles.empty} data-register={register}>{empty ?? "No data"}</td>
          </tr>
        ) : visibleRows.map((row, rowIndex) => (
          <SemanticSurface key={row.id} background={rowBackground(rowIndex)}>
            <tr className={clsx(striped && styles.striped)} aria-rowindex={pageSize ? firstRowIndex + rowIndex + 2 : undefined}>
              {columns.map((column) => (
                <td key={column.key} className={styles.cell} data-register={register} data-align={column.align ?? "left"}>
                  {cellContent(column, row)}
                </td>
              ))}
            </tr>
          </SemanticSurface>
        ))}
      </tbody>
      </Motion.Layout>
    </table>
  );

  const grid = (
    <AriaTable
      className={styles.table}
      aria-label={caption}
      selectionMode={selectable ? "multiple" : "none"}
      selectionBehavior="toggle"
      selectedKeys={selectable ? new Set(selected) : undefined}
      onSelectionChange={selectable ? onAriaSelectionChange : undefined}
      sortDescriptor={sortDescriptor}
      onSortChange={onAriaSortChange}
    >
      <TableHeader className={styles.head}>
        {selectable ? (
          <Column className={clsx(styles.header, styles.select)} data-register={register}>
            <Checkbox slot="selection" aria-label="Select all rows" />
          </Column>
        ) : null}
        {columns.map((column, index) => {
          const canSort = Boolean(table.getColumn(column.key)?.getCanSort());
          return (
            <Column
              key={column.key}
              id={column.key}
              isRowHeader={index === 0}
              allowsSorting={canSort}
              className={styles.header}
              data-register={register}
              data-align={column.align ?? "left"}
              style={column.width ? { width: column.width } : undefined}
            >
              {({ sortDirection }) => canSort ? (
                <span className={styles.sortLabel}>
                  {column.header}
                  <span className={styles.sortIndicator} data-direction={sortDirection ?? "none"} aria-hidden="true">
                    {sortDirection === "ascending" ? <ArrowUpIcon /> : sortDirection === "descending" ? <ArrowDownIcon /> : <SortIcon />}
                  </span>
                </span>
              ) : column.header}
            </Column>
          );
        })}
      </TableHeader>
      <Motion.Layout>
      <TableBody
        className={styles.body}
        renderEmptyState={() => (
          <div className={styles.empty} data-register={register}>{empty ?? "No data"}</div>
        )}
      >
        {visibleRows.map((row, rowIndex) => (
          <SemanticSurface key={row.id} background={striped && rowIndex % 2 === 1 ? stripedBackground : tableBackground}>
            <AriaRow id={row.id} className={clsx(styles.row, striped && styles.striped)}>
              {selectable ? (
                <Cell className={clsx(styles.cell, styles.select)} data-register={register}>
                  <Checkbox slot="selection" aria-label={`Select row ${firstRowIndex + rowIndex + 1}`} />
                </Cell>
              ) : null}
              {columns.map((column) => (
                <Cell key={column.key} className={styles.cell} data-register={register} data-align={column.align ?? "left"}>
                  {themeVars.provide(
                    column.render ? column.render(row.original as Row, row.index) : automaticValue(row.original, column.key)
                  )}
                </Cell>
              ))}
            </AriaRow>
          </SemanticSurface>
        ))}
      </TableBody>
      </Motion.Layout>
    </AriaTable>
  );

  return (
    <div className={clsx(styles.root, className)} style={{ ...themeVars.style, ...style }} {...otherProps}>
      <SemanticSurface background={tableBackground}>
        <div className={styles.scroll}>
          {isGrid ? grid : readingTable}
        </div>
        {pageSize && pageCount > 1 ? (
          <Pagination
            compact
            className={styles.pager}
            aria-label={caption ? `${caption} pages` : "Table pages"}
            count={filteredCount}
            pageSize={pageSize}
            page={pagination.pageIndex + 1}
            onPageChange={(page) => table.setPageIndex(page - 1)}
          />
        ) : null}
        <div className={styles.visuallyHidden} role="status" aria-live="polite">{announcement}</div>
      </SemanticSurface>
    </div>
  );
}
