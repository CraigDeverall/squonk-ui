import React from "react";
import {
  Accordion,
  Avatar,
  Badge,
  Button,
  Card,
  Currency,
  CheckboxGroup,
  Cluster,
  ConfirmModal,
  Drawer,
  DropdownMenu,
  EmptyState,
  Grid,
  IconButton,
  Link,
  Motion,
  Popover,
  ProgressBar,
  Select,
  Table,
  Tabs,
  Tag,
  TagGroup,
  Text,
  Textarea,
  TextField,
  VStack,
  useToast,
  toMinorUnits,
} from "../components";
import type { TableColumn } from "../components";
import { FilterIcon, MailIcon, PhoneIcon, SearchIcon } from "../components/functional-primitive/icon/icon";
import { CASES, nz, shortDate, type Case, type CasePriority, type CaseStatus } from "./fixtures";
import { Stat, SocietyAppShell } from "./demo-shell";
import styles from "./demos.module.css";

const ME = "Hana Walker";
const STATUSES: CaseStatus[] = ["New", "In progress", "Waiting", "Escalated"];
const PRIORITY_TONE: Record<CasePriority, "error" | "warning" | "neutral"> = { High: "error", Medium: "warning", Low: "neutral" };
const STATUS_TONE: Record<CaseStatus, "info" | "primary" | "neutral" | "error" | "success"> = {
  New: "info",
  "In progress": "primary",
  Waiting: "neutral",
  Escalated: "error",
  Closed: "success",
};

function Filters({ statuses, onStatuses, priorities, onPriorities }: {
  statuses: string[];
  onStatuses: (v: string[]) => void;
  priorities: string[];
  onPriorities: (v: string[]) => void;
}) {
  const count = statuses.length + priorities.length;
  return (
    <Popover
      title="Filter cases"
      placement="bottom-end"
      trigger={
        <Button variant="secondary">
          <FilterIcon size="control" /> Filters {count ? <Badge tone="primary">{count}</Badge> : null}
        </Button>
      }
      footer={<Button variant="ghost" onClick={() => { onStatuses([]); onPriorities([]); }}>Clear filters</Button>}
    >
      <CheckboxGroup legend="Status" options={STATUSES.map((s) => ({ value: s, label: s }))} value={statuses} onChange={onStatuses} />
      <CheckboxGroup legend="Priority" direction="row" options={(["High", "Medium", "Low"] as const).map((p) => ({ value: p, label: p }))} value={priorities} onChange={onPriorities} />
    </Popover>
  );
}

function CaseQueue({ cases, onOpen, caption }: { cases: Case[]; onOpen: (c: Case) => void; caption: string }) {
  const toast = useToast();
  const [query, setQuery] = React.useState("");
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [priorities, setPriorities] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [closing, setClosing] = React.useState(false);
  // The bar keeps its last count while it leaves, rather than reading "0 selected".
  const [lastCount, setLastCount] = React.useState(0);
  if (selected.length && selected.length !== lastCount) setLastCount(selected.length);
  const filtering = Boolean(statuses.length || priorities.length || query);

  const rows = cases.filter(
    (c) =>
      (!statuses.length || statuses.includes(c.status)) &&
      (!priorities.length || priorities.includes(c.priority)) &&
      (!query || `${c.member} ${c.id} ${c.reason}`.toLowerCase().includes(query.toLowerCase()))
  );
  const clearAll = () => { setQuery(""); setStatuses([]); setPriorities([]); };

  const columns: TableColumn<Case>[] = [
    {
      key: "member",
      header: "Member",
      width: "15rem",
      sortable: true,
      sortValue: (c) => c.member,
      render: (c) => (
        <VStack gap="none">
          <Link as="button" type="button" weight="bold" className={styles.rowLink} onClick={() => onOpen(c)}>{c.member}</Link>
          <Text tone="secondary"><span className={styles.figure}>{c.id}</span> · {c.fee}</Text>
        </VStack>
      ),
    },
    { key: "reason", header: "Reason" },
    { key: "priority", header: "Priority", sortable: true, sortValue: (c) => ["High", "Medium", "Low"].indexOf(c.priority), render: (c) => <Badge tone={PRIORITY_TONE[c.priority]}>{c.priority}</Badge> },
    { key: "status", header: "Status", sortable: true, sortValue: (c) => c.status, render: (c) => <Badge tone={STATUS_TONE[c.status]} variant="outline">{c.status}</Badge> },
    { key: "opened", header: "Opened", sortable: true, sortValue: (c) => c.opened, render: (c) => <span className={styles.figure}>{shortDate(c.opened)}</span> },
    { key: "owed", header: "Owed", align: "right", sortable: true, sortValue: (c) => c.owed, render: (c) => <Currency {...nz} value={c.owed} /> },
  ];

  return (
    <VStack gap="md">
      <div className={styles.filterBar}>
        <div className={styles.search}>
          <TextField type="search" label="Search cases" placeholder="Member, case number or reason" value={query} onChange={(e) => setQuery(e.target.value)} />
          <SearchIcon className={styles.searchIcon} />
        </div>
        <Filters statuses={statuses} onStatuses={setStatuses} priorities={priorities} onPriorities={setPriorities} />
      </div>

      {/* The row of active filters joins and leaves as filtering starts
          and stops; its tags glide together as one is removed. */}
      <Motion.Presence show={filtering}>
        <div>
          <Cluster gap="xs" align="center">
            <Text as="span" tone="secondary">{rows.length} of {cases.length} cases</Text>
            <Motion.Layout items="[role=row]">
              <TagGroup aria-label="Active filters">
                {query ? <Tag onRemove={() => setQuery("")} removeLabel="Clear the search">“{query}”</Tag> : null}
                {[...statuses, ...priorities].map((f) => (
                  <Tag key={f} tone="primary" onRemove={() => { setStatuses((s) => s.filter((x) => x !== f)); setPriorities((p) => p.filter((x) => x !== f)); }}>{f}</Tag>
                ))}
              </TagGroup>
            </Motion.Layout>
            <Button variant="ghost" onClick={clearAll}>Clear all</Button>
          </Cluster>
        </div>
      </Motion.Presence>

      {/* Bulk actions join when cases are selected and leave when none are. */}
      <Motion.Presence show={selected.length > 0}>
        <div className={styles.bulkBar} role="region" aria-label="Selected cases">
          <Text weight="bold">{selected.length || lastCount} selected</Text>
          <DropdownMenu
            trigger={<span className={styles.menuTrigger}>Assign to…</span>}
            items={["Hana Walker", "Sam Patel", "Mere Walker", "Liam Chen"].map((name) => ({
              key: name,
              label: name,
              onSelect: () => { toast.success(`${selected.length} cases assigned to ${name}.`); setSelected([]); },
            }))}
          />
          <Button variant="danger" onClick={() => setClosing(true)}>Close cases</Button>
        </div>
      </Motion.Presence>

      {/* Filtering down to nothing swaps the queue for the empty state, and back. */}
      <Motion.Swap watch={rows.length > 0}>
        <div>
          {rows.length ? (
            <Table
              caption={caption}
              columns={columns}
              rows={rows}
              rowKey="id"
              selectable
              selectedKeys={selected}
              onSelectionChange={setSelected}
              pageSize={8}
              defaultSort={{ key: "priority", direction: "asc" }}
            />
          ) : (
            <EmptyState
              title="No cases match"
              body="Try fewer filters or a different search."
              action={<Button variant="secondary" onClick={clearAll}>Clear search and filters</Button>}
            />
          )}
        </div>
      </Motion.Swap>

      <ConfirmModal
        open={closing}
        danger
        title={`Close ${selected.length} cases?`}
        message="Closed cases leave the queue. You can reopen them from the Closed tab."
        confirmLabel="Close cases"
        onCancel={() => setClosing(false)}
        onConfirm={() => {
          setClosing(false);
          toast.success(`${selected.length} cases closed.`);
          setSelected([]);
        }}
      />
    </VStack>
  );
}

function CaseDrawer({ open, onClose }: { open: Case | null; onClose: () => void }) {
  const toast = useToast();
  const [note, setNote] = React.useState("");
  const [decision, setDecision] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);
  const c = open;

  return (
    <Drawer
      open={c !== null}
      onClose={onClose}
      title={c ? c.member : ""}
      size="lg"
      footer={
        <>
          <Select
            label="Decision"
            fullWidth={false}
            placeholder="Choose a decision"
            value={decision}
            onChange={setDecision}
            options={[
              { value: "instalment-plan", label: "Offer a dues instalment plan" },
              { value: "waive", label: "Waive late fees", description: "Needs the chapter treasurer's approval" },
              { value: "escalate", label: "Escalate to the secretary" },
            ]}
          />
          <Button variant="primary" lift={false} disabled={!decision} onClick={() => setConfirming(true)}>Record decision</Button>
        </>
      }
    >
      {c ? (
        <>
          <Cluster gap="xs" align="center">
            <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
            <Badge tone={PRIORITY_TONE[c.priority]}>{c.priority} priority</Badge>
            <Text tone="secondary" as="span">{c.id} · opened {shortDate(c.opened)}</Text>
          </Cluster>
          <Grid columns={{ mobile: 1, tablet: 2 }} gap="md">
            <Stat label="Owed" value={<Currency {...nz} value={c.owed} />} />
            <VStack gap="xs">
              <Text tone="secondary">Membership officer</Text>
              <Cluster gap="xs" align="center">
                <Avatar name={c.officer} />
                <Text>{c.officer}</Text>
              </Cluster>
            </VStack>
          </Grid>
          <Cluster gap="xs">
            <IconButton variant="secondary" icon={<PhoneIcon />} label={`Call ${c.member}`} />
            <IconButton variant="secondary" icon={<MailIcon />} label={`Email ${c.member}`} />
          </Cluster>
          <Accordion
            variant="contained"
            multiple
            defaultValue={["history"]}
            headingLevel={3}
            items={[
              {
                value: "history",
                title: "History",
                description: "4 events",
                content: (
                  <ul className={styles.plainList}>
                    <li><Text weight="bold">Reminder notice sent</Text><Text tone="secondary">28 Oct · automatic</Text></li>
                    <li><Text weight="bold">Phone call, no answer</Text><Text tone="secondary">21 Oct · {c.officer}</Text></li>
                    <li><Text weight="bold">Case assigned</Text><Text tone="secondary">14 Oct · {c.officer}</Text></li>
                    <li><Text weight="bold">Case opened: {c.reason.toLowerCase()}</Text><Text tone="secondary">{shortDate(c.opened)}</Text></li>
                  </ul>
                ),
              },
              {
                value: "account",
                title: "Membership",
                description: `${c.fee} · billed every two months`,
                content: <Text>Three sighting reports verified in the last year. One dues instalment plan completed in 2025.</Text>,
              },
            ]}
          />
          <VStack gap="sm">
            <Textarea label="Add a note" rows={3} autoResize maxLength={500} showCount value={note} onChange={(e) => setNote(e.target.value)} />
            <div>
              <Button
                variant="secondary"
                disabled={!note.trim()}
                onClick={() => { toast.success("Note added to the case."); setNote(""); }}
              >
                Add note
              </Button>
            </div>
          </VStack>
          <ConfirmModal
            open={confirming}
            title="Record this decision?"
            message={`${c.member} will be notified by email within 2 working days.`}
            confirmLabel="Record decision"
            onCancel={() => setConfirming(false)}
            onConfirm={() => {
              setConfirming(false);
              setDecision("");
              onClose();
              toast.success(`Decision recorded for ${c.member}.`);
            }}
          />
        </>
      ) : null}
    </Drawer>
  );
}

function AdminBody() {
  const [open, setOpen] = React.useState<Case | null>(null);
  const active = CASES.filter((c) => c.status !== "Closed");
  const mine = active.filter((c) => c.officer === ME);
  const closed = CASES.filter((c) => c.status === "Closed");
  const target = 12;

  return (
    <VStack gap="lg">
      {/* The summary figures arrive one after another. */}
      <Grid columns={{ mobile: 1, tablet: 3 }} gap="md">
        <Motion.Stagger>
          <Motion.Presence show playOnMount>
            <Card variant="outlined"><Stat label="Open cases" value={active.length} /></Card>
          </Motion.Presence>
          <Motion.Presence show playOnMount>
            <Card variant="outlined"><Stat label="Owed across open cases" value={<Currency {...nz} value={active.reduce((s, c) => s + toMinorUnits(c.owed, 2), 0)} minorUnits />} /></Card>
          </Motion.Presence>
          <Motion.Presence show playOnMount>
            <Card variant="outlined">
              <VStack gap="sm">
                <Stat label="Closed this week" value={`${closed.length} of ${target}`} />
                <ProgressBar value={(closed.length / target) * 100} label="Weekly target" />
              </VStack>
            </Card>
          </Motion.Presence>
        </Motion.Stagger>
      </Grid>

      <Card variant="outlined">
        <Tabs
          listLabel="Case lists"
          lazy
          items={[
            { value: "mine", label: "My cases", badge: <Badge tone="info">{mine.length}</Badge>, content: <CaseQueue cases={mine} onOpen={setOpen} caption="My cases" /> },
            { value: "team", label: "Team", badge: <Badge>{active.length}</Badge>, content: <CaseQueue cases={active} onOpen={setOpen} caption="Team cases" /> },
            { value: "closed", label: "Closed", content: <CaseQueue cases={closed} onOpen={setOpen} caption="Closed cases" /> },
          ]}
        />
      </Card>

      <CaseDrawer open={open} onClose={() => setOpen(null)} />
    </VStack>
  );
}

/** A Society secretary's member case work queue. */
export function SocietySecretary() {
  return (
    <SocietyAppShell
      brand="Secretary console"
      nav={["Work queue", "Members", "Instalment plans", "Reports", "Team"]}
      navLabel="Secretary console"
      account={{ person: ME, org: "Membership team, Wellington Chapter", detail: "Membership officer" }}
      active="Work queue"
      crumbs={[{ label: "Secretary console", href: "#home" }, { label: "Work queue" }]}
      title="Work queue"
      description="Overdue dues and sightings awaiting verification, highest priority first."
    >
      <AdminBody />
    </SocietyAppShell>
  );
}
