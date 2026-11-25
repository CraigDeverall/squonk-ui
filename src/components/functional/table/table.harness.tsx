import React from "react";
import { Currency } from "../../functional-primitive/currency/currency";
import { Table, type TableColumn } from "./table";

type Row = { id: number; name: string; created: Date; metadata: { code: string } };
const rows: Row[] = [
  { id: 1, name: "Ada", created: new Date("2026-01-01"), metadata: { code: "A" } },
  { id: 2, name: "Grace", created: new Date("2026-02-01"), metadata: { code: "G" } },
];
const columns: TableColumn<Row>[] = [
  { key: "name", header: "Name", render: row => <input aria-label={`Name ${row.id}`} defaultValue={row.name} /> },
  { key: "created", header: "Created", render: row => row.created.toISOString().slice(0, 10) },
  { key: "metadata", header: "Code", render: row => row.metadata.code },
];

export function TableStatefulHarness({ reversed = false }: { reversed?: boolean }) {
  return <Table columns={columns} rows={reversed ? [...rows].reverse() : rows} rowKey="id" />;
}

const months: TableColumn<{ id: number }>[] = Array.from({ length: 12 }, (_, month) => ({
  key: `m${month}`,
  header: `Dues month ${month + 1}`,
  align: "right",
  render: () => <Currency value={1_800_000} compact locale="en-NZ" />,
}));

/** A table wider than a phone, with compact amounts whose full value is visually hidden. */
export function TableCompactCurrencyHarness() {
  return <Table columns={months} rows={[{ id: 1 }, { id: 2 }]} rowKey="id" caption="Dues collected" />;
}
