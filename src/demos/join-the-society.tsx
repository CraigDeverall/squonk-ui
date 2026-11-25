import React from "react";
import { z } from "zod";
import { Accordion, Alert, Button, Card, Drawer, Heading, Link, Motion, Text, VStack, useToast } from "../components";
import { useAppForm } from "../components/functional/form/form";
import { INTERESTS, CHAPTERS } from "./fixtures";
import { SocietyAppShell } from "./demo-shell";
import styles from "./demos.module.css";

const ACTIVITIES = [
  { value: "night-watch", label: "Night watches", helperText: "Overnight, in small groups, from October to March" },
  { value: "kit", label: "Night-watch kit hire", helperText: "Red-filtered torch, tear-pool sampler and a thermos" },
  { value: "swamp-fund", label: "Swamp Fund levy", helperText: "Optional, towards habitat restoration" },
];

const TIERS = [
  { value: "tadpole", label: "Tadpole" },
  { value: "wanderer", label: "Wanderer" },
  { value: "keeper", label: "Keeper" },
  { value: "life", label: "Life member" },
];

const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "two-monthly", label: "Every two months" },
  { value: "six-monthly", label: "Every six months", helperText: "Only if you live more than two hours from your chapter" },
];

const schema = z
  .object({
    fullName: z.string().trim().min(1, "Enter your full name"),
    tier: z.string().min(1, "Choose your membership tier"),
    interest: z.string().min(1, "Choose your main interest"),
    startDate: z.string().min(1, "Enter the date you started watching"),
    contactName: z.string().trim().min(1, "Enter a contact name"),
    email: z.email("Enter an email address in the right format, like name@example.org"),
    phone: z.string().trim().regex(/^[\d\s+()-]{7,}$/, "Enter a phone number, like 04 555 0192"),
    chapter: z.string().min(1, "Choose your chapter"),
    activities: z.array(z.string()).min(1, "Choose at least one activity to join"),
    kits: z.string(),
    frequency: z.string(),
    notes: z.string().max(300, "Notes must be 300 characters or fewer"),
  })
  // Cross-field rules run even while other fields have errors (`when`),
  // so they appear in the error summary alongside them.
  .refine((v) => !v.activities.includes("kit") || /^\d+$/.test(v.kits), {
    path: ["kits"],
    message: "Enter how many kits you need, as a number",
    when: () => true,
  })
  .refine((v) => !v.activities.includes("night-watch") || v.frequency !== "", {
    path: ["frequency"],
    message: "Choose how often you will join night watches",
    when: () => true,
  });

type Application = z.infer<typeof schema>;

const labelOf = (list: { value: string; label: string }[], value: string) => list.find((o) => o.value === value)?.label ?? "—";

function Summary({ value }: { value: Application }) {
  const row = (term: string, detail: React.ReactNode) => (
    <div className={styles.summaryRow}>
      <dt>{term}</dt>
      <dd>{detail}</dd>
    </div>
  );
  return (
    <Accordion
      variant="contained"
      multiple
      defaultValue={["membership", "contact", "activities"]}
      headingLevel={3}
      items={[
        {
          value: "membership",
          title: "Membership",
          description: value.fullName,
          content: (
            <dl className={styles.summaryList}>
              {row("Tier", labelOf(TIERS, value.tier))}
              {row("Main interest", labelOf(INTERESTS, value.interest))}
              {row("Watching since", value.startDate)}
            </dl>
          ),
        },
        {
          value: "contact",
          title: "Contact",
          description: value.contactName,
          content: (
            <dl className={styles.summaryList}>
              {row("Email", value.email)}
              {row("Phone", value.phone)}
              {row("Chapter", labelOf(CHAPTERS, value.chapter))}
            </dl>
          ),
        },
        {
          value: "activities",
          title: "Activities",
          description: value.activities.map((t) => labelOf(ACTIVITIES, t)).join(", "),
          content: (
            <dl className={styles.summaryList}>
              {value.activities.includes("night-watch") ? row("Night watches", labelOf(FREQUENCIES, value.frequency)) : null}
              {value.activities.includes("kit") ? row("Kits to hire", value.kits) : null}
              {row("Notes", value.notes || "None")}
            </dl>
          ),
        },
      ]}
    />
  );
}

/** A titled part of a long form. Groups of related questions inside it
 *  use Fieldset (or a CheckboxGroup or RadioGroup). */
function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const id = React.useId();
  return (
    <section className={styles.formSection} aria-labelledby={id}>
      <div className={styles.formSectionHeader}>
        <Heading level={4} as="h2" id={id}>{title}</Heading>
        {description ? <Text tone="secondary">{description}</Text> : null}
      </div>
      <div className={styles.formSectionFields}>{children}</div>
    </section>
  );
}

function ApplicationForm() {
  const toast = useToast();
  const [review, setReview] = React.useState<Application | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [reference, setReference] = React.useState<string>();

  const form = useAppForm({
    defaultValues: {
      fullName: "",
      tier: "",
      interest: "",
      startDate: "",
      contactName: "",
      email: "",
      phone: "",
      chapter: "",
      activities: [] as string[],
      kits: "",
      frequency: "",
      notes: "",
    } satisfies Application,
    validators: { onChange: schema },
    onSubmit: ({ value }) => setReview(value),
  });

  const join = async () => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSubmitting(false);
    setReview(null);
    setReference("APP-2026-118204");
    toast.success("We'll email your membership number within 2 working days.", "Application sent");
  };

  if (reference) {
    return (
      <Motion.Presence show playOnMount>
        <Alert tone="success" title="Application sent">
          Your reference is <strong>{reference}</strong>. We'll email your membership number to{" "}
          {form.state.values.email} within 2 working days. <Link href="#account">Back to your account</Link>
        </Alert>
      </Motion.Presence>
    );
  }

  return (
    <div className={styles.twoColumn}>
      {/* The form, then the guidance beside it, arrive in turn. */}
      <Motion.Stagger>
        <Motion.Presence show playOnMount>
          <Card variant="outlined">
            <form.AppForm>
              <form.Form aria-label="Join the Society">
                <form.ErrorSummary />

                <FormSection title="Your membership">
                  <form.AppField name="fullName">{(field) => <field.TextField label="Full name" autoComplete="name" />}</form.AppField>
                  <form.AppField name="tier">{(field) => <field.RadioGroup legend="Membership tier" direction="row" options={TIERS} />}</form.AppField>
                  <form.AppField name="interest">
                    {(field) => (
                      <field.Select
                        searchable
                        label="Main interest"
                        placeholder="Search by name or code, like INT-02"
                        helperText="What you mainly want to do with the Society."
                        options={INTERESTS}
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="startDate">{(field) => <field.TextField label="Date you started watching" type="date" fullWidth={false} />}</form.AppField>
                </FormSection>

                <FormSection title="Contact" description="Who we talk to about this membership.">
                  <form.AppField name="contactName">{(field) => <field.TextField label="Contact name" autoComplete="name" />}</form.AppField>
                  <form.AppField name="email">{(field) => <field.TextField label="Email" type="email" autoComplete="email" />}</form.AppField>
                  <form.AppField name="phone">{(field) => <field.TextField label="Phone" type="tel" autoComplete="tel" fullWidth={false} />}</form.AppField>
                  <form.AppField name="chapter">{(field) => <field.Select searchable clearable label="Chapter" placeholder="Start typing a chapter" options={CHAPTERS} />}</form.AppField>
                </FormSection>

                <FormSection title="Activities">
                  <form.AppField name="activities">{(field) => <field.CheckboxGroup legend="Which activities do you want to join?" options={ACTIVITIES} />}</form.AppField>
                  {/* Follow-up questions join and leave with the activities they
                      belong to. Presence stays mounted, so each can leave. */}
                  <form.Subscribe selector={(state) => state.values.activities}>
                    {(activities) => (
                      <>
                        <Motion.Presence show={activities.includes("night-watch")}>
                          <div className={styles.questions}>
                            <form.AppField name="frequency">{(field) => <field.RadioGroup legend="How often will you join night watches?" options={FREQUENCIES} />}</form.AppField>
                          </div>
                        </Motion.Presence>
                        <Motion.Presence show={activities.includes("kit")}>
                          <div className={styles.questions}>
                            <form.AppField name="kits">{(field) => <field.TextField label="How many kits do you need?" inputMode="numeric" fullWidth={false} />}</form.AppField>
                          </div>
                        </Motion.Presence>
                      </>
                    )}
                  </form.Subscribe>
                  <form.AppField name="notes">{(field) => <field.Textarea label="Anything else we should know? (optional)" maxLength={300} showCount autoResize />}</form.AppField>
                </FormSection>

                <div className={styles.formActions}>
                  <form.SubmitButton>Review application</form.SubmitButton>
                  <Button variant="ghost" type="button" onClick={() => form.reset()}>Start again</Button>
                </div>
              </form.Form>
            </form.AppForm>
          </Card>
        </Motion.Presence>

        <Motion.Presence show playOnMount>
          <aside className={styles.sticky}>
            <Card variant="outlined">
              <VStack gap="sm">
                <Text weight="bold">Before you start</Text>
                <Text>You'll need your email address, a payment card for your first dues and, for a Tadpole, a parent or guardian's contact details.</Text>
                <Text tone="secondary">It takes about 5 minutes. A Tadpole is under 18 and a Keeper is a household.</Text>
                <Link href="#help">Read the membership guide</Link>
              </VStack>
            </Card>
          </aside>
        </Motion.Presence>
      </Motion.Stagger>

      <Drawer
        open={review !== null}
        onClose={() => setReview(null)}
        title="Check your application"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReview(null)}>Change something</Button>
            <Button variant="primary" lift={false} aria-busy={submitting || undefined} onClick={join}>
              {submitting ? "Sending…" : "Submit application"}
            </Button>
          </>
        }
      >
        {review ? (
          <>
            <Text>Check these details before you apply. You can change them later, but your first dues statement uses them.</Text>
            <Summary value={review} />
          </>
        ) : null}
      </Drawer>
    </div>
  );
}

/** A membership application for the Society, with a review step. */
export function JoinTheSociety() {
  return (
    <SocietyAppShell
      crumbs={[{ label: "My account", href: "#account" }, { label: "Join the Society" }]}
      title="Join the Society"
      description="For new members and households. Already a member? Sign in to change your tier."
    >
      <ApplicationForm />
    </SocietyAppShell>
  );
}
