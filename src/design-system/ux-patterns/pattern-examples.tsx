// Live examples for the Patterns pages. Each one is a real composition of
// library components, kept small enough to read next to its rule.
import React from "react";
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  Cluster,
  ConfirmModal,
  DropdownMenu,
  EmptyState,
  Grid,
  Heading,
  IconButton,
  InteractiveCard,
  Link,
  MediaObject,
  Modal,
  Popover,
  ProgressBar,
  QrCode,
  RadioGroup,
  SearchIcon,
  Select,
  Skeleton,
  Spinner,
  Switch,
  Table,
  Tabs,
  Text,
  TextField,
  ToastProvider,
  Tooltip,
  VStack,
  useToast,
  InfoIcon,
  MoreIcon,
  FilterIcon,
  ErrorIcon,
} from "../../components";

// ---- App navigation ---------------------------------------------------------

const NAV = ["Overview", "Sightings", "Payments", "Settings"];

/** A signed-in frame: named navigation, the current page marked, a breadcrumb. */
export function AppFrameExample() {
  const [current, setCurrent] = React.useState("Sightings");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 10rem) minmax(0, 1fr)", gap: 16, minWidth: 0 }}>
      <nav aria-label="Account">
        <VStack gap="xxs">
          {NAV.map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              variant={item === current ? "default" : "subtle"}
              weight={item === current ? "bold" : "regular"}
              underline="never"
              aria-current={item === current ? "page" : undefined}
              onClick={(event: React.MouseEvent) => {
                event.preventDefault();
                setCurrent(item);
              }}
            >
              {item}
            </Link>
          ))}
        </VStack>
      </nav>
      <VStack gap="sm">
        <Breadcrumb items={[{ label: "Home", href: "#home" }, { label: current }]} homeIcon />
        <Heading level={3} as="h2">{current}</Heading>
        <Text tone="secondary">The page's main content. Its heading matches the current navigation item.</Text>
      </VStack>
    </div>
  );
}

/** Tabs switch views of one thing; they are not site navigation. */
export function TabsForViewsExample() {
  return (
    <Tabs
      listLabel="Sighting views"
      items={[
        { value: "summary", label: "Summary", content: <Text>Tear volume: 340 mL</Text> },
        { value: "lines", label: "Details", content: <Text>Tear trail of 40 m; two pools mapped.</Text> },
        { value: "history", label: "History", content: <Text>Logged 28 September.</Text> },
      ]}
    />
  );
}

/** A menu used for page navigation. */
export function MenuAsNavigationExample() {
  return (
    <DropdownMenu
      trigger={<Button as="span" variant="secondary">Go to…</Button>}
      items={[
        { key: "overview", label: "Overview" },
        { key: "sightings", label: "Sightings" },
        { key: "payments", label: "Payments" },
      ]}
    />
  );
}

// ---- Menus and commands -----------------------------------------------------

/** A named menu of commands on a row, with the destructive one last. */
export function RowActionsExample() {
  const [done, setDone] = React.useState<string>();
  return (
    <VStack gap="sm">
      <Cluster gap="sm" align="center">
        <Text weight="bold">Dues statement 1042</Text>
        <Badge tone="warning">Due soon</Badge>
        <DropdownMenu
          triggerLabel="Actions for statement 1042"
          trigger={<MoreIcon size="control" />}
          items={[
            { key: "view", label: "View", onSelect: () => setDone("Opened statement 1042") },
            { key: "copy", label: "Duplicate", onSelect: () => setDone("Duplicated statement 1042") },
            { key: "send", label: "Send reminder", onSelect: () => setDone("Reminder sent") },
            "separator",
            { key: "void", label: "Void statement", tone: "danger", onSelect: () => setDone("Voided (in a real app, after a confirmation)") },
          ]}
        />
      </Cluster>
      <Text tone="secondary" role="status">{done ?? "Choose an action from the menu."}</Text>
    </VStack>
  );
}

/** A menu whose trigger says nothing about what it does. */
export function VagueMenuExample() {
  return (
    <DropdownMenu
      trigger={<Button as="span" variant="ghost">More</Button>}
      items={[
        { key: "a", label: "Edit" },
        { key: "b", label: "Delete", tone: "danger" },
        { key: "c", label: "Export" },
      ]}
    />
  );
}

// ---- Empty and error states -------------------------------------------------

/** Three different empties: each says what happened and offers the next step. */
export function EmptyStatesExample() {
  return (
    <Grid columns={{ mobile: 1, tablet: 3 }} gap="md">
      <Card variant="outlined">
        <EmptyState title="No sightings yet" body="Sightings you log appear here." action={<Button variant="primary">Log a sighting</Button>} />
      </Card>
      <Card variant="outlined">
        <EmptyState icon={<SearchIcon />} title="No matches for 'hemlock'" body="Check the spelling or search for something else." action={<Button variant="secondary">Clear search</Button>} />
      </Card>
      <Card variant="outlined">
        <EmptyState icon={<ErrorIcon />} title="We couldn't load your sightings" body="Your sightings are safe. Try again in a moment." action={<Button variant="secondary">Try again</Button>} />
      </Card>
    </Grid>
  );
}

/** A failed load, said plainly, with a retry. */
export function FailedLoadExample() {
  return (
    <Card variant="outlined">
      <EmptyState icon={<ErrorIcon />} title="We couldn't load your sightings" body="Your sightings are safe. Try again in a moment." action={<Button variant="secondary">Try again</Button>} />
    </Card>
  );
}

/** A failed load presented as "nothing here". */
export function MisleadingEmptyExample() {
  return (
    <Card variant="outlined">
      <EmptyState title="No sightings yet" body="Sightings you log appear here." action={<Button variant="primary">Log a sighting</Button>} />
    </Card>
  );
}

// ---- Cards and landing sections ---------------------------------------------

/** A whole card as one link: one destination, named by its heading. */
export function LinkCardExample() {
  return (
    <InteractiveCard as="a" href="#sightings" variant="outlined" style={{ maxWidth: 360 }}>
      <VStack gap="xs">
        <Heading level={4} as="h3">Sighting reports</Heading>
        <Text tone="secondary">Log, correct and see what has been verified.</Text>
      </VStack>
    </InteractiveCard>
  );
}

/** A card with several actions: a plain Card with real buttons. */
export function CardWithActionsExample() {
  return (
    <Card variant="outlined" style={{ maxWidth: 360 }}>
      <VStack gap="sm">
        <Heading level={4} as="h3">Annual dues, 2026–27 season</Heading>
        <Text tone="secondary">Due 28 November.</Text>
        <Cluster gap="sm">
          <Button variant="primary">Pay dues</Button>
          <Button variant="secondary">View last statement</Button>
        </Cluster>
      </VStack>
    </Card>
  );
}

const PLANS = [
  { name: "Tadpole", price: "$0", detail: "For members under 18", features: ["Night watches", "Newsletter"] },
  { name: "Keeper", price: "$29", detail: "For households", features: ["Up to 6 members", "Field-trip priority", "Phone support"], featured: true },
  { name: "Life member", price: "Talk to us", detail: "For lifelong keepers", features: ["One payment", "Archive access"] },
];

/** Comparable plans: same order of information in every card, one featured. */
export function PricingExample() {
  return (
    <Grid columns={{ mobile: 1, tablet: 3 }} gap="md">
      {PLANS.map((plan) => (
        <Card key={plan.name} variant={plan.featured ? "featured" : "outlined"}>
          <VStack gap="sm">
            <Cluster gap="xs" align="center">
              <Heading level={4} as="h3">{plan.name}</Heading>
              {plan.featured ? <Badge tone="primary">Most popular</Badge> : null}
            </Cluster>
            <Text weight="bold">{plan.price}{plan.price.startsWith("$") ? " a month" : ""}</Text>
            <Text tone="secondary">{plan.detail}</Text>
            <ul style={{ margin: 0, paddingInlineStart: "1.2em" }}>
              {plan.features.map((feature) => <li key={feature}><Text as="span">{feature}</Text></li>)}
            </ul>
            <Button variant={plan.featured ? "primary" : "secondary"}>Choose {plan.name}</Button>
          </VStack>
        </Card>
      ))}
    </Grid>
  );
}

// ---- QR handoff -------------------------------------------------------------

/** A code with its purpose stated and a way in for people who can't scan. */
export function QrHandoffExample() {
  return (
    <Cluster gap="lg" align="center">
      <QrCode value="https://example.org/app?ref=demo" label="Scan to open the app on your phone" />
      <VStack gap="xs" style={{ maxWidth: 280 }}>
        <Text weight="bold">Continue on your phone</Text>
        <Text tone="secondary">Scan the code with your phone's camera. It opens the app at your sighting report.</Text>
        <Link href="#send-link">Can't scan? Send me a link instead</Link>
      </VStack>
    </Cluster>
  );
}

// ---- Choosing a selection control ---------------------------------------------

const CHAPTERS = ["Northland", "Auckland", "Waikato", "Bay of Plenty", "Gisborne", "Hawke's Bay", "Taranaki", "Manawatū-Whanganui", "Wellington", "Tasman", "Nelson", "Marlborough", "West Coast", "Canterbury", "Otago", "Southland"].map((region) => ({ value: region.toLowerCase().replace(/[^a-z]+/g, "-"), label: `${region} Chapter` }));

/** Each control for the kind of choice it fits. */
export function SelectionControlsExample() {
  const [frequency, setFrequency] = React.useState("two-monthly");
  return (
    <Grid columns={{ mobile: 1, tablet: 2 }} gap="lg">
      <RadioGroup
        name="frequency"
        legend="How often do you go on night watch?"
        value={frequency}
        onChange={setFrequency}
        options={[
          { value: "monthly", label: "Monthly" },
          { value: "two-monthly", label: "Every two months", helperText: "Most members" },
          { value: "six-monthly", label: "Every six months" },
        ]}
      />
      <CheckboxGroup
        legend="Which interests do you have?"
        defaultValue={["night-watches"]}
        options={[
          { value: "night-watches", label: "Night watches" },
          { value: "tear-pool-mapping", label: "Tear-pool mapping" },
          { value: "folklore-archive", label: "Folklore archive" },
        ]}
      />
      <Select label="Chapter" placeholder="Choose a chapter" options={CHAPTERS} />
      <Select searchable label="Interest" placeholder="Search by activity" options={[
        { value: "INT-01", label: "Night watches", description: "INT-01" },
        { value: "INT-02", label: "Tear-pool mapping", description: "INT-02" },
        { value: "INT-04", label: "Folklore archive", description: "INT-04" },
        { value: "INT-05", label: "Field photography", description: "INT-05" },
      ]} />
    </Grid>
  );
}

/** Two options hidden behind a select. */
export function HiddenFewOptionsExample() {
  return <Select label="Are you under 18?" placeholder="Choose" options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />;
}

/** The same two options, visible. */
export function VisibleFewOptionsExample() {
  return <RadioGroup name="under-18" legend="Are you under 18?" direction="row" options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />;
}

// ---- Switches, checkboxes and saving ------------------------------------------

/** A switch that saves at once, says so, and moves back if saving fails. */
export function InstantSwitchExample() {
  const [on, setOn] = React.useState(true);
  const [status, setStatus] = React.useState("Saved");
  const [failNext, setFailNext] = React.useState(false);
  return (
    <VStack gap="sm">
      <Switch
        label="Email reminders"
        helperText="Before each due date. You'll still get notices."
        checked={on}
        onChange={(next) => {
          setOn(next);
          setStatus("Saving…");
          window.setTimeout(() => {
            if (failNext) {
              setOn(!next);
              setStatus("Couldn't save. Your reminders are unchanged.");
            } else setStatus("Saved");
          }, 700);
        }}
      />
      <Text tone="secondary" role="status">{status}</Text>
      <Checkbox label="Make the next save fail (to see the recovery)" checked={failNext} onChange={setFailNext} />
    </VStack>
  );
}

/** A checkbox that only counts when the form is submitted. */
export function SubmittedCheckboxExample() {
  const [sent, setSent] = React.useState(false);
  return (
    <form onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
      <VStack gap="sm">
        <Checkbox label="Email me a copy of this report" />
        <div><Button type="submit" variant="primary">Log sighting</Button></div>
        {sent ? <Text role="status">Logged.</Text> : null}
      </VStack>
    </form>
  );
}

// ---- Labels, help and validation ----------------------------------------------

/** A visible label, help that explains the format, and an instruction as the error. */
export function LabelledFieldExample() {
  return (
    <VStack gap="md">
      <TextField label="Membership number" helperText="Starts with SQ, on your membership card." />
      <TextField label="First payment" type="date" error="Enter a date after today" />
    </VStack>
  );
}

/** A placeholder standing in for a label, and an error that doesn't help. */
export function PlaceholderFieldExample() {
  return (
    <VStack gap="md">
      <TextField aria-label="Membership number" placeholder="Membership number" />
      <TextField aria-label="First payment" placeholder="First payment" error="Invalid input" />
    </VStack>
  );
}

// ---- Overlays and disclosures -------------------------------------------------

/** The lightest surface first: inline disclosure, then a popover, then a modal. */
export function OverlayLadderExample() {
  const [open, setOpen] = React.useState(false);
  return (
    <VStack gap="lg">
      <Accordion
        items={[{ value: "late", title: "What happens if I log a sighting late?", content: <Text>You can still log it, but sightings more than 14 days old may need extra verification. Talk to us if you need a hand.</Text> }]}
      />
      <Cluster gap="sm" align="center">
        <Popover
          title="Tear volume"
          trigger={<Button variant="secondary">What counts as tear volume?</Button>}
          footer={<Link href="#tear-volume">More about measuring tear pools</Link>}
        >
          <Text>The estimated amount of tears in a pool, in millilitres, such as 250 mL.</Text>
        </Popover>
        <Tooltip content="Search sightings">
          <IconButton icon={<SearchIcon />} label="Search sightings" tooltip={false} />
        </Tooltip>
        <Button variant="primary" onClick={() => setOpen(true)}>Change bank account</Button>
      </Cluster>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Change bank account"
        footer={<Cluster gap="sm"><Button variant="primary" onClick={() => setOpen(false)}>Save</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></Cluster>}
      >
        <TextField label="Account number" helperText="For example, 12-3456-7890123-00" />
      </Modal>
    </VStack>
  );
}

/** Information needed to use a field, hidden in a tooltip. */
export function HelpInTooltipExample() {
  return (
    <Cluster gap="xs" align="end">
      <TextField label="Account number" />
      <Tooltip content="Format: 12-3456-7890123-00">
        <IconButton icon={<InfoIcon />} label="Account number format" tooltip={false} />
      </Tooltip>
    </Cluster>
  );
}

/** The same information as help text, always visible. */
export function HelpAsTextExample() {
  return <TextField label="Account number" helperText="Format: 12-3456-7890123-00" />;
}

// ---- Destructive actions ------------------------------------------------------

/** Remove at once and offer undo; confirm only what can't be undone. */
export function DestructiveExample() {
  return (
    <ToastProvider position="bottom-right">
      <DestructiveInner />
    </ToastProvider>
  );
}

function DestructiveInner() {
  const toast = useToast();
  const [drafts, setDrafts] = React.useState(["Draft sighting, 12 Sep", "Draft sighting, 3 Sep"]);
  const [confirming, setConfirming] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [closed, setClosed] = React.useState(false);
  return (
    <VStack gap="md">
      <VStack gap="xs">
        {drafts.map((draft) => (
          <Cluster key={draft} gap="sm" align="center">
            <Text>{draft}</Text>
            <Button
              variant="ghost"
              onClick={() => {
                setDrafts((d) => d.filter((x) => x !== draft));
                toast.show({ tone: "info", message: `Deleted "${draft}". Undo from Recently deleted.`, duration: 0 });
              }}
            >
              Delete draft
            </Button>
          </Cluster>
        ))}
        {drafts.length === 0 ? <Text tone="secondary">No drafts. <Link href="#restore" onClick={(e: React.MouseEvent) => { e.preventDefault(); setDrafts(["Draft sighting, 12 Sep", "Draft sighting, 3 Sep"]); }}>Restore them</Link></Text> : null}
      </VStack>
      <div>
        <Button variant="danger" onClick={() => setConfirming(true)} disabled={closed}>{closed ? "Membership cancelled" : "Cancel membership"}</Button>
      </div>
      <ConfirmModal
        open={confirming}
        title="Cancel your membership?"
        message="You won't be able to log sightings or join night watches. This can't be undone; to rejoin you'll need a new application."
        confirmLabel="Cancel membership"
        cancelLabel="Keep membership"
        danger
        loading={closing}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setClosing(true);
          window.setTimeout(() => {
            setClosing(false);
            setConfirming(false);
            setClosed(true);
            toast.success("Your membership is cancelled.");
          }, 900);
        }}
      />
    </VStack>
  );
}

/** A confirmation whose answer is "Yes". */
export function VagueConfirmExample() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <div><Button variant="secondary" onClick={() => setOpen(true)}>Delete</Button></div>
      <ConfirmModal
        open={open}
        title="Are you sure?"
        message="Do you want to continue?"
        confirmLabel="Yes"
        cancelLabel="No"
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

// ---- Focus management ---------------------------------------------------------

/** Deleting the focused row moves focus to the next one, not the top of the page. */
export function FocusAfterDeleteExample() {
  const [items, setItems] = React.useState(["Tui Anderson", "Moana Reid", "Rimu Parata", "Hemi Walker"]);
  const refs = React.useRef(new Map<string, HTMLButtonElement | null>());
  const listRef = React.useRef<HTMLUListElement>(null);
  const remove = (index: number) => {
    const next = items[index + 1] ?? items[index - 1];
    setItems((list) => list.filter((_, i) => i !== index));
    requestAnimationFrame(() => (next ? refs.current.get(next)?.focus() : listRef.current?.focus()));
  };
  return (
    <ul ref={listRef} tabIndex={-1} aria-label="Members" style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
      {items.map((item, i) => (
        <li key={item}>
          <Cluster gap="sm" align="center">
            <Text style={{ minWidth: 140 }}>{item}</Text>
            <Button variant="ghost" ref={(el: HTMLButtonElement | null) => { refs.current.set(item, el); }} onClick={() => remove(i)}>
              Remove {item}
            </Button>
          </Cluster>
        </li>
      ))}
      {items.length === 0 ? <li><Text tone="secondary">No members left.</Text></li> : null}
    </ul>
  );
}

// ---- Toasts, alerts and dialogs -----------------------------------------------

/** Each message on the surface that fits it. */
export function MessagesExample() {
  return (
    <ToastProvider position="bottom-right">
      <MessagesInner />
    </ToastProvider>
  );
}

function MessagesInner() {
  const toast = useToast();
  const [confirming, setConfirming] = React.useState(false);
  return (
    <VStack gap="md">
      <Alert tone="warning" title="Your annual dues are due in 3 days">Pay by 28 November to avoid a late fee.</Alert>
      <Cluster gap="sm">
        <Button variant="secondary" onClick={() => toast.success("Reminder set for 26 November.")}>Remind me</Button>
        <Button variant="primary" onClick={() => setConfirming(true)}>Pay now</Button>
      </Cluster>
      <ConfirmModal
        open={confirming}
        title="Pay your annual dues?"
        message="You'll pay $85.00 by 28 November. You can switch to an instalment plan later."
        confirmLabel="Pay dues"
        cancelLabel="Go back"
        onCancel={() => setConfirming(false)}
        onConfirm={() => { setConfirming(false); toast.success("Dues paid."); }}
      />
    </VStack>
  );
}

/** Loading: skeleton for known shape, spinner for a short wait, a bar for measurable work. */
export function LoadingExample() {
  const [progress, setProgress] = React.useState(40);
  return (
    <Grid columns={{ mobile: 1, tablet: 3 }} gap="lg">
      <VStack gap="xs">
        <Text weight="bold">Known shape</Text>
        <Skeleton shape="text" lines={3} />
      </VStack>
      <VStack gap="xs">
        <Text weight="bold">A short wait</Text>
        <Spinner label="Checking your membership number" />
      </VStack>
      <VStack gap="xs">
        <ProgressBar value={progress} label="Uploading statements" showValue />
        <div><Button variant="ghost" onClick={() => setProgress((p) => (p >= 100 ? 0 : p + 20))}>Advance</Button></div>
      </VStack>
    </Grid>
  );
}

// ---- Tables and grids ---------------------------------------------------------

interface SightingRow { id: string; date: string; chapter: string; volume: string; status: "Verified" | "Under review" }

const SIGHTING_ROWS: SightingRow[] = [
  { id: "r1", date: "12 Sep 2026", chapter: "Waikato", volume: "340 mL", status: "Under review" },
  { id: "r2", date: "3 Sep 2026", chapter: "Waikato", volume: "120 mL", status: "Verified" },
  { id: "r3", date: "28 Aug 2026", chapter: "Taranaki", volume: "410 mL", status: "Verified" },
];

const sightingColumns = [
  { key: "date" as const, header: "Date", sortable: true },
  { key: "chapter" as const, header: "Chapter" },
  { key: "volume" as const, header: "Tear volume", align: "right" as const },
  { key: "status", header: "Status", render: (row: SightingRow) => <Badge tone={row.status === "Verified" ? "success" : "info"}>{row.status}</Badge>, sortValue: (row: SightingRow) => row.status },
];

/** A reading table: caption, sortable header, status badges. */
export function ReadingTableExample() {
  return <Table caption="Logged sightings" columns={sightingColumns} rows={SIGHTING_ROWS} rowKey="id" />;
}

/** A selectable grid: one tab stop, rows chosen to act on. */
export function SelectableGridExample() {
  const [selected, setSelected] = React.useState<string[]>([]);
  return (
    <VStack gap="sm">
      <Cluster gap="sm" align="center">
        <Text weight="bold">{selected.length} selected</Text>
        <Button variant="secondary" disabled={selected.length === 0}>Download</Button>
      </Cluster>
      <Table caption="Sightings to download" columns={sightingColumns} rows={SIGHTING_ROWS} rowKey="id" selectable selectedKeys={selected} onSelectionChange={setSelected} />
    </VStack>
  );
}

/** An empty table that says which empty it is. */
export function EmptyTableExample() {
  return (
    <Table
      caption="Sightings"
      columns={sightingColumns}
      rows={[]}
      rowKey="id"
      empty={<EmptyState icon={<FilterIcon />} title="No sightings match these filters" action={<Button variant="secondary">Clear filters</Button>} />}
    />
  );
}

// ---- Identity and metadata ----------------------------------------------------

/** A person: image or initials, name, role and a status in words. */
export function IdentityExample() {
  return (
    <VStack gap="md">
      {[
        { name: "Hana Walker", role: "Membership officer, Wellington Chapter", status: "Available", tone: "success" as const },
        { name: "Sam Patel", role: "Chapter lead, Dues and member cases, Auckland Chapter", status: "Away until Monday", tone: "warning" as const },
      ].map((person) => (
        <MediaObject key={person.name} media={<Avatar name={person.name} />} align="center">
          <Cluster gap="xs" align="center">
            <Text weight="bold">{person.name}</Text>
            <Badge tone={person.tone}>{person.status}</Badge>
          </Cluster>
          <Text tone="secondary">{person.role}</Text>
        </MediaObject>
      ))}
    </VStack>
  );
}
