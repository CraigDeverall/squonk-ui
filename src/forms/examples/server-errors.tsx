import React from "react";
import { z } from "zod";
import { Alert } from "../../components";
import { useAppForm } from "../../components/functional/form/form";

const schema = z.object({
  username: z.string().trim().min(3, "Enter a username of at least 3 characters"),
  email: z.email("Enter an email address in the right format, like name@example.org"),
});

/** Stands in for the server: some answers only it can give. */
async function createLogin(value: z.infer<typeof schema>) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (value.username === "service-down") return { form: "We couldn't create your login just now. Try again in a few minutes." };
  const fields: Record<string, string> = {};
  if (value.username.toLowerCase() === "aroha") fields.username = "That username is taken. Try another one.";
  if (value.email.endsWith("@example.com")) fields.email = "Use a work email address, not a personal one";
  return Object.keys(fields).length ? { fields } : undefined;
}

/**
 * Errors from the server land where the client's own errors do: on the
 * field, and in the error summary. A form-level message covers what
 * belongs to no field.
 */
export function ServerErrorsForm() {
  const [created, setCreated] = React.useState<string>();
  const form = useAppForm({
    defaultValues: { username: "", email: "" },
    validators: { onChange: schema, onSubmitAsync: async ({ value }) => createLogin(value) },
    onSubmit: async ({ value }) => setCreated(`Created a login for ${value.username}.`),
  });

  return (
    <form.AppForm>
      <form.Form aria-label="Create a login">
        <form.ErrorSummary />
        <form.AppField name="username">
          {(field) => <field.TextField label="Username" autoComplete="username" helperText={'Try "aroha" (taken) or "service-down".'} />}
        </form.AppField>
        <form.AppField name="email">
          {(field) => <field.TextField label="Work email" type="email" helperText="Any address ending @example.com is refused." />}
        </form.AppField>
        <div><form.SubmitButton pendingLabel="Creating…">Create login</form.SubmitButton></div>
        {created ? <Alert tone="success" role="status">{created}</Alert> : null}
      </form.Form>
    </form.AppForm>
  );
}
