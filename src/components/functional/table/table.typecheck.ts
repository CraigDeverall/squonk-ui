import type { TableColumn, TableProps } from "./table";

type Row = { id: number; name: string; note?: string; created: Date; metadata: { code: string } };
export const scalar: TableColumn<Row> = { key: "name", header: "Name" };
export const optionalScalar: TableColumn<Row> = { key: "note", header: "Note" };
export const dateRenderer: TableColumn<Row> = { key: "created", header: "Created", render: row => row.created.toISOString() };
export const derivedRenderer: TableColumn<Row> = { key: "actions", header: "Actions", render: row => row.name };
export const identityField: TableProps<Row> = { columns: [], rows: [], rowKey: "id" };
export const identityAccessor: TableProps<Row> = { columns: [], rows: [], rowKey: row => row.id };
// @ts-expect-error Automatic columns must name actual scalar fields.
export const missingField: TableColumn<Row> = { key: "typo", header: "Missing" };
// @ts-expect-error Date values need an explicit renderer.
export const dateWithoutRenderer: TableColumn<Row> = { key: "created", header: "Created" };
// @ts-expect-error Object values need an explicit renderer.
export const objectWithoutRenderer: TableColumn<Row> = { key: "metadata", header: "Metadata" };
// @ts-expect-error Row identity must be a present string/number/bigint field.
export const objectIdentity: TableProps<Row> = { columns: [], rows: [], rowKey: "metadata" };
