import React from "react";
import { z } from "zod";
import { Alert } from "../../components";
import { useAppForm } from "../../components/functional/form/form";

// Questions that only apply to some answers are validated only when they
// apply, so a hidden field can never block the submit.
const schema = z
  .object({
    leads: z.string().min(1, "Say whether you lead night watches"),
    groupSize: z.string(),
    nextWatch: z.string(),
    watchFrequency: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.leads !== "yes") return;
    if (!/^[1-9]\d*$/.test(v.groupSize)) ctx.addIssue({ code: "custom", path: ["groupSize"], message: "Enter how many people join your watches, as a number" });
    if (!v.nextWatch) ctx.addIssue({ code: "custom", path: ["nextWatch"], message: "Enter the date of your next watch" });
    if (!v.watchFrequency) ctx.addIssue({ code: "custom", path: ["watchFrequency"], message: "Choose how often you run watches" });
  });

/** Follow-up questions that appear, and validate, only when they apply. */
export function WatchLeaderDetailsForm() {
  const [result, setResult] = React.useState<string>();
  const form = useAppForm({
    defaultValues: { leads: "", groupSize: "", nextWatch: "", watchFrequency: "" },
    validators: { onChange: schema },
    onSubmit: async ({ value }) =>
      setResult(value.leads === "yes" ? `Registered as a watch leader for ${value.groupSize}.` : "No watch-leader registration needed."),
  });

  return (
    <form.AppForm>
      <form.Form aria-label="Night-watch leader details">
        <form.ErrorSummary />
        <form.AppField name="leads">
          {(field) => (
            <field.RadioGroup
              legend="Do you lead night watches?"
              direction="row"
              options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
            />
          )}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.leads === "yes"}>
          {(leads) =>
            leads ? (
              <>
                <form.AppField name="groupSize">{(field) => <field.TextField label="How many people join your watches?" inputMode="numeric" />}</form.AppField>
                <form.AppField name="nextWatch">{(field) => <field.TextField label="Date of your next watch" type="date" />}</form.AppField>
                <form.AppField name="watchFrequency">
                  {(field) => (
                    <field.Select
                      label="How often do you run watches?"
                      placeholder="Choose one"
                      options={[
                        { value: "weekly", label: "Weekly" },
                        { value: "fortnightly", label: "Fortnightly" },
                        { value: "monthly", label: "Monthly" },
                      ]}
                    />
                  )}
                </form.AppField>
              </>
            ) : null
          }
        </form.Subscribe>
        <div><form.SubmitButton>Continue</form.SubmitButton></div>
        {result ? <Alert tone="success" role="status">{result}</Alert> : null}
      </form.Form>
    </form.AppForm>
  );
}
