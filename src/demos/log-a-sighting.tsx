import React from "react";
import { z } from "zod";
import { Accordion, Alert, Badge, Card, ConfirmModal, IconButton, Link, Motion, Popover, Text, Tooltip, VStack, useToast } from "../components";
import { useAppForm } from "../components/functional/form/form";
import { HelpIcon, InfoIcon } from "../components/functional-primitive/icon/icon";
import { CHAPTERS } from "./fixtures";
import { SocietyAppShell } from "./demo-shell";
import styles from "./demos.module.css";

const KINDS = [
  { value: "trail", label: "Tear trail" },
  { value: "pool", label: "Tear pool" },
  { value: "weeping", label: "Heard weeping" },
  { value: "glimpse", label: "Glimpse" },
];

const SIZES = [
  { value: "small", label: "Under 30 cm" },
  { value: "medium", label: "30 to 60 cm" },
  { value: "large", label: "Over 60 cm" },
];

const EVIDENCE = [
  { value: "photo", label: "Photo" },
  { value: "sound", label: "Sound recording" },
  { value: "none", label: "None this time" },
];

// Volumes are typed in millilitres and kept as text until they're read.
const NOT_A_VOLUME = "Enter a number of millilitres, like 250";
const required = (message: string) => z.string().trim().min(1, message).regex(/^\d+(\.\d+)?$/, NOT_A_VOLUME);
const optional = z.string().trim().regex(/^(\d+(\.\d+)?)?$/, NOT_A_VOLUME);

const schema = z
  .object({
    chapter: z.string().min(1, "Choose the chapter you're reporting to"),
    place: z.string().trim().min(1, "Enter where you were, like a track name or the nearest road"),
    gps: z.string(),
    date: z.string().min(1, "Enter the date of the sighting"),
    kind: z.string().min(1, "Choose what you saw"),
    size: z.string().min(1, "Choose an estimated size"),
    evidence: z.string(),
    volume: required("Enter the tear volume in millilitres, or 0 if you saw none"),
    measured: optional,
    added: optional,
    removed: optional,
    declaration: z.literal(true, { error: "Confirm that no squonk was chased or captured" }),
  })
  .refine((v) => num(v.measured) <= num(v.volume), {
    path: ["measured"],
    message: "Measured volume can't be more than your estimated tear volume",
    // Run even while other fields have errors, so this shows with them.
    when: () => true,
  });

type Sighting = z.input<typeof schema>;

// Volumes are rounded to a tenth of a millilitre once, so the totals add up exactly.
function num(v: string | undefined) {
  const n = Number.parseFloat(v ?? "");
  return Number.isNaN(n) ? 0 : Math.round(n * 10) / 10;
}
const ml = (n: number) => `${n.toLocaleString("en-NZ", { maximumFractionDigits: 1 })}\u00a0mL`; // never wrap the unit away from its number

/** The volume to record, the corrections to earlier reports and the net (negative when earlier reports shrink), all in tenths of a millilitre. */
function calculate(v: Sighting) {
  const estimated = Math.round(num(v.volume) * 10);
  const corrections = Math.round(num(v.added) * 10) - Math.round(num(v.removed) * 10);
  return { estimated: estimated / 10, corrections: corrections / 10, net: (estimated + corrections) / 10 };
}

function Term({ term, hint }: { term: string; hint: string }) {
  return (
    <span className={styles.term}>
      {term}
      <Tooltip content={hint}>
        <IconButton icon={<HelpIcon />} label={`About ${term.toLowerCase()}`} tooltip={false} />
      </Tooltip>
    </span>
  );
}

function Calculation({ values }: { values: Sighting }) {
  const { estimated, corrections, net } = calculate(values);
  return (
    <Card variant="outlined">
      <VStack gap="sm">
        <Text weight="bold">Your report so far</Text>
        <dl className={styles.summaryList} aria-live="polite">
          <div className={styles.lineItem}><dt>Estimated tear volume</dt><dd>{ml(estimated)}</dd></div>
          <div className={styles.lineItem}><dt>Corrections to earlier reports</dt><dd>{corrections < 0 ? "−" : ""}{ml(Math.abs(corrections))}</dd></div>
          {/* The total flashes each time it recalculates, so a change made
              further up the form isn't missed. */}
          <Motion.Highlight watch={net}>
            <div className={`${styles.lineItem} ${styles.total}`}>
              <dt>{net >= 0 ? "Volume to record" : "Volume to remove"}</dt>
              <dd>{ml(Math.abs(net))}</dd>
            </div>
          </Motion.Highlight>
        </dl>
        <Motion.Swap watch={net >= 0}>
          <Badge tone={net >= 0 ? "success" : "warning"}>{net >= 0 ? "Verified in about 5 working days" : "Earlier reports will be corrected"}</Badge>
        </Motion.Swap>
        <Accordion
          headingLevel={3}
          items={[
            {
              value: "how",
              title: "How we record this",
              content: (
                <Text>
                  We record your estimated tear volume, then add or remove any corrections to earlier reports. A verifier
                  compares the total with your evidence and the chapter's map of tear pools.
                </Text>
              ),
            },
          ]}
        />
      </VStack>
    </Card>
  );
}

function SightingForm() {
  const toast = useToast();
  const [confirming, setConfirming] = React.useState<Sighting | null>(null);
  const [logging, setLogging] = React.useState(false);
  const [logged, setLogged] = React.useState<{ reference: string; net: number }>();

  const form = useAppForm({
    defaultValues: { chapter: "waikato", place: "", gps: "", date: "", kind: "", size: "", evidence: "", volume: "", measured: "", added: "", removed: "", declaration: false } as unknown as Sighting,
    validators: { onChange: schema },
    onSubmit: ({ value }) => setConfirming(value),
  });

  if (logged) {
    return (
      <Motion.Presence show playOnMount>
        <Alert tone="success" title="Sighting logged">
          Your reference is <strong>{logged.reference}</strong>.{" "}
          {logged.net >= 0 ? `A verifier will review ${ml(logged.net)} of tear volume in about 5 working days.` : `We'll correct earlier reports by ${ml(-logged.net)} in about 5 working days.`}{" "}
          <Link href="#sightings">View your sightings</Link>
        </Alert>
      </Motion.Presence>
    );
  }

  return (
    <div className={styles.twoColumn}>
      {/* The form, then its calculation, arrive in turn. */}
      <Motion.Stagger>
        <Motion.Presence show playOnMount>
          <Card variant="outlined">
            <form.AppForm>
              <form.Form aria-label="Sighting report" className={styles.amounts}>
                <form.ErrorSummary />
                <Text tone="secondary">Estimate volumes in millilitres. Leave a box empty if it doesn't apply.</Text>
                <form.AppField name="chapter">
                  {(field) => <field.Select label="Chapter" placeholder="Choose a chapter" options={CHAPTERS} />}
                </form.AppField>
                <form.AppField name="place">
                  {(field) => <field.TextField label="Place" helperText="A track name, hemlock stand or the nearest road." />}
                </form.AppField>
                <form.AppField name="gps">
                  {(field) => (
                    <div className={styles.labelWithHelp}>
                      <field.TextField label="GPS coordinates (optional)" placeholder="-38.0850, 175.5230" />
                      <Popover
                        size="sm"
                        placement="bottom-end"
                        title="GPS coordinates"
                        trigger={<IconButton icon={<InfoIcon />} label="Why add GPS coordinates?" tooltip={false} />}
                      >
                        <Text>Coordinates help the chapter map tear pools. Leave them out if the spot is sensitive, and a verifier will agree a general location with you.</Text>
                        <Link href="#mapping">More about tear-pool mapping</Link>
                      </Popover>
                    </div>
                  )}
                </form.AppField>
                <form.AppField name="date">
                  {(field) => <field.TextField label="Date of the sighting" type="date" fullWidth={false} />}
                </form.AppField>
                <form.AppField name="kind">{(field) => <field.RadioGroup legend="What did you see?" direction="row" options={KINDS} />}</form.AppField>
                <form.AppField name="size">{(field) => <field.RadioGroup legend="Estimated size" direction="row" options={SIZES} />}</form.AppField>
                <form.AppField name="volume">
                  {(field) => <field.TextField label="Estimated tear volume (mL)" inputMode="decimal" fullWidth={false} helperText="Everything you saw, trail and pools together." />}
                </form.AppField>
                <form.AppField name="measured">
                  {(field) => <field.TextField label="Measured with a sampler (mL)" inputMode="decimal" fullWidth={false} helperText="Only if you took a measurement without approaching it." />}
                </form.AppField>
                <form.AppField name="evidence">
                  {(field) => <field.Select label="Evidence (optional)" placeholder="Photo or sound recording" options={EVIDENCE} />}
                </form.AppField>
                <div className={styles.adjustments}>
                  <Text weight="bold" as="h2" className={styles.groupTitle}>
                    <Term term="Corrections" hint="Changes to reports you've already logged: volume to add, or volume to remove." />
                  </Text>
                  <div className={styles.pair}>
                    <form.AppField name="added">{(field) => <field.TextField label="Add to earlier reports (mL)" inputMode="decimal" />}</form.AppField>
                    <form.AppField name="removed">{(field) => <field.TextField label="Remove from earlier reports (mL)" inputMode="decimal" />}</form.AppField>
                  </div>
                </div>
                <form.AppField name="declaration">
                  {(field) => <field.Checkbox label="No squonk was chased, cornered or captured, and this report is true to the best of my knowledge" />}
                </form.AppField>
                <div className={styles.formActions}>
                  <form.SubmitButton>Log sighting</form.SubmitButton>
                </div>
              </form.Form>
            </form.AppForm>
          </Card>
        </Motion.Presence>

        <Motion.Presence show playOnMount>
          <aside className={styles.sticky} aria-label="Calculation">
            <form.Subscribe selector={(state) => state.values}>{(values) => <Calculation values={values} />}</form.Subscribe>
          </aside>
        </Motion.Presence>
      </Motion.Stagger>

      <ConfirmModal
        open={confirming !== null}
        title="Log this sighting?"
        message={
          confirming
            ? `You're logging a ${KINDS.find((k) => k.value === confirming.kind)?.label.toLowerCase() ?? "sighting"} at ${confirming.place}. ${calculate(confirming).net >= 0 ? `We'll record ${ml(calculate(confirming).net)} of tear volume.` : `We'll correct earlier reports by ${ml(-calculate(confirming).net)}.`} You can't change a logged sighting, but you can correct it later.`
            : undefined
        }
        confirmLabel="Log sighting"
        cancelLabel="Go back"
        loading={logging}
        onCancel={() => setConfirming(null)}
        onConfirm={async () => {
          if (!confirming) return;
          setLogging(true);
          await new Promise((resolve) => setTimeout(resolve, 900));
          const net = calculate(confirming).net;
          setLogging(false);
          setConfirming(null);
          setLogged({ reference: "SQ-2026-10-58213", net });
          toast.success("We've received your sighting report.", "Sighting logged");
        }}
      />
    </div>
  );
}

/** A sighting report with a live tear-volume summary and a confirmation before logging. */
export function LogASighting() {
  return (
    <SocietyAppShell
      active="Sightings"
      crumbs={[{ label: "My account", href: "#account" }, { label: "Sightings", href: "#sightings" }, { label: "Log a sighting" }]}
      title="Log a sighting"
      description="Tell the Society what you saw. Please never approach, chase or touch a squonk."
    >
      <SightingForm />
    </SocietyAppShell>
  );
}
