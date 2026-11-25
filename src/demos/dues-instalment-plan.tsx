import React from "react";
import { z } from "zod";
import { Alert, Card, ConfirmModal, Currency, formatCurrency, Link, Motion, Table, Text, toMinorUnits, VStack, useToast } from "../components";
import type { TableColumn } from "../components";
import { useAppForm } from "../components/functional/form/form";
import { nz, shortDate } from "./fixtures";
import { Stat, SocietyAppShell } from "./demo-shell";
import styles from "./demos.module.css";

const DUES = [
  { id: "dues", item: "Annual dues, 2026–27 season", amount: 148.2 },
  { id: "late", item: "Late fee", amount: 7.41 },
  { id: "reminder", item: "Reminder fee to today", amount: 2.5 },
];
// Money is added up and split in cents, so instalments sum to the cent.
const TOTAL = DUES.reduce((sum, d) => sum + toMinorUnits(d.amount, 2), 0);
const nzd = (amountInCents: number) => formatCurrency(amountInCents, { ...nz, minorUnits: true });
const PLAN_FEE_RATE = 0.1091;
const FREQUENCIES = [
  { value: "weekly", label: "Weekly", days: 7 },
  { value: "fortnightly", label: "Fortnightly", days: 14 },
  { value: "monthly", label: "Monthly", days: 30 },
];

const schema = z
  .object({
    approach: z.string().min(1, "Choose how you'd like to pay"),
    frequency: z.string(),
    count: z.string(),
    start: z.string(),
    reasons: z.array(z.string()),
    details: z.string().max(400, "Keep this to 400 characters or fewer"),
  })
  .refine((v) => v.approach !== "instalments" || v.frequency !== "", { path: ["frequency"], message: "Choose how often you'll pay", when: () => true })
  .refine((v) => v.approach !== "instalments" || v.count !== "", { path: ["count"], message: "Choose how many payments", when: () => true })
  .refine((v) => v.approach !== "instalments" || v.start !== "", { path: ["start"], message: "Enter the date of your first payment", when: () => true })
  .refine((v) => v.approach !== "instalments" || v.start === "" || v.start <= "2026-12-03", {
    path: ["start"],
    message: "Your first payment must be within 30 days, by 3 December 2026",
    when: () => true,
  });

type Plan = z.infer<typeof schema>;

interface Instalment {
  n: number;
  date: string;
  /** In cents. */
  amount: number;
}

function schedule(plan: Plan): { rows: Instalment[]; planFee: number } {
  const freq = FREQUENCIES.find((f) => f.value === plan.frequency);
  const count = Number(plan.count);
  if (plan.approach !== "instalments" || !freq || !count || !plan.start) return { rows: [], planFee: 0 };
  const years = (freq.days * count) / 365;
  const planFee = Math.round((TOTAL * PLAN_FEE_RATE * years) / 2);
  const each = Math.round((TOTAL + planFee) / count);
  const start = new Date(plan.start);
  const rows = Array.from({ length: count }, (_, i) => {
    const date = new Date(start);
    if (freq.value === "monthly") date.setMonth(date.getMonth() + i);
    else date.setDate(date.getDate() + i * freq.days);
    return { n: i + 1, date: date.toISOString().slice(0, 10), amount: i === count - 1 ? TOTAL + planFee - each * (count - 1) : each };
  });
  return { rows, planFee };
}

const columns: TableColumn<Instalment>[] = [
  { key: "n", header: "Payment", width: "100px" },
  { key: "date", header: "Date", render: (r) => shortDate(r.date) },
  { key: "amount", header: "Amount", align: "right", render: (r) => <Currency {...nz} value={r.amount} minorUnits /> },
];

function PlanForm() {
  const toast = useToast();
  const [confirming, setConfirming] = React.useState<Plan | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState<string>();

  const form = useAppForm({
    defaultValues: { approach: "", frequency: "", count: "", start: "", reasons: [] as string[], details: "" } satisfies Plan,
    validators: { onChange: schema },
    onSubmit: ({ value }) => setConfirming(value),
  });

  if (done) {
    return (
      <Motion.Presence show playOnMount>
        <Alert tone="success" title="Plan set up">
          {done} We'll stop adding late fees while you keep to it. <Link href="#instalment-plans">View your plan</Link>
        </Alert>
      </Motion.Presence>
    );
  }

  return (
    <VStack gap="lg">
      {/* What's owed, then the form, arrive in turn. */}
      <Motion.Stagger>
        <Motion.Presence show playOnMount>
          <Card variant="outlined">
            <div className={styles.debtSummary}>
              <Stat label="Overdue" value={<Currency {...nz} value={TOTAL} minorUnits />} tone="error" />
              <ul className={styles.plainList}>
                {DUES.map((d) => (
                  <li key={d.id} className={styles.lineItem}><span>{d.item}</span><Currency {...nz} value={d.amount} /></li>
                ))}
              </ul>
            </div>
          </Card>
        </Motion.Presence>

        <Motion.Presence show playOnMount>
          <Card variant="outlined">
            <form.AppForm>
              <form.Form aria-label="Dues instalment plan">
                <form.ErrorSummary />
                <form.AppField name="approach">
                  {(field) => (
                    <field.RadioGroup
                      legend="How would you like to pay?"
                      options={[
                        { value: "full", label: `Pay ${nzd(TOTAL)} now`, helperText: "Stops the plan fee today" },
                        { value: "instalments", label: "Pay in instalments", helperText: "The plan fee continues at 10.91% a year on what's left" },
                      ]}
                    />
                  )}
                </form.AppField>

                {/* The instalment questions join and leave as the choice
                    changes; they stay mounted under Presence so they can leave. */}
                <form.Subscribe selector={(state) => state.values}>
                  {(values) => {
                    const instalments = values.approach === "instalments";
                    // Worked out as instalments even while the questions leave,
                    // so the schedule doesn't vanish before they do.
                    const { rows, planFee } = schedule({ ...values, approach: "instalments" });
                    return (
                      <Motion.Presence show={instalments}>
                        <div className={styles.questions}>
                          <div className={styles.pair}>
                            <form.AppField name="frequency">
                              {(field) => <field.Select label="How often" placeholder="Choose" options={FREQUENCIES.map(({ value, label }) => ({ value, label }))} />}
                            </form.AppField>
                            <form.AppField name="count">
                              {(field) => (
                                <field.Select
                                  label="Number of payments"
                                  placeholder="Choose"
                                  options={[3, 4, 6, 8, 10, 12].map((n) => ({ value: String(n), label: `${n} payments` }))}
                                />
                              )}
                            </form.AppField>
                          </div>
                          <form.AppField name="start">
                            {(field) => <field.TextField label="First payment" type="date" fullWidth={false} helperText="Within 30 days, by 3 December 2026." />}
                          </form.AppField>
                          {/* The schedule appears once it can be worked out; its
                              plan fee counts to each new figure and flashes, so a
                              recalculation is noticed. */}
                          <Motion.Presence show={rows.length > 0}>
                            <VStack gap="sm">
                              <Motion.Highlight watch={planFee}>
                                <div className={styles.lineItem}>
                                  <Text weight="bold">Your schedule</Text>
                                  <Text tone="secondary">Includes about <Motion.Count value={planFee} format={(cents) => nzd(Math.round(cents))} /> plan fee</Text>
                                </div>
                              </Motion.Highlight>
                              <Table caption="Instalment schedule" columns={columns} rows={rows} rowKey="n" pageSize={6} />
                            </VStack>
                          </Motion.Presence>
                        </div>
                      </Motion.Presence>
                    );
                  }}
                </form.Subscribe>

                <form.AppField name="reasons">
                  {(field) => (
                    <field.CheckboxGroup
                      legend="Why can't you pay in full? (optional)"
                      helperText="This helps us suggest other support."
                      options={[
                        { value: "cashflow", label: "Waiting on a payment owed to me" },
                        { value: "costs", label: "Unexpected costs" },
                        { value: "seasonal", label: "Seasonal income" },
                        { value: "other", label: "Something else" },
                      ]}
                    />
                  )}
                </form.AppField>
                <form.AppField name="details">{(field) => <field.Textarea label="Anything else? (optional)" maxLength={400} showCount autoResize rows={2} />}</form.AppField>
                <div className={styles.formActions}>
                  <form.SubmitButton>Continue</form.SubmitButton>
                </div>
              </form.Form>
            </form.AppForm>
          </Card>
        </Motion.Presence>
      </Motion.Stagger>

      <ConfirmModal
        open={confirming !== null}
        title={confirming?.approach === "full" ? `Pay ${nzd(TOTAL)} now?` : "Set up this plan?"}
        message={
          confirming?.approach === "instalments"
            ? `${confirming.count} ${FREQUENCIES.find((f) => f.value === confirming.frequency)?.label.toLowerCase()} payments, starting ${shortDate(confirming.start)}. Missing a payment cancels the plan.`
            : "You'll go to the payment page next."
        }
        confirmLabel={confirming?.approach === "full" ? "Pay now" : "Set up plan"}
        cancelLabel="Go back"
        loading={saving}
        onCancel={() => setConfirming(null)}
        onConfirm={async () => {
          if (!confirming) return;
          setSaving(true);
          await new Promise((resolve) => setTimeout(resolve, 800));
          setSaving(false);
          const summary =
            confirming.approach === "full"
              ? `You've paid ${nzd(TOTAL)}.`
              : `Your first payment of ${nzd(schedule(confirming).rows[0].amount)} is due on ${shortDate(confirming.start)}.`;
          setConfirming(null);
          setDone(summary);
          toast.success(summary, confirming.approach === "full" ? "Payment made" : "Plan set up");
        }}
      />
    </VStack>
  );
}

/** Set up a dues instalment plan for overdue dues, with a live schedule. */
export function DuesInstalmentPlan() {
  return (
    <SocietyAppShell
      active="Instalment plans"
      crumbs={[{ label: "My account", href: "#account" }, { label: "Instalment plans", href: "#instalment-plans" }, { label: "New plan" }]}
      title="Set up a dues instalment plan"
      description="Pay your overdue dues in instalments you can manage."
    >
      <PlanForm />
    </SocietyAppShell>
  );
}
