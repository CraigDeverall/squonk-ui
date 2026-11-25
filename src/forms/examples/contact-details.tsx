import React from "react";
import { z } from "zod";
import { Alert } from "../../components";
import { useAppForm } from "../../components/functional/form/form";

const schema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name"),
  email: z.email("Enter an email address in the right format, like name@example.co.nz"),
  phone: z.string().regex(/^[\d\s+()-]*$/, "Enter a phone number using only numbers, spaces and +"),
  contactBy: z.string().min(1, "Choose how we should contact you"),
});

/** The basics: a schema, bound fields, an error summary and a submit button. */
export function ContactDetailsForm() {
  const [saved, setSaved] = React.useState<string>();
  const form = useAppForm({
    defaultValues: { fullName: "", email: "", phone: "", contactBy: "" },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => setSaved(`Saved. We'll contact ${value.fullName} by ${value.contactBy}.`),
  });

  return (
    <form.AppForm>
      <form.Form aria-label="Contact details">
        <form.ErrorSummary />
        <form.AppField name="fullName">{(field) => <field.TextField label="Full name" autoComplete="name" />}</form.AppField>
        <form.AppField name="email">{(field) => <field.TextField label="Email" type="email" autoComplete="email" />}</form.AppField>
        <form.AppField name="phone">
          {(field) => <field.TextField label="Phone (optional)" type="tel" autoComplete="tel" helperText="For a call back about this account only." />}
        </form.AppField>
        <form.AppField name="contactBy">
          {(field) => (
            <field.RadioGroup
              legend="How should we contact you?"
              direction="row"
              options={[
                { value: "email", label: "Email" },
                { value: "phone", label: "Phone" },
                { value: "post", label: "Post" },
              ]}
            />
          )}
        </form.AppField>
        <div><form.SubmitButton>Save contact details</form.SubmitButton></div>
        {saved ? <Alert tone="success" role="status">{saved}</Alert> : null}
      </form.Form>
    </form.AppForm>
  );
}
