import React from "react";
import { z } from "zod";
import { Alert, formatCurrency, toMinorUnits } from "../../components";
import { useAppForm } from "../../components/functional/form/form";

const owing = 148.2;

// The field's value is a number in dollars, or null when empty, so the
// schema checks a number; "Enter …" covers the empty case.
const schema = z.object({
  amount: z
    .number({ error: "Enter how much you are paying" })
    .min(1, "Enter an amount of $1 or more")
    .max(owing, `Enter an amount up to ${formatCurrency(owing, { locale: "en-NZ" })}, what you owe`),
});

export function PaymentAmountForm() {
  const [saved, setSaved] = React.useState<string>();
  const form = useAppForm({
    defaultValues: { amount: null as number | null },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      // Send money to a server as integer cents (or a decimal string), never as a float to add up.
      const cents = toMinorUnits(value.amount ?? 0, 2);
      setSaved(`Paying ${formatCurrency(cents, { locale: "en-NZ", minorUnits: true })} (${cents} cents sent to the server).`);
    },
  });

  return (
    <form.AppForm>
      <form.Form aria-label="Make a payment">
        <form.ErrorSummary />
        <form.AppField name="amount">
          {(field) => (
            <field.CurrencyField
              label="Amount"
              locale="en-NZ"
              helperText={`You owe ${formatCurrency(owing, { locale: "en-NZ" })}. You can pay part now.`}
            />
          )}
        </form.AppField>
        <div><form.SubmitButton>Continue</form.SubmitButton></div>
        {saved ? <Alert tone="info" role="status">{saved}</Alert> : null}
      </form.Form>
    </form.AppForm>
  );
}
