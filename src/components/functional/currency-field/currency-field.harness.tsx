import React from "react";
import { CurrencyField, type CurrencyFieldProps } from "./currency-field";

/** An uncontrolled CurrencyField that prints the last value it reported, for component tests. */
export function CurrencyFieldHarness(props: Omit<CurrencyFieldProps, "label" | "onChange">) {
  const [reported, setReported] = React.useState<number | null | undefined>(undefined);
  return (
    <div>
      <CurrencyField label="Amount" {...props} onChange={setReported} />
      <output data-testid="value">{reported === undefined ? "" : String(reported)}</output>
    </div>
  );
}
