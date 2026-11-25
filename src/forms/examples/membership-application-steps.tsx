import React from "react";
import { z } from "zod";
import { Alert, Button, Heading, ProgressBar, Text } from "../../components";
import { useAppForm } from "../../components/functional/form/form";
import styles from "./examples.module.css";

const details = z.object({
  name: z.string().trim().min(1, "Enter your full name"),
  postcode: z.string().regex(/^\d{4}$/, "Enter your postcode, which is 4 digits"),
});
const membership = z.object({
  interest: z.string().min(1, "Choose your main interest"),
  frequency: z.string().min(1, "Choose how often you will join night watches"),
});
type Details = z.infer<typeof details>;
type Membership = z.infer<typeof membership>;

const STEPS = ["Your details", "Membership details", "Check and submit"];

/** Step 1. Each step is its own form, validated before moving on. */
function DetailsStep({ initial, onNext }: { initial: Details; onNext: (v: Details) => void }) {
  const form = useAppForm({ defaultValues: initial, validators: { onChange: details }, onSubmit: ({ value }) => onNext(value) });
  return (
    <form.AppForm>
      <form.Form aria-label={STEPS[0]}>
        <form.ErrorSummary />
        <form.AppField name="name">{(field) => <field.TextField label="Full name" autoComplete="name" />}</form.AppField>
        <form.AppField name="postcode">{(field) => <field.TextField label="Postcode" inputMode="numeric" autoComplete="postal-code" helperText="4 digits, to match you with a chapter." />}</form.AppField>
        <div><form.SubmitButton>Continue</form.SubmitButton></div>
      </form.Form>
    </form.AppForm>
  );
}

/** Step 2. */
function MembershipStep({ initial, onNext, onBack }: { initial: Membership; onNext: (v: Membership) => void; onBack: () => void }) {
  const form = useAppForm({ defaultValues: initial, validators: { onChange: membership }, onSubmit: ({ value }) => onNext(value) });
  return (
    <form.AppForm>
      <form.Form aria-label={STEPS[1]}>
        <form.ErrorSummary />
        <form.AppField name="interest">
          {(field) => (
            <field.Select
              label="Main interest"
              placeholder="Choose one"
              options={[
                { value: "Night watches", label: "Night watches" },
                { value: "Tear-pool mapping", label: "Tear-pool mapping" },
                { value: "Folklore archive", label: "Folklore archive" },
              ]}
            />
          )}
        </form.AppField>
        <form.AppField name="frequency">
          {(field) => (
            <field.RadioGroup
              legend="How often will you join night watches?"
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "two-monthly", label: "Every two months" },
                { value: "six-monthly", label: "Every six months" },
              ]}
            />
          )}
        </form.AppField>
        <div className={styles.actions}>
          <form.SubmitButton>Continue</form.SubmitButton>
          <Button variant="ghost" onClick={onBack}>Back</Button>
        </div>
      </form.Form>
    </form.AppForm>
  );
}

/**
 * A form in steps. Answers are kept as you go back and forth, the heading
 * takes focus on each new step so screen readers announce it, and nothing
 * is sent until the last step.
 */
export function MembershipApplicationSteps() {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<{ details: Details; membership: Membership }>({
    details: { name: "", postcode: "" },
    membership: { interest: "", frequency: "" },
  });
  const [done, setDone] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    headingRef.current?.focus();
  }, [step]);

  if (done) return <Alert tone="success" role="status">Application received for {answers.details.name}.</Alert>;

  return (
    <div className={styles.steps}>
      <div className={styles.stepHeader}>
        <Text tone="secondary">Step {step + 1} of {STEPS.length}</Text>
        <Heading level={2} ref={headingRef} tabIndex={-1}>{STEPS[step]}</Heading>
        <ProgressBar value={((step + 1) / STEPS.length) * 100} ariaLabel={`Step ${step + 1} of ${STEPS.length}`} />
      </div>
      {step === 0 ? (
        <DetailsStep initial={answers.details} onNext={(v) => { setAnswers((a) => ({ ...a, details: v })); setStep(1); }} />
      ) : step === 1 ? (
        <MembershipStep
          initial={answers.membership}
          onBack={() => setStep(0)}
          onNext={(v) => { setAnswers((a) => ({ ...a, membership: v })); setStep(2); }}
        />
      ) : (
        <>
          <dl className={styles.review}>
            <dt>Full name</dt><dd>{answers.details.name}</dd>
            <dt>Postcode</dt><dd>{answers.details.postcode}</dd>
            <dt>Main interest</dt><dd>{answers.membership.interest}</dd>
            <dt>Night watches</dt><dd>{answers.membership.frequency}</dd>
          </dl>
          <div className={styles.actions}>
            <Button variant="primary" onClick={() => setDone(true)}>Submit application</Button>
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
          </div>
        </>
      )}
    </div>
  );
}
