import React from "react";
import { Button } from "../../functional/button/button";
import { Link } from "../../functional/link/link";
import { Table, type TableColumn } from "../../functional/table/table";
import { Heading } from "../../functional-primitive/heading/heading";
import { Text } from "../../functional-primitive/text/text";
import { Card } from "../../layout/card/card";
import { HStack } from "../../layout-primitive/hstack/hstack";
import { VStack } from "../../layout-primitive/vstack/vstack";
import { NotPrintable, Printable, PrintOnly } from "./printable";

type Line = { date: string; item: string; amount: string };
const LINES: Line[] = [
  { date: "28 Sept 2026", item: "Swamp Fund levy, July–August", amount: "$148.20" },
  { date: "20 Oct 2026", item: "Night-watch kit hire, September", amount: "$62.14" },
  { date: "1 Nov 2026", item: "Payment received", amount: "−$100.00" },
];
const COLUMNS: TableColumn<Line>[] = [
  { key: "date", header: "Date" },
  { key: "item", header: "Item" },
  { key: "amount", header: "Amount", align: "right" },
];

/**
 * A page with an app around a statement: the header and actions stay on
 * screen, the statement prints, and a letterhead appears only on paper.
 */
export function PrintableStatement({ withPrintable = true }: { withPrintable?: boolean }) {
  const statement = (
    <VStack gap="md">
      <PrintOnly>
        <Text data-testid="letterhead" weight="bold">The Squonk Society · Dues statement</Text>
      </PrintOnly>
      <Heading level={2} data-testid="statement-heading">Statement of account</Heading>
      <Card variant="outlined" data-testid="statement-card">
        <VStack gap="sm">
          <Text>Aroha Ngata · Membership SQ-104-772</Text>
          <Table caption="Transactions" columns={COLUMNS} rows={LINES} rowKey="item" />
          <Text tone="secondary">
            Pay online at{" "}
            <Link href="https://example.org/pay" data-testid="pay-link">example.org/pay</Link>.
          </Text>
          <Button variant="primary" data-testid="pay-button">Make a payment</Button>
        </VStack>
      </Card>
      <PrintOnly>
        <Text tone="secondary" data-testid="reference">Reference S-2026-11-0042</Text>
      </PrintOnly>
    </VStack>
  );
  return (
    <VStack gap="lg">
      <NotPrintable>
        <HStack gap="sm" data-testid="app-bar">
          <Text weight="bold">Squonk Society member portal</Text>
          <Button variant="secondary">Sign out</Button>
        </HStack>
      </NotPrintable>
      <Text data-testid="screen-intro">Your statement is below. Print it for your records.</Text>
      {withPrintable ? <Printable data-testid="printable">{statement}</Printable> : statement}
      <NotPrintable>
        <Text data-testid="screen-help">Questions? Use the chat in the corner.</Text>
      </NotPrintable>
    </VStack>
  );
}
