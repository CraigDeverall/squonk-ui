// Live examples for the Patterns pages about whole screens: choosing
// components, page layouts, search and filters, collections, dashboards,
// settings, onboarding, loading, imagery, writing and density. Each one is a
// real composition of library components, kept small enough to read next to
// its rule.
import React from "react";
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CheckIcon,
  CheckboxGroup,
  Cluster,
  Divider,
  EmptyState,
  Fieldset,
  FilterIcon,
  Grid,
  Heading,
  InboxIllustration,
  InteractiveCard,
  Link,
  MediaObject,
  Meter,
  NavList,
  Popover,
  Presentation,
  ProgressBar,
  RadioGroup,
  SearchIllustration,
  Select,
  Sidebar,
  Split,
  Stat,
  Switch,
  Table,
  Tag,
  TagGroup,
  Text,
  TextField,
  VStack,
} from "../../components";

// ---- Choosing components ------------------------------------------------------

/** Three kinds of status: an item's (Badge), the page's (Alert) and a level against a limit (Meter). */
export function StatusKindsExample() {
  return (
    <VStack gap="md">
      <Alert tone="warning" title="Your annual dues are due in 3 days">Pay by 28 November to avoid a late fee.</Alert>
      <Cluster gap="sm" align="center">
        <Text weight="bold">Annual dues, 2026–27 season</Text>
        <Badge tone="warning">Due soon</Badge>
      </Cluster>
      <Meter label="Document storage" value={82} warningAt={80} criticalAt={95} valueLabel="8.2 of 10 GB used" showValue />
    </VStack>
  );
}

// ---- Page layouts and app shells ----------------------------------------------

/** A signed-in shell: Sidebar with NavList, then a page header (breadcrumb, title, actions) over the content. */
export function AppShellExample() {
  const [current, setCurrent] = React.useState("sightings");
  return (
    <div style={{ display: "flex", minHeight: 260, minWidth: 0, border: "1px solid var(--squonk-roles-color-divider)", borderRadius: 8, overflow: "hidden" }}>
      <Sidebar width="210px">
        <NavList
          label="Account"
          current={current}
          onNavigate={setCurrent}
          items={SHELL_NAV.map((item) => ({ ...item, href: `#${item.id}` }))}
        />
      </Sidebar>
      <div style={{ flex: 1, minWidth: 0, padding: 16 }}>
        <VStack gap="md">
          <VStack gap="xs">
            <Breadcrumb items={[{ label: "Home", href: "#home" }, { label: "Sightings" }]} homeIcon />
            <Split align="center" wrap>
              <Heading level={3} as="h2">Sightings</Heading>
              <Button variant="primary">Log a sighting</Button>
            </Split>
          </VStack>
          <Text tone="secondary">The page's content. Its heading matches the current navigation item.</Text>
        </VStack>
      </div>
    </div>
  );
}

const SHELL_NAV = [
  { id: "overview", label: "Overview" },
  { id: "sightings", label: "Sightings", end: <Badge tone="warning">1 due</Badge> },
  { id: "payments", label: "Payments" },
  { id: "settings", label: "Settings" },
];

/** A reading page: one column capped at a readable width, titled sections. */
export function ReadingColumnExample() {
  return (
    <div style={{ maxWidth: "36rem" }}>
      <VStack gap="lg">
        <VStack gap="xs">
          <Heading level={3} as="h2">Paying by instalments</Heading>
          <Text tone="secondary">Spread your dues over regular payments.</Text>
        </VStack>
        <VStack gap="xs">
          <Heading level={4} as="h3">Who can apply</Heading>
          <Text>Anyone with dues they can't pay in full by the due date. Apply before it's overdue if you can.</Text>
        </VStack>
        <VStack gap="xs">
          <Heading level={4} as="h3">What it costs</Heading>
          <Text>The late fee stops growing while you keep to the plan.</Text>
        </VStack>
      </VStack>
    </div>
  );
}

// ---- Search, filtering and sorting --------------------------------------------

/** A labelled search above the results, filters in a popover, active filters as removable tags, and a count. */
export function SearchAndFilterExample() {
  const [query, setQuery] = React.useState("");
  const [interests, setInterests] = React.useState<string[]>([]);
  const rows = MEMBERS.filter((c) => (interests.length === 0 || interests.includes(c.interest)) && c.name.toLowerCase().includes(query.trim().toLowerCase()));
  const filtering = Boolean(query || interests.length);
  const clear = () => { setQuery(""); setInterests([]); };
  return (
    <VStack gap="md">
      <Cluster gap="sm" align="end">
        <div style={{ flex: "1 1 14rem" }}>
          <TextField type="search" label="Search members" placeholder="Name" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Popover
          title="Filter members"
          placement="bottom-end"
          trigger={<Button variant="secondary"><FilterIcon size="control" /> Filters {interests.length ? <Badge tone="primary">{interests.length}</Badge> : null}</Button>}
          footer={<Button variant="ghost" onClick={() => setInterests([])}>Clear filters</Button>}
        >
          <CheckboxGroup legend="Interest" options={["Night watches", "Tear-pool mapping", "Folklore archive"].map((t) => ({ value: t, label: t }))} value={interests} onChange={setInterests} />
        </Popover>
      </Cluster>
      {filtering ? (
        <Cluster gap="xs" align="center">
          <Text as="span" tone="secondary">{rows.length} of {MEMBERS.length} members</Text>
          <TagGroup aria-label="Active filters">
            {query ? <Tag onRemove={() => setQuery("")} removeLabel="Clear the search">“{query}”</Tag> : null}
            {interests.map((t) => <Tag key={t} tone="primary" onRemove={() => setInterests((list) => list.filter((x) => x !== t))}>{t}</Tag>)}
          </TagGroup>
          <Button variant="ghost" onClick={clear}>Clear all</Button>
        </Cluster>
      ) : null}
      <Table
        caption="Members"
        rowKey="id"
        rows={rows}
        defaultSort={{ key: "name", direction: "asc" }}
        columns={[
          { key: "name", header: "Member", sortable: true },
          { key: "interest", header: "Interest", sortable: true },
          { key: "due", header: "Next due", sortable: true },
        ]}
        empty={<EmptyState icon={<SearchIllustration size="sm" />} title="No members match" body="Try a different name or fewer filters." action={<Button variant="secondary" onClick={clear}>Clear search and filters</Button>} />}
      />
    </VStack>
  );
}

const MEMBERS = [
  { id: "c1", name: "Aroha Ngata", interest: "Night watches", due: "28 Nov" },
  { id: "c2", name: "Tui Anderson", interest: "Tear-pool mapping", due: "20 Nov" },
  { id: "c3", name: "Rimu Whānau Keepers", interest: "Folklore archive", due: "7 Apr" },
  { id: "c4", name: "Moana Reid", interest: "Night watches", due: "15 Jan" },
];

// ---- Lists, tables and cards --------------------------------------------------

/** A list: one line per item, read top to bottom, each with one link. */
export function SimpleListExample() {
  return (
    <VStack as="ul" gap="sm" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {LETTERS.map((letter, i) => (
        <li key={letter.title}>
          {i > 0 ? <Divider /> : null}
          <MediaObject media={<Avatar name={letter.from} />} align="center">
            <Link href="#letter">{letter.title}</Link>
            <Text tone="secondary">{letter.from} · {letter.when}</Text>
          </MediaObject>
        </li>
      ))}
    </VStack>
  );
}

const LETTERS = [
  { title: "Your sighting report was received", from: "Hana Walker", when: "Today" },
  { title: "Reminder: Swamp Fund levy due 20 November", from: "Sam Patel", when: "Yesterday" },
  { title: "Instalment plan approved", from: "Hana Walker", when: "3 Nov" },
];

/** Cards: a few items people choose between, each with one destination. */
export function CardGridExample() {
  return (
    <Grid minColumnWidth="12rem" gap="md">
      {[
        { title: "Annual dues", detail: "Next payment due 28 November", status: <Badge tone="warning">Due soon</Badge> },
        { title: "Swamp Fund levy", detail: "Paid for October", status: <Badge tone="success">Up to date</Badge> },
        { title: "Field-trip deposit", detail: "2026 deposit not started", status: <Badge tone="neutral">Not started</Badge> },
      ].map((item) => (
        <InteractiveCard key={item.title} as="a" href={`#${item.title}`} variant="outlined">
          <VStack gap="xs">
            <Heading level={4} as="h3">{item.title}</Heading>
            <Text tone="secondary">{item.detail}</Text>
            <div>{item.status}</div>
          </VStack>
        </InteractiveCard>
      ))}
    </Grid>
  );
}

// ---- Dashboards and summaries -------------------------------------------------

/** An overview: what needs doing first, the figures people act on, then recent activity. */
export function OverviewScreenExample() {
  return (
    <VStack gap="lg">
      <Alert tone="warning" title="1 payment due this week">
        Annual dues for the 2026–27 season are due 28 November. <Link href="#pay">Pay now</Link>
      </Alert>
      <Grid columns={{ mobile: 1, tablet: 3 }} gap="md">
        <Card><Stat label="You owe" value="$148.20" /></Card>
        <Card><Stat label="Paid this year" value="$38,140" change={0.06} changeLabel="vs last year" /></Card>
        <Card><Stat label="Payments on time" value="11 of 12" /></Card>
      </Grid>
      <Card>
        <VStack gap="sm">
          <Split align="center">
            <Heading level={4} as="h3">Recent activity</Heading>
            <Link href="#activity">See all</Link>
          </Split>
          <VStack as="ul" gap="xs" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            <li><Text>Payment of $1,240.00 received · 2 Nov</Text></li>
            <li><Text>Swamp Fund levy paid for October · 1 Nov</Text></li>
          </VStack>
        </VStack>
      </Card>
    </VStack>
  );
}

// ---- Settings and preferences -------------------------------------------------

/** Settings grouped under headings: switches that save at once, and a group saved with its own button. */
export function SettingsExample() {
  const [reminders, setReminders] = React.useState(true);
  const [frequency, setFrequency] = React.useState("monthly");
  const [saved, setSaved] = React.useState<string>();
  return (
    <VStack gap="xl" style={{ maxWidth: "36rem" }}>
      <section aria-labelledby="settings-notifications">
        <VStack gap="md">
          <VStack gap="xxs">
            <Heading level={4} as="h3" id="settings-notifications">Notifications</Heading>
            <Text tone="secondary">These change as soon as you switch them.</Text>
          </VStack>
          <Switch label="Email reminders" helperText="Before each due date." checked={reminders} onChange={setReminders} />
          <Switch label="Text message alerts" helperText="For payments and credits." defaultChecked={false} />
        </VStack>
      </section>
      <section aria-labelledby="settings-statements">
        <form onSubmit={(e) => { e.preventDefault(); setSaved("Statement preferences saved."); }}>
          <VStack gap="md">
            <VStack gap="xxs">
              <Heading level={4} as="h3" id="settings-statements">Statements</Heading>
              <Text tone="secondary">Saved when you press the button.</Text>
            </VStack>
            <RadioGroup name="statement-frequency" legend="How often" value={frequency} onChange={setFrequency} options={[{ value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" }]} />
            <Fieldset legend="Send to">
              <TextField label="Email" type="email" defaultValue="aroha@example.org" />
            </Fieldset>
            <Cluster gap="sm" align="center">
              <Button variant="primary" type="submit">Save statement preferences</Button>
              <Text as="span" tone="secondary" role="status">{saved ?? ""}</Text>
            </Cluster>
          </VStack>
        </form>
      </section>
    </VStack>
  );
}

// ---- Onboarding and first run -------------------------------------------------

/** A set-up checklist: progress in words and a bar, done steps marked, the next step as the one primary action. */
export function SetupChecklistExample() {
  const [done, setDone] = React.useState(["member", "bank"]);
  const next = SETUP_STEPS.find((s) => !done.includes(s.id));
  return (
    <Card variant="outlined" style={{ maxWidth: 420 }}>
      <VStack gap="md">
        <VStack gap="xs">
          <Heading level={4} as="h3">Finish setting up</Heading>
          <ProgressBar value={(done.length / SETUP_STEPS.length) * 100} label={`${done.length} of ${SETUP_STEPS.length} done`} />
        </VStack>
        <VStack as="ol" gap="xs" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {SETUP_STEPS.map((step) => (
            <li key={step.id}>
              <Cluster gap="xs" align="center">
                {done.includes(step.id) ? <CheckIcon size="control" label="Done" /> : null}
                <Text tone={done.includes(step.id) ? "secondary" : "primary"}>{step.label}</Text>
              </Cluster>
            </li>
          ))}
        </VStack>
        {next ? (
          <div><Button variant="primary" onClick={() => setDone((d) => [...d, next.id])}>{next.action}</Button></div>
        ) : (
          <Text role="status">You're all set.</Text>
        )}
      </VStack>
    </Card>
  );
}

const SETUP_STEPS = [
  { id: "member", label: "Add your member details", action: "Add member details" },
  { id: "bank", label: "Add a bank account", action: "Add a bank account" },
  { id: "chapter", label: "Choose your chapter", action: "Choose a chapter" },
  { id: "household", label: "Invite your household", action: "Invite your household" },
];

/** The first visit to an empty area: an illustration, what will appear here, and the first step. */
export function FirstRunExample() {
  return (
    <EmptyState
      icon={<InboxIllustration size="lg" />}
      title="No sightings yet"
      body="Sightings you log appear here, with their verification status."
      action={<Button variant="primary">Log your first sighting</Button>}
    />
  );
}

// ---- Loading and progress -----------------------------------------------------

/** A button that shows it's working: it keeps its label and place, and ignores presses until done. */
export function PendingButtonExample() {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState("");
  return (
    <Cluster gap="sm" align="center">
      <Button
        variant="primary"
        pending={pending}
        onClick={() => {
          setPending(true);
          setStatus("");
          window.setTimeout(() => { setPending(false); setStatus("Sighting logged."); }, 1200);
        }}
      >
        Log sighting
      </Button>
      <Text as="span" tone="secondary" role="status">{status}</Text>
    </Cluster>
  );
}

// ---- Illustrations, icons and images -------------------------------------------

/** An icon inside a control, an illustration beside a message. */
export function IconOrIllustrationExample() {
  return (
    <Grid columns={{ mobile: 1, tablet: 2 }} gap="lg">
      <VStack gap="xs">
        <Text weight="bold">Icon: inside a control</Text>
        <div><Button variant="secondary"><FilterIcon size="control" /> Filters</Button></div>
      </VStack>
      <EmptyState icon={<SearchIllustration />} title="No results for 'hemlock'" body="Check the spelling or try another name." />
    </Grid>
  );
}

// ---- Writing for the interface -------------------------------------------------

/** Specific words: the button says what happens, the error says how to fix it. */
export function SpecificWordsExample() {
  return (
    <VStack gap="sm">
      <TextField label="Membership number" defaultValue="SQ-104" error="Enter all 6 digits, such as SQ-104-772" />
      <Cluster gap="sm"><Button variant="primary">Save bank account</Button><Button variant="ghost">Cancel</Button></Cluster>
    </VStack>
  );
}

/** Vague words: the button says nothing about what happens, the error doesn't help. */
export function VagueWordsExample() {
  return (
    <VStack gap="sm">
      <TextField label="Membership number" defaultValue="SQ-104" error="Invalid input" />
      <Cluster gap="sm"><Button variant="primary">OK</Button><Button variant="ghost">Cancel</Button></Cluster>
    </VStack>
  );
}

// ---- Density and registers -----------------------------------------------------

/** The same controls in the compact and default registers: everything steps together. */
export function RegistersExample() {
  return (
    <Grid columns={{ mobile: 1, tablet: 2 }} gap="lg">
      {(["compact", "default"] as const).map((register) => (
        <Presentation key={register} register={register}>
          <VStack gap="sm">
            <Text weight="bold">{register}</Text>
            <Select label="Status" defaultValue="open" options={[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }]} />
            <Cluster gap="sm" align="center">
              <Button variant="primary">Assign</Button>
              <Badge tone="info">12 cases</Badge>
            </Cluster>
          </VStack>
        </Presentation>
      ))}
    </Grid>
  );
}
