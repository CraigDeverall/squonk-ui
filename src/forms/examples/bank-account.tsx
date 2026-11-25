import React from "react";
import { z } from "zod";
import { Alert } from "../../components";
import { useAppForm } from "../../components/functional/form/form";

const ACCOUNT = /^\d{2}-\d{4}-\d{7}-\d{2,3}$/;

// Cross-field rules sit on the object. `when: () => true` runs them even
// while another field is invalid, so every problem shows at once; `path`
// puts the message on the field it is about.
const schema = z
  .object({
    accountName: z.string().trim().min(1, "Enter the name on the account"),
    accountNumber: z.string().regex(ACCOUNT, "Enter the account number in the format 12-3456-7890123-00"),
    confirmNumber: z.string().min(1, "Enter the account number again"),
    from: z.string().min(1, "Enter the date the change starts"),
    until: z.string(),
  })
  .refine((v) => v.confirmNumber === "" || v.confirmNumber === v.accountNumber, {
    message: "The account numbers don't match",
    path: ["confirmNumber"],
    when: () => true,
  })
  .refine((v) => !v.until || !v.from || v.until > v.from, {
    message: "The end date must be after the start date",
    path: ["until"],
    when: () => true,
  });

/** Rules that compare fields: a confirmation that must match and a date range. */
export function BankAccountForm() {
  const [saved, setSaved] = React.useState(false);
  const form = useAppForm({
    defaultValues: { accountName: "", accountNumber: "", confirmNumber: "", from: "", until: "" },
    validators: { onChange: schema },
    onSubmit: async () => setSaved(true),
  });

  return (
    <form.AppForm>
      <form.Form aria-label="Change credit payout account">
        <form.ErrorSummary />
        <form.AppField name="accountName">{(field) => <field.TextField label="Name on the account" />}</form.AppField>
        <form.AppField name="accountNumber">
          {(field) => <field.TextField label="Account number" inputMode="numeric" helperText="For example, 12-3456-7890123-00" />}
        </form.AppField>
        <form.AppField name="confirmNumber">
          {(field) => <field.TextField label="Confirm account number" inputMode="numeric" autoComplete="off" />}
        </form.AppField>
        <form.AppField name="from">{(field) => <field.TextField label="Use this account from" type="date" />}</form.AppField>
        <form.AppField name="until">
          {(field) => <field.TextField label="Until (optional)" type="date" helperText="Leave empty to keep using it." />}
        </form.AppField>
        <div><form.SubmitButton>Save bank account</form.SubmitButton></div>
        {saved ? <Alert tone="success" role="status">Credits will be paid into the new account.</Alert> : null}
      </form.Form>
    </form.AppForm>
  );
}
