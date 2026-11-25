import React from "react";
import { z } from "zod";
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Code,
  ConfirmModal,
  Divider,
  DropdownMenu,
  Fieldset,
  Heading,
  IconButton,
  InteractiveCard,
  Kbd,
  Link,
  MediaObject,
  Motion,
  Pagination,
  QrCode,
  Skeleton,
  Switch,
  Text,
  VStack,
  useToast,
} from "../components";
import { useAppForm } from "../components/functional/form/form";
import {
  CopyIcon,
  DocumentIcon,
  GlobeIcon,
  HelpIcon,
  LockIcon,
  MoreIcon,
  PhoneIcon,
} from "../components/functional-primitive/icon/icon";
import { MEMBER } from "./fixtures";
import { SocietyAppShell } from "./demo-shell";
import styles from "./demos.module.css";

/** A section of the settings page: its title and purpose beside its controls on wide screens. */
function SettingsSection({ id, title, description, children }: { id: string; title: string; description: React.ReactNode; children: React.ReactNode }) {
  const headingId = `${id}-heading`;
  return (
    <section className={styles.formSection} aria-labelledby={headingId} id={id}>
      <div className={styles.formSectionHeader}>
        <Heading level={2} id={headingId}>{title}</Heading>
        <Text tone="secondary">{description}</Text>
      </div>
      <div className={styles.formSectionFields}>{children}</div>
    </section>
  );
}

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter the name of the person we should contact"),
  email: z.email("Enter an email address in the right format, like name@example.co.nz"),
  phone: z.string().trim().min(6, "Enter a phone number we can call during the day"),
  language: z.string().min(1, "Choose a language for letters"),
  street: z.string().trim().min(1, "Enter the street address"),
  town: z.string().trim().min(1, "Enter the town or city"),
  postcode: z.string().regex(/^\d{4}$/, "Enter a 4-digit postcode"),
  about: z.string().max(200, "Keep the note to 200 characters or fewer"),
});

function ProfileForm() {
  const toast = useToast();
  const form = useAppForm({
    defaultValues: {
      name: MEMBER.contact,
      email: MEMBER.email,
      phone: "04 555 0192",
      language: "en",
      street: "14 Rimu Road",
      town: "Paraparaumu",
      postcode: "5032",
      about: "Please call before 3pm; I'm usually out on a hemlock walk in the afternoon.",
    },
    validators: { onChange: profileSchema },
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("We'll use these details from now on.", "Contact details saved");
    },
  });
  return (
    <form.AppForm>
      <form.Form aria-label="Contact details">
        <VStack gap="lg">
          <form.ErrorSummary />
          <MediaObject media={<Avatar name={MEMBER.contact} />} align="center">
            <Text weight="bold">{MEMBER.contact}</Text>
            <Text tone="secondary">Wanderer, {MEMBER.chapter}</Text>
          </MediaObject>
          <Divider />
          <form.AppField name="name">{(field) => <field.TextField label="Contact name" autoComplete="name" />}</form.AppField>
          <form.AppField name="email">
            {(field) => <field.TextField label="Email" type="email" autoComplete="email" helperText="We send reminders and receipts here." />}
          </form.AppField>
          <form.AppField name="phone">{(field) => <field.TextField label="Daytime phone" type="tel" autoComplete="tel" />}</form.AppField>
          <form.AppField name="language">
            {(field) => (
              <field.Select
                label="Language for letters"
                options={[
                  { value: "en", label: "English" },
                  { value: "mi", label: "Te reo Māori" },
                  { value: "sm", label: "Gagana Sāmoa" },
                  { value: "zh", label: "中文 (Chinese)" },
                ]}
              />
            )}
          </form.AppField>
          <Fieldset legend="Postal address" helperText="Where we post letters we can't send by email.">
            <form.AppField name="street">{(field) => <field.TextField label="Street address" autoComplete="street-address" />}</form.AppField>
            <div className={styles.fieldPair}>
              <form.AppField name="town">{(field) => <field.TextField label="Town or city" autoComplete="address-level2" />}</form.AppField>
              <form.AppField name="postcode">{(field) => <field.TextField label="Postcode" inputMode="numeric" autoComplete="postal-code" />}</form.AppField>
            </div>
          </Fieldset>
          <form.AppField name="about">
            {(field) => <field.Textarea label="Note for our staff" helperText="Anything that helps us reach you." showCount maxLength={200} rows={3} />}
          </form.AppField>
          <div className={styles.formActions}>
            <form.SubmitButton pendingLabel="Saving…">Save contact details</form.SubmitButton>
          </div>
        </VStack>
      </form.Form>
    </form.AppForm>
  );
}

/** A switch that saves the moment it changes, says so, and moves back if saving fails. */
function InstantSetting({ label, helperText, initial, fails }: { label: string; helperText: string; initial: boolean; fails?: boolean }) {
  const [on, setOn] = React.useState(initial);
  const [status, setStatus] = React.useState<string | null>(null);
  // Only the latest change may report back: an older save finishing late
  // must not undo or relabel a newer choice.
  const latest = React.useRef(0);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <div className={styles.settingRow}>
      <Switch
        label={label}
        helperText={helperText}
        checked={on}
        onChange={(next) => {
          const request = ++latest.current;
          setOn(next);
          setStatus("Saving…");
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => {
            if (request !== latest.current) return;
            if (fails) {
              setOn(!next);
              setStatus("Couldn't save. Nothing changed; try again later.");
            } else setStatus("Saved");
          }, 600);
        }}
      />
      {/* Each new status eases in, so "Saved" or a failure is noticed. */}
      <Motion.Swap watch={status}>
        <Text as="span" tone="secondary" role="status" className={styles.settingStatus}>{status}</Text>
      </Motion.Swap>
    </div>
  );
}

function StatementsForm() {
  const toast = useToast();
  const form = useAppForm({
    defaultValues: { statements: ["dues", "levy"] as string[], delivery: "email" },
    validators: { onChange: z.object({ statements: z.array(z.string()).min(1, "Choose at least one statement"), delivery: z.string() }) },
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success("Your next statements will follow these choices.", "Statement preferences saved");
    },
  });
  return (
    <form.AppForm>
      <form.Form aria-label="Statements">
        <VStack gap="lg">
          <form.AppField name="statements">
            {(field) => (
              <field.CheckboxGroup
                legend="Send me statements for"
                options={[
                  { value: "dues", label: "Annual dues", helperText: "After each dues period" },
                  { value: "levy", label: "Swamp Fund levy", helperText: "Monthly" },
                  { value: "kit", label: "Night-watch kit hire", helperText: "Once a year" },
                ]}
              />
            )}
          </form.AppField>
          <form.AppField name="delivery">
            {(field) => (
              <field.RadioGroup
                legend="How should we send them?"
                options={[
                  { value: "email", label: "Email, with a PDF attached" },
                  { value: "online", label: "Online only", helperText: "We'll email to say one is ready" },
                  { value: "post", label: "By post", helperText: "Takes up to 5 working days" },
                ]}
              />
            )}
          </form.AppField>
          <div className={styles.formActions}>
            <form.SubmitButton variant="secondary" pendingLabel="Saving…">Save statement preferences</form.SubmitButton>
          </div>
        </VStack>
      </form.Form>
    </form.AppForm>
  );
}

/** A made-up Base32 secret, shown grouped; the QR code carries the same one. */
const SETUP_KEY = "KJLT 4Q2M 7XRA 3PDE";
const SETUP_SECRET = SETUP_KEY.replace(/ /g, "");
const SETUP_URI = `otpauth://totp/Squonk%20Society:${encodeURIComponent(MEMBER.email)}?secret=${SETUP_SECRET}&issuer=Squonk%20Society`;

function TwoStepSetup() {
  const toast = useToast();
  // Say it's copied only once it is; otherwise say how to copy it by hand.
  const copy = async (text: string, what: string) => {
    try {
      if (!navigator.clipboard) throw new Error("No clipboard");
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied.`);
    } catch {
      toast.error(`Couldn't copy the ${what.toLowerCase()}. Select it and copy it yourself.`);
    }
  };
  return (
    <Card variant="outlined">
      <div className={styles.qrSetup}>
        <QrCode value={SETUP_URI} label="Scan with your authenticator app" />
        <VStack gap="sm">
          <Text weight="bold">Scan this with an authenticator app on your phone</Text>
          <Text tone="secondary">
            It adds the Squonk Society to the app, which then shows a new 6-digit code every 30 seconds. You'll enter a code each time you sign in.
          </Text>
          <Text tone="secondary">Can't scan it? Type this key into the app instead:</Text>
          <div className={styles.copyRow}>
            <Code>{SETUP_KEY}</Code>
            <IconButton icon={<CopyIcon />} label="Copy set-up key" variant="ghost" onClick={() => void copy(SETUP_SECRET, "Set-up key")} />
          </div>
          <Divider />
          <Text weight="bold">Recovery codes</Text>
          <Text tone="secondary">Each works once if you lose your phone. Keep them somewhere safe.</Text>
          <Code block>{RECOVERY.join("\n")}</Code>
          <div className={styles.formActions}>
            <Button variant="secondary" onClick={() => void copy(RECOVERY.join("\n"), "Recovery codes")}>
              <CopyIcon /> Copy codes
            </Button>
          </div>
        </VStack>
      </div>
    </Card>
  );
}

const RECOVERY = ["8F2K-QW7M", "LT9P-3XRB", "M4ZD-K8VA", "Q7HN-2CJE"];

interface Session {
  id: string;
  device: string;
  where: string;
  when: string;
  kind: "phone" | "web";
  current?: boolean;
}

const SESSIONS: Session[] = [
  { id: "s1", device: "Chrome on Windows", where: "Paraparaumu", when: "Active now", kind: "web", current: true },
  { id: "s2", device: "Safari on iPhone", where: "Paraparaumu", when: "2 hours ago", kind: "phone" },
  { id: "s3", device: "Firefox on macOS", where: "Wellington", when: "Yesterday", kind: "web" },
  { id: "s4", device: "Squonk Society app, Android", where: "Porirua", when: "3 days ago", kind: "phone" },
  { id: "s5", device: "Edge on Windows", where: "Wellington", when: "1 week ago", kind: "web" },
  { id: "s6", device: "Safari on iPad", where: "Ōtaki", when: "2 weeks ago", kind: "web" },
];

const PAGE_SIZE = 4;

function Sessions() {
  const toast = useToast();
  const [loading, setLoading] = React.useState(true);
  const [sessions, setSessions] = React.useState(SESSIONS);
  const [page, setPage] = React.useState(1);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 800);
    return () => window.clearTimeout(timer);
  }, []);
  // Signing out the last device on a page moves back to the last page that has any.
  const pages = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = sessions.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const signOut = (session: Session) => {
    setSessions((all) => all.filter((s) => s.id !== session.id));
    toast.success(`${session.device} has been signed out.`);
  };
  // The loaded list swaps in for its placeholder.
  return (
    <Motion.Swap watch={loading}>
      {loading ? (
        <VStack gap="md" aria-busy="true" aria-label="Loading signed-in devices">
          {Array.from({ length: 3 }, (_, i) => (
            <MediaObject key={i} media={<Skeleton shape="circle" width={40} height={40} />} align="center">
              <Skeleton shape="text" lines={2} />
            </MediaObject>
          ))}
        </VStack>
      ) : (
        <VStack gap="md">
          {/* Signing a device out lets the rest glide up into its place. */}
          <Motion.Layout>
            <ul className={styles.sessionList} aria-label="Signed-in devices">
              {shown.map((session) => (
                <li key={session.id} className={styles.sessionRow}>
                  <MediaObject media={<span className={styles.sessionIcon}>{session.kind === "phone" ? <PhoneIcon /> : <GlobeIcon />}</span>} align="center">
                    <Text weight="bold">
                      {session.device} {session.current ? <Badge tone="success">This device</Badge> : null}
                    </Text>
                    <Text tone="secondary">{session.where} · {session.when}</Text>
                  </MediaObject>
                  {session.current ? null : (
                    <DropdownMenu
                      align="end"
                      triggerLabel={`Actions for ${session.device}`}
                      trigger={<MoreIcon size="control" />}
                      items={[
                        { key: "details", label: "See sign-in history" },
                        "separator",
                        { key: "sign-out", label: "Sign out", tone: "danger", onSelect: () => signOut(session) },
                      ]}
                    />
                  )}
                </li>
              ))}
            </ul>
          </Motion.Layout>
          {sessions.length > PAGE_SIZE ? (
            <Pagination count={sessions.length} pageSize={PAGE_SIZE} page={current} onPageChange={setPage} aria-label="Signed-in devices pages" />
          ) : null}
        </VStack>
      )}
    </Motion.Swap>
  );
}

const SHORTCUTS: { keys: string[]; does: string }[] = [
  { keys: ["/"], does: "Search your account" },
  { keys: ["G", "P"], does: "Go to payments" },
  { keys: ["G", "R"], does: "Go to sightings" },
  { keys: ["Ctrl", "S"], does: "Save the form you're in" },
  { keys: ["?"], does: "Show all shortcuts" },
];

function Shortcuts() {
  return (
    <dl className={styles.shortcutList}>
      {SHORTCUTS.map((shortcut) => (
        <div key={shortcut.does} className={styles.shortcutRow}>
          <dt>{shortcut.does}</dt>
          <dd>
            {shortcut.keys.map((key, i) => (
              <React.Fragment key={key}>
                {i > 0 ? <Text as="span" tone="secondary"> then </Text> : null}
                <Kbd>{key}</Kbd>
              </React.Fragment>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DangerZone() {
  const toast = useToast();
  const [confirming, setConfirming] = React.useState(false);
  const [working, setWorking] = React.useState(false);
  return (
    <Card variant="outlined">
      <VStack gap="sm">
        <Text weight="bold">Stop using the portal</Text>
        <Text tone="secondary">
          We'll post every newsletter and notice, and you'll log sightings on a paper form. Your membership history stays, and you can switch back by calling us.
        </Text>
        <div className={styles.formActions}>
          <Button variant="danger" onClick={() => setConfirming(true)}>Stop using the portal</Button>
        </div>
      </VStack>
      <ConfirmModal
        open={confirming}
        danger
        loading={working}
        title={`Stop using the portal for ${MEMBER.name}?`}
        message="Everyone with access to this account will be signed out, and online payments and dues instalment plans will stop. You'll need to call us to switch back."
        confirmLabel="Stop using the portal"
        cancelLabel="Keep using the portal"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setWorking(true);
          window.setTimeout(() => {
            setWorking(false);
            setConfirming(false);
            toast.show({ tone: "info", title: "Request received", message: "We'll confirm by post within 5 working days.", duration: 0 });
          }, 900);
        }}
      />
    </Card>
  );
}

const FAQ = [
  {
    value: "lost-phone",
    title: "I've lost the phone I use to sign in",
    content: <Text>Use one of your recovery codes to sign in, then set up two-step sign-in again on your new phone. No codes? Call us and we'll check who you are.</Text>,
  },
  {
    value: "agent",
    title: "Can my accountant see these settings?",
    content: <Text>Agents linked to your account can see your contact details but can't change your sign-in or notification settings.</Text>,
  },
  {
    value: "letters",
    title: "Why did I get a letter when I chose email?",
    content: <Text>Some notices, like a default assessment, must be posted by law. We'll still email you a copy.</Text>,
  },
];

const GUIDES = [
  { href: "#guide-two-step", icon: <LockIcon />, title: "Keeping your account secure", detail: "Two-step sign-in, recovery codes and spotting scams." },
  { href: "#guide-agents", icon: <HelpIcon />, title: "Giving an agent access", detail: "Let your accountant file and pay for you." },
  { href: "#guide-records", icon: <DocumentIcon />, title: "What records to keep", detail: "Invoices, receipts and how long to hold them." },
];

function HelpAside() {
  return (
    <VStack gap="lg">
      <Alert tone="info" title="Two-step sign-in is off">
        Turn it on below. It stops anyone who learns your password from signing in.
      </Alert>
      <VStack gap="sm">
        <Heading level={2} as="h2">Guides</Heading>
        {GUIDES.map((guide) => (
          <InteractiveCard key={guide.href} as="a" href={guide.href} className={styles.guideCard}>
            <MediaObject media={<span className={styles.sessionIcon}>{guide.icon}</span>}>
              <Text weight="bold">{guide.title}</Text>
              <Text tone="secondary">{guide.detail}</Text>
            </MediaObject>
          </InteractiveCard>
        ))}
      </VStack>
      <VStack gap="sm">
        <Heading level={2} as="h2">Questions</Heading>
        <Accordion items={FAQ} headingLevel={3} variant="contained" />
      </VStack>
      <Text tone="secondary">
        Still stuck? <Link href="#contact">Contact us</Link>.
      </Text>
    </VStack>
  );
}

function SettingsBody() {
  return (
    <div className={styles.twoColumn}>
      {/* The settings, then the help beside them, arrive in turn. */}
      <Motion.Stagger>
        <Motion.Presence show playOnMount>
          <VStack gap="xl">
            <SettingsSection id="contact" title="Contact details" description="Who we talk to about this membership, and where we send things.">
              <ProfileForm />
            </SettingsSection>
            <SettingsSection id="notifications" title="Notifications" description="These change as soon as you switch them.">
              <InstantSetting label="Email reminders" helperText="A week before each due date." initial />
              <InstantSetting label="Text message reminders" helperText="The day before something is due." initial={false} />
              <InstantSetting label="Payment receipts" helperText="An email each time a payment reaches us." initial />
              <InstantSetting label="Newsletter" helperText="News from the Society and your chapter, every couple of months. (This one can't save in the demo.)" initial={false} fails />
            </SettingsSection>
            <SettingsSection id="statements" title="Statements" description="Saved when you press the button.">
              <StatementsForm />
            </SettingsSection>
            <SettingsSection id="security" title="Two-step sign-in" description="Ask for a code from your phone as well as your password.">
              <TwoStepSetup />
            </SettingsSection>
            <SettingsSection id="devices" title="Signed-in devices" description="Sign out anything you don't recognise.">
              <Sessions />
            </SettingsSection>
            <SettingsSection id="shortcuts" title="Keyboard shortcuts" description="Move around without the mouse.">
              <Shortcuts />
            </SettingsSection>
            <SettingsSection id="danger" title="Online portal" description="Changes that are hard to undo.">
              <DangerZone />
            </SettingsSection>
          </VStack>
        </Motion.Presence>
        <Motion.Presence show playOnMount>
          <aside className={styles.sticky} aria-label="Help with settings">
            <HelpAside />
          </aside>
        </Motion.Presence>
      </Motion.Stagger>
    </div>
  );
}

/** A member's settings: contact details, notifications, statements, security and help. */
export function AccountSettings() {
  return (
    <SocietyAppShell
      active="Settings"
      crumbs={[{ label: "My account", href: "#account" }, { label: "Settings" }]}
      title="Settings"
      description={`${MEMBER.chapter} · changes apply to everyone who manages this membership`}
    >
      <SettingsBody />
    </SocietyAppShell>
  );
}
