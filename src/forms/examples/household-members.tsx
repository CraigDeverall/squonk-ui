import React from "react";
import { z } from "zod";
import { Alert, Button, Heading } from "../../components";
import { useAppForm } from "../../components/functional/form/form";
import { AddIcon, DeleteIcon } from "../../components/functional-primitive/icon/icon";
import styles from "./examples.module.css";

const householdMember = z.object({
  name: z.string().trim().min(1, "Enter the household member's full name"),
  email: z.email("Enter the household member's email address in the right format"),
});
const schema = z.object({ members: z.array(householdMember).min(1, "Add at least one household member") });
type HouseholdMember = z.infer<typeof householdMember>;

const blank = (): HouseholdMember => ({ name: "", email: "" });

/**
 * A repeating group: add and remove the people in a Keeper (household)
 * membership. Each row's fields are named by index (`members[0].name`), so errors and summary links find them.
 */
export function HouseholdMembersForm() {
  const [saved, setSaved] = React.useState<string>();
  const form = useAppForm({
    defaultValues: { members: [blank()] },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => setSaved(`Saved ${value.members.length} household member${value.members.length === 1 ? "" : "s"}.`),
  });

  return (
    <form.AppForm>
      <form.Form aria-label="Household members">
        <form.ErrorSummary />
        <form.AppField name="members" mode="array">
          {(list) => (
            <>
              {list.state.value.map((_, i) => (
                <fieldset key={i} className={styles.group}>
                  <legend className={styles.groupLegend}>
                    <Heading level={3}>Household member {i + 1}</Heading>
                  </legend>
                  <form.AppField name={`members[${i}].name`}>{(field) => <field.TextField label="Full name" />}</form.AppField>
                  <form.AppField name={`members[${i}].email`}>{(field) => <field.TextField label="Email" type="email" />}</form.AppField>
                  {list.state.value.length > 1 ? (
                    <div>
                      <Button variant="ghost" onClick={() => list.removeValue(i)}>
                        <DeleteIcon size="control" /> Remove household member {i + 1}
                      </Button>
                    </div>
                  ) : null}
                </fieldset>
              ))}
              <div>
                <Button variant="secondary" onClick={() => list.pushValue(blank())}>
                  <AddIcon size="control" /> Add another household member
                </Button>
              </div>
            </>
          )}
        </form.AppField>
        <div><form.SubmitButton>Save household members</form.SubmitButton></div>
        {saved ? <Alert tone="success" role="status">{saved}</Alert> : null}
      </form.Form>
    </form.AppForm>
  );
}
