import React from "react";
import { FieldError, Group, Input, Label, NumberField, Text } from "react-aria-components";
import { z } from "zod";
import { Alert } from "../../components";
import { useAppForm, useFieldContext } from "../../components/functional/form/form";
import { useStore } from "@tanstack/react-form";
import styles from "./examples.module.css";

/**
 * How a custom field is built, from React Aria's NumberField and
 * bound with `useFieldContext`. React Aria brings the behaviour (locale
 * formatting, arrow keys, the label, description and error wiring); the form
 * brings the value, blur state and error; the theme tokens bring the look.
 * For real money inputs use the library's CurrencyField (`field.CurrencyField`).
 */
function WholeDollarField({ label, description }: { label: string; description?: string }) {
  const field = useFieldContext<number | null>();
  const attempts = useStore(field.form.store, (state) => state.submissionAttempts);
  const shown = field.state.meta.isBlurred || attempts > 0;
  const error = shown ? field.state.meta.errors.map((e) => (typeof e === "string" ? e : e?.message)).find(Boolean) : undefined;

  return (
    <NumberField
      className={styles.numberField}
      name={field.name}
      value={field.state.value ?? NaN}
      onChange={(value) => field.handleChange(Number.isNaN(value) ? null : value)}
      onBlur={field.handleBlur}
      isInvalid={Boolean(error)}
      validationBehavior="aria"
      formatOptions={{ style: "currency", currency: "NZD", maximumFractionDigits: 0 }}
      minValue={0}
    >
      <Label className={styles.numberLabel}>{label}</Label>
      <Group className={styles.numberGroup}>
        <Input className={styles.numberInput} />
      </Group>
      {description && !error ? <Text slot="description" className={styles.numberHint}>{description}</Text> : null}
      <FieldError className={styles.numberError}>{error}</FieldError>
    </NumberField>
  );
}

const schema = z.object({
  gift: z.number({ error: "Enter your planned gift" }).min(1, "Enter your planned gift"),
});

export function PlannedGiftForm() {
  const [saved, setSaved] = React.useState<string>();
  const form = useAppForm({
    defaultValues: { gift: null as number | null },
    validators: { onChange: schema },
    onSubmit: async ({ value }) =>
      setSaved(`${(value.gift ?? 0) >= 1000 ? "You'll be listed as" : "You won't be listed as"} a Swamp Fund patron.`),
  });

  return (
    <form.AppForm>
      <form.Form aria-label="Planned gift">
        <form.ErrorSummary />
        <form.AppField name="gift">
          {() => <WholeDollarField label="Planned Swamp Fund gift in the next 12 months" description="Gifts of $1,000 or more are listed. A rough figure is fine." />}
        </form.AppField>
        <div><form.SubmitButton>Check</form.SubmitButton></div>
        {saved ? <Alert tone="info" role="status">{saved}</Alert> : null}
      </form.Form>
    </form.AppForm>
  );
}
