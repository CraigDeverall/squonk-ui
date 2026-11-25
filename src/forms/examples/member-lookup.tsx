import React from "react";
import { z } from "zod";
import { Alert } from "../../components";
import { useAppForm } from "../../components/functional/form/form";

const KNOWN: Record<string, string> = { "SQ-104-772": "Aroha Ngata", "SQ-208-315": "Tui Harrow" };

/** Stands in for a request to the server. */
const lookUp = (id: string) =>
  new Promise<string | undefined>((resolve) => setTimeout(() => resolve(KNOWN[id]), 600));

const idFormat = z.string().regex(/^SQ-\d{3}-\d{3}$/, "Enter a membership number in the format SQ-104-772");

/**
 * A check that needs the server. The format rule runs on every change; the
 * lookup runs only when the format is right, half a second after typing
 * stops, and the field says it is checking meanwhile.
 */
export function MemberLookupForm() {
  const [member, setMember] = React.useState<string>();
  const form = useAppForm({
    defaultValues: { membershipNumber: "" },
    onSubmit: async ({ value }) => setMember(`${KNOWN[value.membershipNumber]} is now linked to your household membership.`),
  });

  return (
    <form.AppForm>
      <form.Form aria-label="Link a household member">
        <form.ErrorSummary />
        <form.AppField
          name="membershipNumber"
          validators={{
            onChange: idFormat,
            onChangeAsyncDebounceMs: 500,
            onChangeAsync: async ({ value }) =>
              idFormat.safeParse(value).success && !(await lookUp(value)) ? "We can't find a member with that number" : undefined,
          }}
        >
          {(field) => (
            <field.TextField
              label="Member's membership number"
              helperText={
                field.state.meta.isValidating
                  ? "Checking…"
                  : KNOWN[field.state.value] ?? "Try SQ-104-772, or any other number to see the not-found message."
              }
            />
          )}
        </form.AppField>
        <div><form.SubmitButton pendingLabel="Checking…">Link member</form.SubmitButton></div>
        {member ? <Alert tone="success" role="status">{member}</Alert> : null}
      </form.Form>
    </form.AppForm>
  );
}
