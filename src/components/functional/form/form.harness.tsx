import React from "react";
import { z } from "zod";
import { useAppForm } from "./form";

export const registrationSchema = z.object({
  memberName: z.string().trim().min(1, "Enter your full name"),
  email: z.email("Enter an email address in the right format, like name@example.co.nz"),
  accounts: z.array(z.string()).min(1, "Choose at least one account to set up"),
  frequency: z.string().min(1, "Choose how often you will pay your dues"),
  chapter: z.string().min(1, "Choose your chapter"),
  notes: z.string().max(200, "Notes must be 200 characters or fewer"),
  declaration: z.literal(true, { error: "Confirm the information is correct" }),
});

export type Registration = z.infer<typeof registrationSchema>;

const chapters = ["Auckland", "Waikato", "Bay of Plenty", "Wellington", "Canterbury", "Otago", "Southland"].map((label) => ({
  value: label.toLowerCase().replace(/\s+/g, "-"),
  label,
}));

/**
 * A membership application form: schema validation, a server-side check that
 * "taken@example.co.nz" already belongs to a member, and a success message.
 */
export function RegistrationForm({ onSubmitted }: { onSubmitted?: (value: Registration) => void }) {
  const [done, setDone] = React.useState<string>();
  const form = useAppForm({
    defaultValues: {
      memberName: "",
      email: "",
      accounts: [] as string[],
      frequency: "",
      chapter: "",
      notes: "",
      declaration: false,
    } as unknown as Registration,
    validators: {
      onChange: registrationSchema,
      onSubmitAsync: async ({ value }) => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return value.email === "taken@example.co.nz"
          ? { fields: { email: "This email address is already belongs to a member. Sign in instead." } }
          : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      setDone(`Welcome to the Society, ${value.memberName}. Accounts: ${value.accounts.join(", ")}.`);
      onSubmitted?.(value);
    },
  });

  return (
    <form.AppForm>
      <form.Form aria-label="Join the Society" style={{ maxWidth: 480 }}>
        <form.ErrorSummary />
        <form.AppField name="memberName">{(field) => <field.TextField label="Full name" autoComplete="name" />}</form.AppField>
        <form.AppField name="email">{(field) => <field.TextField label="Email" type="email" autoComplete="email" helperText="We'll send your confirmation here." />}</form.AppField>
        <form.AppField name="accounts">
          {(field) => (
            <field.CheckboxGroup
              legend="Which accounts are you registering for?"
              options={[
                { value: "dues", label: "Annual dues" },
                { value: "levy", label: "Swamp Fund levy" },
                { value: "kit", label: "Night-watch kit hire" },
              ]}
            />
          )}
        </form.AppField>
        <form.AppField name="frequency">
          {(field) => (
            <field.RadioGroup
              legend="How often will you pay your dues?"
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "two-monthly", label: "Every two months" },
                { value: "six-monthly", label: "Every six months" },
              ]}
            />
          )}
        </form.AppField>
        <form.AppField name="chapter">{(field) => <field.Select searchable label="Chapter" placeholder="Start typing a chapter" options={chapters} />}</form.AppField>
        <form.AppField name="notes">{(field) => <field.Textarea label="Notes (optional)" maxLength={200} showCount rows={3} />}</form.AppField>
        <form.AppField name="declaration">{(field) => <field.Checkbox label="The information I've given is correct" />}</form.AppField>
        <div>
          <form.SubmitButton pendingLabel="Checking…">Join</form.SubmitButton>
        </div>
        {done ? <p role="status">{done}</p> : null}
      </form.Form>
    </form.AppForm>
  );
}
